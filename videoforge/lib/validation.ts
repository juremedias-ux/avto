import { z } from "zod";
import { ASPECT_RATIOS, MODEL_IDS, MODELS, RESOLUTIONS, validateModelSettings } from "@/lib/models";
import { findTemplate } from "@/lib/templates";

/** Max length of the negative prompt (merged into the prompt, see composePrompt). */
export const NEGATIVE_PROMPT_MAX = 500;
const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
export const SOURCE_IMAGE_PATH_RE = new RegExp(`^(${UUID})/(${UUID})/(${UUID})\\.(jpg|png)$`);

const durationSchema = z.coerce.number().pipe(z.union([z.literal(5), z.literal(10)]));

const sharedSettings = {
  model: z.enum(MODEL_IDS),
  resolution: z.enum(RESOLUTIONS),
  duration: durationSchema,
  aspectRatio: z.enum(ASPECT_RATIOS),
  audio: z.boolean().default(false),
  templateId: z
    .string()
    .max(64)
    .regex(/^[a-z0-9-]+$/)
    .optional()
    .refine((id) => id === undefined || findTemplate(id) !== undefined, "unknown_template"),
};

const promptSchema = z.string().trim().min(3, "prompt_too_short").max(2500, "prompt_too_long");

export const textToVideoSchema = z.object({
  mode: z.literal("text_to_video"),
  prompt: promptSchema,
  negativePrompt: z.string().trim().max(NEGATIVE_PROMPT_MAX, "negative_too_long").optional(),
  ...sharedSettings,
});

export const imageToVideoSchema = z.object({
  mode: z.literal("image_to_video"),
  prompt: promptSchema,
  sourceImagePath: z.string().regex(SOURCE_IMAGE_PATH_RE, "invalid_image"),
  ...sharedSettings,
});

export const generationSchema = z
  .discriminatedUnion("mode", [textToVideoSchema, imageToVideoSchema])
  .superRefine((input, ctx) => {
    const model = MODELS[input.model];
    const problem = validateModelSettings(model, { resolution: input.resolution, audio: input.audio });
    if (problem) ctx.addIssue({ code: "custom", path: ["resolution"], message: problem });
    const negative = input.mode === "text_to_video" ? input.negativePrompt : undefined;
    const limit = input.mode === "text_to_video" ? model.maxPromptLength.textToVideo : model.maxPromptLength.imageToVideo;
    if (composePrompt(input.prompt, negative).length > limit) {
      ctx.addIssue({ code: "custom", path: ["prompt"], message: "prompt_too_long" });
    }
  });

export type GenerationInput = z.infer<typeof generationSchema>;

/**
 * Kling's new-standard video endpoints have no negative_prompt field; the API
 * reference states prompts may contain negative descriptions. The negative
 * prompt is therefore appended as an "Avoid:" clause.
 */
export function composePrompt(prompt: string, negativePrompt?: string | null): string {
  const negative = negativePrompt?.trim();
  return negative ? `${prompt.trim()}\n\nAvoid: ${negative}` : prompt.trim();
}

export const uuidSchema = z.uuid();

export const videoFiltersSchema = z.object({
  status: z.enum(["draft", "queued", "processing", "succeeded", "failed"]).optional().catch(undefined),
  model: z.enum(MODEL_IDS).optional().catch(undefined),
  format: z.enum(ASPECT_RATIOS).optional().catch(undefined),
  from: z.iso.date().optional().catch(undefined),
  to: z.iso.date().optional().catch(undefined),
  page: z.coerce.number().int().min(1).max(10_000).optional().catch(undefined),
});
export type VideoFilters = z.infer<typeof videoFiltersSchema>;

export const emailSchema = z.string().trim().toLowerCase().pipe(z.email().max(254));
export const passwordSchema = z.string().min(8, "password_too_short").max(128);

export const signUpSchema = z.object({
  fullName: z.string().trim().min(1).max(120),
  email: emailSchema,
  password: passwordSchema,
});

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(128),
});

export const profileSchema = z.object({
  fullName: z.string().trim().min(1).max(120),
  locale: z.enum(["sl", "en"]),
});

export const organizationNameSchema = z.string().trim().min(1).max(100);

export const addMemberSchema = z.object({
  organizationId: uuidSchema,
  email: emailSchema,
  role: z.enum(["admin", "member"]),
});

export const memberRoleSchema = z.object({
  organizationId: uuidSchema,
  userId: uuidSchema,
  role: z.enum(["admin", "member"]),
});

export const removeMemberSchema = z.object({ organizationId: uuidSchema, userId: uuidSchema });

export const adminCreditsSchema = z.object({
  organizationId: uuidSchema,
  amount: z.coerce
    .number()
    .int()
    .min(-100_000)
    .max(100_000)
    .refine((n) => n !== 0, "amount_zero"),
  reason: z.string().trim().min(3).max(500),
});

export const adminStatusSchema = z.object({
  userId: uuidSchema,
  status: z.enum(["active", "suspended", "blocked"]),
  reason: z.string().trim().max(500).optional(),
});

export const checkoutSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("pack"), packId: z.enum(["pack-50", "pack-200", "pack-500"]) }),
  z.object({ kind: z.literal("subscription") }),
]);
