# VideoForge AI

Slovenian B2B SaaS MVP for generating short AI videos (5 or 10 s) from text prompts or
images. Video generation is performed by the **Kling AI API**; VideoForge provides
accounts and organizations, credits and payments, the generation workflow, the video
library and an admin panel. UI languages: Slovenian (default) and English.

> This app lives in the `videoforge/` subdirectory of the repository and is independent
> of the GradimoCamper site in the repository root (own `package.json`, config and
> migrations). Run every command below from `videoforge/`.

## Contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Local setup](#local-setup)
- [Configuration reference](#configuration-reference)
- [Tests](#tests)
- [Deployment (Vercel)](#deployment-vercel)
- [Operations](#operations)
- [Known limitations](#known-limitations)
- [Testing and deployment checklist](#testing-and-deployment-checklist)

Further documentation: [architecture](docs/architecture.md) ·
[Kling integration](docs/kling-integration.md) · [pricing](docs/pricing.md)

## Features

| Area | Implemented |
| --- | --- |
| Auth | Email/password sign-up and sign-in, Google OAuth, password reset, protected dashboard |
| Organizations | Personal organization per user, additional organizations, roles `admin`/`member`, add/remove members, role changes, organization switcher |
| Create video | Text-to-video (prompt, negative prompt, model, 5/10 s, 16:9 / 9:16 / 1:1, resolution, native audio where supported) and image-to-video (upload, motion prompt, duration, aspect ratio via crop) |
| Templates | 12 prompt templates in 6 categories: product, e-commerce, real estate, restaurant, services, social media |
| Credits | 10 free credits on signup, live cost estimate, balance check, charge only after Kling accepts, automatic refund on failure, ledger with history |
| Kling | `lib/kling.ts`: `createTextToVideoTask()`, `createImageToVideoTask()`, `getTaskStatus()`, `downloadVideo()`; async polling + signed callbacks + cron; error mapping; retries with exponential backoff |
| Library | Thumbnails, status, model, duration, date; filters (status, model, format, date range); play, MP4 download, duplicate settings, delete |
| Payments | Stripe Checkout for packs of 50 / 200 / 500 credits, monthly subscription with included credits, Billing Portal, idempotent webhooks |
| Admin | Users, organizations, transactions, videos; manual credit adjustments; Kling cost per user, organization and video; suspend/block accounts |
| UX | Dark theme, mobile-first layout, statuses draft/queued/processing/succeeded/failed, skeleton loaders, progress indicator with elapsed time |
| Security | RLS on all tables, service-role-only business functions, Zod validation, private storage with signed URLs, CSP, per-user concurrency limit, sanitized API usage logs |

**Demo/staging mode:** without `KLING_API_KEY` the app runs normally but shows a banner
and refuses generation requests before anything is written or charged. No generation is
ever faked.

## Tech stack

Next.js 16 (App Router, Turbopack) · React 19 · TypeScript (strict, `noUncheckedIndexedAccess`) ·
Tailwind CSS 4 · shadcn/ui-style components on Radix UI (`components/ui`, `components.json`) ·
Supabase (Postgres, Auth, Storage, RLS) via `@supabase/ssr` and `@supabase/supabase-js` (no Prisma) ·
Stripe · Zod 4 · Vitest.

## Project structure

```
app/
  (auth)/            login, signup, forgot-password, reset-password
  (app)/             dashboard, create, library, library/[id], billing, settings (protected)
  admin/             platform admin panel
  api/               videos, uploads, kling/callback, stripe/webhook, cron/poll-jobs, health
  auth/              server actions + PKCE callback
  actions/           server actions (organizations, billing)
components/          ui/ (shadcn-style), create/, video/, shell/, settings/, admin/
lib/
  kling.ts           Kling API client
  generation/        generation lifecycle (submit, poll, refund, archive)
  billing/           plans + Stripe
  i18n/              sl / en dictionaries
  models.ts pricing.ts validation.ts auth.ts env.ts storage.ts …
supabase/migrations/ schema, RLS, functions, storage buckets
tests/               Vitest unit tests; tests/sql/ migration tests
docs/                architecture, Kling integration, pricing
proxy.ts             session refresh (Next.js 16 "proxy", formerly middleware)
vercel.json          cron schedule
```

## Local setup

### 1. Prerequisites

* Node.js ≥ 20.9 (developed with Node 22) and npm
* A Supabase project (free tier works for development)
* Optional: Stripe account (test mode) and the Stripe CLI
* Optional: Kling AI API key (without it the app runs in demo mode)

### 2. Install

```bash
cd videoforge
```

```bash
npm install
```

### 3. Supabase database

Apply the four migrations in `supabase/migrations/` **in filename order**.

Option A — Supabase SQL Editor: open each file, paste, run.

Option B — Supabase CLI:

```bash
npx supabase init
```

```bash
npx supabase link --project-ref YOUR-PROJECT-REF
```

```bash
npx supabase db push
```

(`supabase init` creates `supabase/config.toml`; keep the existing `migrations/` folder.)

The migrations create the tables, RLS policies, functions, the signup trigger on
`auth.users` and the private storage buckets `source-images` and `videos`.

### 4. Supabase Auth

In **Authentication → URL Configuration**:

* Site URL: `http://localhost:3000` (production: your domain)
* Redirect URLs: `http://localhost:3000/auth/callback` (and the production equivalent)

Email/password works out of the box. With "Confirm email" enabled, users must click the
confirmation link before signing in.

Google OAuth: create an OAuth client (type "Web application") in Google Cloud Console
with the authorized redirect URI `https://YOUR-PROJECT-REF.supabase.co/auth/v1/callback`,
then enable **Authentication → Providers → Google** in Supabase with its client ID and
secret.

### 5. Environment

```bash
cp .env.example .env.local
```

Fill in at least `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY` and
`APP_URL`. See [Configuration reference](#configuration-reference).

### 6. Run

```bash
npm run dev
```

Open http://localhost:3000, sign up, and you land on the dashboard with 10 credits.

### 7. Make yourself platform admin

In the Supabase SQL editor:

```sql
update public.users set is_platform_admin = true where email = 'you@example.com';
```

The **Admin** entry appears in the sidebar (`/admin`). Non-admins get a 404 there.

### 8. Stripe (optional)

1. Create a Product "VideoForge Business" with a **monthly recurring price**; put its id in
   `STRIPE_SUBSCRIPTION_PRICE_ID`. Credit packs need no Stripe products (inline prices).
2. Activate the Customer Portal in the Stripe Dashboard (needed for "Manage subscription").
3. Forward webhooks locally and copy the printed signing secret into `STRIPE_WEBHOOK_SECRET`:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Events used: `checkout.session.completed`, `checkout.session.async_payment_succeeded`,
`invoice.paid`, `customer.subscription.created`, `customer.subscription.updated`,
`customer.subscription.deleted`.

### 9. Kling (optional)

Set `KLING_API_KEY`. Locally there is no public callback URL, so status updates come from
browser polling (every 5–10 s while a video page or library card is open). To exercise the
cron sweep locally:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/poll-jobs
```

## Configuration reference

| Variable | Required | Purpose |
| --- | --- | --- |
| `APP_URL` | yes (prod) | Public base URL for OAuth, e-mail, Stripe and Kling callback URLs |
| `SUPABASE_URL` | yes | Project URL; also used at build time for the CSP |
| `SUPABASE_PUBLISHABLE_KEY` | yes | Publishable/anon key (auth sessions) |
| `SUPABASE_SECRET_KEY` | yes | Secret/service-role key (server only) |
| `KLING_API_KEY` | for generation | Kling API key; empty = demo mode |
| `KLING_API_BASE_URL` | no | Default `https://api-singapore.klingai.com` |
| `KLING_WEBHOOK_SECRET` | recommended | Verifies Kling callback signatures |
| `KLING_USD_PER_UNIT` | no | Cost reporting fallback (default 0.14) |
| `KLING_REQUEST_TIMEOUT_MS` | no | Default 30000 |
| `KLING_TASK_TIMEOUT_MINUTES` | no | Fail + refund after this long (default 30) |
| `MAX_CONCURRENT_GENERATIONS` | no | Per user, default 2 |
| `STRIPE_SECRET_KEY` | for payments | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | for payments | Webhook signing secret |
| `STRIPE_SUBSCRIPTION_PRICE_ID` | for subscription | Recurring monthly price id |
| `CRON_SECRET` | yes (prod) | Protects `/api/cron/poll-jobs` |

`GET /api/health` reports which integrations are configured (booleans only).

## Tests

```bash
npm run lint
```

```bash
npm run typecheck
```

```bash
npm test
```

Unit tests cover pricing, validation, the Kling client (request shapes, error mapping,
retries, idempotent recovery, billing parsing, webhook signatures, download URL guard),
image header parsing, i18n parity and plural forms, and helpers.

```bash
npm run test:sql
```

Runs all migrations against a throwaway local PostgreSQL 16 cluster with minimal stubs
for Supabase's `auth`/`storage` schemas, then checks the signup bonus, credit holds,
charge-after-acceptance, single refunds, the concurrency limit, ledger immutability,
admin authorization, last-admin protection, RLS isolation and column privileges.
Requires the PostgreSQL server binaries (`initdb`, `pg_ctl`).

## Deployment (Vercel)

1. Import the repository in Vercel and set **Root Directory** to `videoforge`.
2. Add all environment variables from the table above for Production (and Preview).
   `APP_URL` must be the production URL, e.g. `https://app.videoforge.si`.
3. In Supabase Auth, add `https://YOUR-DOMAIN/auth/callback` to the redirect URLs and set
   the Site URL.
4. In Stripe (live mode), add the webhook endpoint `https://YOUR-DOMAIN/api/stripe/webhook`
   with the events listed above and use its signing secret.
5. In the Kling console, create a webhook secret and set `KLING_WEBHOOK_SECRET`.
6. Cron: `vercel.json` schedules `/api/cron/poll-jobs` every 5 minutes, and Vercel sends
   `CRON_SECRET` as a bearer token. On the Hobby plan, Vercel cron jobs run at most once
   per day; use Pro or an external scheduler calling the endpoint with the same header.
7. Route handlers set `maxDuration` 60 s (300 s for the cron). Check that your Vercel plan
   allows these limits.

## Operations

* **Adjust credits:** Admin → Organizations (or Users → personal organization). Negative
  amounts deduct; a reason is stored in the ledger.
* **Suspend:** user can sign in and view, cannot generate or buy. **Block:** no access,
  and the Supabase Auth user is banned so sessions cannot be refreshed.
* **Kling cost:** Admin → Videos shows units and USD per video (real values from Kling's
  `billing` when returned, otherwise marked "estimated"); Users and Organizations show
  totals.
* **Failed Kling calls:** Admin → Overview lists failed calls of the last 24 hours.

## Known limitations

* The Kling contract was taken from a vendor documentation snapshot (2026-09-20) because
  the official docs were not reachable during development; see the ⚠ items in
  [docs/kling-integration.md](docs/kling-integration.md).
* Members can be added only if they already have an account (no e-mail invitations).
* Credits do not expire; subscription credits accumulate.
* Source images of failed or abandoned image-to-video attempts are deleted only when the
  video is deleted.
* Date filters use UTC day boundaries.
* No automated end-to-end test against live Supabase/Stripe/Kling services was run;
  use the checklist below.

## Testing and deployment checklist

**Local / staging**

- [ ] `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` pass
- [ ] `npm run test:sql` passes (or migrations applied cleanly in a fresh Supabase project)
- [ ] Sign up with email/password → personal organization with 10 credits, ledger entry "Welcome bonus"
- [ ] E-mail confirmation and password reset links return to `/auth/callback` and sign in
- [ ] Google sign-in works and creates the same profile/organization
- [ ] Without `KLING_API_KEY`: demo banner, submit disabled, `POST /api/videos` → 503, balance unchanged
- [ ] With `KLING_API_KEY`: text-to-video 5 s 720p → draft → queued (credits deducted) → processing → succeeded; MP4 in `videos` bucket; play + download work
- [ ] Image-to-video with each aspect ratio; image < 300 px is rejected
- [ ] A prompt rejected by moderation shows the moderation message and no credits are charged
- [ ] A failed or timed-out task is refunded exactly once (ledger: Generation −N, Refund +N)
- [ ] Third simultaneous generation is rejected with the concurrency message (default limit 2)
- [ ] Insufficient balance: estimate shows the warning, API returns 402
- [ ] Library filters (status, model, format, dates), duplicate settings, delete
- [ ] User B cannot open `/library/<A's video id>` or `/api/videos/<id>/download` (404)
- [ ] Organization: create, add member by e-mail, change role, cannot remove last admin; member sees org videos and cannot buy credits
- [ ] Stripe test: buy 50 credits → balance +50 once even when the webhook is resent (`stripe events resend <id>`)
- [ ] Stripe test: subscribe → +150 credits on `invoice.paid`; renewal (test clock) grants again; cancel via portal updates status
- [ ] Admin: adjust credits (+/−), suspend (generation blocked), block (redirect to `/blocked`, Auth ban), costs visible
- [ ] Language switch SL/EN on public and dashboard pages; layout at 375 px width

**Production**

- [ ] Vercel root directory `videoforge`, all env vars set, `APP_URL` = production URL
- [ ] Supabase redirect URLs and Site URL updated; Google OAuth client has production origin
- [ ] Supabase Storage upload limit ≥ size of 10 s 1080p clips (bucket limit 100 MB)
- [ ] Stripe live webhook endpoint + secret; Customer Portal activated; live subscription price id
- [ ] Kling webhook secret configured; a test callback returns 200 from `/api/kling/callback`
- [ ] `CRON_SECRET` set; cron schedule allowed by the plan (or external scheduler configured)
- [ ] At least one platform admin set via SQL
- [ ] Kling rates in `lib/models.ts` and `KLING_USD_PER_UNIT` match the Kling contract; pack prices confirmed
- [ ] Privacy policy and terms (GDPR: prompts and images are sent to Kling) published before launch
