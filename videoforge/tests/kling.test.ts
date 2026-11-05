import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import type { KlingEnv } from "@/lib/env";
import {
  backoffDelay,
  classifyKlingError,
  KlingClient,
  KlingError,
  parseCallbackTaskRef,
  parseTask,
  summarizeBilling,
  verifyKlingWebhook,
  type KlingCallMetrics,
} from "@/lib/kling";

const env: KlingEnv = {
  apiKey: "test-key",
  baseUrl: "https://kling.test",
  webhookSecret: null,
  usdPerUnit: 0.14,
  requestTimeoutMs: 5_000,
  taskTimeoutMinutes: 30,
};

const noSleep = { maxAttempts: 4, baseDelayMs: 1, maxDelayMs: 1, sleep: async () => {} };

type Call = { url: string; init: RequestInit };

function mockFetch(responses: Array<{ status: number; body: unknown } | Error>) {
  const calls: Call[] = [];
  const fn = (async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), init: init ?? {} });
    const next = responses.shift();
    if (!next) throw new Error("no more responses");
    if (next instanceof Error) throw next;
    return new Response(JSON.stringify(next.body), { status: next.status, headers: { "content-type": "application/json" } });
  }) as typeof fetch;
  return { fn, calls };
}

const created = { code: 0, message: "ok", request_id: "req-1", data: { id: "task-1", status: "submitted", create_time: 1, update_time: 1, external_id: "job-1" } };

describe("classifyKlingError", () => {
  it.each([
    [401, 1000, "invalid_api_key"],
    [401, 1004, "invalid_api_key"],
    [429, 1102, "provider_insufficient_balance"],
    [403, 1103, "forbidden"],
    [400, 1201, "invalid_request"],
    [404, 1203, "not_found"],
    [400, 1301, "content_moderation"],
    [429, 1302, "rate_limited"],
    [429, 1303, "concurrency_limited"],
    [429, 1304, "ip_blocked"],
    [500, 5000, "provider_unavailable"],
    [504, 5002, "timeout"],
    [502, null, "provider_unavailable"],
    [null, null, "network"],
  ] as const)("HTTP %s / code %s -> %s", (http, code, expected) => {
    expect(classifyKlingError(http, code)).toBe(expected);
  });
});

describe("backoffDelay", () => {
  it("grows exponentially, never below the base delay, capped", () => {
    const opts = { maxAttempts: 5, baseDelayMs: 1000, maxDelayMs: 8000 };
    expect(backoffDelay(1, { ...opts, random: () => 1 })).toBe(1000);
    expect(backoffDelay(2, { ...opts, random: () => 1 })).toBe(2000);
    expect(backoffDelay(3, { ...opts, random: () => 1 })).toBe(4000);
    expect(backoffDelay(6, { ...opts, random: () => 1 })).toBe(8000);
    expect(backoffDelay(3, { ...opts, random: () => 0 })).toBe(1000);
  });
});

describe("KlingClient", () => {
  it("creates a text-to-video task with the documented request shape", async () => {
    const { fn, calls } = mockFetch([{ status: 200, body: created }]);
    const metrics: KlingCallMetrics[] = [];
    const client = new KlingClient(env, { fetch: fn, retry: noSleep, onCall: (m) => void metrics.push(m) });
    const task = await client.createTextToVideoTask({
      model: "kling-2.6",
      prompt: "A cat",
      resolution: "1080p",
      aspectRatio: "9:16",
      duration: 10,
      audio: true,
      externalTaskId: "job-1",
      callbackUrl: "https://app.test/api/kling/callback",
    });
    expect(task.id).toBe("task-1");
    expect(calls[0]?.url).toBe("https://kling.test/text-to-video/kling-2.6");
    expect((calls[0]?.init.headers as Record<string, string>).Authorization).toBe("Bearer test-key");
    expect(JSON.parse(String(calls[0]?.init.body))).toEqual({
      prompt: "A cat",
      settings: { resolution: "1080p", aspect_ratio: "9:16", duration: 10, audio: "native" },
      options: {
        external_task_id: "job-1",
        watermark_info: { enabled: false },
        callback_url: "https://app.test/api/kling/callback",
      },
    });
    expect(metrics).toHaveLength(1);
    expect(metrics[0]).toMatchObject({ operation: "create_text_to_video", success: true, httpStatus: 200, providerCode: 0 });
    // Metrics never include the prompt or key.
    expect(JSON.stringify(metrics)).not.toContain("A cat");
    expect(JSON.stringify(metrics)).not.toContain("test-key");
  });

  it("sends image-to-video as contents[] with a first_frame", async () => {
    const { fn, calls } = mockFetch([{ status: 200, body: created }]);
    const client = new KlingClient(env, { fetch: fn, retry: noSleep });
    await client.createImageToVideoTask({
      model: "kling-2.5-turbo",
      prompt: "Slow push in",
      image: "https://storage.test/frame.jpg",
      resolution: "720p",
      duration: 5,
      externalTaskId: "job-2",
    });
    expect(calls[0]?.url).toBe("https://kling.test/image-to-video/kling-2.5-turbo");
    expect(JSON.parse(String(calls[0]?.init.body))).toEqual({
      contents: [
        { type: "prompt", text: "Slow push in" },
        { type: "first_frame", url: "https://storage.test/frame.jpg" },
      ],
      settings: { resolution: "720p", duration: 5 },
      options: { external_task_id: "job-2", watermark_info: { enabled: false } },
    });
  });

  it("does not retry content moderation rejections", async () => {
    const { fn, calls } = mockFetch([{ status: 400, body: { code: 1301, message: "risk control", request_id: "r" } }]);
    const client = new KlingClient(env, { fetch: fn, retry: noSleep });
    const error = await client
      .createTextToVideoTask({ model: "kling-2.6", prompt: "x", resolution: "720p", aspectRatio: "16:9", duration: 5, externalTaskId: "j" })
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(KlingError);
    expect((error as KlingError).category).toBe("content_moderation");
    expect(calls).toHaveLength(1);
  });

  it("retries rate limits with backoff and then succeeds", async () => {
    const { fn, calls } = mockFetch([
      { status: 429, body: { code: 1302, message: "too many", request_id: "r" } },
      { status: 429, body: { code: 1303, message: "parallel task over resource pack limit", request_id: "r" } },
      { status: 200, body: created },
    ]);
    const client = new KlingClient(env, { fetch: fn, retry: noSleep });
    const task = await client.createTextToVideoTask({
      model: "kling-2.6", prompt: "x", resolution: "720p", aspectRatio: "16:9", duration: 5, externalTaskId: "job-1",
    });
    expect(task.id).toBe("task-1");
    expect(calls).toHaveLength(3);
  });

  it("treats HTTP 200 with a non-zero code as an error", async () => {
    const { fn } = mockFetch([{ status: 200, body: { code: 1000, message: "Authentication failed", request_id: "r" } }]);
    const client = new KlingClient(env, { fetch: fn, retry: noSleep });
    await expect(client.getTaskStatus("t")).rejects.toMatchObject({ category: "invalid_api_key" });
  });

  it("after an ambiguous failure, looks the task up by external_task_id instead of creating a duplicate", async () => {
    const existing = { code: 0, message: "ok", request_id: "r2", data: [{ id: "task-9", status: "processing", external_id: "job-1" }] };
    const { fn, calls } = mockFetch([new TypeError("socket hang up"), { status: 200, body: existing }]);
    const client = new KlingClient(env, { fetch: fn, retry: noSleep });
    const task = await client.createTextToVideoTask({
      model: "kling-2.6", prompt: "x", resolution: "720p", aspectRatio: "16:9", duration: 5, externalTaskId: "job-1",
    });
    expect(task.id).toBe("task-9");
    expect(calls).toHaveLength(2);
    expect(calls[1]?.url).toBe("https://kling.test/tasks?external_task_ids=job-1");
  });

  it("queries task status by id and parses outputs and billing", async () => {
    const body = {
      code: 0,
      message: "ok",
      request_id: "r3",
      data: [
        {
          id: "task-1",
          status: "succeeded",
          message: "",
          create_time: 1781080778802,
          update_time: 1781080794151,
          external_id: "job-1",
          outputs: [{ type: "video", id: "v1", url: "https://cdn.test/v.mp4", watermark_url: null, duration: "5.1" }],
          billing: [{ charge_type: "unit", amount: "2.5", currency: null, package_type: "video" }],
        },
      ],
    };
    const { fn, calls } = mockFetch([{ status: 200, body }]);
    const client = new KlingClient(env, { fetch: fn, retry: noSleep });
    const task = await client.getTaskStatus("task-1");
    expect(calls[0]?.url).toBe("https://kling.test/tasks?task_ids=task-1");
    expect(task.status).toBe("succeeded");
    expect(task.videos).toEqual([{ id: "v1", url: "https://cdn.test/v.mp4", watermarkUrl: null, durationSeconds: 5.1 }]);
    expect(summarizeBilling(task.billing, 0.14)).toEqual({ units: 2.5, costUsd: 0.35 });
  });

  it("throws not_found when the task list is empty", async () => {
    const { fn } = mockFetch([{ status: 200, body: { code: 0, message: "ok", request_id: "r", data: [] } }]);
    const client = new KlingClient(env, { fetch: fn, retry: noSleep });
    await expect(client.getTaskStatus("missing")).rejects.toMatchObject({ category: "not_found" });
  });

  it("refuses to download from non-public URLs", async () => {
    const client = new KlingClient(env, { fetch: mockFetch([]).fn, retry: noSleep });
    for (const url of ["http://cdn.test/v.mp4", "https://localhost/v.mp4", "https://127.0.0.1/v.mp4", "https://[::1]/v.mp4"]) {
      await expect(client.downloadVideo(url)).rejects.toMatchObject({ category: "download_failed" });
    }
  });
});

describe("parseTask", () => {
  it("rejects unknown status values", () => {
    expect(() => parseTask({ id: "x", status: "succeed" }, null)).toThrow();
  });
});

describe("summarizeBilling", () => {
  it("prefers reported USD cash amounts", () => {
    expect(summarizeBilling([{ chargeType: "cash", amount: 0.5, currency: "USD", packageType: "video" }], 0.14)).toEqual({ units: null, costUsd: 0.5 });
    expect(summarizeBilling([], 0.14)).toEqual({ units: null, costUsd: null });
  });
});

describe("verifyKlingWebhook", () => {
  const rawSecret = Buffer.from("super-secret-key-material").toString("base64");
  const secret = `whsec_${rawSecret}`;
  const body = JSON.stringify({ id: "task-1", status: "succeeded" });
  const sign = (id: string, ts: string, payload: string) =>
    createHmac("sha256", Buffer.from(rawSecret, "base64")).update(`${id}.${ts}.${payload}`).digest("base64");

  it("accepts a valid signature (also among several)", () => {
    const sig = sign("msg_1", "1700000000", body);
    expect(verifyKlingWebhook(body, { id: "msg_1", timestamp: "1700000000", signature: `v1,${sig}` }, secret, 1700000100)).toEqual({ ok: true });
    expect(verifyKlingWebhook(body, { id: "msg_1", timestamp: "1700000000", signature: `v1,AAAA v1,${sig}` }, secret, 1700000100)).toEqual({ ok: true });
  });

  it("rejects tampered bodies, stale timestamps and missing headers", () => {
    const sig = sign("msg_1", "1700000000", body);
    expect(verifyKlingWebhook(`${body} `, { id: "msg_1", timestamp: "1700000000", signature: `v1,${sig}` }, secret, 1700000000)).toEqual({ ok: false, reason: "bad_signature" });
    expect(verifyKlingWebhook(body, { id: "msg_1", timestamp: "1700000000", signature: `v1,${sig}` }, secret, 1700000400)).toEqual({ ok: false, reason: "stale" });
    expect(verifyKlingWebhook(body, { id: null, timestamp: "1", signature: "v1,x" }, secret)).toEqual({ ok: false, reason: "missing_headers" });
  });
});

describe("parseCallbackTaskRef", () => {
  it("extracts only identifiers", () => {
    expect(parseCallbackTaskRef(JSON.stringify({ id: "t1", external_id: "j1", status: "succeeded" }))).toEqual({ taskId: "t1", externalId: "j1" });
    expect(parseCallbackTaskRef("not json")).toBeNull();
  });
});
