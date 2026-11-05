import type { Metadata } from "next";
import { CreateVideoForm, type CreateFormInitial } from "@/components/create/create-video-form";
import { requireAppContext } from "@/lib/auth";
import type { VideoRow } from "@/lib/db/types";
import { isKlingConfigured } from "@/lib/env";
import { getI18n } from "@/lib/i18n/server";
import { DEFAULT_MODEL, isModelId, type Duration } from "@/lib/models";
import { signOne, SOURCE_BUCKET } from "@/lib/storage";
import { getServiceClient } from "@/lib/supabase/service";
import { findTemplate } from "@/lib/templates";
import { SOURCE_IMAGE_PATH_RE, uuidSchema } from "@/lib/validation";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.create.title };
}

export default async function CreatePage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const ctx = await requireAppContext("/create");
  const { t } = await getI18n();
  const params = await searchParams;

  let initial: CreateFormInitial = {
    mode: params.mode === "image" ? "image_to_video" : "text_to_video",
    prompt: "",
    negativePrompt: "",
    motionPrompt: "",
    model: DEFAULT_MODEL,
    resolution: "720p",
    duration: 5,
    aspectRatio: "16:9",
    audio: false,
  };

  const template = findTemplate(params.template);
  if (template) {
    initial = {
      ...initial,
      prompt: template.prompt,
      negativePrompt: template.negativePrompt,
      motionPrompt: template.motionPrompt,
      aspectRatio: template.aspectRatio,
      duration: template.duration,
      templateId: template.id,
    };
  }

  // "Duplicate settings": prefill from a video the user can see (RLS-checked).
  let duplicated = false;
  if (params.from && uuidSchema.safeParse(params.from).success) {
    const { data: source } = await ctx.db.from("videos").select("*").eq("id", params.from).maybeSingle<VideoRow>();
    if (source && isModelId(source.model)) {
      duplicated = true;
      const imageMatch = source.source_image_path ? SOURCE_IMAGE_PATH_RE.exec(source.source_image_path) : null;
      // The stored image can be reused only by its uploader within the active organization.
      const reusable =
        imageMatch && imageMatch[1] === ctx.organization.id && imageMatch[2] === ctx.profile.id && source.source_image_path;
      const service = getServiceClient();
      const previewUrl = reusable && service ? await signOne(service, SOURCE_BUCKET, reusable, 3600) : null;
      initial = {
        mode: source.mode,
        prompt: source.mode === "text_to_video" ? source.prompt : "",
        negativePrompt: source.negative_prompt ?? "",
        motionPrompt: source.mode === "image_to_video" ? source.prompt : "",
        model: source.model,
        resolution: source.resolution,
        duration: source.duration_seconds as Duration,
        aspectRatio: source.aspect_ratio,
        audio: source.audio,
        templateId: source.template_id ?? undefined,
        existingImage: reusable && previewUrl ? { path: reusable, previewUrl } : null,
      };
    }
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">{t.create.title}</h1>
        <p className="text-sm text-muted-foreground">{t.create.subtitle}</p>
      </div>
      <CreateVideoForm
        initial={initial}
        balance={ctx.organization.credit_balance}
        canGenerate={isKlingConfigured() && ctx.profile.status === "active"}
        duplicated={duplicated}
      />
    </div>
  );
}
