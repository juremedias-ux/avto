import type { AspectRatio, Duration } from "@/lib/models";

/**
 * Prompt templates. Prompts are written in English because Kling's prompt
 * guidance and examples are in English/Chinese; titles are localized.
 * Placeholders in [brackets] are meant to be replaced by the user.
 */

export const TEMPLATE_CATEGORIES = ["product", "ecommerce", "real_estate", "restaurant", "services", "social"] as const;
export type TemplateCategory = (typeof TEMPLATE_CATEGORIES)[number];

export type PromptTemplate = {
  id: string;
  category: TemplateCategory;
  title: { sl: string; en: string };
  prompt: string;
  negativePrompt: string;
  /** Motion prompt used when the template is applied in image-to-video mode. */
  motionPrompt: string;
  aspectRatio: AspectRatio;
  duration: Duration;
};

const COMMON_NEGATIVE = "blurry, distorted text, watermark, low resolution, flickering, deformed hands";

export const PROMPT_TEMPLATES: readonly PromptTemplate[] = [
  {
    id: "product-hero-spin",
    category: "product",
    title: { sl: "Izdelek na vrtljivem podstavku", en: "Product hero turntable" },
    prompt:
      "Studio product shot of [product] slowly rotating on a matte pedestal, soft key light with gentle rim light, clean gradient background, shallow depth of field, premium commercial look",
    negativePrompt: COMMON_NEGATIVE,
    motionPrompt: "The product slowly rotates 360 degrees on the pedestal while the camera holds steady, soft light sweeps across the surface",
    aspectRatio: "1:1",
    duration: 5,
  },
  {
    id: "product-macro-detail",
    category: "product",
    title: { sl: "Makro detajli izdelka", en: "Macro product details" },
    prompt:
      "Cinematic macro close-up gliding across the surface of [product], highlighting texture and craftsmanship, warm studio lighting, slow dolly movement, high-end advertisement",
    negativePrompt: COMMON_NEGATIVE,
    motionPrompt: "Slow macro dolly across the product surface, light glints move along the edges",
    aspectRatio: "16:9",
    duration: 5,
  },
  {
    id: "ecommerce-unboxing",
    category: "ecommerce",
    title: { sl: "Odpiranje paketa", en: "Unboxing moment" },
    prompt:
      "Top-down view of hands opening a branded box revealing [product] inside tissue paper, bright natural daylight, clean white table, satisfying unboxing moment for an online store",
    negativePrompt: COMMON_NEGATIVE,
    motionPrompt: "Hands lift the lid and reveal the product, camera slowly pushes in",
    aspectRatio: "9:16",
    duration: 5,
  },
  {
    id: "ecommerce-lifestyle",
    category: "ecommerce",
    title: { sl: "Izdelek v vsakdanji rabi", en: "Lifestyle in use" },
    prompt:
      "Lifestyle scene of a person using [product] in a bright modern apartment, natural window light, candid authentic moment, smooth handheld camera, social commerce ad",
    negativePrompt: COMMON_NEGATIVE,
    motionPrompt: "The person naturally uses the product, gentle handheld camera movement",
    aspectRatio: "9:16",
    duration: 10,
  },
  {
    id: "real-estate-exterior",
    category: "real_estate",
    title: { sl: "Zunanjost nepremičnine z drona", en: "Property exterior drone" },
    prompt:
      "Smooth aerial drone shot slowly approaching a [house type] with a garden at golden hour, warm sunlight, clear sky, real estate showcase, stable cinematic movement",
    negativePrompt: COMMON_NEGATIVE,
    motionPrompt: "Slow aerial push-in toward the building, slight upward tilt, golden hour light",
    aspectRatio: "16:9",
    duration: 10,
  },
  {
    id: "real-estate-interior",
    category: "real_estate",
    title: { sl: "Sprehod skozi notranjost", en: "Interior walkthrough" },
    prompt:
      "Steady gimbal walkthrough of a bright, staged [room type] with large windows, natural light, neutral modern furniture, wide-angle lens, inviting real estate tour",
    negativePrompt: COMMON_NEGATIVE,
    motionPrompt: "Steady gimbal glide forward through the room, slight pan toward the window",
    aspectRatio: "16:9",
    duration: 5,
  },
  {
    id: "restaurant-signature-dish",
    category: "restaurant",
    title: { sl: "Jed hiše", en: "Signature dish" },
    prompt:
      "Close-up of a freshly plated [dish] on a rustic wooden table, steam rising, warm restaurant ambience with bokeh lights, slow push-in, appetizing food commercial",
    negativePrompt: COMMON_NEGATIVE,
    motionPrompt: "Steam rises from the dish while the camera slowly pushes in",
    aspectRatio: "9:16",
    duration: 5,
  },
  {
    id: "restaurant-ambience",
    category: "restaurant",
    title: { sl: "Vzdušje v lokalu", en: "Restaurant ambience" },
    prompt:
      "Evening interior of a cozy [restaurant style] restaurant, guests enjoying dinner, candles and warm pendant lights, slow lateral tracking shot, inviting atmosphere",
    negativePrompt: COMMON_NEGATIVE,
    motionPrompt: "Slow lateral tracking shot, candle flames flicker gently",
    aspectRatio: "16:9",
    duration: 10,
  },
  {
    id: "services-team-at-work",
    category: "services",
    title: { sl: "Ekipa pri delu", en: "Team at work" },
    prompt:
      "Professional [service type] team working together in a modern office, confident friendly expressions, soft daylight, slow dolly shot, trustworthy corporate brand video",
    negativePrompt: COMMON_NEGATIVE,
    motionPrompt: "Slow dolly past the team at work, natural subtle movements",
    aspectRatio: "16:9",
    duration: 5,
  },
  {
    id: "services-before-after",
    category: "services",
    title: { sl: "Pred in po storitvi", en: "Service transformation" },
    prompt:
      "Satisfying transformation of a [space or object] being cleaned and renewed by a professional, smooth time-lapse feel, bright even lighting, clear result reveal",
    negativePrompt: COMMON_NEGATIVE,
    motionPrompt: "Smooth reveal of the renewed result, camera slowly pulls back",
    aspectRatio: "1:1",
    duration: 10,
  },
  {
    id: "social-hook-reveal",
    category: "social",
    title: { sl: "Hitri uvod za družbena omrežja", en: "Social hook reveal" },
    prompt:
      "Dynamic vertical shot with a quick whip pan revealing [subject], vibrant colors, energetic mood, punchy lighting, eye-catching first second for social media",
    negativePrompt: COMMON_NEGATIVE,
    motionPrompt: "Quick whip pan reveal followed by a gentle zoom in",
    aspectRatio: "9:16",
    duration: 5,
  },
  {
    id: "social-seasonal-promo",
    category: "social",
    title: { sl: "Sezonska akcija", en: "Seasonal promo" },
    prompt:
      "Festive [season] themed scene featuring [product or brand element], soft falling particles, warm cozy lighting, slow orbit camera, cheerful promotional mood",
    negativePrompt: COMMON_NEGATIVE,
    motionPrompt: "Slow orbit around the subject, soft particles drift through the frame",
    aspectRatio: "1:1",
    duration: 5,
  },
];

export function findTemplate(id: string | null | undefined): PromptTemplate | undefined {
  return id ? PROMPT_TEMPLATES.find((t) => t.id === id) : undefined;
}
