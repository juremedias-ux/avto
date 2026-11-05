import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { AppContext } from "@/lib/auth";
import { parseDbErrorCode } from "@/lib/db/errors";
import type { VideoJobRow, VideoRow } from "@/lib/db/types";
import { getMaxConcurrentGenerations, getSiteUrl } from "@/lib/env";
import {
  getKlingClient,
  KlingError,
  sanitizeProviderMessage,
  summarizeBilling,
  type KlingCallMetrics,
  type KlingClient,
  type KlingErrorCategory,
  type KlingTask,
} from "@/lib/kling";
import { MODELS } from "@/lib/models";
import { estimateCost, providerCostUsd } from "@/lib/pricing";
import { getServiceClient } from "@/lib/supabase/service";
import { removeObjects, signOne, SOURCE_BUCKET, VIDEO_BUCKET, videoPath } from "@/lib/storage";
import { composePrompt, SOURCE_IMAGE_PATH_RE, type GenerationInput } from "@/lib/validation";

/**
 * Generation lifecycle (see docs/architecture.md):
 *   begin_generation (draft, credits held, nothing deducted)
 *   -> Kling create task
 *   -> accept_generation (credits deducted) | fail_generation (nothing charged)
 *   -> polling / callback -> complete_generation | fail_generation (refund)
 */

export type GenerationErrorCode =
  | KlingErrorCategory
  | "insufficient_credits"
  | "concurrency_limit"
  | "account_suspended"
  | "not_member"
  | "invalid_image"
  | "billing_error"
  | "unknown";

export type StartResult =
  | { ok: true; videoId: string; pending: boolean }
  | { ok: false; error: GenerationErrorCode; videoId?: string };

const AMBIGUOUS: ReadonlySet<KlingErrorCategory> = new Set(["timeout", "network", "provider_unavailable"]);
const STALE_SUBMISSION_MS = 5 * 60 * 1000;
const JOB_LEASE_SECONDS = 120;

type UsageIds = { organizationId: string; userId: string; videoId: string; jobId: string };

function usageLogger(service: SupabaseClient, ids: UsageIds) {
  return async (m: KlingCallMetrics) => {
    await service.from("api_usage_logs").insert({
      organization_id: ids.organizationId,
      user_id: ids.userId,
      video_id: ids.videoId,
      video_job_id: ids.jobId,
      provider: "kling",
      operation: m.operation,
      http_status: m.httpStatus,
      provider_code: m.providerCode,
      provider_request_id: m.requestId,
      success: m.success,
      error_category: m.errorCategory,
      latency_ms: m.latencyMs,
      attempt: m.attempt,
    });
  };
}

function callbackUrl(): string | undefined {
  const site = getSiteUrl();
  // Kling must be able to reach the URL; localhost and plain HTTP are skipped (polling still works).
  if (!site.startsWith("https://") || /\/\/(localhost|127\.|\[::1\])/.test(site)) return undefined;
  return `${site}/api/kling/callback`;
}

function mapDbError(message: string | undefined): GenerationErrorCode {
  switch (parseDbErrorCode({ message })) {
    case "VF_INSUFFICIENT_CREDITS":
      return "insufficient_credits";
    case "VF_CONCURRENCY_LIMIT":
      return "concurrency_limit";
    case "VF_ACCOUNT_SUSPENDED":
      return "account_suspended";
    case "VF_NOT_MEMBER":
      return "not_member";
    default:
      return "unknown";
  }
}

// ---------------------------------------------------------------------------
// Submit
// ---------------------------------------------------------------------------

export async function startGeneration(ctx: AppContext, input: GenerationInput): Promise<StartResult> {
  const service = getServiceClient();
  const baseKling = getKlingClient();
  // Demo/staging mode: nothing is created and nothing is charged.
  if (!service || !baseKling) return { ok: false, error: "not_configured" };
  if (ctx.profile.status !== "active") return { ok: false, error: "account_suspended" };

  const model = MODELS[input.model];
  const cost = estimateCost({ model: input.model, resolution: input.resolution, duration: input.duration, audio: input.audio });

  let imageUrl: string | undefined;
  if (input.mode === "image_to_video") {
    const match = SOURCE_IMAGE_PATH_RE.exec(input.sourceImagePath);
    if (!match || match[1] !== ctx.organization.id || match[2] !== ctx.profile.id) {
      return { ok: false, error: "invalid_image" };
    }
    // Signed for 1 hour; Kling downloads the first frame from this URL. Fails if the object is missing.
    imageUrl = (await signOne(service, SOURCE_BUCKET, input.sourceImagePath, 3600)) ?? undefined;
    if (!imageUrl) return { ok: false, error: "invalid_image" };
  }

  const negative = input.mode === "text_to_video" ? input.negativePrompt : undefined;
  const { data: begun, error: beginError } = await service.rpc("begin_generation", {
    p_user_id: ctx.profile.id,
    p_organization_id: ctx.organization.id,
    p_mode: input.mode,
    p_model: input.model,
    p_resolution: input.resolution,
    p_duration_seconds: input.duration,
    p_aspect_ratio: input.aspectRatio,
    p_audio: cost.audio,
    p_prompt: input.prompt,
    p_negative_prompt: negative ?? null,
    p_template_id: input.templateId ?? null,
    p_source_image_path: input.mode === "image_to_video" ? input.sourceImagePath : null,
    p_credits_cost: cost.credits,
    p_estimated_provider_units: cost.providerUnits,
    p_max_concurrent: getMaxConcurrentGenerations(),
    p_metadata: { negative_prompt_merged: Boolean(negative) },
  });
  if (beginError) return { ok: false, error: mapDbError(beginError.message) };

  const { video_id: videoId, job_id: jobId } = begun as { video_id: string; job_id: string };
  const kling = baseKling.withMetrics(
    usageLogger(service, { organizationId: ctx.organization.id, userId: ctx.profile.id, videoId, jobId }),
  );

  const prompt = composePrompt(input.prompt, negative);
  const audio = model.audio.kind === "optional" ? cost.audio : undefined;
  const multiShot = model.supportsMultiShot ? false : undefined;

  let task: KlingTask;
  try {
    task =
      input.mode === "text_to_video"
        ? await kling.createTextToVideoTask({
            model: input.model,
            prompt,
            resolution: input.resolution,
            aspectRatio: input.aspectRatio,
            duration: input.duration,
            audio,
            multiShot,
            externalTaskId: jobId,
            callbackUrl: callbackUrl(),
          })
        : await kling.createImageToVideoTask({
            model: input.model,
            prompt,
            image: imageUrl as string,
            resolution: input.resolution,
            duration: input.duration,
            audio,
            multiShot,
            externalTaskId: jobId,
            callbackUrl: callbackUrl(),
          });
  } catch (error) {
    const category: KlingErrorCategory = error instanceof KlingError ? error.category : "unexpected_response";
    const message = error instanceof Error ? sanitizeProviderMessage(error.message) : "Unknown error";
    if (AMBIGUOUS.has(category)) {
      // Kling may have created the task anyway. Keep the draft; reconcileSubmission()
      // looks it up by external_task_id and either bills it or closes it unbilled.
      await service
        .from("video_jobs")
        .update({ error_code: category, error_message: message, submit_attempts: 1 })
        .eq("id", jobId);
      return { ok: true, videoId, pending: true };
    }
    await service.rpc("fail_generation", {
      p_job_id: jobId,
      p_error_code: category,
      p_error_message: message,
      p_provider_status: null,
      p_refund: false,
    });
    return { ok: false, error: category, videoId };
  }

  return acceptTask(service, jobId, videoId, task);
}

async function acceptTask(service: SupabaseClient, jobId: string, videoId: string, task: KlingTask): Promise<StartResult> {
  const { error } = await service.rpc("accept_generation", {
    p_job_id: jobId,
    p_provider_task_id: task.id,
    p_provider_status: task.status,
  });
  if (error) {
    // The task exists at Kling but could not be billed (e.g. balance changed). Record and stop.
    await service.from("video_jobs").update({ provider_task_id: task.id }).eq("id", jobId);
    await service.rpc("fail_generation", {
      p_job_id: jobId,
      p_error_code: "billing_error",
      p_error_message: parseDbErrorCode(error) ?? "accept_generation failed",
      p_provider_status: task.status,
      p_refund: false,
    });
    return { ok: false, error: "billing_error", videoId };
  }
  return { ok: true, videoId, pending: false };
}

// ---------------------------------------------------------------------------
// Sync (poll) a single job
// ---------------------------------------------------------------------------

function nextPollSeconds(pollCount: number): number {
  // Every 5 s during the first minute, then every 10 s.
  return pollCount < 12 ? 5 : 10;
}

export async function syncJob(jobId: string, options: { force?: boolean } = {}): Promise<void> {
  const service = getServiceClient();
  const base = getKlingClient();
  if (!service || !base) return;

  const { data: claimed } = await service.rpc("claim_job", { p_job_id: jobId, p_lease_seconds: JOB_LEASE_SECONDS });
  if (claimed !== true) return;

  try {
    const { data: job } = await service.from("video_jobs").select("*").eq("id", jobId).maybeSingle<VideoJobRow>();
    if (!job) return;
    const { data: video } = await service.from("videos").select("*").eq("id", job.video_id).maybeSingle<VideoRow>();
    if (!video) return;

    const kling = base.withMetrics(
      usageLogger(service, { organizationId: job.organization_id, userId: job.user_id, videoId: video.id, jobId }),
    );

    if (job.status === "submitting") {
      await reconcileSubmission(service, kling, job);
      return;
    }

    if (video.status === "succeeded" && !video.video_storage_path && video.provider_video_url && !video.deleted_at) {
      await archiveVideo(service, kling, video);
      return;
    }

    if (job.status !== "submitted" && job.status !== "processing") return;
    if (!options.force && job.next_poll_at && new Date(job.next_poll_at).getTime() > Date.now()) return;
    if (!job.provider_task_id) return;

    let task: KlingTask;
    try {
      task = await kling.getTaskStatus(job.provider_task_id);
    } catch (error) {
      const category = error instanceof KlingError ? error.category : "unexpected_response";
      const ageMs = Date.now() - new Date(job.submitted_at ?? job.created_at).getTime();
      if (category === "not_found" && ageMs > 10 * 60 * 1000) {
        await service.rpc("fail_generation", {
          p_job_id: jobId,
          p_error_code: "not_found",
          p_error_message: "Kling task not found",
          p_provider_status: null,
          p_refund: true,
        });
      } else {
        await service
          .from("video_jobs")
          .update({ next_poll_at: new Date(Date.now() + 30_000).toISOString(), last_polled_at: new Date().toISOString() })
          .eq("id", jobId);
      }
      return;
    }

    if (task.status === "submitted" || task.status === "processing") {
      const startedAt = new Date(job.submitted_at ?? job.created_at).getTime();
      if (Date.now() - startedAt > kling.taskTimeoutMinutes * 60 * 1000) {
        await service.rpc("fail_generation", {
          p_job_id: jobId,
          p_error_code: "timeout",
          p_error_message: `No result after ${kling.taskTimeoutMinutes} minutes`,
          p_provider_status: task.status,
          p_refund: true,
        });
        return;
      }
      await service.rpc("mark_generation_processing", {
        p_job_id: jobId,
        p_provider_status: task.status,
        p_next_poll_seconds: nextPollSeconds(job.poll_count),
      });
      return;
    }

    if (task.status === "failed") {
      await service.rpc("fail_generation", {
        p_job_id: jobId,
        p_error_code: "generation_failed",
        p_error_message: task.message ? sanitizeProviderMessage(task.message) : "Generation failed",
        p_provider_status: "failed",
        p_refund: true,
      });
      return;
    }

    await finalizeSuccess(service, kling, job, video, task);
  } finally {
    await service.rpc("release_job", { p_job_id: jobId });
  }
}

async function finalizeSuccess(
  service: SupabaseClient,
  kling: KlingClient,
  job: VideoJobRow,
  video: VideoRow,
  task: KlingTask,
): Promise<void> {
  const output = task.videos[0];
  if (!output) {
    await service.rpc("fail_generation", {
      p_job_id: job.id,
      p_error_code: "unexpected_response",
      p_error_message: "Kling reported success without a video",
      p_provider_status: "succeeded",
      p_refund: true,
    });
    return;
  }

  const billing = summarizeBilling(task.billing, kling.usdPerUnit);
  const units = billing.units ?? (job.estimated_provider_units !== null ? Number(job.estimated_provider_units) : null);
  const costUsd = billing.costUsd ?? (units !== null ? providerCostUsd(units, kling.usdPerUnit) : null);

  const storagePath = await storeVideo(service, kling, video, output.url);

  await service.rpc("complete_generation", {
    p_job_id: job.id,
    p_provider_video_id: output.id,
    p_provider_video_url: output.url,
    p_video_storage_path: storagePath,
    p_result_duration_seconds: output.durationSeconds,
    p_provider_units: units,
    p_provider_cost_usd: costUsd,
    p_provider_billing: task.billing,
    p_metadata: { provider_cost_estimated: billing.units === null && billing.costUsd === null, archive_pending: !storagePath },
  });
}

/** Downloads the MP4 from Kling and stores it privately; returns the storage path or null. */
async function storeVideo(service: SupabaseClient, kling: KlingClient, video: VideoRow, url: string): Promise<string | null> {
  try {
    const file = await kling.downloadVideo(url);
    const path = videoPath(video.organization_id, video.id);
    const { error } = await service.storage.from(VIDEO_BUCKET).upload(path, file.bytes, {
      contentType: "video/mp4",
      upsert: true,
    });
    return error ? null : path;
  } catch {
    return null;
  }
}

async function archiveVideo(service: SupabaseClient, kling: KlingClient, video: VideoRow): Promise<void> {
  if (!video.provider_video_url) return;
  const path = await storeVideo(service, kling, video, video.provider_video_url);
  if (path) {
    await service
      .from("videos")
      .update({ video_storage_path: path, metadata: { ...video.metadata, archive_pending: false } })
      .eq("id", video.id)
      .is("video_storage_path", null);
  }
}

/** Resolves a draft whose submission outcome is unknown, using external_task_id. */
async function reconcileSubmission(service: SupabaseClient, kling: KlingClient, job: VideoJobRow): Promise<void> {
  const age = Date.now() - new Date(job.created_at).getTime();
  // An error_code on a submitting job means the submit request already ended ambiguously.
  if (!job.error_code && age < STALE_SUBMISSION_MS) return;

  let existing: KlingTask | null;
  try {
    existing = await kling.getTaskByExternalId(job.external_task_id);
  } catch {
    return; // try again on the next sweep
  }
  if (existing) {
    await acceptTask(service, job.id, job.video_id, existing);
    return;
  }
  // Only conclude "not created" after the stale window, to avoid racing a slow submit.
  if (age < STALE_SUBMISSION_MS) return;
  await service.rpc("fail_generation", {
    p_job_id: job.id,
    p_error_code: "submission_interrupted",
    p_error_message: "Submission did not complete",
    p_provider_status: null,
    p_refund: false,
  });
}

// ---------------------------------------------------------------------------
// Entry points used by routes
// ---------------------------------------------------------------------------

/** Refreshes one video the user can see (RLS-checked) and returns its latest row. */
export async function refreshVideo(ctx: AppContext, videoId: string): Promise<VideoRow | null> {
  const { data: video } = await ctx.db.from("videos").select("*").eq("id", videoId).maybeSingle<VideoRow>();
  if (!video) return null;

  const needsSync =
    video.status === "draft" ||
    video.status === "queued" ||
    video.status === "processing" ||
    (video.status === "succeeded" && !video.video_storage_path && Boolean(video.provider_video_url));
  if (!needsSync) return video;

  const service = getServiceClient();
  if (!service) return video;
  const { data: job } = await service
    .from("video_jobs")
    .select("id")
    .eq("video_id", video.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<{ id: string }>();
  if (job) await syncJob(job.id);

  const { data: fresh } = await ctx.db.from("videos").select("*").eq("id", videoId).maybeSingle<VideoRow>();
  return fresh ?? video;
}

/** Kling callback: the body only identifies the task; state is re-fetched from the API. */
export async function handleTaskCallback(ref: { taskId: string; externalId: string | null }): Promise<boolean> {
  const service = getServiceClient();
  if (!service) return false;
  const byTask = await service
    .from("video_jobs")
    .select("id")
    .eq("provider_task_id", ref.taskId)
    .maybeSingle<{ id: string }>();
  let jobId = byTask.data?.id ?? null;
  if (!jobId && ref.externalId) {
    const byExternal = await service
      .from("video_jobs")
      .select("id")
      .eq("external_task_id", ref.externalId)
      .maybeSingle<{ id: string }>();
    jobId = byExternal.data?.id ?? null;
  }
  if (!jobId) return false;
  await syncJob(jobId, { force: true });
  return true;
}

/** Cron sweep: due polls, stale submissions and pending archives, within a time budget. */
export async function pollPendingJobs(budgetMs: number): Promise<{ processed: number }> {
  const service = getServiceClient();
  if (!service || !getKlingClient()) return { processed: 0 };
  const deadline = Date.now() + budgetMs;
  const nowIso = new Date().toISOString();

  const [due, submitting, archives] = await Promise.all([
    service
      .from("video_jobs")
      .select("id")
      .in("status", ["submitted", "processing"])
      .lte("next_poll_at", nowIso)
      .order("next_poll_at", { ascending: true })
      .limit(25),
    service
      .from("video_jobs")
      .select("id")
      .eq("status", "submitting")
      .lte("created_at", new Date(Date.now() - 60_000).toISOString())
      .order("created_at", { ascending: true })
      .limit(10),
    service
      .from("videos")
      .select("id")
      .eq("status", "succeeded")
      .is("video_storage_path", null)
      .not("provider_video_url", "is", null)
      .is("deleted_at", null)
      .gte("completed_at", new Date(Date.now() - 29 * 24 * 3600 * 1000).toISOString())
      .limit(5),
  ]);

  const jobIds = [...(due.data ?? []), ...(submitting.data ?? [])].map((r: { id: string }) => r.id);
  if (archives.data?.length) {
    const { data: archiveJobs } = await service
      .from("video_jobs")
      .select("id")
      .in("video_id", archives.data.map((r: { id: string }) => r.id));
    jobIds.push(...(archiveJobs ?? []).map((r: { id: string }) => r.id));
  }

  let processed = 0;
  for (const id of [...new Set(jobIds)]) {
    if (Date.now() > deadline) break;
    await syncJob(id, { force: true });
    processed++;
  }
  return { processed };
}

export type DeleteResult = { ok: true } | { ok: false; error: "video_in_progress" | "video_not_found" | "forbidden" | "unknown" };

export async function deleteVideo(ctx: AppContext, videoId: string): Promise<DeleteResult> {
  const service = getServiceClient();
  if (!service) return { ok: false, error: "unknown" };
  const { data, error } = await service.rpc("delete_video", { p_actor_id: ctx.profile.id, p_video_id: videoId });
  if (error) {
    const code = parseDbErrorCode(error);
    if (code === "VF_VIDEO_IN_PROGRESS") return { ok: false, error: "video_in_progress" };
    if (code === "VF_VIDEO_NOT_FOUND") return { ok: false, error: "video_not_found" };
    if (code === "VF_FORBIDDEN") return { ok: false, error: "forbidden" };
    return { ok: false, error: "unknown" };
  }
  const paths = data as { source_image_path: string | null; video_storage_path: string | null };
  await Promise.all([
    removeObjects(service, SOURCE_BUCKET, [paths.source_image_path]),
    removeObjects(service, VIDEO_BUCKET, [paths.video_storage_path]),
  ]);
  return { ok: true };
}
