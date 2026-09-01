# Go Hargeisa — Digital Loyalty / Rewards Engine

Status: **migrations written, NOT applied**. Customer (Phase 6), staff
(Phase 8) and minimal admin UI are code-complete and pass typecheck / lint /
build; end-to-end runtime is unverified until the migrations are applied.

Migrations (apply in order):
- `20260908000001_loyalty_core.sql` — tables, RLS, grants, RPC engine
- `20260908000002_loyalty_flormar_activation.sql` — Flormar program + tiers + starter rewards/offers
- `20260908000003_loyalty_staff_operations.sql` — staff lookup-by-number, staff-initiated redemption, console-doc helper
- `20260908000004_loyalty_admin_metrics.sql` — `loyalty_program_metrics()`

## Concept

A reusable, **partner-scoped** loyalty platform. One engine, many partners,
each independently switched on/off.

```
Go Hargeisa Loyalty Engine
  ├── Flormar Hargeisa   → enabled = true   (the only one right now)
  ├── Partner B          → no program row / enabled = false
  └── Partner C          → no program row / enabled = false
```

## Partner identity

There is **no `partners` table** on this platform. A partner is a listing
row in `hotels | restaurants | cafes | services | city_services`, addressed
polymorphically as `(listing_type, listing_id)` — the same pattern as
`product_orders`, `reviews`, `business_offers`, `business_access_grants`.

`loyalty_programs` carries `(listing_type, listing_id)` with a UNIQUE
constraint. Every other loyalty table hangs off `program_id`.

**Flormar** = the `city_services` row with `slug = 'flormar-hargeisa'`
(already published, `is_partner = true`, ~225 products).

## Tables (all `program_id`-scoped unless noted)

| table | purpose |
|---|---|
| `loyalty_programs` | one per partner listing. `enabled` is the master switch. Holds the earning rule (`points_per_currency`, `currency`), expiration config, welcome bonus, redemption TTL. |
| `loyalty_tiers` | configurable membership tiers. Threshold = **lifetime** points. `multiplier` boosts earning. |
| `loyalty_members` | one row per `(program, user)`. Reuses `profiles` — no parallel customer table. `member_uid` (opaque random uuid) is the **only** value in the QR code. |
| `loyalty_transactions` | append-only ledger. One row per points movement, signed `points`, `balance_after` snapshot. |
| `loyalty_rewards` | reward catalog. `reward_type ∈ {discount_amount, discount_percent, free_product, gift, other}`, `points_required`, limits, optional `min_tier_id`. |
| `loyalty_redemptions` | one row per redemption. `redemption_code` globally unique. `status: issued → redeemed` exactly once. `reward_snapshot` freezes terms. |
| `loyalty_offers` | display-only promos (no points logic). |
| `loyalty_staff` | who may operate a program's counter. `role ∈ {staff, manager}`. |
| `loyalty_events` | append-only impression analytics (QR view, reward view, offer view) — same shape/posture as the platform's `business_metric_events`. Points earn/redeem/join are analysed off `loyalty_transactions`. |

## Authorization model

- **Customer** (`profiles.role = 'user'`): SELECT own membership / own
  transactions / own redemptions; SELECT active rewards/offers/tiers of a
  program. **No write access to any balance table.** Joins via
  `loyalty_join()`; redeems via `loyalty_redeem_reward()`.
- **Flormar staff**: a `loyalty_staff` row (or the listing's `owner_id`, or
  platform owner). Gated by `loyalty_is_staff(program_id)` /
  `loyalty_is_manager(program_id)` SECURITY DEFINER helpers.
- **Platform owner** (`profiles.role = 'owner'`): full management of every
  program via RLS `loyalty_is_platform_owner()`.

## Transaction integrity

Every points change goes through a **SECURITY DEFINER** RPC that:
1. `SELECT … FOR UPDATE` locks the member row,
2. re-derives all money/points math server-side (client never sends a
   points value or price),
3. writes exactly one `loyalty_transactions` row for the delta,
4. refuses to drop `current_points` below zero,
5. is idempotent where a double-submit is possible (`client_ref` /
   `p_client_ref`).

| RPC | caller | effect |
|---|---|---|
| `loyalty_join(listing_type, listing_id)` | customer | create member + membership number + welcome bonus. Idempotent (advisory-locked per program so concurrent first-joins can't collide on the number). |
| `loyalty_record_purchase(member_uid, amount, currency, reference, note, client_ref)` | **staff** | award `floor(amount × points_per_currency × tier.multiplier)`. Idempotent per `client_ref`. |
| `loyalty_adjust_points(member_uid, points, type, description, client_ref)` | **manager** | signed manual adjustment / bonus / refund. |
| `loyalty_redeem_reward(reward_id, client_ref?)` | customer | check points + limits + tier, deduct, issue redemption + code. Never past `per_member_limit`. Idempotent per `client_ref`. |
| `loyalty_staff_redeem(redemption_code)` | **staff** | `issued → redeemed`, guarded so it can only happen once. Program derived from the (globally unique) code. |
| `loyalty_cancel_redemption(redemption_code, reason?)` | **manager** | reverse a still-`issued` redemption and refund the points via a `REFUND` transaction. A `redeemed` code can't be cancelled here. |
| `loyalty_staff_lookup(member_uid)` | **staff** | one-shot JSON: member basics, tier, recent txns, open redemptions, redeemable rewards (mirrors every gate `loyalty_redeem_reward` enforces). |
| `loyalty_staff_lookup_by_number(program_id, number)` | **staff** | same JSON, resolved by the printed membership number — the manual-entry fallback when the camera path isn't available. |
| `loyalty_staff_redeem_reward(member_uid, reward_id, client_ref?)` | **staff** | redeem a reward for a member at the counter, fulfilled on the spot (`status` straight to `redeemed`). Same deduction + every eligibility gate as `loyalty_redeem_reward`. |
| `loyalty_program_metrics(program_id)` | **owner** / listing owner | read-only overview: member counts, points issued/redeemed, rewards redeemed, purchases, top members/rewards. |

`loyalty_member_console_doc(member_id)` is an internal helper (no auth check, not granted) that both `loyalty_staff_lookup*` wrappers call after their own `loyalty_is_staff()` gate.

`current_points` = spendable balance. `lifetime_points` = ever-earned,
drives tier, only ever decreased by an `EXPIRATION` transaction (the columns
+ transaction type exist; the scheduled expiry job is not built yet and
needs no schema change to add).

## QR

- **Payload** = `member_uid` only (opaque uuid). Reveals nothing on its own;
  a scanner must still be authorized staff for `loyalty_staff_lookup` to
  return anything.
- **Generation**: pure-JS (`qrcode` dependency — to be added in Phase 6).
- **Scanning** (staff): web `getUserMedia` + `BarcodeDetector`, `jsqr`
  fallback. **No native/Capacitor change** — the Android app is a remote-URL
  WebView.

## Customer UI (Phase 6 — shipped)

- **Route** `app/[locale]/rewards/[slug]/` — `page.tsx` (Rewards home) +
  `card/page.tsx` (full-screen membership card). `layout.tsx` sets noindex.
  `notFound()` unless an **enabled** program resolves for the slug. Slug
  resolves against `city_services` today (`lib/data/loyalty.ts` →
  `resolveListingBySlug`); other listing types are a one-function change.
- **Data** `lib/data/loyalty.ts` (public + cookie-aware reads, RLS-gated),
  **actions** `lib/actions/loyalty.ts` (`joinLoyaltyProgramAction`,
  `redeemLoyaltyRewardAction`, `loadLoyaltyActivityAction`,
  `recordLoyaltyEventAction` — all thin wrappers over the RPCs).
- **Module** `lib/loyalty/` — types, mappers, helpers, `qr.ts` (server-only
  `qrcode` SVG generation), `constants.ts` (`GHLY1:` QR payload format).
- **Components** `components/loyalty/` — `LoyaltyExperience` (member home),
  `LoyaltyCard`, `LoyaltyQr` (tap-to-enlarge), `LoyaltyCardStage`,
  `TierProgress`, `RewardsGrid` (+ redeem dialog), `OffersRow`,
  `ActivityFeed`, `ActiveRedemptions`, `LoyaltyJoinGate` (empty state),
  `LoyaltyEntryCard` (reusable entry point).
- **Entry points** — Flormar storefront (`FlormarStorefront` gained an
  optional `loyaltySlot` prop; the city-services page passes it only when
  the program is enabled) and the customer dashboard (`getMyLoyaltyMemberships`).
- **Branding** — `<PartnerThemeScope>` + `getPartnerTheme(...)`, keyed on the
  listing the program points at. No branding columns on `loyalty_programs`.
- **i18n** — `loyalty` namespace added to `messages/{en,ar,so}.json` (79 keys
  each). RTL via the app's existing logical-property + `dir` setup.
- New dependency: **`qrcode`** (+ `@types/qrcode`) — pure-JS, server-only.

## Staff console (Phase 8 — shipped)

- **Route** `app/[locale]/rewards/staff/[slug]/` — `force-dynamic`, noindex
  (inherits `rewards/layout.tsx`). `getStaffProgramContext()`
  (`lib/data/loyalty-staff.ts`) resolves the program and calls
  `loyalty_is_staff` / `loyalty_is_manager` — `not_found` (404), redirect to
  login when signed-out, a "staff access only" screen when signed-in but not
  staff, otherwise the console.
- **Actions** `lib/actions/loyalty-staff.ts` — `staffLookupByQr`,
  `staffLookupByNumber`, `staffRecordPurchase`, `staffAdjustPoints`
  (manager), `staffValidateCode`, `staffRedeemReward`, `staffCancelRedemption`
  (manager). Every one is a thin wrapper; the RPC does the auth.
- **Components** `components/loyalty/staff/` — `StaffConsole` (scan /
  validate-code tabs), `QrScanner`, `MemberPanel` (add purchase, redeem
  reward, mark/cancel codes, adjust points, recent activity).
- **QR scanner** (`qr-scanner.tsx`) — pure web: `getUserMedia({ video:
  { facingMode: "environment" } })` → `BarcodeDetector` when the engine
  exposes it, `jsQR` on sampled `<canvas>` frames otherwise, manual
  membership-number entry as the always-available fallback (denied camera,
  desktop, damaged QR). **No native / Capacitor plugin** — runs unchanged in
  the Android remote-URL WebView. New dependency: **`jsqr`** (pure-JS).
- **`Permissions-Policy`** in `next.config.mjs` changed `camera=()` →
  `camera=(self)` — same-origin only, for this one route. `media-src` needs
  no change (the stream is attached via `video.srcObject`, not a URL).

## Admin (Phase 8 — minimal; full dashboard is Phase 9)

- **Route** `app/[locale]/admin/loyalty/` — `requireOwner`, added to
  `useAdminNavItems`. `getLoyaltyAdminOverview()` +
  `loyalty_program_metrics()`.
- **Component** `components/admin/loyalty-admin-manager.tsx` — per-program
  card: enable/disable toggle, metrics grid, top members / top rewards,
  **loyalty-staff management** (add by person + role, activate/deactivate,
  remove). Actions in `lib/actions/loyalty-admin.ts` (owner-gated + RLS).
- Rewards / tiers / offers editing, analytics charts, per-partner activation
  wizard → **Phase 9**.

## Not yet built

- Full Loyalty admin dashboard (Phase 9): rewards/tiers/offers CRUD, richer
  analytics, the "enable loyalty for partner X" flow.
- Point-expiration cron job (schema-ready).
- `types/database.ts` regeneration after the migrations are applied.

## Tier calculation

`loyalty_recalc_tier(member_id)` = the highest `active` tier whose
`min_points ≤ lifetime_points`. It deliberately does **not** consult
`max_points` — that column is display-only ("progress to next tier"), so a
misconfigured gap between one tier's `max_points` and the next tier's
`min_points` can never leave a member with no tier.

## Known follow-ups / notes for review

- Point expiration is schema-ready (`expiration_enabled`, `expiration_months`,
  `EXPIRATION` transaction type) but the scheduled job is not built — adding
  it later needs no schema change.
- Rewards/tiers/offers seeded for Flormar are **starter config**, fully
  editable in the admin dashboard once Phase 9 lands.
- `current_points` / `lifetime_points` are `integer` (max ~2.1B) — ample for
  this business; revisit only if a single member could ever exceed that.
- Branding for the customer experience comes from the existing
  `partner-themes.ts` (`getPartnerTheme('city_service','flormar-hargeisa')`),
  keyed on the same listing the program points at — no branding columns on
  `loyalty_programs`.
