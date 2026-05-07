# Phase 1: Stabilize Payment Flow - Context

**Gathered:** 2026-05-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Ensure MercadoPago payment integration works reliably end-to-end — from preference creation, through webhook processing and fallback verification, to database state consistency and accounting record creation.

**In scope:** Webhook signature validation, verify-payment endpoint, PaymentMethod enum, Ingreso record creation, membership activation deduplication, stuck reservation cleanup, webhook idempotency, local testing tooling.

**Out of scope:** New payment methods, UI redesign of checkout flow, email notifications for payments, refund handling (belongs in separate phase).

</domain>

<decisions>
## Implementation Decisions

### Webhook Signature Validation
- **D-01:** Never bypass webhook validation — enforce HMAC signature check in both dev and production
- **D-02:** If `MP_WEBHOOK_SECRET` is not set in `.env`, use a hardcoded default secret (`dev-webhook-secret-2026`) instead of skipping validation
- **D-03:** Validate only the `x-signature` header (not query parameters or full body)
- **D-04:** Return `401` with `{ success: false, error: { code: 'INVALID_SIGNATURE' } }` when signature validation fails
- **D-05:** If MP sends a webhook for a paymentId that doesn't exist in our DB, return `404` and log to MongoDB audit_logs

### Webhook Idempotency & Retries
- **D-06:** Use MercadoPago `paymentId` as the idempotency key — if a Payment row already exists with that ID, return `200` without re-processing
- **D-07:** Webhook handler only validates signature and dispatches to the payment-processor service — no business logic inline

### Fallback Verify-Payment Endpoint
- **D-08:** Replace hardcoded `CONFIRMED` status — endpoint must poll MercadoPago API directly via `mercadopago.service.getPayment()`
- **D-09:** Unify `/verificar-pago` and `/verificar-pago-paquete` into a single endpoint that detects reservation vs package by the payment reference
- **D-10:** Fallback endpoint is read-only — it returns the real payment status but does NOT process confirmation (only the webhook does that)

### PaymentMethod Enum
- **D-11:** Add `MERCADO_PAGO` to the Prisma `PaymentMethod` enum and run `prisma migrate` (SQL ENUM in MySQL)
- **D-12:** After migration, run `prisma generate` to update TypeScript types; update Zod validators using `Object.values(PaymentMethod)`

### Ingreso Records (Accounting)
- **D-13:** Each Ingreso record must capture: `paymentId` (FK), `monto`, `moneda` (MXN), `fecha`, `tipo` (linked to `cuentas_contables`), `referencia` (MP external_reference)
- **D-14:** Map ingreso type to cuenta contable by payment type: reservation → "Ingreso por clase", package → "Ingreso por paquete/membresía"
- **D-15:** Ingreso creation happens in the same atomic transaction as payment confirmation — if Ingreso fails, entire post-payment transaction rolls back

### Membership Activation Logic
- **D-16:** Create `payment-processor.service.ts` as the centralized service for all post-payment processing (reservations, packages, memberships, ingresos)
- **D-17:** Route handlers are thin — they parse the request, validate, and call the payment-processor service. All business logic lives in the service.

### Stuck Reservation Cleanup
- **D-18:** Implement a cron job that runs every 5-10 minutes to check for reservations in `PENDING_APPROVAL` state for more than 30 minutes
- **D-19:** Cron job queries MercadoPago directly to check real payment status and confirms or cancels accordingly

### Local Testing
- **D-20:** Provide a mock payload script in the repo that simulates MercadoPago webhook payloads via curl/fetch — no ngrok or external tunneling required for dev testing

### the agent's Discretion
- Exact HTTP method and endpoint path for the unified verify-payment endpoint
- Cron job implementation (node-cron, set-interval, or external scheduler)
- Mock payload script format and structure

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Payment & Webhook
- `apps/api/src/routes/webhook.routes.ts` — Current webhook handler (needs signature validation fix + dispatch to service)
- `apps/api/src/services/mercadopago.service.ts` — MP service (has createPreference and getPayment — reuse for fallback)
- `apps/api/src/config/env.ts` — Env validation (MP_WEBHOOK_SECRET currently required in prod, optional in dev)

### Database
- `apps/api/prisma/schema.prisma` — Contains PaymentMethod enum, Payment model, Ingreso model, cuentas_contables, Reservation model

### Portal Routes
- `apps/api/src/routes/portal.routes.ts` — Contains verificar-pago (hardcoded CONFIRMED) and verificar-pago-paquete endpoints

### Architecture Context
- `.planning/codebase/ARCHITECTURE.md` — System architecture, data flow for portal booking and webhook processing
- `.planning/codebase/INTEGRATIONS.md` — MercadoPago integration details, webhook configuration, env vars
- `.planning/codebase/STACK.md` — Technology stack, Prisma/Express/Next.js versions

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `mercadopago.service.ts` — Already has `createPreference()` and `getPayment()` — extend with payment processing logic
- `kiosk.service.ts` — Example of a well-structured service file (extracted from routes) — use as pattern for payment-processor.service.ts
- `ApiSuccess` / `ApiError` — Unified response envelope from `utils/response.ts` — use for all endpoint responses

### Established Patterns
- TanStack Query for server state (web app)
- Inline route handlers for most API logic — but services layer exists for complex logic (kiosk, mercadopago, auth)
- Zod inline validation in route handlers
- Prisma singleton via `global.__prisma`
- Dual-token JWT auth (access 15m + refresh 7d)

### Integration Points
- Webhook: `POST /api/v1/portal/webhook/mercadopago` — needs validation fix + service dispatch
- Verify payment: `POST /api/v1/portal/verificar-pago` and `POST /api/v1/portal/verificar-pago-paquete` — unify into single endpoint
- Payment creation: `mercadopago.service.createPreference()` — already working
- Accounting: `Ingreso` and `cuentas_contables` tables exist in Prisma schema — need to be populated on payment

</code_context>

<specifics>
## Specific Ideas

- The default dev webhook secret should be documented in the README / setup guide so developers know what to use
- Mock payload script should cover: approved payment, rejected payment, cancelled payment, and invalid signature scenarios
- The cron job for stuck reservations should be configurable (interval and threshold) via environment variables

</specifics>

<deferred>
## Deferred Ideas

- Email notifications for payment confirmation / failure (belongs in Email Notifications phase)
- Refund handling via MercadoPago (belongs in separate phase)
- New payment methods beyond MercadoPago (belongs in separate phase)
- Dashboard UI for viewing payment history and accounting records

</deferred>

---

*Phase: 1-Stabilize Payment Flow*
*Context gathered: 2026-05-05*
