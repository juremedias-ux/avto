import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { getKlingEnv, type KlingEnv } from "@/lib/env";
import type { AspectRatio, Duration, ModelId, Resolution } from "@/lib/models";

/**
 * Kling AI API client (new-standard endpoints).
 *
 *   POST {base}/text-to-video/{model}
 *   POST {base}/image-to-video/{model}
 *   GET  {base}/tasks?task_ids={id}            (or ?external_task_ids={id})
 *   Authorization: Bearer {KLING_API_KEY}
 *
 * Contract source and caveats: docs/kling-integration.md. This module never
 * logs prompts, images, result URLs or the API key; the onCall hook receives
 * metrics only.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type KlingTaskStatus = "submitted" | "processing" | "succeeded" | "failed";

export type KlingVideoOutput = {
  id: string | null;
  url: string;
  watermarkUrl: string | null;
  durationSeconds: number | null;
};

export type KlingBillingItem = {
  chargeType: string | null;
  amount: number | null;
  currency: string | null;
  packageType: string | null;
};

export type KlingTask = {
  id: string;
  status: KlingTaskStatus;
  message: string | null;
  externalId: string | null;
  createdAt: number | null;
  updatedAt: number | null;
  videos: KlingVideoOutput[];
  billing: KlingBillingItem[];
  requestId: string | null;
};

export type TextToVideoInput = {
  model: ModelId;
  prompt: string;
  resolution: Resolution;
  aspectRatio: AspectRatio;
  duration: Duration;
  /** Sent only for models with an audio switch. */
  audio?: boolean;
  /** Sent only for models that accept settings.multi_shot. */
  multiShot?: boolean;
  externalTaskId: string;
  callbackUrl?: string;
};

export type ImageToVideoInput = {
  model: ModelId;
  prompt: string;
  /** First frame: HTTPS URL (or Base64) of a JPG/PNG, >= 300 px, ratio 1:2.5–2.5:1. */
  image: string;
  resolution: Resolution;
  duration: Duration;
  audio?: boolean;
  multiShot?: boolean;
  externalTaskId: string;
  callbackUrl?: string;
};

export type KlingOperation =
  | "create_text_to_video"
  | "create_image_to_video"
  | "get_task"
  | "get_task_by_external_id"
  | "download_video";

export type KlingCallMetrics = {
  operation: KlingOperation;
  httpStatus: number | null;
  providerCode: number | null;
  requestId: string | null;
  success: boolean;
  errorCategory: KlingErrorCategory | null;
  latencyMs: number;
  attempt: number;
};

export type KlingErrorCategory =
  | "not_configured"
  | "invalid_api_key"
  | "provider_insufficient_balance"
  | "forbidden"
  | "invalid_request"
  | "not_found"
  | "content_moderation"
  | "rate_limited"
  | "concurrency_limited"
  | "ip_blocked"
  | "provider_unavailable"
  | "timeout"
  | "network"
  | "unexpected_response"
  | "download_failed";

const RETRYABLE: ReadonlySet<KlingErrorCategory> = new Set([
  "rate_limited",
  "concurrency_limited",
  "provider_unavailable",
  "timeout",
  "network",
]);

export class KlingError extends Error {
  readonly category: KlingErrorCategory;
  readonly httpStatus: number | null;
  readonly providerCode: number | null;
  readonly requestId: string | null;
  readonly retryable: boolean;

  constructor(
    category: KlingErrorCategory,
    message: string,
    details: { httpStatus?: number | null; providerCode?: number | null; requestId?: string | null } = {},
  ) {
    super(message);
    this.name = "KlingError";
    this.category = category;
    this.httpStatus = details.httpStatus ?? null;
    this.providerCode = details.providerCode ?? null;
    this.requestId = details.requestId ?? null;
    this.retryable = RETRYABLE.has(category);
  }
}

// ---------------------------------------------------------------------------
// Error classification (Kling error-code table)
// ---------------------------------------------------------------------------

/**
 * Maps a Kling service code (preferred) or HTTP status to an error category.
 *   1000-1004 auth | 1100 account | 1101/1102 balance/resource pack | 1103 forbidden
 *   1200/1201 params | 1202/1203 not found | 1300/1301 policy/content | 1302 rate
 *   1303 concurrency | 1304 IP whitelist | 5000/5001 server | 5002 timeout
 */
export function classifyKlingError(httpStatus: number | null, providerCode: number | null): KlingErrorCategory {
  if (providerCode !== null && providerCode !== 0) {
    if (providerCode >= 1000 && providerCode <= 1004) return "invalid_api_key";
    if (providerCode === 1100) return "forbidden";
    if (providerCode === 1101 || providerCode === 1102) return "provider_insufficient_balance";
    if (providerCode === 1103) return "forbidden";
    if (providerCode === 1200 || providerCode === 1201) return "invalid_request";
    if (providerCode === 1202 || providerCode === 1203) return "not_found";
    if (providerCode === 1300 || providerCode === 1301) return "content_moderation";
    if (providerCode === 1302) return "rate_limited";
    if (providerCode === 1303) return "concurrency_limited";
    if (providerCode === 1304) return "ip_blocked";
    if (providerCode === 5002) return "timeout";
    if (providerCode >= 5000 && providerCode < 6000) return "provider_unavailable";
  }
  if (httpStatus === null) return "network";
  if (httpStatus === 401) return "invalid_api_key";
  if (httpStatus === 403) return "forbidden";
  if (httpStatus === 404) return "not_found";
  if (httpStatus === 429) return "rate_limited";
  if (httpStatus === 504) return "timeout";
  if (httpStatus >= 500) return "provider_unavailable";
  if (httpStatus >= 400) return "invalid_request";
  return "unexpected_response";
}

// ---------------------------------------------------------------------------
// Retry with exponential backoff and full jitter
// ---------------------------------------------------------------------------

export type RetryOptions = {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  random?: () => number;
  sleep?: (ms: number) => Promise<void>;
};

export const DEFAULT_RETRY: RetryOptions = { maxAttempts: 4, baseDelayMs: 1000, maxDelayMs: 16_000 };

/** Delay before retry n (1-based): random in [base, min(max, base * 2^(n-1))]. */
export function backoffDelay(retryNumber: number, options: RetryOptions): number {
  const random = options.random ?? Math.random;
  const ceiling = Math.min(options.maxDelayMs, options.baseDelayMs * 2 ** Math.max(0, retryNumber - 1));
  // Kling recommends an initial delay of at least 1 second, so never go below base.
  return Math.round(options.baseDelayMs + random() * Math.max(0, ceiling - options.baseDelayMs));
}

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export async function withRetry<T>(
  fn: (attempt: number) => Promise<T>,
  options: RetryOptions = DEFAULT_RETRY,
): Promise<T> {
  const sleep = options.sleep ?? defaultSleep;
  let lastError: unknown;
  for (let attempt = 1; attempt <= options.maxAttempts; attempt++) {
    try {
      return await fn(attempt);
    } catch (error) {
      lastError = error;
      const retryable = error instanceof KlingError && error.retryable;
      if (!retryable || attempt === options.maxAttempts) throw error;
      await sleep(backoffDelay(attempt, options));
    }
  }
  throw lastError;
}

// ---------------------------------------------------------------------------
// Response schemas (lenient: unknown fields are ignored)
// ---------------------------------------------------------------------------

const envelopeSchema = z.object({
  code: z.number(),
  message: z.string().nullish(),
  request_id: z.string().nullish(),
  data: z.unknown().optional(),
});

const statusSchema = z.enum(["submitted", "processing", "succeeded", "failed"]);

const createDataSchema = z.object({
  id: z.string().min(1),
  status: statusSchema.catch("submitted"),
  create_time: z.number().nullish(),
  update_time: z.number().nullish(),
  external_id: z.string().nullish(),
});

const numeric = z.union([z.number(), z.string()]).nullish().transform((v) => {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
});

const outputSchema = z.object({
  type: z.string().nullish(),
  id: z.union([z.string(), z.number()]).nullish(),
  url: z.string().nullish(),
  watermark_url: z.string().nullish(),
  duration: numeric,
});

const billingSchema = z.object({
  charge_type: z.string().nullish(),
  amount: numeric,
  currency: z.string().nullish(),
  package_type: z.string().nullish(),
});

const taskSchema = z.object({
  id: z.string().min(1),
  status: statusSchema,
  message: z.string().nullish(),
  create_time: z.number().nullish(),
  update_time: z.number().nullish(),
  external_id: z.string().nullish(),
  outputs: z.array(outputSchema).nullish(),
  billing: z.array(billingSchema).nullish(),
});

export function parseTask(raw: unknown, requestId: string | null): KlingTask {
  const task = taskSchema.parse(raw);
  return {
    id: task.id,
    status: task.status,
    message: task.message?.trim() ? task.message.trim() : null,
    externalId: task.external_id ?? null,
    createdAt: task.create_time ?? null,
    updatedAt: task.update_time ?? null,
    videos: (task.outputs ?? [])
      .filter((o) => (o.type ?? "video") === "video" && typeof o.url === "string" && o.url.length > 0)
      .map((o) => ({
        id: o.id === null || o.id === undefined ? null : String(o.id),
        url: o.url as string,
        watermarkUrl: o.watermark_url ?? null,
        durationSeconds: o.duration,
      })),
    billing: (task.billing ?? []).map((b) => ({
      chargeType: b.charge_type ?? null,
      amount: b.amount,
      currency: b.currency ?? null,
      packageType: b.package_type ?? null,
    })),
    requestId,
  };
}

/** Units and USD cost from a task's billing entries (null when not reported). */
export function summarizeBilling(
  billing: KlingBillingItem[],
  usdPerUnit: number,
): { units: number | null; costUsd: number | null } {
  let units: number | null = null;
  let cash: number | null = null;
  for (const item of billing) {
    if (item.amount === null) continue;
    if (item.chargeType === "unit") units = (units ?? 0) + item.amount;
    if (item.chargeType === "cash" && (item.currency ?? "").toUpperCase() === "USD") cash = (cash ?? 0) + item.amount;
  }
  const costUsd = cash ?? (units !== null ? Math.round(units * usdPerUnit * 10_000) / 10_000 : null);
  return { units, costUsd };
}

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------

export type KlingClientOptions = {
  fetch?: typeof fetch;
  retry?: RetryOptions;
  onCall?: (metrics: KlingCallMetrics) => void | Promise<void>;
};

export const MAX_VIDEO_DOWNLOAD_BYTES = 100 * 1024 * 1024;

export class KlingClient {
  readonly #env: KlingEnv;
  readonly #fetch: typeof fetch;
  readonly #retry: RetryOptions;
  readonly #onCall?: KlingClientOptions["onCall"];

  constructor(env: KlingEnv, options: KlingClientOptions = {}) {
    this.#env = env;
    this.#fetch = options.fetch ?? fetch;
    this.#retry = options.retry ?? DEFAULT_RETRY;
    this.#onCall = options.onCall;
  }

  get usdPerUnit(): number {
    return this.#env.usdPerUnit;
  }

  get taskTimeoutMinutes(): number {
    return this.#env.taskTimeoutMinutes;
  }

  /** Same client with a different metrics hook (per request context). */
  withMetrics(onCall: KlingClientOptions["onCall"]): KlingClient {
    return new KlingClient(this.#env, { fetch: this.#fetch, retry: this.#retry, onCall });
  }

  async createTextToVideoTask(input: TextToVideoInput): Promise<KlingTask> {
    const settings: Record<string, unknown> = {
      resolution: input.resolution,
      aspect_ratio: input.aspectRatio,
      duration: input.duration,
    };
    if (input.audio !== undefined) settings.audio = input.audio ? "native" : "off";
    if (input.multiShot !== undefined) settings.multi_shot = input.multiShot;

    return this.#createTask("create_text_to_video", `/text-to-video/${encodeURIComponent(input.model)}`, {
      prompt: input.prompt,
      settings,
      options: buildOptions(input.externalTaskId, input.callbackUrl),
    }, input.externalTaskId);
  }

  async createImageToVideoTask(input: ImageToVideoInput): Promise<KlingTask> {
    const settings: Record<string, unknown> = {
      resolution: input.resolution,
      duration: input.duration,
    };
    if (input.audio !== undefined) settings.audio = input.audio ? "native" : "off";
    if (input.multiShot !== undefined) settings.multi_shot = input.multiShot;

    return this.#createTask("create_image_to_video", `/image-to-video/${encodeURIComponent(input.model)}`, {
      contents: [
        { type: "prompt", text: input.prompt },
        { type: "first_frame", url: input.image },
      ],
      settings,
      options: buildOptions(input.externalTaskId, input.callbackUrl),
    }, input.externalTaskId);
  }

  /** Current state of a task by Kling task id. Throws KlingError(not_found) if unknown. */
  async getTaskStatus(taskId: string): Promise<KlingTask> {
    const task = await withRetry(
      (attempt) => this.#queryTasks("get_task", `task_ids=${encodeURIComponent(taskId)}`, attempt),
      this.#retry,
    );
    if (!task) throw new KlingError("not_found", "Kling task not found");
    return task;
  }

  /** Looks a task up by our external_task_id; null when Kling has no such task. */
  async getTaskByExternalId(externalTaskId: string): Promise<KlingTask | null> {
    return withRetry(
      (attempt) =>
        this.#queryTasks("get_task_by_external_id", `external_task_ids=${encodeURIComponent(externalTaskId)}`, attempt),
      this.#retry,
    );
  }

  /**
   * Downloads a finished MP4 from the result URL Kling returned. Results are
   * deleted by Kling after 30 days, so callers archive them in storage.
   */
  async downloadVideo(url: string): Promise<{ bytes: Uint8Array; contentType: string }> {
    assertSafeDownloadUrl(url);
    return withRetry(async (attempt) => {
      const started = Date.now();
      let httpStatus: number | null = null;
      try {
        const response = await this.#fetch(url, {
          method: "GET",
          redirect: "follow",
          signal: AbortSignal.timeout(Math.max(this.#env.requestTimeoutMs, 120_000)),
          cache: "no-store",
        });
        httpStatus = response.status;
        if (!response.ok) {
          throw new KlingError(response.status >= 500 ? "provider_unavailable" : "download_failed",
            `Video download failed with HTTP ${response.status}`, { httpStatus });
        }
        const contentType = (response.headers.get("content-type") ?? "").split(";")[0]!.trim().toLowerCase();
        if (contentType && !contentType.startsWith("video/") && contentType !== "application/octet-stream") {
          throw new KlingError("download_failed", `Unexpected content type ${contentType}`, { httpStatus });
        }
        const bytes = await readLimited(response, MAX_VIDEO_DOWNLOAD_BYTES);
        await this.#report({ operation: "download_video", httpStatus, providerCode: null, requestId: null,
          success: true, errorCategory: null, latencyMs: Date.now() - started, attempt });
        return { bytes, contentType: "video/mp4" };
      } catch (error) {
        const klingError = toKlingError(error, httpStatus, null, null);
        await this.#report({ operation: "download_video", httpStatus, providerCode: null, requestId: null,
          success: false, errorCategory: klingError.category, latencyMs: Date.now() - started, attempt });
        throw klingError;
      }
    }, this.#retry);
  }

  async #createTask(
    operation: "create_text_to_video" | "create_image_to_video",
    path: string,
    body: Record<string, unknown>,
    externalTaskId: string,
  ): Promise<KlingTask> {
    let ambiguous = false;
    return withRetry(async (attempt) => {
      // A previous attempt may have reached Kling before failing on our side
      // (timeout, dropped connection, 5xx). external_task_id is unique per
      // account, so look it up first instead of creating a duplicate task.
      if (attempt > 1 && ambiguous) {
        const existing = await this.#queryTasks(
          "get_task_by_external_id", `external_task_ids=${encodeURIComponent(externalTaskId)}`, attempt,
        ).catch(() => null);
        if (existing) return existing;
      }
      try {
        const { data, requestId } = await this.#request(operation, "POST", path, body, attempt);
        const parsed = createDataSchema.safeParse(data);
        if (!parsed.success) {
          throw new KlingError("unexpected_response", "Kling returned an unexpected create response", { requestId });
        }
        return {
          id: parsed.data.id,
          status: parsed.data.status,
          message: null,
          externalId: parsed.data.external_id ?? externalTaskId,
          createdAt: parsed.data.create_time ?? null,
          updatedAt: parsed.data.update_time ?? null,
          videos: [],
          billing: [],
          requestId,
        };
      } catch (error) {
        if (!(error instanceof KlingError)) throw error;
        // A retry after an ambiguous failure can be rejected as a duplicate
        // external_task_id (invalid_request); the original task then exists.
        if (attempt > 1 && ambiguous && error.category === "invalid_request") {
          const existing = await this.#queryTasks(
            "get_task_by_external_id", `external_task_ids=${encodeURIComponent(externalTaskId)}`, attempt,
          ).catch(() => null);
          if (existing) return existing;
        }
        ambiguous = ambiguous || ["timeout", "network", "provider_unavailable"].includes(error.category);
        throw error;
      }
    }, this.#retry);
  }

  async #queryTasks(operation: KlingOperation, query: string, attempt: number): Promise<KlingTask | null> {
    const { data, requestId } = await this.#request(operation, "GET", `/tasks?${query}`, undefined, attempt);
    const list = z.array(z.unknown()).safeParse(data);
    if (!list.success) {
      throw new KlingError("unexpected_response", "Kling returned an unexpected task response", { requestId });
    }
    const first = list.data[0];
    if (first === undefined) return null;
    try {
      return parseTask(first, requestId);
    } catch {
      throw new KlingError("unexpected_response", "Kling returned an unparseable task", { requestId });
    }
  }

  async #request(
    operation: KlingOperation,
    method: "GET" | "POST",
    path: string,
    body: Record<string, unknown> | undefined,
    attempt: number,
  ): Promise<{ data: unknown; requestId: string | null }> {
    const started = Date.now();
    let httpStatus: number | null = null;
    let providerCode: number | null = null;
    let requestId: string | null = null;
    try {
      const response = await this.#fetch(`${this.#env.baseUrl}${path}`, {
        method,
        headers: {
          Authorization: `Bearer ${this.#env.apiKey}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(this.#env.requestTimeoutMs),
        cache: "no-store",
      });
      httpStatus = response.status;
      const json: unknown = await response.json().catch(() => null);
      const envelope = envelopeSchema.safeParse(json);
      if (envelope.success) {
        providerCode = envelope.data.code;
        requestId = envelope.data.request_id ?? null;
      }
      if (!response.ok || !envelope.success || envelope.data.code !== 0) {
        const category = classifyKlingError(httpStatus, providerCode);
        const providerMessage = envelope.success ? envelope.data.message ?? "" : "";
        throw new KlingError(category, sanitizeProviderMessage(providerMessage) || `Kling HTTP ${httpStatus}`, {
          httpStatus,
          providerCode,
          requestId,
        });
      }
      await this.#report({ operation, httpStatus, providerCode, requestId, success: true, errorCategory: null,
        latencyMs: Date.now() - started, attempt });
      return { data: envelope.data.data, requestId };
    } catch (error) {
      const klingError = toKlingError(error, httpStatus, providerCode, requestId);
      await this.#report({ operation, httpStatus, providerCode, requestId, success: false,
        errorCategory: klingError.category, latencyMs: Date.now() - started, attempt });
      throw klingError;
    }
  }

  async #report(metrics: KlingCallMetrics): Promise<void> {
    if (!this.#onCall) return;
    try {
      await this.#onCall(metrics);
    } catch {
      // Metrics must never break a generation.
    }
  }
}

function buildOptions(externalTaskId: string, callbackUrl: string | undefined): Record<string, unknown> {
  const options: Record<string, unknown> = {
    external_task_id: externalTaskId,
    watermark_info: { enabled: false },
  };
  if (callbackUrl) options.callback_url = callbackUrl;
  return options;
}

function toKlingError(
  error: unknown,
  httpStatus: number | null,
  providerCode: number | null,
  requestId: string | null,
): KlingError {
  if (error instanceof KlingError) return error;
  if (error instanceof DOMException && (error.name === "TimeoutError" || error.name === "AbortError")) {
    return new KlingError("timeout", "Kling request timed out", { httpStatus, providerCode, requestId });
  }
  return new KlingError("network", "Could not reach the Kling API", { httpStatus, providerCode, requestId });
}

/** Provider messages are shown in the UI and stored; keep them short and single-line. */
export function sanitizeProviderMessage(message: string): string {
  return message.replace(/[\r\n\t]+/g, " ").replace(/https?:\/\/\S+/g, "[url]").trim().slice(0, 300);
}

function assertSafeDownloadUrl(raw: string): void {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new KlingError("download_failed", "Invalid video URL");
  }
  const host = url.hostname.toLowerCase();
  const isIpLiteral = /^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.includes(":");
  if (url.protocol !== "https:" || host === "localhost" || host.endsWith(".local") || host.endsWith(".internal") || isIpLiteral) {
    throw new KlingError("download_failed", "Refusing to download from a non-public URL");
  }
}

async function readLimited(response: Response, maxBytes: number): Promise<Uint8Array> {
  const declared = Number(response.headers.get("content-length") ?? "0");
  if (declared > maxBytes) throw new KlingError("download_failed", "Video exceeds the size limit");
  if (!response.body) return new Uint8Array(await response.arrayBuffer());
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      throw new KlingError("download_failed", "Video exceeds the size limit");
    }
    chunks.push(value);
  }
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return out;
}

// ---------------------------------------------------------------------------
// Webhook (callback) verification — Standard Webhooks scheme used by Kling
// ---------------------------------------------------------------------------

export type WebhookVerification = { ok: true } | { ok: false; reason: "missing_headers" | "stale" | "bad_signature" };

/**
 * Verifies webhook-id / webhook-timestamp / webhook-signature headers:
 * signature = base64(HMAC-SHA256(base64decode(secret without "whsec_"), `${id}.${ts}.${body}`)).
 */
export function verifyKlingWebhook(
  rawBody: string,
  headers: { id: string | null; timestamp: string | null; signature: string | null },
  secret: string,
  nowSeconds: number = Math.floor(Date.now() / 1000),
  toleranceSeconds = 300,
): WebhookVerification {
  if (!headers.id || !headers.timestamp || !headers.signature) return { ok: false, reason: "missing_headers" };
  const ts = Number(headers.timestamp);
  if (!Number.isFinite(ts) || Math.abs(nowSeconds - ts) > toleranceSeconds) return { ok: false, reason: "stale" };

  const key = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const expected = createHmac("sha256", key).update(`${headers.id}.${headers.timestamp}.${rawBody}`).digest();

  for (const part of headers.signature.split(" ")) {
    const [version, value] = part.split(",", 2);
    if (version !== "v1" || !value) continue;
    const given = Buffer.from(value, "base64");
    if (given.length === expected.length && timingSafeEqual(given, expected)) return { ok: true };
  }
  return { ok: false, reason: "bad_signature" };
}

const callbackSchema = z.object({ id: z.string().min(1), external_id: z.string().nullish() }).loose();

/** Extracts the task id from a callback body. The body itself is never trusted for state. */
export function parseCallbackTaskRef(rawBody: string): { taskId: string; externalId: string | null } | null {
  try {
    const parsed = callbackSchema.safeParse(JSON.parse(rawBody));
    if (!parsed.success) return null;
    return { taskId: parsed.data.id, externalId: parsed.data.external_id ?? null };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Default instance and convenience functions
// ---------------------------------------------------------------------------

/** Configured client, or null when KLING_API_KEY is not set (demo/staging mode). */
export function getKlingClient(options?: KlingClientOptions): KlingClient | null {
  const env = getKlingEnv();
  return env ? new KlingClient(env, options) : null;
}

function requireClient(): KlingClient {
  const client = getKlingClient();
  if (!client) throw new KlingError("not_configured", "KLING_API_KEY is not configured");
  return client;
}

export function createTextToVideoTask(input: TextToVideoInput): Promise<KlingTask> {
  return requireClient().createTextToVideoTask(input);
}

export function createImageToVideoTask(input: ImageToVideoInput): Promise<KlingTask> {
  return requireClient().createImageToVideoTask(input);
}

export function getTaskStatus(taskId: string): Promise<KlingTask> {
  return requireClient().getTaskStatus(taskId);
}

export function downloadVideo(url: string): Promise<{ bytes: Uint8Array; contentType: string }> {
  return requireClient().downloadVideo(url);
}
