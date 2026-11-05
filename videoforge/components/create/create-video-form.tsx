"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CoinsIcon, ImageIcon, Loader2Icon, TypeIcon, UploadIcon } from "lucide-react";
import { FormMessage } from "@/components/form-message";
import { TemplatePicker } from "@/components/create/template-picker";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cropToAspect, type CroppedImage } from "@/lib/client-image";
import { format, plural } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/client";
import {
  ASPECT_RATIOS,
  DURATIONS,
  effectiveAudio,
  MODEL_IDS,
  MODELS,
  validateModelSettings,
  type AspectRatio,
  type Duration,
  type ModelId,
  type Resolution,
} from "@/lib/models";
import { estimateCost } from "@/lib/pricing";
import type { PromptTemplate } from "@/lib/templates";
import { composePrompt, NEGATIVE_PROMPT_MAX } from "@/lib/validation";
import { cn } from "@/lib/utils";

type Mode = "text_to_video" | "image_to_video";

export type CreateFormInitial = {
  mode: Mode;
  prompt: string;
  negativePrompt: string;
  motionPrompt: string;
  model: ModelId;
  resolution: Resolution;
  duration: Duration;
  aspectRatio: AspectRatio;
  audio: boolean;
  templateId?: string;
  /** Existing source image (duplicate of the user's own image-to-video). */
  existingImage?: { path: string; previewUrl: string } | null;
};

type Props = {
  initial: CreateFormInitial;
  balance: number;
  canGenerate: boolean;
  duplicated: boolean;
};

function Segmented<T extends string | number>({
  value,
  options,
  onChange,
  label,
  render,
  disabled,
}: {
  value: T;
  options: readonly T[];
  onChange: (v: T) => void;
  label: string;
  render?: (v: T) => string;
  disabled?: boolean;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex w-full rounded-lg bg-muted p-1">
      {options.map((o) => (
        <button
          key={String(o)}
          type="button"
          role="radio"
          aria-checked={o === value}
          disabled={disabled}
          onClick={() => onChange(o)}
          className={cn(
            "flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50",
            o === value ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {render ? render(o) : String(o)}
        </button>
      ))}
    </div>
  );
}

export function CreateVideoForm({ initial, balance, canGenerate, duplicated }: Props) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(initial.mode);
  const [prompt, setPrompt] = useState(initial.prompt);
  const [negativePrompt, setNegativePrompt] = useState(initial.negativePrompt);
  const [motionPrompt, setMotionPrompt] = useState(initial.motionPrompt);
  const [model, setModel] = useState<ModelId>(initial.model);
  const [resolution, setResolution] = useState<Resolution>(initial.resolution);
  const [duration, setDuration] = useState<Duration>(initial.duration);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(initial.aspectRatio);
  const [audio, setAudio] = useState(initial.audio);
  const [templateId, setTemplateId] = useState<string | undefined>(initial.templateId);
  const [file, setFile] = useState<File | null>(null);
  const [cropped, setCropped] = useState<CroppedImage | null>(null);
  const [existingImage, setExistingImage] = useState(initial.existingImage ?? null);
  const [stage, setStage] = useState<"idle" | "uploading" | "submitting">("idle");
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const spec = MODELS[model];
  const audioOn = effectiveAudio(spec, audio);
  const settingsProblem = validateModelSettings(spec, { resolution, audio: audioOn });
  const cost = useMemo(() => {
    try {
      return estimateCost({ model, resolution, duration, audio: audioOn });
    } catch {
      return null;
    }
  }, [model, resolution, duration, audioOn]);
  const after = cost ? balance - cost.credits : balance;
  const insufficient = cost !== null && after < 0;

  const activePrompt = mode === "text_to_video" ? prompt : motionPrompt;
  const maxLength = mode === "text_to_video" ? spec.maxPromptLength.textToVideo : spec.maxPromptLength.imageToVideo;
  const composedLength = composePrompt(activePrompt, mode === "text_to_video" ? negativePrompt : "").length;

  function changeModel(id: ModelId) {
    setModel(id);
    // Keep resolution valid for the new model.
    const next = MODELS[id];
    if (!next.resolutions.includes(resolution)) setResolution(next.resolutions[0] ?? "720p");
  }

  // Re-crop locally whenever the image or aspect ratio changes (upload happens on submit).
  useEffect(() => {
    if (!file) return;
    let cancelled = false;
    void cropToAspect(file, aspectRatio).then((result) => {
      if (cancelled) return;
      if (typeof result === "string") {
        setCropped(null);
        setError((t.errors as Record<string, string>)[result] ?? t.errors.invalid_image);
      } else {
        setError(null);
        setCropped((prev) => {
          if (prev) URL.revokeObjectURL(prev.previewUrl);
          return result;
        });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [file, aspectRatio, t]);

  function applyTemplate(tpl: PromptTemplate) {
    setTemplateId(tpl.id);
    setAspectRatio(tpl.aspectRatio);
    setDuration(tpl.duration);
    if (mode === "text_to_video") {
      setPrompt(tpl.prompt);
      setNegativePrompt(tpl.negativePrompt);
    } else {
      setMotionPrompt(tpl.motionPrompt);
    }
  }

  function messageFor(code: string | undefined, extra?: { max?: number }): string {
    const map = t.errors as Record<string, string>;
    const text = (code && map[code]) || t.errors.unknown;
    return format(text, { max: extra?.max ?? 2 });
  }

  async function uploadImage(): Promise<string | null> {
    if (!cropped) return existingImage?.path ?? null;
    setStage("uploading");
    const fd = new FormData();
    fd.set("file", new File([cropped.blob], "frame.jpg", { type: "image/jpeg" }));
    const res = await fetch("/api/uploads/source-image", { method: "POST", body: fd });
    const body = (await res.json().catch(() => ({}))) as { path?: string; error?: string };
    if (!res.ok || !body.path) {
      setError(messageFor(body.error));
      return null;
    }
    setExistingImage(null);
    return body.path;
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (settingsProblem) return setError(messageFor(settingsProblem));
    if (composedLength > maxLength) return setError(t.errors.prompt_too_long);
    if (activePrompt.trim().length < 3) return setError(t.errors.prompt_too_short);

    try {
      let sourceImagePath: string | null = null;
      if (mode === "image_to_video") {
        sourceImagePath = await uploadImage();
        if (!sourceImagePath) {
          setStage("idle");
          if (!cropped && !existingImage) setError(t.errors.invalid_image);
          return;
        }
      }
      setStage("submitting");
      const payload =
        mode === "text_to_video"
          ? { mode, prompt, negativePrompt: negativePrompt || undefined, model, resolution, duration, aspectRatio, audio: audioOn, templateId }
          : { mode, prompt: motionPrompt, sourceImagePath, model, resolution, duration, aspectRatio, audio: audioOn, templateId };
      const res = await fetch("/api/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = (await res.json().catch(() => ({}))) as { videoId?: string; error?: string; reason?: string; max?: number };
      if (res.ok && body.videoId) {
        router.push(`/library/${body.videoId}`);
        router.refresh();
        return;
      }
      setError(messageFor(body.error === "validation" ? (body.reason ?? "validation") : body.error, { max: body.max }));
      if (body.videoId) router.refresh();
    } catch {
      setError(t.errors.network);
    } finally {
      setStage("idle");
    }
  }

  const busy = stage !== "idle";
  const previewUrl = cropped?.previewUrl ?? existingImage?.previewUrl ?? null;

  const settings = (
    <div className="grid gap-5 sm:grid-cols-2">
      <div className="grid gap-2">
        <Label>{t.create.model}</Label>
        <Select value={model} onValueChange={(v) => changeModel(v as ModelId)}>
          <SelectTrigger aria-label={t.create.model}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MODEL_IDS.map((id) => (
              <SelectItem key={id} value={id}>
                {MODELS[id].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-2">
        <Label>{t.create.resolution}</Label>
        <Segmented value={resolution} options={spec.resolutions} onChange={setResolution} label={t.create.resolution} />
      </div>
      <div className="grid gap-2">
        <Label>{t.create.duration}</Label>
        <Segmented
          value={duration}
          options={DURATIONS}
          onChange={setDuration}
          label={t.create.duration}
          render={(d) => format(t.common.seconds, { n: d })}
        />
      </div>
      <div className="grid gap-2">
        <Label>{t.create.aspectRatio}</Label>
        <Segmented
          value={aspectRatio}
          options={ASPECT_RATIOS}
          onChange={setAspectRatio}
          label={t.create.aspectRatio}
          disabled={mode === "image_to_video" && !file && Boolean(existingImage)}
        />
      </div>
      <div className="grid gap-2 sm:col-span-2">
        <Label>{t.create.audio}</Label>
        {spec.audio.kind === "optional" ? (
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="size-4 accent-[var(--primary)]"
              checked={audio}
              onChange={(e) => {
                setAudio(e.target.checked);
                if (e.target.checked && spec.audio.kind === "optional" && spec.audio.requiresResolution) {
                  setResolution(spec.audio.requiresResolution);
                }
              }}
            />
            {t.create.audioOptional}
            {spec.audio.requiresResolution && (
              <span className="text-xs text-muted-foreground">({t.create.audioRequires1080})</span>
            )}
          </label>
        ) : (
          <p className="text-sm text-muted-foreground">
            {spec.audio.kind === "always" ? t.create.audioAlways : t.create.audioNone}
          </p>
        )}
      </div>
    </div>
  );

  return (
    <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="grid min-w-0 gap-6">
        {duplicated && <FormMessage message={t.create.duplicateLoaded} />}
        <Card>
          <CardContent className="grid gap-6">
            <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)}>
              <TabsList className="w-full sm:w-fit">
                <TabsTrigger value="text_to_video">
                  <TypeIcon aria-hidden />
                  {t.create.tabText}
                </TabsTrigger>
                <TabsTrigger value="image_to_video">
                  <ImageIcon aria-hidden />
                  {t.create.tabImage}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="text_to_video" className="grid gap-5">
                <div className="grid gap-2">
                  <Label htmlFor="prompt">{t.create.prompt}</Label>
                  <Textarea
                    id="prompt"
                    rows={5}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={t.create.promptPlaceholder}
                    maxLength={maxLength}
                    aria-invalid={composedLength > maxLength}
                  />
                  <p className="flex justify-between gap-2 text-xs text-muted-foreground">
                    <span>{format(t.create.promptHint, { max: maxLength })}</span>
                    <span className={cn(composedLength > maxLength && "text-destructive")}>
                      {composedLength}/{maxLength}
                    </span>
                  </p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="negative">{t.create.negativePrompt}</Label>
                  <Textarea
                    id="negative"
                    rows={2}
                    value={negativePrompt}
                    onChange={(e) => setNegativePrompt(e.target.value)}
                    placeholder={t.create.negativePlaceholder}
                    maxLength={NEGATIVE_PROMPT_MAX}
                  />
                  <p className="text-xs text-muted-foreground">{t.create.negativeHint}</p>
                </div>
              </TabsContent>

              <TabsContent value="image_to_video" className="grid gap-5">
                <div className="grid gap-2">
                  <Label htmlFor="image">{t.create.image}</Label>
                  <div className="grid gap-3 sm:grid-cols-[12rem_minmax(0,1fr)] sm:items-start">
                    <button
                      type="button"
                      onClick={() => fileInput.current?.click()}
                      className="grid aspect-square place-items-center overflow-hidden rounded-lg border border-dashed bg-muted/40 text-muted-foreground hover:bg-muted"
                    >
                      {previewUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element -- local object URL / signed URL
                        <img src={previewUrl} alt="" className="size-full object-contain" />
                      ) : (
                        <span className="grid place-items-center gap-2 text-xs">
                          <UploadIcon aria-hidden />
                          {t.create.imageSelect}
                        </span>
                      )}
                    </button>
                    <div className="grid gap-2 text-xs text-muted-foreground">
                      <p>{t.create.imageHint}</p>
                      <p>{format(t.create.imageCropNote, { ratio: aspectRatio })}</p>
                      {cropped && <p className="text-success">{t.create.imageReady} · {cropped.width} × {cropped.height}</p>}
                      <Button type="button" size="sm" variant="outline" className="w-fit" onClick={() => fileInput.current?.click()}>
                        {previewUrl ? t.create.imageChange : t.create.imageSelect}
                      </Button>
                    </div>
                  </div>
                  <input
                    ref={fileInput}
                    id="image"
                    type="file"
                    accept="image/jpeg,image/png"
                    className="sr-only"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) setFile(f);
                    }}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="motion">{t.create.motionPrompt}</Label>
                  <Textarea
                    id="motion"
                    rows={3}
                    value={motionPrompt}
                    onChange={(e) => setMotionPrompt(e.target.value)}
                    placeholder={t.create.motionPlaceholder}
                    maxLength={maxLength}
                  />
                  <p className="text-xs text-muted-foreground">{format(t.create.promptHint, { max: maxLength })}</p>
                </div>
              </TabsContent>
            </Tabs>
            <Separator />
            {settings}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t.create.templates}</CardTitle>
            <CardDescription>{t.create.templatesHint}</CardDescription>
          </CardHeader>
          <CardContent>
            <TemplatePicker onApply={applyTemplate} activeId={templateId} />
          </CardContent>
        </Card>
      </div>

      <div className="lg:sticky lg:top-20 lg:self-start">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CoinsIcon className="size-4 text-warning" aria-hidden />
              {t.create.estimate}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <p className="text-3xl font-semibold" aria-live="polite">
              {cost ? plural(t.credits, cost.credits, locale) : "—"}
            </p>
            <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 text-sm">
              <dt className="text-muted-foreground">{t.create.balance}</dt>
              <dd>{plural(t.credits, balance, locale)}</dd>
              <dt className="text-muted-foreground">{t.create.afterGeneration}</dt>
              <dd className={cn(insufficient && "text-destructive")}>{plural(t.credits, Math.max(after, 0), locale)}</dd>
            </dl>
            {insufficient && (
              <div className="grid gap-2 text-sm text-destructive">
                {t.create.insufficient}
                <Button asChild variant="outline" size="sm">
                  <Link href="/billing">{t.create.buyCredits}</Link>
                </Button>
              </div>
            )}
            <FormMessage error={error} />
            <Button type="submit" size="lg" disabled={!canGenerate || busy || insufficient || Boolean(settingsProblem)}>
              {busy && <Loader2Icon className="animate-spin" />}
              {stage === "uploading" ? t.create.imageUploading : stage === "submitting" ? t.create.submitting : t.create.submit}
            </Button>
            <p className="text-xs text-muted-foreground">{t.create.chargedNote}</p>
          </CardContent>
        </Card>
      </div>
    </form>
  );
}
