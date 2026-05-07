<!-- refreshed: 2026-05-05 -->
# Codebase Structure

**Analysis Date:** 2026-05-05

## Directory Layout

```
sarui-studio/                         # npm workspaces monorepo root
├── apps/
│   ├── api/                          # Express REST API (Node.js + TypeScript)
│   │   ├── prisma/
│   │   │   ├── schema.prisma         # MySQL schema — source of truth for all models
│   │   │   └── migrations/           # Prisma migration history
│   │   └── src/
│   │       ├── app.ts                # Express app factory — middleware + routes
│   │       ├── server.ts             # Startup: DB connect, listen, graceful shutdown
│   │       ├── config/
│   │       │   ├── database.ts       # Prisma singleton client
│   │       │   ├── mongodb.ts        # Mongoose connect/disconnect
│   │       │   └── env.ts            # Zod-validated env vars — fails fast at boot
│   │       ├── routes/
│   │       │   ├── index.ts          # Master router — mounts all sub-routers at /api/v1
│   │       │   ├── auth.routes.ts
│   │       │   ├── portal.routes.ts  # Largest route file (934 lines) — public + CLIENT auth
│   │       │   ├── webhook.routes.ts # MercadoPago webhook handler
│   │       │   ├── clientes.routes.ts
│   │       │   ├── clases.routes.ts
│   │       │   ├── reservaciones.routes.ts
│   │       │   ├── membresias.routes.ts
│   │       │   ├── paquetes.routes.ts
│   │       │   ├── instructores.routes.ts
│   │       │   ├── dashboard.routes.ts
│   │       │   ├── perfil.routes.ts
│   │       │   ├── usuarios.routes.ts
│   │       │   ├── contabilidad.routes.ts
│   │       │   ├── kiosk.routes.ts
│   │       │   ├── tipo-actividades.routes.ts
│   │       │   └── tipo-membresias.routes.ts
│   │       ├── services/
│   │       │   ├── auth.service.ts
│   │       │   ├── kiosk.service.ts  # Check-in business logic
│   │       │   ├── mercadopago.service.ts
│   │       │   ├── qr.service.ts
│   │       │   ├── audit.service.ts
│   │       │   └── clientes.service.ts
│   │       ├── middlewares/
│   │       │   ├── auth.middleware.ts   # JWT verification → req.user
│   │       │   ├── role.middleware.ts   # requireRole() factory
│   │       │   ├── error.middleware.ts  # Global error handler + createError()
│   │       │   └── validate.middleware.ts
│   │       ├── controllers/
│   │       │   ├── auth.controller.ts
│   │       │   └── kiosk.controller.ts
│   │       ├── models/
│   │       │   ├── AuditLog.model.ts    # Mongoose — audit trail
│   │       │   └── AttendanceLog.model.ts  # Mongoose — kiosk check-in log
│   │       ├── validators/
│   │       │   ├── auth.validator.ts
│   │       │   └── kiosk.validator.ts
│   │       ├── utils/
│   │       │   ├── response.ts    # ApiSuccess() / ApiError() helpers
│   │       │   ├── jwt.ts         # signToken / verifyToken / TokenPayload
│   │       │   ├── bcrypt.ts      # hashPassword / comparePassword
│   │       │   └── pagination.ts
│   │       └── database/
│   │           └── seed.ts        # Dev seed script
│   │
│   └── web/                          # Next.js 15 App Router (React + TypeScript)
│       ├── public/                   # Static assets
│       └── src/
│           ├── app/
│           │   ├── layout.tsx         # Root layout — fonts, metadata, <Providers>
│           │   ├── page.tsx           # Landing page
│           │   ├── providers.tsx      # TanStack Query + Sonner Toaster
│           │   ├── globals.css
│           │   ├── (auth)/
│           │   │   └── login/         # Staff/admin login page
│           │   ├── (dashboard)/       # Protected admin/staff area
│           │   │   ├── layout.tsx     # Auth guard — redirects to /login if not authenticated
│           │   │   ├── dashboard/
│           │   │   ├── clientes/
│           │   │   ├── clases/
│           │   │   ├── instructores/
│           │   │   ├── membresias/
│           │   │   ├── paquetes/
│           │   │   ├── reservaciones/
│           │   │   ├── catalogos/
│           │   │   ├── perfil/
│           │   │   ├── contabilidad/
│           │   │   └── (no layout auth for portal — separate context)
│           │   ├── portal/            # Public-facing client portal
│           │   │   ├── layout.tsx     # Portal chrome — static nav (no auth awareness)
│           │   │   ├── page.tsx
│           │   │   ├── login/
│           │   │   ├── clases/
│           │   │   ├── agendar/
│           │   │   │   └── [claseId]/
│           │   │   ├── mis-agendas/
│           │   │   ├── membresia/
│           │   │   └── pago/
│           │   │       ├── exitoso/
│           │   │       ├── fallido/
│           │   │       └── membresia-exitosa/
│           │   └── kiosk/             # Self-service check-in terminal UI
│           ├── components/
│           │   ├── layout/
│           │   │   ├── Sidebar.tsx
│           │   │   └── Topbar.tsx
│           │   ├── ui/                # Primitive UI components (shadcn/ui style)
│           │   │   ├── button.tsx
│           │   │   ├── card.tsx
│           │   │   ├── dialog.tsx
│           │   │   ├── dropdown-menu.tsx
│           │   │   ├── input.tsx
│           │   │   └── badge.tsx
│           │   ├── dashboard/
│           │   ├── clientes/
│           │   ├── clases/
│           │   ├── instructores/
│           │   ├── membresias/
│           │   ├── paquetes/
│           │   ├── reservaciones/
│           │   ├── catalogos/
│           │   ├── kiosk/
│           │   └── landing/
│           ├── hooks/
│           │   ├── useAuth.ts          # Login, logout, localStorage token management
│           │   ├── usePortal.ts        # Portal-specific queries and mutations
│           │   ├── useAgendasPortal.ts
│           │   ├── useClientes.ts
│           │   ├── useMembresias.ts
│           │   ├── usePaquetes.ts
│           │   ├── useClases.ts (implied by components)
│           │   ├── useReservaciones.ts
│           │   ├── useInstructores.ts
│           │   ├── useContabilidad.ts
│           │   ├── usePerfil.ts
│           │   ├── useTipoActividades.ts
│           │   ├── useTipoMembresias.ts
│           │   └── useUsuarios.ts
│           ├── lib/
│           │   ├── api-client.ts       # Axios for admin/staff — attaches JWT, 401 → /login
│           │   ├── portal-client.ts    # Two Axios instances: public + auth portal
│           │   ├── utils.ts            # cn() class merging utility
│           │   ├── animations.ts       # Framer Motion variants
│           │   └── qr-card.ts
│           ├── store/
│           │   └── uiStore.ts          # Zustand — sidebarOpen, persisted to localStorage
│           └── types/
│               └── index.ts            # Frontend TypeScript type definitions
│
└── packages/
    └── shared/
        └── src/
            └── types/                  # Shared types (currently unused — types duplicated in each app)
```

## Directory Purposes

**`apps/api/src/routes/`:**
- Purpose: One file per resource domain; each file exports an Express Router
- Contains: Route handlers with inline Prisma queries + Zod validation
- Key files: `index.ts` (master mount), `portal.routes.ts` (largest — 934 lines), `webhook.routes.ts`

**`apps/api/src/services/`:**
- Purpose: Business logic that is too complex or reusable for inline route handlers
- Contains: `kiosk.service.ts` (check-in flow), `mercadopago.service.ts` (MP SDK wrappers), `auth.service.ts`, `audit.service.ts`

**`apps/api/src/config/`:**
- Purpose: Application-level singletons and validated configuration
- Contains: Prisma client singleton, Mongoose connect/disconnect, Zod env schema

**`apps/api/src/models/`:**
- Purpose: MongoDB/Mongoose schemas only — no Prisma models here (those are in `schema.prisma`)
- Contains: `AuditLog.model.ts`, `AttendanceLog.model.ts`

**`apps/web/src/app/(dashboard)/`:**
- Purpose: All admin/staff pages behind auth guard
- Route group — parentheses mean `(dashboard)` does not appear in URLs
- Auth guard lives at `layout.tsx` — checks `useAuth().isAuthenticated`

**`apps/web/src/app/portal/`:**
- Purpose: Public client-facing portal — mix of public and authenticated pages
- No route group parentheses — `portal` IS part of the URL
- Layout has static chrome only; individual pages handle their own auth checks

**`apps/web/src/hooks/`:**
- Purpose: All TanStack Query wrappers — one file per resource domain
- Pattern: Each file exports `useXxx()` (query) and `useCreateXxx()` / `useUpdateXxx()` (mutations)

**`apps/web/src/components/ui/`:**
- Purpose: Primitive, unstyled-base UI components (shadcn/ui pattern)
- Generated: No — hand-maintained
- These are the base building blocks; domain components in sibling directories compose them

## Key File Locations

**Entry Points:**
- `apps/api/src/server.ts`: API process startup
- `apps/api/src/app.ts`: Express application factory
- `apps/web/src/app/layout.tsx`: Next.js root layout

**Configuration:**
- `apps/api/src/config/env.ts`: All environment variables — validated with Zod at startup
- `apps/api/prisma/schema.prisma`: MySQL data model — all tables and enums
- `apps/web/src/lib/api-client.ts`: Admin HTTP client configuration
- `apps/web/src/lib/portal-client.ts`: Portal HTTP clients (public + auth)

**Auth:**
- `apps/api/src/middlewares/auth.middleware.ts`: JWT verification
- `apps/api/src/middlewares/role.middleware.ts`: Role-based access
- `apps/api/src/utils/jwt.ts`: Token sign/verify
- `apps/web/src/hooks/useAuth.ts`: Frontend auth state

**Payments:**
- `apps/api/src/services/mercadopago.service.ts`: MP SDK — preference creation, payment retrieval
- `apps/api/src/routes/webhook.routes.ts`: Inbound MP webhook handler
- `apps/web/src/app/portal/pago/exitoso/`: Payment success page
- `apps/web/src/app/portal/pago/membresia-exitosa/`: Package purchase success page

**API Response Shape:**
- `apps/api/src/utils/response.ts`: `ApiSuccess()` and `ApiError()` — use these everywhere

## Naming Conventions

**API Route Files:**
- Pattern: `{resource}.routes.ts` (kebab-case, plural noun)
- Examples: `clientes.routes.ts`, `tipo-actividades.routes.ts`, `webhook.routes.ts`

**API Service Files:**
- Pattern: `{resource}.service.ts`
- Examples: `mercadopago.service.ts`, `kiosk.service.ts`

**API Model Files (MongoDB):**
- Pattern: `{EntityName}.model.ts` (PascalCase entity)
- Examples: `AuditLog.model.ts`, `AttendanceLog.model.ts`

**Web Hook Files:**
- Pattern: `use{Resource}.ts` (camelCase, singular or plural matching domain)
- Examples: `useAuth.ts`, `useClientes.ts`, `usePortal.ts`

**Web Component Files:**
- Pattern: PascalCase for components (`Sidebar.tsx`, `Topbar.tsx`)
- Domain components live in `src/components/{domain}/`
- UI primitives live in `src/components/ui/`

**Web Page Files:**
- Pattern: Next.js convention — `page.tsx`, `layout.tsx` in route segment directories
- Route groups use `(groupName)` — does not affect URL

**Prisma Models:**
- Pattern: PascalCase singular (`User`, `Client`, `Membership`)
- Table names are snake_case plural set via `@@map()`

## Where to Add New Code

**New API resource (e.g. `/api/v1/reportes`):**
1. Create route file: `apps/api/src/routes/reportes.routes.ts`
2. Mount in: `apps/api/src/routes/index.ts` — add `router.use('/reportes', reportesRoutes)`
3. If complex logic: create `apps/api/src/services/reportes.service.ts`
4. If new DB tables: add models to `apps/api/prisma/schema.prisma` and run migration

**New frontend admin page (e.g. `/reportes`):**
1. Create directory: `apps/web/src/app/(dashboard)/reportes/`
2. Add `page.tsx` inside — it is automatically protected by the dashboard layout auth guard
3. Add hook: `apps/web/src/hooks/useReportes.ts`
4. Add domain components: `apps/web/src/components/reportes/`

**New portal page (e.g. `/portal/credencial`):**
1. Create directory: `apps/web/src/app/portal/credencial/`
2. Add `page.tsx` — handle auth check inside the page (portal layout does NOT guard)
3. Use `portalAuthClient` from `apps/web/src/lib/portal-client.ts` for authenticated calls
4. Use `portalPublicClient` for unauthenticated calls

**New database table:**
1. Add model to `apps/api/prisma/schema.prisma`
2. Run: `npm run migrate --workspace=apps/api`
3. Import `prisma` from `apps/api/src/config/database.ts` in the route/service

**New MongoDB collection:**
1. Create model file: `apps/api/src/models/{Name}.model.ts`
2. Export a Mongoose model
3. Import and use in service files

**Shared utility (API):**
- Place in `apps/api/src/utils/` — import with relative path

**Shared utility (Web):**
- Place in `apps/web/src/lib/` — import with `@/lib/` path alias

## Special Directories

**`apps/api/prisma/migrations/`:**
- Purpose: Auto-generated Prisma migration SQL files
- Generated: Yes (by `prisma migrate dev`)
- Committed: Yes — tracks schema history

**`apps/api/dist/`:**
- Purpose: TypeScript compiled output
- Generated: Yes
- Committed: No

**`apps/web/.next/`:**
- Purpose: Next.js build cache and output
- Generated: Yes
- Committed: No

**`.planning/codebase/`:**
- Purpose: GSD codebase analysis documents consumed by planner and executor agents
- Generated: Yes (by gsd-map-codebase)
- Committed: Optional — treat as documentation

**`packages/shared/src/types/`:**
- Purpose: Intended shared TypeScript types between api and web
- Current state: Not actively imported — types are duplicated in each app's `types/` dir
- Do not rely on this as a shared source of truth until the duplication is resolved

---

*Structure analysis: 2026-05-05*
