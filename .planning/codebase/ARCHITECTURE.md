<!-- refreshed: 2026-05-05 -->
# Architecture

**Analysis Date:** 2026-05-05

## System Overview

```text
┌──────────────────────────────────────────────────────────────────────┐
│                          Next.js 15 Frontend                         │
│   apps/web/src/app/                                                  │
├──────────────────┬───────────────────────────┬───────────────────────┤
│  (auth) group    │   (dashboard) group        │   portal group        │
│  /login          │   /dashboard, /clientes    │   /clases, /agendar   │
│                  │   /clases, /instructores   │   /mis-agendas        │
│                  │   /membresias, /paquetes   │   /membresia          │
│                  │   /reservaciones           │   /pago/*             │
│                  │   /perfil, /contabilidad   │                       │
│                  │   /catalogos               │                       │
└────────┬─────────┴────────────┬──────────────┴──────────────┬────────┘
         │  axios + TanStack Query              │              │
         │  apps/web/src/lib/api-client.ts      │  apps/web/src/lib/portal-client.ts
         │  apps/web/src/hooks/use*.ts          │  apps/web/src/hooks/usePortal.ts
         ▼                                      ▼              ▼
┌──────────────────────────────────────────────────────────────────────┐
│                         Express REST API                             │
│   apps/api/src/app.ts — /api/v1/*                                    │
├────────────────────────────────────────────────────────────────────--┤
│  Middlewares: helmet · cors · morgan · authMiddleware · requireRole  │
│  apps/api/src/middlewares/                                           │
├──────────────────┬──────────────────────┬────────────────────────────┤
│  Route Handlers  │   Service Layer      │   Validators / Utils       │
│  apps/api/src/   │   apps/api/src/      │   apps/api/src/validators/ │
│  routes/*.ts     │   services/*.ts      │   apps/api/src/utils/      │
└────────┬─────────┴──────────┬───────────┴────────────────────────────┘
         │                    │
         ▼                    ▼
┌────────────────────┐  ┌────────────────────┐  ┌──────────────────────┐
│   MySQL (Prisma)   │  │  MongoDB (Mongoose) │  │  MercadoPago SDK     │
│  apps/api/src/     │  │  apps/api/src/      │  │  apps/api/src/       │
│  config/database.ts│  │  config/mongodb.ts  │  │  services/           │
│  prisma/schema.    │  │  models/AuditLog.*  │  │  mercadopago.service │
│  prisma            │  │  models/Attendance  │  │                      │
│                    │  │  Log.model.ts       │  │                      │
└────────────────────┘  └────────────────────┘  └──────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | Key Files |
|-----------|----------------|-----------|
| Next.js App Router | Pages, routing, SSR/CSR layout groups | `apps/web/src/app/` |
| TanStack Query hooks | Server state, cache, mutations | `apps/web/src/hooks/use*.ts` |
| Zustand store | Client-only UI state (sidebar open/closed) | `apps/web/src/store/uiStore.ts` |
| apiClient | Admin/staff HTTP client — attaches JWT, handles 401 | `apps/web/src/lib/api-client.ts` |
| portalAuthClient | Portal authenticated HTTP client | `apps/web/src/lib/portal-client.ts` |
| portalPublicClient | Portal unauthenticated HTTP client | `apps/web/src/lib/portal-client.ts` |
| Express app | REST API server, middleware stack, 404/error handlers | `apps/api/src/app.ts` |
| Route handlers | Inline route logic (no separate controller layer for most routes) | `apps/api/src/routes/*.ts` |
| Service layer | Complex business logic isolated from routes | `apps/api/src/services/*.ts` |
| Prisma client | MySQL ORM — singleton via global.__prisma | `apps/api/src/config/database.ts` |
| Mongoose | MongoDB ODM — audit logs + kiosk attendance logs | `apps/api/src/config/mongodb.ts` |
| MercadoPago service | Payment preference creation and payment retrieval | `apps/api/src/services/mercadopago.service.ts` |

## Pattern Overview

**Overall:** Monorepo with two independent apps (Next.js frontend + Express API) communicating over HTTP REST. No shared runtime code — the `packages/shared/src/types/` package exists but is not actively imported by either app (types are duplicated in each app).

**Key Characteristics:**
- API uses inline route handlers (not MVC controllers) for most resources — only `auth` and `kiosk` have dedicated controller files
- Frontend uses TanStack Query for all server state — no Redux, no Context for data
- Dual database pattern: MySQL (Prisma) for all transactional/relational data; MongoDB (Mongoose) for append-only logs (audit, attendance)
- Auth is stateless JWT (access token 15m + refresh token 7d stored in MySQL)
- Portal and dashboard are separate UX contexts within the same Next.js app, sharing no auth state

## Layers

**Frontend — Pages Layer:**
- Purpose: Route segments rendered by Next.js App Router
- Location: `apps/web/src/app/`
- Contains: Server and client components, page.tsx, layout.tsx files
- Depends on: hooks layer, components layer
- Used by: End users via browser

**Frontend — Hooks Layer:**
- Purpose: All data fetching, mutations, and auth state
- Location: `apps/web/src/hooks/`
- Contains: TanStack Query wrappers around `apiClient` / `portalAuthClient` / `portalPublicClient`
- Depends on: lib/api-client.ts, lib/portal-client.ts
- Used by: Page and component files

**Frontend — Components Layer:**
- Purpose: Reusable UI components scoped by domain
- Location: `apps/web/src/components/`
- Contains: Domain components (e.g. `clientes/`, `reservaciones/`) + shared UI primitives in `ui/`
- Depends on: hooks, store, lib/utils
- Used by: Pages

**Frontend — Store Layer:**
- Purpose: Client-only persistent UI state
- Location: `apps/web/src/store/uiStore.ts`
- Contains: Zustand store with `sidebarOpen` flag persisted to localStorage under key `sarui-ui`
- Depends on: Nothing
- Used by: Dashboard layout, Sidebar, Topbar

**API — Routes Layer:**
- Purpose: HTTP request handling — validation, auth, business logic, DB access
- Location: `apps/api/src/routes/`
- Contains: All Express Router instances; most routes contain inline logic (no separate service call)
- Depends on: middlewares, config/database, config/env, utils/response, services (for kiosk and payments)
- Used by: `apps/api/src/routes/index.ts` which mounts all routers under `/api/v1`

**API — Services Layer:**
- Purpose: Complex, reusable business logic extracted from routes
- Location: `apps/api/src/services/`
- Contains: `auth.service.ts`, `kiosk.service.ts`, `mercadopago.service.ts`, `qr.service.ts`, `audit.service.ts`, `clientes.service.ts`
- Depends on: config/database, config/mongodb, config/env, models
- Used by: Route handlers and controllers

**API — Middleware Layer:**
- Purpose: Cross-cutting request concerns
- Location: `apps/api/src/middlewares/`
- Contains:
  - `auth.middleware.ts` — verifies Bearer JWT, attaches `req.user`
  - `role.middleware.ts` — `requireRole(...roles)` factory, checks `req.user.role`
  - `error.middleware.ts` — global Express error handler
  - `validate.middleware.ts` — Zod schema validation

## Data Flow

### Admin Dashboard Request Path

1. User action triggers TanStack Query mutation or query in hook (`apps/web/src/hooks/use*.ts`)
2. `apiClient` sends HTTP request with Bearer token from `localStorage.getItem('sarui_token')` (`apps/web/src/lib/api-client.ts`)
3. Express receives at `apps/api/src/app.ts` → `authMiddleware` (`apps/api/src/middlewares/auth.middleware.ts`) verifies JWT and sets `req.user`
4. `requireRole(...)` checks role (`apps/api/src/middlewares/role.middleware.ts`)
5. Route handler queries Prisma → MySQL (`apps/api/src/config/database.ts`)
6. `ApiSuccess(res, data)` or `ApiError(res, code, msg, status)` shapes response (`apps/api/src/utils/response.ts`)
7. TanStack Query caches result; component re-renders

### Portal Booking Flow (Authenticated Client)

1. Client logs in via `POST /api/v1/auth/login` → receives JWT stored in `localStorage`
2. `useCrearReservaPortal()` mutation posts to `POST /api/v1/portal/reservaciones` via `portalAuthClient`
3. If `pagarAhora: true`: atomic `$executeRaw` increments `spotsBooked`, creates `PENDING_APPROVAL` reservation, returns MercadoPago `checkoutUrl`
4. Client pays on MercadoPago → webhook fires `POST /api/v1/portal/webhook/mercadopago`
5. Webhook validates HMAC signature, calls `getPayment()`, runs `$transaction` to confirm reservation + upsert Payment row
6. If webhook unreachable: `POST /api/v1/portal/verificar-pago` fallback polls MP directly

### Portal Booking Flow (Provisional Token, No Account Login)

1. `POST /api/v1/portal/buscar-cliente` validates email → returns short-lived `provisional` JWT (30m)
2. `POST /api/v1/portal/reservar-provisional` verifies provisional token, validates membership type compatibility, creates reservation + decrements sessions atomically

### MercadoPago Package Purchase Flow

1. Client hits `POST /api/v1/portal/comprar-paquete` → `createPackagePreference()` with `external_reference = PKG:{packageId}:{clientId}`
2. On payment: webhook detects `PKG:` prefix, runs `membership.upsert` idempotently (keyed on `mercadoPagoPaymentId`), creates Payment row
3. Fallback: `POST /api/v1/portal/verificar-pago-paquete`

### Kiosk Check-In Flow

1. Kiosk UI posts QR code or PIN to `POST /api/v1/kiosk/check-in`
2. `kiosk.service.ts` looks up client, finds active reservation, confirms attendance
3. Writes to both MySQL (`Attendance` table) and MongoDB (`AttendanceLog` collection)

**State Management:**
- Server state: TanStack Query (staleTime 2min for dashboard, 5min for portal packages)
- UI state: Zustand (`uiStore.ts`, persisted to `localStorage`)
- Auth state: localStorage (`sarui_token`, `sarui_refresh_token`, `sarui_user`) — read on mount by `useAuth`

## Key Abstractions

**ApiSuccess / ApiError:**
- Purpose: Unified JSON response envelope `{ success: true, data }` / `{ success: false, error: { code, message } }`
- File: `apps/api/src/utils/response.ts`
- Pattern: Every route handler calls one of these — never `res.json()` directly

**prisma singleton:**
- Purpose: Single PrismaClient instance reused across requests; prevents connection exhaustion in dev hot-reload
- File: `apps/api/src/config/database.ts`
- Pattern: `global.__prisma` check before instantiation

**authMiddleware + requireRole:**
- Purpose: Composable auth guards applied at router or individual route level
- Files: `apps/api/src/middlewares/auth.middleware.ts`, `apps/api/src/middlewares/role.middleware.ts`
- Pattern: `router.use(authMiddleware)` for full-router protection; `requireRole('ADMIN')` on specific sensitive routes

**Zod inline validation:**
- Purpose: Input validation at route boundaries
- Pattern: `z.object({...}).safeParse(req.body)` inline in route handler; errors returned as `VALIDATION_ERROR`

## Entry Points

**API Server:**
- Location: `apps/api/src/server.ts`
- Triggers: `npm run dev --workspace=apps/api` or `node dist/server.js`
- Responsibilities: Connects MySQL + MongoDB, starts Express HTTP server, registers shutdown handlers

**API App:**
- Location: `apps/api/src/app.ts`
- Responsibilities: Registers all middleware, mounts `routes/index.ts` at `/api/v1`, health check at `/health`

**Route Index:**
- Location: `apps/api/src/routes/index.ts`
- Responsibilities: Mounts all routers; public routes (`/auth`, `/kiosk`, `/portal/webhook`, `/portal`) listed before protected routes

**Next.js Root Layout:**
- Location: `apps/web/src/app/layout.tsx`
- Responsibilities: Fonts, metadata, wraps tree in `<Providers>` (TanStack Query + Sonner Toaster)

**Next.js Providers:**
- Location: `apps/web/src/app/providers.tsx`
- Responsibilities: `QueryClientProvider` with global defaults (staleTime 2min, retry 1, no refetchOnWindowFocus)

**Dashboard Layout (auth guard):**
- Location: `apps/web/src/app/(dashboard)/layout.tsx`
- Responsibilities: Reads `useAuth()` state, redirects to `/login` if unauthenticated, renders Sidebar + Topbar shell

## Architectural Constraints

- **Threading:** Node.js single-threaded event loop. No worker threads. Kiosk PIN check iterates all clients in memory for bcrypt comparison — O(n) on client table.
- **Global state:** `global.__prisma` in `apps/api/src/config/database.ts` is a module-level singleton
- **Circular imports:** None detected
- **Auth token storage:** Access token and user object stored in `localStorage` — not httpOnly cookies. XSS risk.
- **Dual DB per request:** Kiosk writes to both MySQL and MongoDB in the same service call (`kiosk.service.ts`) — no distributed transaction. MongoDB write failure does not roll back MySQL.
- **No shared package usage:** `packages/shared/src/types/` exists but types are duplicated in both apps rather than imported

## Anti-Patterns

### Inline business logic in routes

**What happens:** Most route files in `apps/api/src/routes/` contain full business logic (Prisma queries, validation, transactions) inline rather than in services.
**Why it's wrong:** Route files grow beyond 500 lines (e.g. `portal.routes.ts` is 934 lines); logic cannot be unit tested without spinning up Express.
**Do this instead:** Extract to `apps/api/src/services/` as demonstrated by `kiosk.service.ts` and `mercadopago.service.ts`.

### Static nav auth state in portal layout

**What happens:** `apps/web/src/app/portal/layout.tsx` always renders "Iniciar sesión" link regardless of auth state.
**Why it's wrong:** Authenticated portal clients see a login button instead of their name or a logout option.
**Do this instead:** Read `localStorage.getItem('sarui_token')` client-side (mark layout as `"use client"`) or use a portal-specific auth hook.

### PIN check full table scan

**What happens:** `apps/api/src/services/kiosk.service.ts` fetches all clients to compare PIN via bcrypt.
**Why it's wrong:** O(n) database + CPU cost grows linearly with client count. 
**Do this instead:** Store a deterministic PIN hash that can be looked up directly, or use a PIN→clientId index.

## Error Handling

**Strategy:** Errors propagate via `next(error)` to the global `errorHandler` in `apps/api/src/middlewares/error.middleware.ts`. Route-level validation errors return immediately via `ApiError()`.

**Patterns:**
- Validation errors: `ApiError(res, 'VALIDATION_ERROR', ..., 400)` returned inline
- Business rule errors: `ApiError(res, 'DOMAIN_CODE', ..., 4xx)` returned inline
- Unexpected errors: `next(error)` → `errorHandler` masks message in production (500s only)
- 401 on frontend: `apiClient` interceptor clears localStorage and redirects to `/login`; `portalAuthClient` redirects to `/portal/login`

## Cross-Cutting Concerns

**Logging:** `morgan` for HTTP access logs (dev format in dev, combined in prod); `console.error` in error handler; MongoDB `AuditLog` collection for user action audit trail
**Validation:** Zod inline in route handlers; `validate.middleware.ts` exists but routes mostly use inline `safeParse`
**Authentication:** JWT Bearer tokens — `authMiddleware` sets `req.user`; portal has a secondary `provisional` JWT type for booking without full login

---

*Architecture analysis: 2026-05-05*
