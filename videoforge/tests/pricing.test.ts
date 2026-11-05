import { describe, expect, it } from "vitest";
import { MODEL_IDS, MODELS, validateModelSettings } from "@/lib/models";
import { estimateCost, providerCostUsd, providerUnits } from "@/lib/pricing";

describe("pricing", () => {
  it("computes Kling units from the per-second table", () => {
    expect(providerUnits({ model: "kling-2.5-turbo", resolution: "720p", duration: 5, audio: false })).toBe(1.5);
    expect(providerUnits({ model: "kling-2.6", resolution: "1080p", duration: 10, audio: true })).toBe(10);
    expect(providerUnits({ model: "kling-3.0", resolution: "4k", duration: 5, audio: false })).toBe(15);
    expect(providerUnits({ model: "kling-3.0-turbo", resolution: "1080p", duration: 5, audio: false })).toBe(5);
  });

  it("rounds credits up to whole credits", () => {
    expect(estimateCost({ model: "kling-2.5-turbo", resolution: "720p", duration: 5, audio: false }).credits).toBe(2);
    expect(estimateCost({ model: "kling-2.5-turbo", resolution: "1080p", duration: 5, audio: false }).credits).toBe(3);
    expect(estimateCost({ model: "kling-3.0", resolution: "720p", duration: 5, audio: true }).credits).toBe(5);
  });

  it("forces audio on for always-audio models and off for silent models", () => {
    expect(estimateCost({ model: "kling-3.0-turbo", resolution: "720p", duration: 5, audio: false }).audio).toBe(true);
    expect(estimateCost({ model: "kling-2.5-turbo", resolution: "720p", duration: 5, audio: true }).audio).toBe(false);
  });

  it("has a rate for every supported model/resolution/duration combination", () => {
    for (const id of MODEL_IDS) {
      for (const resolution of MODELS[id].resolutions) {
        for (const duration of [5, 10] as const) {
          for (const audio of [false, true]) {
            if (validateModelSettings(MODELS[id], { resolution, audio })) continue;
            expect(estimateCost({ model: id, resolution, duration, audio }).credits).toBeGreaterThan(0);
          }
        }
      }
    }
  });

  it("rejects 720p native audio on Kling 2.6", () => {
    expect(validateModelSettings(MODELS["kling-2.6"], { resolution: "720p", audio: true })).toBe("audio_requires_resolution");
    expect(validateModelSettings(MODELS["kling-2.6"], { resolution: "4k", audio: false })).toBe("resolution_unsupported");
  });

  it("converts units to USD", () => {
    expect(providerCostUsd(1.5, 0.14)).toBe(0.21);
  });
});
