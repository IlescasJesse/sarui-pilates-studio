# External Integrations

**Analysis Date:** 2026-05-05

## APIs & External Services

**Payment Processing:**
- MercadoPago — Online payment collection for class reservations and package purchases
  - Server SDK: `mercadopago` 2.12.x (`apps/api/src/services/mercadopago.service.ts`)
  - React SDK: `@mercadopago/sdk-react` 1.0.7 (`apps/web`)
  - Auth env vars: `MP_ACCESS_TOKEN`, `MP_PUBLIC_KEY`, `MP_WEBHOOK_SECRET`
  - Two preference types:
    1. Reservation payment — `external_reference` = `reservationId`
    2. Package/membership purchase — `external_reference` = `PKG:{packageId}:{clientId}`
  - Back URLs: `{FRONTEND_URL}/portal/pago/exitoso`, `/portal/pago/fallido`, `/portal/pago/pendiente`
  - Package purchase back URL: `{FRONTEND_URL}/portal/pago/membresia-exitosa`
  - Currency: MXN

## Data Storage

**Databases:**
- MySQL (primary relational store)
  - Connection env var: `DATABASE_URL`
  - Client: Prisma 5.14.x (`@prisma/client`)
  - Connection helper: `apps/api/src/config/database.ts`
  - Schema: `apps/api/prisma/schema.prisma`
  - Tables: `users`, `refresh_tokens`, `clients`, `instructors`, `packages`, `tipos_actividad`, `tipos_membresia`, `tipos_membresia_actividades`, `memberships`, `classes`, `reservations`, `attendances`, `payments`, `solicitudes_cuenta`, `staff_profiles`, `cuentas_contables`, `gastos`, `ingresos`

- MongoDB (audit / activity logs)
  - Connection env var: `MONGODB_URI`
  - Client: Mongoose 8.4.x
  - Connection helper: `apps/api/src/config/mongodb.ts`
  - Collections:
    - `audit_logs` — model at `apps/api/src/models/AuditLog.model.ts`; tracks user actions (CREATE, UPDATE, DELETE, LOGIN, LOGOUT, VIEW) with entity, entityId, changes, and IP
    - `attendance_logs` — model at `apps/api/src/models/AttendanceLog.model.ts`

**File Storage:**
- Local filesystem only — no cloud storage integration detected

**Caching:**
- None server-side
- Client-side: TanStack Query cache in the web app

## Authentication & Identity

**Auth Provider:**
- Custom JWT implementation — no third-party auth provider (no Auth0, Supabase Auth, Clerk, etc.)
  - Implementation: `apps/api/src/utils/jwt.ts`
  - Middleware: `apps/api/src/middlewares/auth.middleware.ts`
  - Role middleware: `apps/api/src/middlewares/role.middleware.ts`
  - Dual-token architecture: short-lived access token (15m) + refresh token (7d)
  - Refresh tokens stored in MySQL `refresh_tokens` table (revocable)
  - Access tokens stored in browser `localStorage` under key `sarui_token`
  - User stored in `localStorage` under key `sarui_user`
  - Password hashing: `bcryptjs`
  - Roles: `ADMIN`, `INSTRUCTOR`, `RECEPCIONISTA`, `CLIENT`

## Monitoring & Observability

**Error Tracking:**
- None detected — no Sentry, Datadog, or equivalent integration

**Logs:**
- HTTP request logs: `morgan` (dev format in development, combined in production)
- Application logs: `console.log` / `console.error` / `console.warn`
- Audit trail: MongoDB `audit_logs` collection (structured, queryable)

## CI/CD & Deployment

**Hosting:**
- Not detected — no Vercel config, Dockerfile, Railway config, or deployment manifests found

**CI Pipeline:**
- Not detected — no `.github/workflows/`, no CircleCI, no similar config found

## Webhooks

**Incoming:**
- `POST /api/v1/portal/webhook/mercadopago` — MercadoPago payment notifications
  - Handler: `apps/api/src/routes/webhook.routes.ts`
  - Signature validation: HMAC-SHA256 using `MP_WEBHOOK_SECRET` via `x-signature` header
  - Dev behavior: validation skipped (warn once) if `MP_WEBHOOK_SECRET` is unset
  - Production behavior: `MP_WEBHOOK_SECRET` required or server refuses to start
  - Processed event type: `payment` only; all others return 200 and exit early
  - On `approved` + reservation: updates `reservations` status to CONFIRMED, upserts `payments`
  - On `approved` + package (`PKG:` prefix): idempotent upsert of `memberships`, creates `payments`
  - On `rejected`/`cancelled` + reservation in `PENDING_APPROVAL`: cancels reservation, decrements `spotsBooked`

**Outgoing:**
- MercadoPago preference creation — API calls to MercadoPago REST API via SDK (server-side, not a webhook)

## Environment Configuration

**Required env vars (API):**
- `DATABASE_URL` — MySQL connection string
- `MONGODB_URI` — MongoDB connection string
- `JWT_SECRET` — min 32 chars
- `JWT_REFRESH_SECRET` — min 32 chars
- `MP_ACCESS_TOKEN` — MercadoPago server access token
- `MP_PUBLIC_KEY` — MercadoPago public key

**Optional / conditional env vars (API):**
- `MP_WEBHOOK_SECRET` — Required in production; optional in development (validation disabled with warning)
- `PORT` — defaults to `4000`
- `JWT_EXPIRES_IN` — defaults to `15m`
- `JWT_REFRESH_EXPIRES_IN` — defaults to `7d`
- `NODE_ENV` — `development` | `production` | `test`
- `FRONTEND_URL` — defaults to `http://localhost:3000`
- `API_URL` — defaults to `http://localhost:4000`

**Required env vars (Web):**
- `NEXT_PUBLIC_API_URL` — Public API base URL for browser axios client
- `API_BASE_URL` — Server-side API target for Next.js rewrite proxy

**Secrets location:**
- `.env` file in `apps/api/` (not committed); validated at boot via `apps/api/src/config/env.ts`
- `.env.local` or similar expected in `apps/web/` for Next.js env vars

---

*Integration audit: 2026-05-05*
