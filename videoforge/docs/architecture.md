# VideoForge AI — Architecture

## Overview

```
Browser ──HTTPS──▶ Next.js (Vercel)                ──▶ Kling AI API (api-singapore.klingai.com)
  │                 ├─ proxy.ts (session refresh)       ▲            │ callback (optional)
  │                 ├─ Server Components (RLS reads)    │            ▼
  │                 ├─ Route handlers / Server Actions ─┘     /api/kling/callback
  │                 └─ lib/* (services)
  │                          │
  │                          ├──▶ Supabase Postgres (RLS + SECURITY DEFINER functions)
  │                          ├──▶ Supabase Auth (email/password, Google OAuth)
  │                          ├──▶ Supabase Storage (private buckets: source-images, videos)
  │                          └──▶ Stripe (Checkout, Billing Portal) ◀── /api/stripe/webhook
  │
  └── signed Storage URLs (1 h) for playback / 5 min for MP4 download
Vercel Cron ──▶ /api/cron/poll-jobs (sweep pending jobs, reconcile, archive)
```

The browser never receives a Supabase, Kling or Stripe secret. It does not use a
Supabase client at all: every database, storage and provider call is made by
server code. Session cookies are `httpOnly`.

## Directory layout

| Path | Purpose |
| --- | --- |
| `app/(auth)/*` | Sign in, sign up, password reset pages |
| `app/auth/actions.ts`, `app/auth/callback/route.ts` | Auth server actions, PKCE callback (OAuth, e-mail confirmation, recovery) |
| `app/(app)/*` | Protected dashboard: dashboard, create, library, library/[id], billing, settings |
| `app/admin/*` | Platform admin panel (404 for non-admins) |
| `app/api/videos/*` | Create generation, status/poll, delete, MP4 download |
| `app/api/uploads/source-image` | First-frame upload for image-to-video |
| `app/api/kling/callback` | Kling task callback |
| `app/api/stripe/webhook` | Stripe events |
| `app/api/cron/poll-jobs` | Background sweep |
| `lib/kling.ts` | Kling API client: create tasks, query status, download, error mapping, retry, webhook verification |
| `lib/generation/service.ts` | Generation lifecycle orchestration |
| `lib/billing/*` | Plans and Stripe integration |
| `lib/pricing.ts`, `lib/models.ts` | Model capabilities and credit pricing (shared by client and server) |
| `lib/validation.ts` | Zod schemas for every input |
| `lib/auth.ts` | Session, profile, active organization, role guards |
| `lib/i18n/*` | Slovenian (default) and English dictionaries |
| `supabase/migrations/*` | Schema, RLS, functions, storage buckets |
| `tests/*.test.ts` | Unit tests (Vitest) |
| `tests/sql/*` | Migration tests against a local PostgreSQL with Supabase stubs |

## Data model

| Table | Purpose |
| --- | --- |
| `users` | Profile 1:1 with `auth.users`: locale, status (`active`/`suspended`/`blocked`), `is_platform_admin`, active organization |
| `organizations` | Credit wallet (`credit_balance >= 0`) and Stripe customer. Every user gets a personal organization |
| `organization_members` | Membership with role `admin` or `member` |
| `videos` | User-facing generation: settings, status, result, credits cost/charged/refunded. Soft-deleted |
| `video_jobs` | Provider task: Kling task id, `external_task_id`, poll schedule, lease lock, units and USD cost. Internal |
| `credit_transactions` | Append-only ledger with `balance_after` and unique `idempotency_key` |
| `subscriptions` | Mirror of Stripe subscriptions |
| `api_usage_logs` | Kling call metrics: operation, HTTP status, Kling code, request id, latency, attempt. No prompts, images, URLs or keys |

Credits belong to organizations. A user's videos belong to the organization that was
active when they were created; all members of that organization can see them.
Only the creator or an organization admin can delete a video.

`updated_at` triggers exist on every mutable table. The ledger has no `updated_at`:
a trigger rejects changes to amounts, and rows change only when a referenced user or
video is deleted (`ON DELETE SET NULL`).

## Security model

1. **Authentication** — Supabase Auth (email/password, Google OAuth via PKCE).
   `proxy.ts` refreshes session cookies and redirects anonymous users away from
   protected paths. This is only an optimisation: each protected layout, route handler
   and server action calls `supabase.auth.getUser()` again (`lib/auth.ts`).
2. **Row-level security** — all page reads use the user's JWT (role `authenticated`).
   Policies limit `organizations`, `organization_members`, `videos`,
   `credit_transactions` and `subscriptions` to organization members; `users` to self
   and teammates. `video_jobs` and `api_usage_logs` have no customer policies.
   Blocked users fail every membership check.
3. **Privileged writes** — anything that moves credits or changes memberships is a
   `SECURITY DEFINER` function executable only by `service_role`. The server passes
   the verified user id; functions re-check membership, role, account status and
   platform-admin status themselves.
4. **Column privileges** — `authenticated` may update only `users.full_name`,
   `users.locale`, `users.active_organization_id` (to an organization it belongs to)
   and `organizations.name` (admins only). Balances and admin flags are not writable.
5. **Storage** — both buckets are private with no policies for client roles. The server
   uploads with the service role and hands out short-lived signed URLs after checking
   access through RLS. Upload paths are chosen by the server
   (`{org}/{user}/{uuid}.jpg`), and image-to-video only accepts paths inside the
   caller's own `{org}/{user}/` prefix.
6. **Input validation** — Zod for every request body, form, query string and provider
   response. Uploaded images are checked by magic bytes and pixel dimensions.
7. **CSRF** — server actions are protected by Next.js origin checks; JSON routes that
   mutate state reject cross-origin `Origin` headers (`lib/http.ts`).
8. **Webhooks** — Stripe events are verified with `STRIPE_WEBHOOK_SECRET`. Kling
   callbacks are verified with the Standard Webhooks signature when
   `KLING_WEBHOOK_SECRET` is set. In both cases the handlers are idempotent, and a
   Kling callback only triggers a re-read of the task from the Kling API.
9. **Headers** — CSP (no third-party scripts), `X-Frame-Options: DENY`,
   `nosniff`, strict referrer policy, `no-store` and `noindex` on private paths.
10. **Concurrency limit** — `begin_generation` takes a per-user advisory lock and
    rejects a new generation when the user already has `MAX_CONCURRENT_GENERATIONS`
    in `draft`/`queued`/`processing`.

## Generation lifecycle

```
            begin_generation()                 Kling accepts            Kling: processing
 [form] ───────────────────────▶ draft ──────────────────────▶ queued ───────────────────▶ processing
   │      checks: active user,      │  accept_generation():                                  │
   │      member, balance − holds   │  deduct credits (ledger)                               │
   │      ≥ cost, concurrency       │                                                        ▼
   │      (nothing deducted)        │ Kling rejects                         succeeded ◀── Kling: succeeded
   │                                └──────────────▶ failed (no charge)       │  download MP4 → Storage
   │                                                                          │  complete_generation()
   │                                                     failed ◀── Kling: failed / timeout
   │                                                     fail_generation(): refund exactly once
```

* **Draft hold** — between `begin_generation` and Kling's answer the cost of the draft
  is *held* (counted against the available balance) but not deducted, so two parallel
  submissions cannot overspend. Holds expire after 10 minutes.
* **Charge after acceptance** — `accept_generation` deducts credits only once Kling
  has returned a task id. Idempotency key `charge:{video_id}`.
* **Refund on failure** — `fail_generation` refunds charged credits once
  (`refund:{video_id}`), for Kling-reported failures, timeouts and lost tasks.
* **Ambiguous submissions** — if the create request times out or the connection drops,
  the draft is kept. The job is looked up by `external_task_id` (= `video_jobs.id`)
  and then either billed (task exists) or closed without charge
  (`submission_interrupted`).
* **Polling** — the browser polls `GET /api/videos/:id` every 5 s for the first
  minute, then every 10 s. The server calls Kling only when `next_poll_at` is due
  (5 s, then 10 s) and holds a 120 s lease (`claim_job`) so browser polls, callbacks
  and the cron never process the same job concurrently.
* **Callback** — when `APP_URL` is public HTTPS, each create request includes
  `options.callback_url`; the callback forces an immediate sync.
* **Cron** — `/api/cron/poll-jobs` sweeps due jobs, reconciles stale drafts and
  retries archiving of finished videos whose download failed.
* **Archiving** — finished MP4s are copied into the private `videos` bucket because
  Kling deletes results after 30 days. Until archived, downloads redirect to Kling's URL.

## Internationalisation

Locale comes from the `vf_locale` cookie, then `Accept-Language`, else Slovenian.
Dictionaries live in `lib/i18n/sl.ts` and `lib/i18n/en.ts`; the type of `sl` is
derived from `en`, so a missing key fails `tsc`. Slovenian plural forms (one/two/few/other)
use `Intl.PluralRules`. Prompt templates have localised titles and English prompts.

## Demo / staging mode

When `KLING_API_KEY` is empty, a banner is shown, the submit button is disabled and
`POST /api/videos` returns `503 not_configured` before anything is written. No video is
ever marked as succeeded without a real Kling result.
