# Coding Conventions

**Analysis Date:** 2026-05-05

## Naming Patterns

**Files:**
- Route files: `kebab-case.routes.ts` — e.g., `clientes.routes.ts`, `tipo-actividades.routes.ts`
- Hook files: `usePascalCase.ts` — e.g., `useClientes.ts`, `usePortal.ts`
- Component files: `PascalCase.tsx` — e.g., `ClientesTable.tsx`, `ClienteForm.tsx`
- Page files: `page.tsx`, `layout.tsx` (Next.js App Router convention)
- Middleware files: `kebab-case.middleware.ts` — e.g., `auth.middleware.ts`, `role.middleware.ts`
- Utility files: `kebab-case.ts` — e.g., `api-client.ts`, `response.ts`

**Functions/Hooks:**
- React hooks: `useNounVerb` or `useNounEntity` pattern — `useClientes`, `useCreateCliente`, `useUpdateCliente`, `useDeleteCliente`
- Event handlers in components: `handle + Action` — `handleEditCliente`, `handleCloseForm`
- API helpers: lowercase verbs — `get`, `post`, `put`, `patch`, `del`
- API utilities: PascalCase — `ApiSuccess`, `ApiError`

**Variables:**
- camelCase throughout TypeScript files
- Spanish domain names for entities: `cliente`, `clase`, `reservacion`, `membresia`, `paquete`, `solicitud`
- English for structural code: `router`, `middleware`, `config`, `schema`

**Types/Interfaces:**
- Interfaces: `PascalCase` with `I`-prefix omitted — `Cliente`, `ClientesResponse`, `CreateClienteDto`
- DTOs: `VerbEntityDto` — `CreateClienteDto`, `UpdateClienteDto`
- Zod schemas: `camelCase + Schema` suffix — `clienteSchema`, `reservaSchema`, `solicitudSchema`
- Local union types: declared inline — `type Tab = "clientes" | "portal" | "solicitudes"`

## Code Style

**Formatting:**
- No Prettier config detected; formatting enforced via ESLint (`next/core-web-vitals` + `next/typescript` in `apps/web/.eslintrc.json`)
- API has no detected linting config — TypeScript strict mode acts as primary guard

**TypeScript:**
- `strict: true` in both `apps/web/tsconfig.json` and `apps/api/tsconfig.json`
- `skipLibCheck: true` on both
- Path alias `@/*` maps to `apps/web/src/*`
- Target: `ES2017` (web), ESNext module resolution with `bundler` strategy

## Import Organization

**Order (observed in route and hook files):**
1. External framework imports (`express`, `react`, `next`)
2. Third-party libraries (`zod`, `jsonwebtoken`, `qrcode`, `@tanstack/react-query`)
3. Internal config/utils (`../config/database`, `../utils/response`, `@/lib/api-client`)
4. Internal middlewares (`../middlewares/auth.middleware`)
5. Types/interfaces (inline in same file or from `@/types`)

**Path Aliases:**
- `@/*` — resolves to `apps/web/src/*`
- Relative imports used throughout API (`../utils/`, `../config/`, `../middlewares/`)

## API Response Shape

All API responses use a consistent envelope from `apps/api/src/utils/response.ts`:

**Success:**
```typescript
{ success: true, data: T }
// Via: ApiSuccess(res, data, status?)
```

**Error:**
```typescript
{ success: false, error: { code: string, message: string } }
// Via: ApiError(res, code, message, status?)
```

**Validation error (inline, not via ApiError):**
```typescript
res.status(400).json({
  success: false,
  error: { code: 'VALIDATION_ERROR', message: '...', details: parseResult.error.errors }
})
```

**Status codes in use:**
- `200` — default success
- `201` — resource created
- `400` — validation or bad request
- `401` — unauthorized / token invalid
- `403` — forbidden / wrong role
- `404` — not found
- `409` — conflict (duplicate, already exists)

## Validation

**Pattern:** Zod schemas defined at the top of each route file, validated with `.safeParse()` before any DB call.

```typescript
const clienteSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  email: z.string().email('Invalid email'),
  pin: z.string().length(4).regex(/^\d{4}$/).optional(),
});

const parseResult = clienteSchema.safeParse(req.body);
if (!parseResult.success) {
  res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', ... } });
  return;
}
```

**Note:** Some routes use inline `req.body as { field?: Type }` casts without Zod (e.g., `comprar-paquete`). Prefer Zod for all user input.

## Error Handling

**API (Express):**
- All route handlers are `async` and use `try/catch` with `next(error)` to pass unhandled errors to the global error handler
- Explicit early returns after every `ApiError(...)` call to prevent response-after-send errors
- Special errors with `.code` property are caught before `next(error)`:
  ```typescript
  } catch (error) {
    if ((error as { code?: string }).code === 'CLASS_FULL') {
      ApiError(res, 'CLASS_FULL', '...', 409);
      return;
    }
    next(error);
  }
  ```

**Frontend (hooks):**
- Mutations re-throw errors in `onError` for component-level handling:
  ```typescript
  onError: (error: AxiosError<any>) => {
    throw new Error(error.response?.data?.error?.message || 'Fallback message');
  }
  ```
- 401 responses trigger global logout + redirect via axios response interceptor in `apps/web/src/lib/api-client.ts`

## Authentication

**Token storage:** `localStorage` keys `sarui_token` and `sarui_user`
**Token attachment:** Axios request interceptor in `apps/web/src/lib/api-client.ts` attaches `Authorization: Bearer <token>` automatically
**API guard:** `authMiddleware` reads `Authorization: Bearer` header, verifies JWT, sets `req.user`
**Role guard:** `requireRole(...roles)` middleware — called after `authMiddleware`, checks `req.user.role`
**Dual client pattern (portal):** `portalPublicClient` for unauthenticated routes, `portalAuthClient` for authenticated portal routes — both defined in `apps/web/src/lib/portal-client.ts`

## Database Access

**Pattern:** Direct `prisma` client usage inside route handlers — no repository/service abstraction layer for most routes
**Soft deletes:** `deletedAt: null` filter added to all queries; deletion sets `deletedAt: new Date()`
**Atomic writes:** `prisma.$transaction([...])` for multi-table writes; `$executeRaw` for atomic counter increments to prevent race conditions:
  ```typescript
  await tx.$executeRaw`UPDATE \`Class\` SET spotsBooked = spotsBooked + 1
    WHERE id = ${claseId} AND spotsBooked < capacity`
  ```
**Pagination:** `skip` / `take` with `page` and `limit` query params; returns `{ data, pagination: { total, page, limit, pages } }`

## Frontend Component Patterns

**"use client" directive:** All interactive pages and hooks declare `"use client"` at top of file
**State management:** React `useState` for local UI state; TanStack Query for server state
**Query keys:** Namespaced arrays — `["clientes", params]`, `["portal", "clases"]`, `["portal", "mis-membresias"]`
**Cache invalidation:** `qc.invalidateQueries({ queryKey: [...] })` in mutation `onSuccess`
**Animations:** `framer-motion` (`motion`, `AnimatePresence`) for tab/panel transitions
**Icons:** `lucide-react`

## Styling

**Framework:** Tailwind CSS
**Brand colors (hardcoded):**
- Primary dark green: `#254F40`
- Accent yellow-green: `#F6FFB5`
- Background light: `#FDFFEC`
**Component library:** shadcn/ui — components in `apps/web/src/components/ui/`
**Pattern:** Tailwind utility classes inline; brand colors used directly as hex literals (no CSS variables for brand palette)

## Comments

**API:** Section separators use long dashes:
```typescript
// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/portal/clases  — público, sin auth
// ─────────────────────────────────────────────────────────────────────────────
```

**Hooks:** Section separators use short dashes with labels:
```typescript
// ── Types ────────────────────────────────────────────────────────────────────
// ── Query Hooks ──────────────────────────────────────────────────────────────
// ── Mutation Hooks ───────────────────────────────────────────────────────────
```

**Language:** Comments, error messages to users, and route descriptions mix Spanish and English. Domain-facing strings (UI, user messages) tend to be Spanish; code comments can be either.

## Module Design

**API routes:** Each entity has its own router file (`apps/api/src/routes/*.routes.ts`), mounted via `apps/api/src/routes/index.ts`
**Frontend hooks:** One hook file per entity (`apps/web/src/hooks/use*.ts`); a single file exports all query + mutation hooks for that entity
**Barrel exports:** Not widely used — hooks and components imported by direct file path

---

*Convention analysis: 2026-05-05*
