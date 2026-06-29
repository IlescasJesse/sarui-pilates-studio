---
phase: 23-nomina-personal
reviewed: 2026-06-29T00:00:00Z
depth: standard
files_reviewed: 12
files_reviewed_list:
  - apps/api/prisma/schema.prisma
  - apps/api/src/routes/asistencia.routes.ts
  - apps/api/src/routes/index.ts
  - apps/api/src/routes/nomina.routes.ts
  - apps/api/src/routes/personal.routes.ts
  - apps/api/src/services/nomina.service.ts
  - apps/web/src/app/(dashboard)/personal/_components/TabAsistencia.tsx
  - apps/web/src/app/(dashboard)/personal/_components/TabNomina.tsx
  - apps/web/src/app/(dashboard)/personal/_components/TabPersonal.tsx
  - apps/web/src/app/(dashboard)/personal/page.tsx
  - apps/web/src/components/layout/Sidebar.tsx
  - apps/web/src/hooks/usePersonal.ts
findings:
  critical: 5
  warning: 5
  info: 2
  total: 12
status: issues_found
---

# Phase 23: Code Review Report

**Reviewed:** 2026-06-29
**Depth:** standard
**Files Reviewed:** 12
**Status:** issues_found

## Summary

This phase implements staff management, attendance tracking, and payroll (nómina) for the Sarui pilates studio. The backend service layer and route logic are generally sound, but there are pervasive API contract mismatches between the API and the frontend that will cause runtime failures across the entire module. None of the staff CRUD, attendance grid, or payroll adjustment flows will work correctly as implemented. Five critical blockers must be fixed before this code ships.

---

## Critical Issues

### CR-01: Field name mismatch — API schema expects `firstName`/`lastName`, frontend sends `nombre`/`apellido`

**File:** `apps/api/src/routes/personal.routes.ts:21-22` / `apps/web/src/hooks/usePersonal.ts:135-136`

**Issue:** The API's `staffSchema` (POST and PATCH `/personal/staff`) requires `firstName` and `lastName`. The frontend hook `useCrearStaff` and `useEditarStaff` send `nombre` and `apellido`. Zod's `staffSchema.safeParse` will strip the unknown fields (or fail if using `.strict()`), so `firstName` and `lastName` arrive as `undefined`. Prisma's `StaffProfile.create` will throw a required-field error or silently create records with empty names. Every create/edit of a staff member fails.

**Fix:**
```typescript
// Option A — align the API schema to the frontend naming (recommended, consistent with Spanish UI):
const staffSchema = z.object({
  userId: z.string().min(1),
  nombre: z.string().trim().min(1),     // was firstName
  apellido: z.string().trim().min(1),   // was lastName
  ...
});
// then map to DB fields:
prisma.staffProfile.create({ data: { firstName: nombre, lastName: apellido, ... } })

// Option B — align the frontend to the API:
// useCrearStaff mutationFn sends { firstName: data.nombre, lastName: data.apellido, ... }
```

---

### CR-02: Field name mismatch — GET `/personal/staff` returns `firstName`/`lastName` but frontend type expects `nombre`/`apellido`

**File:** `apps/api/src/routes/personal.routes.ts:107-116` / `apps/web/src/hooks/usePersonal.ts:14-15`

**Issue:** Prisma returns `StaffProfile` rows with `firstName` and `lastName` fields. The frontend `StaffProfile` TypeScript type declares `nombre` and `apellido`. Every usage of `s.nombre`, `s.apellido` in `TabPersonal.tsx` (lines 185, 186, 597, 600) and `TabAsistencia.tsx` (lines 172, 173, 177) will evaluate to `undefined`. Avatar initials, names in tables, and the edit form pre-fill will all be blank. `s.nombre[0]` will throw `TypeError: Cannot read properties of undefined` at runtime.

**Fix:** Either transform the API response or rename the DB→response fields. The cleanest approach is a response mapper in the GET handler:
```typescript
// In personal.routes.ts GET /staff handler, map the result:
const mapped = items.map(s => ({
  ...s,
  nombre: s.firstName,
  apellido: s.lastName,
}));
ApiSuccess(res, mapped);
```
Apply the same mapping to all staff-returning endpoints (POST, PATCH, and the asistencia admin endpoint).

---

### CR-03: Attendance admin PATCH — hook sends `staffId` (StaffProfile.id), API schema requires `userId` (User.id)

**File:** `apps/api/src/routes/asistencia.routes.ts:18-23` / `apps/web/src/hooks/usePersonal.ts:189` / `apps/web/src/app/(dashboard)/personal/_components/TabAsistencia.tsx:217`

**Issue:** `adminMarcarSchema` expects the body field `userId` (a `User.id` / cuid). `useMarcarAsistenciaAdmin` sends `{ staffId, fecha, presente }` where `staffId` is `row.staff.id` — the `StaffProfile.id`, not the `User.id`. Zod strips `staffId` as an unknown key. `userId` is missing → validation fails → every admin checkbox toggle returns `400 VALIDATION_ERROR`. No attendance can be recorded by admin.

**Fix:**
```typescript
// Option A — rename the API field to staffId and look up the userId:
// In adminMarcarSchema: staffId: z.string().min(1)
// In handler: const staff = await prisma.staffProfile.findUnique({ where: { id: staffId } })
//             use staff.userId for the upsert

// Option B — pass the userId from the frontend:
// In TabAsistencia, pass row.staff.userId instead of row.staff.id
// and rename the hook param to userId
```

---

### CR-04: GET `/personal/asistencia/admin` returns `{ staff, asistencias }` flat object; hook casts it as `AsistenciaSemana[]`

**File:** `apps/api/src/routes/asistencia.routes.ts:146` / `apps/web/src/hooks/usePersonal.ts:78-89`

**Issue:** The API responds with `{ staff: StaffProfile[], asistencias: AsistenciaPersonal[] }` — two separate flat arrays. The hook declares `useQuery<AsistenciaSemana[]>` and returns `res.data.data` directly. `AsistenciaSemana` is `{ staff: StaffProfile, dias: AsistenciaDia[] }[]` — a grouped, per-employee structure. The shapes are completely different. `TabAsistencia` then iterates `asistencias.map(row => row.staff...)` on what is actually a plain object, causing `asistencias.map is not a function` crash, or if `res.data.data` is the object, iterating its keys instead of staff rows. The entire attendance grid will not render.

**Fix:** Either (a) restructure the API to return pre-grouped data:
```typescript
// In asistencia.routes.ts GET /admin:
const result = staff.map(s => ({
  staff: s,
  dias: asistencias
    .filter(a => a.userId === s.userId)
    .map(a => ({
      fecha: a.fecha.toISOString(),
      presente: a.presente,
      staffId: s.id,
    })),
}));
ApiSuccess(res, result);
```
Or (b) keep the flat response and restructure in the hook's `queryFn`.

---

### CR-05: `ajusteSchema` requires both `deducciones` AND `netoAPagar`; UI sends only one field at a time

**File:** `apps/api/src/routes/nomina.routes.ts:17-20` / `apps/web/src/app/(dashboard)/personal/_components/TabNomina.tsx:293-296`

**Issue:** The Zod schema is:
```typescript
const ajusteSchema = z.object({
  deducciones: z.coerce.number().min(0),
  netoAPagar: z.coerce.number().min(0),
});
```
Both fields are required (no `.optional()`). `handleAjuste` sends only `{ deducciones: num }` or `{ netoAPagar: num }` depending on which input was changed. When `deducciones` is edited, the request body has no `netoAPagar` → `z.coerce.number()` coerces `undefined` to `NaN`, which fails `.min(0)` → `400 VALIDATION_ERROR`. No adjustment can be saved from the UI.

Note: the intentional design (deducciones preserved on recalculate, neto editable independently) is correct, but the schema must allow partial updates:
```typescript
const ajusteSchema = z.object({
  deducciones: z.coerce.number().min(0).optional(),
  netoAPagar: z.coerce.number().min(0).optional(),
}).refine(data => data.deducciones !== undefined || data.netoAPagar !== undefined, {
  message: 'Al menos un campo es requerido',
});
```

---

## Warnings

### WR-01: `calcularDetallesPeriodo` does not delete stale rows before recalculating — deactivated staff remain in nómina

**File:** `apps/api/src/services/nomina.service.ts:52-97`

**Issue:** `calcularDetallesPeriodo` uses `upsert` to create/update `NominaDetalle` rows for currently active staff. If a staff member was active when the period was created, then deactivated before recalculation, their existing row is never deleted — it stays in the period with stale salary data. The `recalcular` endpoint would leave ghost rows for departed employees.

**Fix:** Delete all existing rows for the period before re-inserting:
```typescript
// At the start of calcularDetallesPeriodo:
await tx.nominaDetalle.deleteMany({ where: { periodoId } });
// Then use create instead of upsert
```

---

### WR-02: `NominaDetalle.gastoId` lacks an ORM-level foreign key relation to `Gasto`

**File:** `apps/api/prisma/schema.prisma:801`

**Issue:** `gastoId String? @unique` is declared as a bare string with no `@relation` to `Gasto`. This means Prisma will not enforce referential integrity, will not cascade deletes, and will not generate a typed relation field. If a `Gasto` record is ever deleted, the orphaned `gastoId` silently points to nothing. Also prevents Prisma `include: { gasto: true }` on `NominaDetalle`.

**Fix:**
```prisma
model NominaDetalle {
  ...
  gastoId  String? @unique

  gasto    Gasto?  @relation(fields: [gastoId], references: [id])
}

model Gasto {
  ...
  nominaDetalle NominaDetalle?
}
```

---

### WR-03: Trash button in `PeriodoCard` (BORRADOR) renders with no `onClick` handler — silent dead UI

**File:** `apps/web/src/app/(dashboard)/personal/_components/TabNomina.tsx:414-416`

**Issue:**
```tsx
<Button variant="ghost" size="sm" className="text-muted-foreground">
  <Trash2 className="w-4 h-4" />
</Button>
```
The delete button for BORRADOR periods has no `onClick`. Clicking it does nothing. There is no `useEliminarPeriodo` hook, no API endpoint for deleting a period, and no dialog. This is dead UI that misleads the admin into thinking they can delete a draft period.

**Fix:** Either implement delete (add endpoint + hook + confirm dialog), or remove the button entirely until the feature is built.

---

### WR-04: `useAsistenciaSemana` called unconditionally for `RECEPCIONISTA` users who lack access to GET `/admin`

**File:** `apps/web/src/app/(dashboard)/personal/_components/TabAsistencia.tsx:40` / `apps/api/src/routes/asistencia.routes.ts:111`

**Issue:** `GET /personal/asistencia/admin` requires `ADMIN` or `INSTRUCTOR` role. `TabAsistencia` calls `useAsistenciaSemana` for every user who lands on the tab, including `RECEPCIONISTA`. That user gets a 403, `isLoading` goes false, `asistencias` is undefined, and the tab shows "No hay empleados activos" — misleading. The RECEPCIONISTA can see their own attendance via `GET /mi-semana`, not the admin grid.

**Fix:** Add a role guard before the query or use the `enabled` option:
```typescript
const isAdmin = user?.role === "ADMIN" || user?.role === "INSTRUCTOR";
const { data: asistencias, isLoading } = useAsistenciaSemana(semanaInicioStr);
// Separate hook for self-attendance when !isAdmin
```
Also note: role strings compared in `TabAsistencia` are lowercase (`"admin"`, `"instructor"`) while the DB enum is uppercase (`ADMIN`, `INSTRUCTOR`). Confirm what `useAuth` returns — if it returns the DB enum values, the `isAdmin` check on line 30 will always be false.

---

### WR-05: `new Date(fechaStr)` without explicit UTC parsing — timezone-sensitive date shift

**File:** `apps/api/src/routes/asistencia.routes.ts:166` / `apps/api/src/routes/nomina.routes.ts:53-54`

**Issue:** `new Date("2025-07-01")` is parsed as UTC midnight by the V8 JS engine. Then `fecha.setHours(0, 0, 0, 0)` sets the local server time. On a server whose TZ is not UTC (e.g., `America/Mexico_City`, UTC-6), this shifts the date: UTC midnight minus 6 hours = previous day 18:00 UTC, then `setHours(0,0,0,0)` sets local 00:00 = `2025-06-30T06:00:00Z` stored in MySQL. Attendance queries using `gte`/`lte` against that stored date will miss records on edge days.

**Fix:** Use explicit UTC-based date construction:
```typescript
// Replace: new Date(fechaStr); fecha.setHours(0,0,0,0);
// With:
const [y, m, d] = fechaStr.split('-').map(Number);
const fecha = new Date(Date.UTC(y, m - 1, d));
// For end of day: new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999));
```

---

## Info

### IN-01: `useEditarPuesto` exported from `usePersonal.ts` but never imported or used in `TabPersonal.tsx`

**File:** `apps/web/src/hooks/usePersonal.ts:112-119`

**Issue:** `useEditarPuesto` is defined and exported but no component imports it. Puestos can be created and deleted, but there is no edit-puesto UI. The export is dead code.

**Fix:** Either add an edit-puesto dialog or remove the hook until the feature is needed.

---

### IN-02: Sidebar active-state logic will activate both "Contabilidad" and "Finanzas" simultaneously

**File:** `apps/web/src/components/layout/Sidebar.tsx:93-94`

**Issue:** `isActive = pathname === href || pathname.startsWith(href + "/")`. When `pathname` is `/contabilidad/finanzas`, both the "Contabilidad" item (`href="/contabilidad"`) and "Finanzas" item (`href="/contabilidad/finanzas"`) match — the first via `startsWith`, the second via `===`. Both render as active (highlighted). This is a cosmetic UX issue but looks like a bug to users.

**Fix:** For parent routes, check that `pathname` doesn't match a more-specific child:
```typescript
const isActive = pathname === href || 
  (pathname.startsWith(href + "/") && !navItems.some(
    other => other.href !== href && pathname.startsWith(other.href)
  ));
```
Or simply list "Finanzas" as a sub-item and use exact matching for "Contabilidad".

---

_Reviewed: 2026-06-29_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
