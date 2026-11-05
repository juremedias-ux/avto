import { DURATIONS, effectiveAudio, MODELS, type Duration, type ModelId, type Resolution } from "@/lib/models";

/**
 * Credit pricing. 1 VideoForge credit is priced against 1 Kling unit
 * (docs/pricing.md). Shared by client (estimate display) and server
 * (authoritative charge) so both always agree.
 */
export const CREDITS_PER_PROVIDER_UNIT = 1;
export const MINIMUM_CREDITS_PER_VIDEO = 1;

export type CostInput = {
  model: ModelId;
  resolution: Resolution;
  duration: Duration;
  audio: boolean;
};

export type CostBreakdown = {
  providerUnits: number;
  credits: number;
  audio: boolean;
};

export class PricingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PricingError";
  }
}

/** Kling units for the clip, from the per-second rate table. */
export function providerUnits(input: CostInput): number {
  const model = MODELS[input.model];
  const audio = effectiveAudio(model, input.audio);
  const rates = model.unitsPerSecond[input.resolution];
  const perSecond = audio ? rates?.audio : rates?.silent;
  if (perSecond === undefined) {
    throw new PricingError(`No rate for ${input.model} ${input.resolution} audio=${audio}`);
  }
  if (!(DURATIONS as readonly number[]).includes(input.duration)) {
    throw new PricingError(`Unsupported duration ${input.duration}`);
  }
  // Round to 3 decimals to avoid floating point noise (0.3 * 5 = 1.5000000000000002).
  return Math.round(perSecond * input.duration * 1000) / 1000;
}

export function estimateCost(input: CostInput): CostBreakdown {
  const model = MODELS[input.model];
  const audio = effectiveAudio(model, input.audio);
  const units = providerUnits({ ...input, audio });
  const credits = Math.max(MINIMUM_CREDITS_PER_VIDEO, Math.ceil(units * CREDITS_PER_PROVIDER_UNIT - 1e-9));
  return { providerUnits: units, credits, audio };
}

/** Provider cost in USD for a number of units. */
export function providerCostUsd(units: number, usdPerUnit: number): number {
  return Math.round(units * usdPerUnit * 10_000) / 10_000;
}
