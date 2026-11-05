# Pricing proposal — credit cost calculation

All amounts here are **proposals** for the business to confirm. Provider rates come from
Kling's "Resource package deduction rules" table in the vendor documentation snapshot
dated 2026-09-20 (see `docs/kling-integration.md`). Verify them against your Kling
contract before launch; the app reads the rate table from `lib/models.ts`.

## 1. Kling provider cost

Kling bills video generation per second of output, in resource-pack *units*. The table
lists 1 unit at **USD 0.14** (list price). Configure your actual price with
`KLING_USD_PER_UNIT`; when Kling returns the real deduction in `billing[]`, the admin
panel shows that value instead of the estimate.

| Model | 720p units/s | 1080p units/s | 4K units/s |
| --- | --- | --- | --- |
| Kling 2.5 Turbo | 0.3 | 0.5 | — |
| Kling 2.6 (no audio) | 0.3 | 0.5 | — |
| Kling 2.6 (native audio, no voice control) | — | 1.0 | — |
| Kling 3.0 (no audio) | 0.6 | 0.8 | 3.0 |
| Kling 3.0 (native audio, no voice control) | 0.9 | 1.2 | 3.0 |
| Kling 3.0 Turbo (with native audio) | 0.8 | 1.0 | — |

## 2. Credit formula

```
provider_units = units_per_second(model, resolution, audio) × duration_seconds
credits        = max(1, ceil(provider_units × CREDITS_PER_PROVIDER_UNIT))
CREDITS_PER_PROVIDER_UNIT = 1
```

One VideoForge credit is pegged to one Kling unit and the result is rounded **up**, so a
credit is never worth less than the provider cost it covers. The same function
(`estimateCost` in `lib/pricing.ts`) produces the estimate in the browser and the
authoritative charge on the server.

### Resulting credit cost per video

| Model | Resolution | Audio | 5 s units | 5 s cost (USD @0.14) | **5 s credits** | 10 s units | 10 s cost (USD) | **10 s credits** |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Kling 2.5 Turbo | 720p | no | 1.5 | 0.21 | **2** | 3 | 0.42 | **3** |
| Kling 2.5 Turbo | 1080p | no | 2.5 | 0.35 | **3** | 5 | 0.70 | **5** |
| Kling 2.6 | 720p | no | 1.5 | 0.21 | **2** | 3 | 0.42 | **3** |
| Kling 2.6 | 1080p | no | 2.5 | 0.35 | **3** | 5 | 0.70 | **5** |
| Kling 2.6 | 1080p | yes | 5 | 0.70 | **5** | 10 | 1.40 | **10** |
| Kling 3.0 | 720p | no | 3 | 0.42 | **3** | 6 | 0.84 | **6** |
| Kling 3.0 | 720p | yes | 4.5 | 0.63 | **5** | 9 | 1.26 | **9** |
| Kling 3.0 | 1080p | no | 4 | 0.56 | **4** | 8 | 1.12 | **8** |
| Kling 3.0 | 1080p | yes | 6 | 0.84 | **6** | 12 | 1.68 | **12** |
| Kling 3.0 | 4K | either | 15 | 2.10 | **15** | 30 | 4.20 | **30** |
| Kling 3.0 Turbo | 720p | always | 4 | 0.56 | **4** | 8 | 1.12 | **8** |
| Kling 3.0 Turbo | 1080p | always | 5 | 0.70 | **5** | 10 | 1.40 | **10** |

(Generated from `lib/pricing.ts`; `tests/pricing.test.ts` covers the formula.)

## 3. Packs and subscription (proposal)

| Offer | Credits | Price (EUR) | EUR per credit |
| --- | --- | --- | --- |
| Free signup bonus | 10 | 0 | — |
| Pack 50 | 50 | 19.00 | 0.380 |
| Pack 200 | 200 | 65.00 | 0.325 |
| Pack 500 | 500 | 145.00 | 0.290 |
| Business subscription (monthly) | 150 / month | 49.00 / month | 0.327 |

* Pack prices are defined in `lib/billing/plans.ts` and charged with inline Stripe prices,
  so the displayed and charged amounts always match.
* The subscription price is the Stripe recurring price `STRIPE_SUBSCRIPTION_PRICE_ID`;
  its amount is read from Stripe for display. Subscribers can buy packs at any time.
* Credits do not expire in this MVP (subscription credits accumulate). Decide whether
  monthly credits should roll over before launch.

## 4. Margin check

Per credit, the provider cost is at most `KLING_USD_PER_UNIT` (rounding up only lowers
the provider cost per credit). The gross margin per credit is therefore at least:

```
margin_per_credit_EUR = price_per_credit_EUR
                      − KLING_USD_PER_UNIT × FX(EUR per USD)
                      − payment fees per credit
```

With the list price of USD 0.14 per unit, the cheapest proposed credit (EUR 0.290 in the
500 pack) stays above the provider cost as long as 0.14 USD converts to less than
EUR 0.29 minus fees. Insert the current exchange rate and your Stripe fee schedule to get
exact figures; they are not fixed here because both change over time.

Other cost drivers to include in the business case:

* the 10 free signup credits (at most 10 units ≈ USD 1.40 at list price per new account);
* refunds: failed generations are refunded to the customer, but Kling may still bill
  failed or timed-out tasks — monitor `video_jobs` with `status = failed` and their
  `provider_units` in the admin panel;
* VAT: decide whether displayed prices include VAT (Slovenian standard rate 22%) and how
  EU B2B reverse charge is handled, e.g. with Stripe Tax.

## 5. Changing prices

* Provider rates or new models: `lib/models.ts` (`unitsPerSecond`).
* Credit peg / minimum: `CREDITS_PER_PROVIDER_UNIT`, `MINIMUM_CREDITS_PER_VIDEO` in `lib/pricing.ts`.
* Packs and subscription credits: `lib/billing/plans.ts`.
* Signup bonus: SQL function `public.signup_bonus_credits()` (new migration).
