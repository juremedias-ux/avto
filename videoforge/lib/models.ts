/**
 * Kling video models exposed in VideoForge, with the capabilities documented in
 * the Kling API reference (new-standard endpoints, snapshot dated 2026-09-20).
 * See docs/kling-integration.md. Shared by client and server code.
 */

export const RESOLUTIONS = ["720p", "1080p", "4k"] as const;
export type Resolution = (typeof RESOLUTIONS)[number];

export const ASPECT_RATIOS = ["16:9", "9:16", "1:1"] as const;
export type AspectRatio = (typeof ASPECT_RATIOS)[number];

/** Product decision: VideoForge offers 5 s and 10 s clips on every model. */
export const DURATIONS = [5, 10] as const;
export type Duration = (typeof DURATIONS)[number];

export const MODEL_IDS = ["kling-2.5-turbo", "kling-2.6", "kling-3.0", "kling-3.0-turbo"] as const;
export type ModelId = (typeof MODEL_IDS)[number];

/** How a model handles native audio in the API. */
export type AudioSupport =
  | { kind: "none" }
  | { kind: "always" }
  | { kind: "optional"; requiresResolution?: Resolution };

export type ModelSpec = {
  id: ModelId;
  label: string;
  resolutions: readonly Resolution[];
  audio: AudioSupport;
  /** Whether the create request accepts settings.multi_shot. */
  supportsMultiShot: boolean;
  /** Prompt limits (characters) per endpoint. */
  maxPromptLength: { textToVideo: number; imageToVideo: number };
  /** Kling resource-pack units per generated second, by resolution and audio. */
  unitsPerSecond: Partial<Record<Resolution, { silent?: number; audio?: number }>>;
};

export const MODELS: Record<ModelId, ModelSpec> = {
  "kling-2.5-turbo": {
    id: "kling-2.5-turbo",
    label: "Kling 2.5 Turbo",
    resolutions: ["720p", "1080p"],
    audio: { kind: "none" },
    supportsMultiShot: false,
    maxPromptLength: { textToVideo: 2500, imageToVideo: 2500 },
    unitsPerSecond: { "720p": { silent: 0.3 }, "1080p": { silent: 0.5 } },
  },
  "kling-2.6": {
    id: "kling-2.6",
    label: "Kling 2.6",
    resolutions: ["720p", "1080p"],
    // "When generating videos with native audio, only 1080P resolution is supported."
    audio: { kind: "optional", requiresResolution: "1080p" },
    supportsMultiShot: false,
    maxPromptLength: { textToVideo: 2500, imageToVideo: 2500 },
    unitsPerSecond: { "720p": { silent: 0.3 }, "1080p": { silent: 0.5, audio: 1.0 } },
  },
  "kling-3.0": {
    id: "kling-3.0",
    label: "Kling 3.0",
    resolutions: ["720p", "1080p", "4k"],
    audio: { kind: "optional" },
    supportsMultiShot: true,
    maxPromptLength: { textToVideo: 2500, imageToVideo: 2500 },
    unitsPerSecond: {
      "720p": { silent: 0.6, audio: 0.9 },
      "1080p": { silent: 0.8, audio: 1.2 },
      "4k": { silent: 3.0, audio: 3.0 },
    },
  },
  "kling-3.0-turbo": {
    id: "kling-3.0-turbo",
    label: "Kling 3.0 Turbo",
    resolutions: ["720p", "1080p"],
    // Billed "With Native Audio"; the create request has no audio switch.
    audio: { kind: "always" },
    supportsMultiShot: false,
    maxPromptLength: { textToVideo: 2500, imageToVideo: 2500 },
    unitsPerSecond: { "720p": { audio: 0.8 }, "1080p": { audio: 1.0 } },
  },
};

export const DEFAULT_MODEL: ModelId = "kling-2.6";

export function isModelId(value: string): value is ModelId {
  return (MODEL_IDS as readonly string[]).includes(value);
}

/** Resolves the effective audio flag for a model and requested setting. */
export function effectiveAudio(model: ModelSpec, requested: boolean): boolean {
  switch (model.audio.kind) {
    case "none":
      return false;
    case "always":
      return true;
    case "optional":
      return requested;
  }
}

/** Returns a reason code when the combination is not supported, otherwise null. */
export function validateModelSettings(
  model: ModelSpec,
  settings: { resolution: Resolution; audio: boolean },
): "resolution_unsupported" | "audio_requires_resolution" | null {
  if (!model.resolutions.includes(settings.resolution)) return "resolution_unsupported";
  const audio = effectiveAudio(model, settings.audio);
  if (audio && model.audio.kind === "optional" && model.audio.requiresResolution
      && settings.resolution !== model.audio.requiresResolution) {
    return "audio_requires_resolution";
  }
  return null;
}
