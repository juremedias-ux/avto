# Kling AI integration

VideoForge does not train or host models. All generation is done by the Kling AI API;
`lib/kling.ts` is the only module that talks to it.

## Source of the API contract

The official documentation (`kling.ai/document-api`, `app.klingai.com`) could not be
reached from the development environment. The contract below was taken from a
**vendor documentation snapshot dated 2026-09-20** published in the GitHub repository
[`aself101/kling-api`](https://github.com/aself101/kling-api/tree/main/docs/api)
(files `kling-get-started-*.md`, `kling-2.5-turbo-*.md`, `kling-2.6-*.md`,
`kling-omni-3.0-*.md`, `kling-3.0-turbo-*.md`, `kling-pricing-video.md`,
`kling-updates-api.md`).

**Before going live, verify every item marked ⚠ against the current official docs**
(index: `https://kling.ai/document-api/llms.txt`).

## Endpoints used

| Purpose | Method and path | Notes |
| --- | --- | --- |
| Text to video | `POST {base}/text-to-video/{model}` | Model is part of the path |
| Image to video | `POST {base}/image-to-video/{model}` | First frame in `contents[]` |
| Task status | `GET {base}/tasks?task_ids={id}` | Returns `data: [task]` |
| Task by our id | `GET {base}/tasks?external_task_ids={id}` | Used for idempotent recovery |

* Base URL: `https://api-singapore.klingai.com` (documented as the endpoint for servers
  outside China; override with `KLING_API_BASE_URL`).
* Authentication: `Authorization: Bearer {KLING_API_KEY}`. The changelog (2026-06-17)
  introduced API-key authentication; new endpoints accept API keys only. The legacy
  AccessKey/SecretKey JWT scheme is **not** implemented.
* Models offered: `kling-2.5-turbo`, `kling-2.6`, `kling-3.0`, `kling-3.0-turbo`
  (`lib/models.ts`). ⚠ The snapshot's `kling-3.0` page is titled "Omni 3.0" while the
  path is `/text-to-video/kling-3.0`; pricing lists "Kling 3.0" and "Kling 3.0 Omni"
  separately. VideoForge uses the "Kling 3.0" rates, which are equal to or higher than
  the Omni rates.

### Request body — text to video

```json
{
  "prompt": "…",
  "settings": { "resolution": "720p", "aspect_ratio": "16:9", "duration": 5, "audio": "off", "multi_shot": false },
  "options": { "external_task_id": "<video_jobs.id>", "callback_url": "https://…/api/kling/callback",
               "watermark_info": { "enabled": false } }
}
```

* `settings.audio` (`native`/`off`) is sent only for models with an audio switch
  (2.6, 3.0). Kling 2.6 supports native audio only at 1080p (enforced in validation).
* `settings.multi_shot` is sent only to `kling-3.0` (documented default `true`;
  VideoForge sends `false` for predictable single-shot clips).
* `duration` is a JSON integer. Kling accepts 3–15 s on 3.0 models and 5/10 s on 2.x;
  VideoForge offers 5 and 10 s on all models.
* **Negative prompt:** the new-standard endpoints have no `negative_prompt` field. The
  3.0 Turbo page states that prompts can contain negative descriptions, so the negative
  prompt is appended as `\n\nAvoid: …` (`composePrompt` in `lib/validation.ts`). The
  combined text must fit the model's limit (2,500 characters used for all models).

### Request body — image to video

```json
{
  "contents": [
    { "type": "prompt", "text": "<motion prompt>" },
    { "type": "first_frame", "url": "<signed Supabase Storage URL, valid 1 h>" }
  ],
  "settings": { "resolution": "720p", "duration": 5 },
  "options": { "external_task_id": "…", "callback_url": "…", "watermark_info": { "enabled": false } }
}
```

* Image rules from the docs: JPG/JPEG/PNG, ≤ 50 MB, width and height ≥ 300 px, aspect
  ratio between 1:2.5 and 2.5:1. VideoForge accepts ≤ 4 MB after browser-side
  re-encoding (Vercel request body limit is 4.5 MB) and checks dimensions server-side
  (`lib/images.ts`).
* **Aspect ratio:** the image-to-video endpoints have no `aspect_ratio` setting; the
  output follows the first frame. The browser therefore centre-crops the image to the
  selected 16:9 / 9:16 / 1:1 before upload (`lib/client-image.ts`).
* The image is passed as a URL (documented example format). ⚠ Base64 is also documented
  as accepted, but the expected Base64 format (with or without `data:` prefix) is not
  stated, so it is not used.

### Responses

Create: `{ "code": 0, "message", "request_id", "data": { "id", "status", "create_time", "update_time", "external_id" } }`

Query: `{ "code": 0, …, "data": [ { "id", "status", "message", "create_time", "update_time", "external_id",
"outputs": [ { "type": "video", "id", "url", "watermark_url", "duration" } ],
"billing": [ { "charge_type": "unit"|"cash", "amount", "currency", "package_type" } ] } ] }`

* `status`: `submitted` → `processing` → `succeeded` | `failed`.
* A non-zero `code` is treated as an error even with HTTP 200.
* `billing` gives the real units (or cash) consumed; it is stored in
  `video_jobs.provider_units` / `provider_cost_usd`. When absent, the estimate from the
  rate table is stored and marked as estimated in the admin panel.
* Results are deleted by Kling after 30 days, so finished MP4s are downloaded into the
  private `videos` bucket (`downloadVideo()`).

## Status mapping

| Kling task | `video_jobs.status` | `videos.status` | Credits |
| --- | --- | --- | --- |
| (not yet sent) | `submitting` | `draft` | held, not deducted |
| create accepted (`submitted`) | `submitted` | `queued` | deducted |
| `processing` | `processing` | `processing` | — |
| `succeeded` | `succeeded` | `succeeded` | — |
| `failed` | `failed` | `failed` | refunded |
| running > `KLING_TASK_TIMEOUT_MINUTES` | `timed_out` | `failed` (`timeout`) | refunded |
| create rejected | `failed` | `failed` | never charged |

## Polling and callbacks

* Browser: `GET /api/videos/:id` every 5 s for the first minute, then every 10 s.
* Server throttle: `video_jobs.next_poll_at` (5 s for the first 12 polls, then 10 s);
  a 120 s lease (`claim_job`) prevents parallel processing of the same job.
* Callback: sent by Kling "when the task status changes" if `callback_url` was given.
  `APP_URL` must be public HTTPS for the callback URL to be included.
  * If `KLING_WEBHOOK_SECRET` is set, the Standard Webhooks headers are required:
    `webhook-id`, `webhook-timestamp` (±5 min), `webhook-signature` (`v1,<base64>`,
    HMAC-SHA256 over `{id}.{timestamp}.{rawBody}` with the base64-decoded secret
    after removing `whsec_`).
  * The callback body is used only to find the job; the state is always re-read from
    `GET /tasks`.
* Cron: `/api/cron/poll-jobs` every 5 minutes (`vercel.json`). ⚠ On the Vercel Hobby
  plan cron jobs run at most once per day; use Pro, or an external scheduler that calls
  the endpoint with `Authorization: Bearer $CRON_SECRET`.

## Error handling

| Kling HTTP / code | Category | Retried | User message key |
| --- | --- | --- | --- |
| 401 / 1000–1004 | `invalid_api_key` | no | `errors.invalid_api_key` |
| 429 / 1100 | `forbidden` (account status) | no | `errors.forbidden` |
| 429 / 1101, 1102 | `provider_insufficient_balance` | no | `errors.provider_insufficient_balance` |
| 403 / 1103 | `forbidden` | no | `errors.forbidden` |
| 400 / 1200, 1201 | `invalid_request` | no | `errors.invalid_request` |
| 404 / 1202, 1203 | `not_found` | no | `errors.not_found` |
| 400 / 1300, 1301 | `content_moderation` | no | `errors.content_moderation` |
| 429 / 1302 | `rate_limited` | yes | `errors.rate_limited` |
| 429 / 1303 | `concurrency_limited` | yes | `errors.concurrency_limited` |
| 429 / 1304 | `ip_blocked` | no | `errors.ip_blocked` |
| 500 / 5000, 503 / 5001 | `provider_unavailable` | yes | `errors.provider_unavailable` |
| 504 / 5002, request timeout | `timeout` | yes | `errors.timeout` |
| network error | `network` | yes | `errors.network` |

* Retry: up to 4 attempts, exponential backoff with full jitter, minimum delay 1 s
  (the concurrency guide recommends an initial delay of at least 1 second), cap 16 s.
* Creating a task is made idempotent with `external_task_id`: after an ambiguous failure
  (timeout, network, 5xx) the next attempt first looks the task up by
  `external_task_ids`; a duplicate-id rejection also triggers a lookup.
* Task-level failures (`status: failed`) are stored with Kling's `message`
  (sanitised, max 300 characters) and refunded. ⚠ The docs do not specify the message
  format for moderation failures after acceptance, so they are reported as
  `generation_failed` with the provider message.
* "Insufficient credits" has two meanings: the customer's VideoForge credits (checked in
  `begin_generation`, HTTP 402 to the browser) and the platform's Kling resource pack
  (1101/1102, nothing charged to the customer).

## Usage logging

Every Kling call writes one `api_usage_logs` row: operation, HTTP status, Kling code,
Kling `request_id`, success, error category, latency and attempt number, linked to
organization, user, video and job. Prompts, image URLs, result URLs and the API key are
never logged (covered by a unit test on the metrics hook).

## Concurrency

Kling counts concurrency per account, model version and package type; a video task
occupies a slot from `submitted` until it ends. VideoForge additionally limits each user
to `MAX_CONCURRENT_GENERATIONS` (default 2). When the Kling account limit is reached
(`1303`), the request is retried with backoff and, if still rejected, shown as
`concurrency_limited` without charging credits.
