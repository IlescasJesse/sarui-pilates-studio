# Phase 23: Módulo de Nómina y Personal — Research

**Researched:** 2026-06-28
**Domain:** Gestión de personal, asistencia diaria y nómina semanal con integración contable (Prisma/MySQL + Express + Next.js)
**Confidence:** HIGH — todo verificado directamente contra el código fuente del proyecto

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Puestos y Personal**
- CRUD de puestos con `nombre` + `salarioSemanal` (Decimal)
- Cualquier `User` puede tener `StaffProfile` → extender con `puestoId`, `fechaIngreso`, `activo`
- Admin puede crear nuevo puesto en el mismo flujo de asignación (no requiere pantalla separada)
- Personal incluye: instructores, recepcionistas, admin (todos los roles del sistema)

**Asistencia**
- Modelo checklist diario — campo `presente: Boolean` por empleado por fecha
- El propio empleado se autoregistra desde su perfil
- Restricción temporal: solo puede marcar el día actual (fecha servidor, no cliente)
- Corrección admin: admin puede editar cualquier fecha retroactivamente
- Idempotente: upsert por `(userId, fecha)` — marcar dos veces no duplica

**Cálculo de Nómina**
- Salario fijo semanal sin bonos en v1
- Fórmula: `netoAPagar = (salarioSemanal / 7) * diasTrabajados`
- `diasTrabajados` = count de `AsistenciaPersonal` con `presente=true` en el período
- Sin IMSS/ISR en v1 — campo `deducciones` existe pero default 0
- Admin puede ajustar `deducciones` y `netoAPagar` manualmente antes de aprobar

**Flujo de Aprobación**
- Estados: `BORRADOR → APROBADO → PAGADO`
- Solo ADMIN puede aprobar
- Al aprobar (`APROBADO`): dentro de `$transaction` crear un `Gasto` por cada `NominaDetalle` con:
  - `cuentaCodigo: '602'`, `cuentaNombre: 'Sueldos y salarios'`
  - `concepto: 'Nómina {fechaInicio}–{fechaFin} — {nombre empleado}'`
  - `monto: netoAPagar`

**Roles de Acceso**
- Empleados: solo ven su propio historial de asistencia y recibos de nómina (read-only)
- ADMIN/INSTRUCTOR: pueden ver y marcar asistencia de cualquier empleado
- Solo ADMIN: crear/editar puestos, gestionar personal, aprobar nómina

### Claude's Discretion
- Sin instrucciones explícitas de discreción — todo en Decisions

### Deferred Ideas (OUT OF SCOPE)
- Bonos / comisiones por clases impartidas
- IMSS / ISR automático
- Notificaciones al empleado al aprobar nómina
- Entrada/salida con hora para pago por horas
- Exportar recibo PDF
</user_constraints>

---

## Summary

La fase 23 agrega tres capacidades nuevas sobre la base existente del proyecto: (1) gestión de personal con puestos y salarios, (2) registro de asistencia diaria por empleado, y (3) cálculo y aprobación de nómina semanal integrada al módulo contable. El código base ya tiene los cimientos exactos para esto: `StaffProfile`, `Gasto`, `CuentaContable`, el patrón `autoCreateIngreso` (del que derivaremos `autoCreateGasto`), y el patrón `$transaction` para efectos contables atómicos.

**Alerta importante sobre cuenta contable:** El CONTEXT.md menciona la cuenta `501 Sueldos y Salarios`, pero la cuenta 501 en el seed real es `501 Honorarios de instructores (COSTO)`. La cuenta de sueldos del personal es la **602 — Sueldos y salarios (GASTO)**. El planner debe usar `cuentaCodigo: '602'` para el `autoCreateGasto` de nómina.

La arquitectura de la fase sigue exactamente los patrones existentes: rutas Express con Zod, `requireRole`, `authMiddleware`, `prisma.$transaction`, y páginas Next.js con hooks de TanStack Query. No se necesitan dependencias nuevas de ningún tipo.

**Primary recommendation:** Extender schema Prisma con 4 modelos + 1 enum, un archivo de routes en API, un hook de TanStack Query, y una página `(dashboard)/personal/page.tsx` con tres pestañas (Personal, Asistencia, Nómina).

---

## Project Constraints (from CLAUDE.md)

| Directiva | Fuente |
|-----------|--------|
| Do what has been asked; nothing more, nothing less | CLAUDE.md |
| NEVER create files unless absolutely necessary — prefer editing existing files | CLAUDE.md |
| ALWAYS read a file before editing it | CLAUDE.md |
| ALWAYS run tests after code changes (`npm run build && npm test`) | CLAUDE.md |
| VERIFY build succeeds before committing | CLAUDE.md |
| Keep files under 500 lines | CLAUDE.md |
| Validate input at system boundaries | CLAUDE.md |
| Código en inglés. Docs en español. | .claude/CLAUDE.md |
| No usar MCP ni Vercel CLI | CLAUDE.md global |

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| CRUD de puestos | API / Backend | — | Solo ADMIN, lógica de negocio en el servidor |
| Extensión StaffProfile | DB / Prisma migration | API | Requiere migración + nuevos campos |
| Registro de asistencia | API / Backend | Browser (autoregistro) | Validación de fecha en servidor; cliente solo envía |
| Edición retroactiva admin | API / Backend | — | requireRole ADMIN protege el endpoint |
| Cálculo de nómina (período) | API / Backend | — | Agrega asistencias + aplica fórmula en servidor |
| Aprobación + efecto contable | API / Backend ($transaction) | — | Debe ser atómico; idéntico al patrón chargeWalkIn |
| Marcado estado PAGADO | API / Backend | — | Transición de estado simple, solo ADMIN |
| UI gestión de personal | Frontend (dashboard) | — | Página admin `(dashboard)/personal/` |
| UI checklist asistencia | Frontend (dashboard) | — | Sub-tab en la misma página admin |
| UI panel nómina | Frontend (dashboard) | — | Sub-tab en la misma página admin |
| Vista empleado (historial) | Frontend (dashboard) | — | Ruta /perfil o sub-ruta /personal/mi-nomina |

---

## Standard Stack

### Core (ya en el proyecto — sin instalar nada)

| Library | Version | Purpose | Confirmed |
|---------|---------|---------|-----------|
| Prisma | ^6.7.0 | ORM + migraciones MySQL | [VERIFIED: apps/api/package.json] |
| Express | ^5.0.0 | Router API | [VERIFIED: apps/api/package.json] |
| Zod | ^3.23.8 | Validación de inputs en rutas | [VERIFIED: apps/api/package.json] |
| @tanstack/react-query | 5.56.x | Server state + cache en frontend | [VERIFIED: .planning/codebase/STACK.md] |
| react-hook-form + @hookform/resolvers | 7.53.x + 3.9.x | Formularios con Zod | [VERIFIED: .planning/codebase/STACK.md] |
| date-fns | 3.6.x | Cálculo de rangos semanales | [VERIFIED: .planning/codebase/STACK.md] |
| sonner | 2.x | Toast notifications | [VERIFIED: .planning/codebase/STACK.md] |
| lucide-react | 0.436.x | Iconos | [VERIFIED: .planning/codebase/STACK.md] |

**No se necesita instalar ningún paquete nuevo.** Todos los requisitos de la fase están cubiertos por dependencias ya presentes.

### Package Legitimacy Audit

No aplica — esta fase no instala paquetes nuevos. [VERIFIED: análisis del scope]

---

## Architecture Patterns

### System Architecture Diagram

```
Employee Browser                Admin Browser
      │                               │
  POST /asistencia               POST /admin/personal
  (fecha = today, servidor)      CRUD puestos + staff
      │                               │
      ▼                               ▼
┌─────────────────────────────────────────────┐
│  Express API  /api/v1                       │
│                                             │
│  authMiddleware → requireRole(...)          │
│                                             │
│  /personal/puestos        → ADMIN only      │
│  /personal/staff          → ADMIN only      │
│  /personal/asistencia     → ADMIN write     │
│  /personal/asistencia/hoy → any staff       │
│  /personal/nomina         → ADMIN only      │
│  /personal/nomina/aprobar → ADMIN + $tx     │
│  /personal/mi-nomina      → own user        │
└──────────┬──────────────────────────────────┘
           │
           ▼
    Prisma $transaction
    ┌────────────────────────────┐
    │  1. PeriodoNomina update   │
    │     estado → APROBADO      │
    │  2. NominaDetalle[]        │
    │  3. autoCreateGasto()      │  ← patrón de membership.service.ts
    │     CuentaContable upsert  │    cuentaCodigo: '602'
    │     Gasto.create() × N     │
    └────────────────────────────┘
           │
           ▼
      MySQL (Prisma)
      puestos / staff_profiles / asistencia_personal
      periodos_nomina / nomina_detalles / gastos
```

### Recommended Project Structure

```
apps/api/src/
├── routes/
│   └── personal.routes.ts       # nuevo — todas las sub-rutas de nómina/personal
├── services/
│   └── nomina.service.ts        # nuevo — autoCreateGasto, calcularPeriodo
├── workers/                     # no se toca en esta fase
├── prisma/
│   └── migrations/
│       └── 20260628000000_add_nomina/   # nueva migración

apps/web/src/
├── app/(dashboard)/
│   └── personal/
│       └── page.tsx             # nueva página con 3 tabs
├── hooks/
│   └── usePersonal.ts           # nuevo hook — puestos + staff + asistencia + nómina
```

### Pattern 1: autoCreateGasto (derivado de autoCreateIngreso)

El servicio `membership.service.ts` exporta `autoCreateIngreso`. La nómina necesita `autoCreateGasto` con la misma firma pero creando `Gasto` en lugar de `Ingreso`. Crear en `apps/api/src/services/nomina.service.ts`:

```typescript
// Source: apps/api/src/services/membership.service.ts (patrón existente)
export async function autoCreateGasto(
  tx: Prisma.TransactionClient,
  params: {
    monto: number;
    concepto: string;
    fecha: Date;
    cuentaCodigo: string;     // '602'
    cuentaNombre: string;     // 'Sueldos y salarios'
    creadoPorId: string;
  }
): Promise<string> {         // devuelve gastoId
  const cuenta = await tx.cuentaContable.upsert({
    where: { codigo: params.cuentaCodigo },
    create: { codigo: params.cuentaCodigo, nombre: params.cuentaNombre, tipo: 'GASTO' },
    update: {},
  });
  const gasto = await tx.gasto.create({
    data: {
      cuentaContableId: cuenta.id,
      concepto: params.concepto,
      monto: params.monto,
      fecha: params.fecha,
      creadoPorId: params.creadoPorId,
    },
  });
  return gasto.id;
}
```

### Pattern 2: Ruta de aprobación con $transaction

```typescript
// Source: patrón de apps/api/src/routes/reservaciones.routes.ts
router.post(
  '/nomina/periodos/:id/aprobar',
  requireRole('ADMIN'),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const periodo = await prisma.periodoNomina.findUnique({
        where: { id },
        include: { detalles: { include: { user: { include: { staffProfile: true } } } } },
      });
      if (!periodo) return ApiError(res, 'NOT_FOUND', 'Período no encontrado', 404);
      if (periodo.estado !== 'BORRADOR')
        return ApiError(res, 'INVALID_STATUS', 'Solo se pueden aprobar períodos en BORRADOR', 400);

      const result = await prisma.$transaction(async (tx) => {
        const updated = await tx.periodoNomina.update({
          where: { id },
          data: { estado: 'APROBADO' },
        });
        for (const detalle of periodo.detalles) {
          const nombre = `${detalle.user.staffProfile?.firstName} ${detalle.user.staffProfile?.lastName}`;
          const fechaLabel = `${periodo.fechaInicio.toISOString().slice(0,10)}–${periodo.fechaFin.toISOString().slice(0,10)}`;
          const gastoId = await autoCreateGasto(tx, {
            monto: Number(detalle.netoAPagar),
            concepto: `Nómina ${fechaLabel} — ${nombre}`,
            fecha: periodo.fechaFin,
            cuentaCodigo: '602',
            cuentaNombre: 'Sueldos y salarios',
            creadoPorId: req.user!.id,
          });
          await tx.nominaDetalle.update({
            where: { id: detalle.id },
            data: { gastoId },
          });
        }
        return updated;
      });
      ApiSuccess(res, result);
    } catch (error) { next(error); }
  }
);
```

### Pattern 3: Autoregistro de asistencia (validación fecha servidor)

```typescript
// Empleado solo puede marcar HOY — la fecha viene del servidor, no del body
router.post('/asistencia', authMiddleware, async (req, res, next) => {
  try {
    const { presente, observaciones } = req.body as { presente?: boolean; observaciones?: string };
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);   // date only, timezone México

    const registro = await prisma.asistenciaPersonal.upsert({
      where: { userId_fecha: { userId: req.user!.id, fecha: hoy } },
      create: { userId: req.user!.id, fecha: hoy, presente: presente ?? true, observaciones },
      update: { presente: presente ?? true, observaciones },
    });
    ApiSuccess(res, registro);
  } catch (error) { next(error); }
});
```

### Pattern 4: Hook TanStack Query (convención existente)

```typescript
// Source: apps/web/src/hooks/useContabilidad.ts (patrón existente)
// Archivo nuevo: apps/web/src/hooks/usePersonal.ts

export function usePuestos() {
  return useQuery<Puesto[]>({
    queryKey: ['personal-puestos'],
    queryFn: async () => {
      const res = await apiClient.get('/personal/puestos');
      return res.data.data;
    },
  });
}

export function useAprobarNomina() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (periodoId: string) =>
      apiClient.post(`/personal/nomina/periodos/${periodoId}/aprobar`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['personal-nomina'] });
      qc.invalidateQueries({ queryKey: ['contabilidad-gastos'] }); // invalida vista contable también
    },
  });
}
```

### Anti-Patterns to Avoid

- **Calcular `netoAPagar` en el cliente:** La fórmula debe calcularse en el servidor al crear/recalcular el período — el cliente solo envía ajustes manuales de `deducciones`/`netoAPagar`.
- **Usar la cuenta 501 para sueldos:** La cuenta 501 es "Honorarios de instructores (COSTO)". La cuenta correcta para el personal en nómina es **602 — Sueldos y salarios (GASTO)**.
- **Fecha de asistencia desde el cliente:** Siempre derivar `fecha = new Date()` en el servidor al auto-registrar; si el cliente pasa la fecha, ignorarla (solo admin puede especificar fecha).
- **Aprobar un período ya aprobado:** Validar `estado === 'BORRADOR'` antes de la transacción — idéntico al patrón de `PENDING_APPROVAL` en reservaciones.
- **Olvidar `gastoId` en NominaDetalle:** La foreign key `gastoId` en `NominaDetalle` es la única forma de rastrear qué Gasto corresponde a cada línea de nómina — actualizar dentro de la misma transacción.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Transacción atómica nómina+gastos | Múltiples awaits separados | `prisma.$transaction` | Rollback automático si falla cualquier Gasto |
| Upsert cuenta contable | Buscar y crear por separado | `tx.cuentaContable.upsert` | Patrón establecido en `autoCreateIngreso` |
| Upsert asistencia | Check + insert/update manual | `prisma.asistenciaPersonal.upsert` | La constraint `@@unique([userId, fecha])` garantiza idempotencia |
| Validación de inputs | Checks manuales en routes | Zod `.safeParse()` | Convención de todo el proyecto |
| Roles de acceso | Lógica manual `req.user.role` | `requireRole('ADMIN')` middleware | Middleware existente, un call |
| Formato de fecha semana | Aritmética manual | `date-fns` `startOfWeek`/`endOfWeek` | Ya en el proyecto |

**Key insight:** Esta fase es casi totalmente una replicación de patrones existentes — `autoCreateIngreso` → `autoCreateGasto`, `$transaction` de reservaciones → `$transaction` de aprobación, CRUD de inventario → CRUD de puestos.

---

## Critical Discoveries

### 1. Cuenta contable correcta para sueldos

El CONTEXT.md menciona "cuenta 501 Sueldos" pero al verificar `seed-cuentas.ts`:
- `501` = "Honorarios de instructores" tipo **COSTO** [VERIFIED: apps/api/src/database/seed-cuentas.ts línea 28]
- `602` = "Sueldos y salarios" tipo **GASTO** [VERIFIED: apps/api/src/database/seed-cuentas.ts línea 33]

**El planner debe usar `cuentaCodigo: '602'`** en `autoCreateGasto`.

### 2. Role enum incluye RECEPCIONISTA

El schema actual tiene 4 roles: `ADMIN | INSTRUCTOR | RECEPCIONISTA | CLIENT` [VERIFIED: schema.prisma línea 19-24]. El CONTEXT.md dice "todos los roles excepto CLIENT pueden tener StaffProfile". Los middlewares de rutas de empleado deben aceptar `requireRole('ADMIN', 'INSTRUCTOR', 'RECEPCIONISTA')`.

### 3. StaffProfile no tiene campos de nómina

El modelo `StaffProfile` actual tiene: `id, userId, firstName, lastName, phone, avatarUrl, createdAt, updatedAt` [VERIFIED: schema.prisma línea 548-563]. Faltan: `puestoId`, `fechaIngreso`, `activo`. La migración es necesaria.

### 4. Ruta de registro en index.ts

Las nuevas rutas se montan como `router.use('/personal', personalRoutes)` en `apps/api/src/routes/index.ts`. Revisar el archivo antes de editar. [VERIFIED: apps/api/src/routes/index.ts]

### 5. Patrón de validación inline en rutas con doble middleware

`inventario.routes.ts` aplica `router.use(authMiddleware)` y `router.use(requireRole('ADMIN'))` al inicio del archivo para proteger todas las rutas del módulo [VERIFIED: apps/api/src/routes/inventario.routes.ts líneas 9-10]. Las rutas de nómina admin deben seguir el mismo patrón en el archivo `personal.routes.ts`, pero las rutas de empleado (`/asistencia`, `/mi-nomina`) deben estar en el mismo archivo con `requireRole` por-ruta.

### 6. Sin sistema de tests configurado

El proyecto no tiene Vitest ni Jest configurado [VERIFIED: .planning/codebase/TESTING.md]. La única verificación post-implementación es `npm run build`. El planner debe incluir un paso de build check al final de cada wave.

---

## Common Pitfalls

### Pitfall 1: Usar fecha del cliente para autoregistro de asistencia
**What goes wrong:** Si se acepta la fecha del body, un empleado puede antedatar asistencias.
**Why it happens:** Olvido de que la restricción es explícita en el CONTEXT.md.
**How to avoid:** En el endpoint de autoregistro, siempre `const fecha = new Date(); fecha.setHours(0,0,0,0)` server-side. Admin usa un endpoint diferente (`PATCH /admin/asistencia`) que acepta `fecha` en el body.
**Warning signs:** Body con campo `fecha` en el endpoint del empleado.

### Pitfall 2: Cuenta contable 501 vs 602
**What goes wrong:** Los gastos de nómina se registran en "Honorarios de instructores" en lugar de "Sueldos y salarios".
**Why it happens:** El CONTEXT.md original dice "501 Sueldos" — error de referencia, el seed tiene 602.
**How to avoid:** Usar `cuentaCodigo: '602'` en `autoCreateGasto`. El upsert de `CuentaContable` lo creará si no existe, pero en producción ya existe el 602.

### Pitfall 3: Doble aprobación de nómina
**What goes wrong:** Se crean gastos duplicados si se llama /aprobar dos veces.
**Why it happens:** Sin validación de estado antes de la transacción.
**How to avoid:** Verificar `periodo.estado === 'BORRADOR'` antes de iniciar `$transaction`. Retornar 400 si ya es APROBADO o PAGADO.

### Pitfall 4: diasTrabajados calculado mal
**What goes wrong:** El campo `diasTrabajados` en NominaDetalle no coincide con los registros reales de AsistenciaPersonal.
**Why it happens:** Se almacena en NominaDetalle al crear el período — si se agregan asistencias después, el detalle queda desactualizado.
**How to avoid:** La creación del período debe re-calcular desde la tabla `asistencia_personal` (count donde `presente=true` y fecha dentro del rango). Endpoint `POST /admin/nomina/periodos` recalcula al generar. Si admin marca asistencias retroactivas antes de aprobar, ofrecer endpoint de recálculo.

### Pitfall 5: staffProfile nulo al formatear nombre en concepto de Gasto
**What goes wrong:** `null` reference error al construir el concepto `Nómina ... — ${nombre}`.
**Why it happens:** `user.staffProfile` puede ser null si el user no tiene perfil completo.
**How to avoid:** Usar fallback: `const nombre = staffProfile ? \`${staffProfile.firstName} ${staffProfile.lastName}\` : user.email`.

---

## Code Examples

### Modelos Prisma a agregar al schema

```prisma
// Source: apps/api/prisma/schema.prisma (extensión)

model Puesto {
  id             String        @id @default(cuid())
  nombre         String        @unique
  salarioSemanal Decimal       @db.Decimal(10, 2)
  activo         Boolean       @default(true)
  createdAt      DateTime      @default(now())
  staffProfiles  StaffProfile[]
  @@map("puestos")
}

model AsistenciaPersonal {
  id            String   @id @default(cuid())
  userId        String
  fecha         DateTime @db.Date
  presente      Boolean  @default(true)
  observaciones String?
  creadoEn      DateTime @default(now())
  user          User     @relation(fields: [userId], references: [id])
  @@unique([userId, fecha])
  @@index([userId])
  @@index([fecha])
  @@map("asistencia_personal")
}

model PeriodoNomina {
  id          String          @id @default(cuid())
  fechaInicio DateTime        @db.Date
  fechaFin    DateTime        @db.Date
  estado      EstadoNomina    @default(BORRADOR)
  creadoPorId String
  creadoEn    DateTime        @default(now())
  creadoPor   User            @relation(fields: [creadoPorId], references: [id])
  detalles    NominaDetalle[]
  @@index([estado])
  @@map("periodos_nomina")
}

model NominaDetalle {
  id             String        @id @default(cuid())
  periodoId      String
  userId         String
  diasTrabajados Int
  salarioBruto   Decimal       @db.Decimal(10, 2)
  deducciones    Decimal       @db.Decimal(10, 2) @default(0)
  netoAPagar     Decimal       @db.Decimal(10, 2)
  gastoId        String?       @unique
  periodo        PeriodoNomina @relation(fields: [periodoId], references: [id])
  user           User          @relation(fields: [userId], references: [id])
  @@unique([periodoId, userId])
  @@map("nomina_detalles")
}

enum EstadoNomina {
  BORRADOR
  APROBADO
  PAGADO
}
```

### Extensión de StaffProfile

```prisma
// Agregar a StaffProfile existente:
model StaffProfile {
  // ...campos existentes...
  puestoId    String?
  fechaIngreso DateTime? @db.Date
  activo      Boolean   @default(true)

  puesto Puesto? @relation(fields: [puestoId], references: [id])
  nominaDetalles NominaDetalle[]
}
```

### Extensión de User (relaciones nuevas)

```prisma
// Agregar al model User:
asistencias    AsistenciaPersonal[]
periodosNomina PeriodoNomina[]
nominaDetalles NominaDetalle[]
```

### Creación de período (endpoint POST /admin/nomina/periodos)

```typescript
// Source: patrón inventario.routes.ts + nomina.service.ts (nuevo)
const periodoSchema = z.object({
  fechaInicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  fechaFin: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

router.post('/nomina/periodos', requireRole('ADMIN'), async (req, res, next) => {
  try {
    const parse = periodoSchema.safeParse(req.body);
    if (!parse.success) { ApiError(res, 'VALIDATION_ERROR', 'Datos inválidos', 400); return; }
    const { fechaInicio, fechaFin } = parse.data;
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);

    // Obtener todos los staff activos con puesto asignado
    const staffList = await prisma.staffProfile.findMany({
      where: { activo: true, puestoId: { not: null } },
      include: { user: true, puesto: true },
    });

    const periodo = await prisma.$transaction(async (tx) => {
      const p = await tx.periodoNomina.create({
        data: { fechaInicio: inicio, fechaFin: fin, creadoPorId: req.user!.id },
      });
      for (const staff of staffList) {
        const dias = await tx.asistenciaPersonal.count({
          where: { userId: staff.userId, presente: true, fecha: { gte: inicio, lte: fin } },
        });
        const bruto = Number(staff.puesto!.salarioSemanal);
        const neto = (bruto / 7) * dias;
        await tx.nominaDetalle.create({
          data: {
            periodoId: p.id,
            userId: staff.userId,
            diasTrabajados: dias,
            salarioBruto: bruto,
            deducciones: 0,
            netoAPagar: neto,
          },
        });
      }
      return p;
    });
    ApiSuccess(res, periodo, 201);
  } catch (error) { next(error); }
});
```

---

## Validation Architecture

### Test Framework

No hay framework de tests configurado en el proyecto. [VERIFIED: .planning/codebase/TESTING.md]

| Property | Value |
|----------|-------|
| Framework | Ninguno instalado |
| Config file | No existe |
| Quick run command | `npm run build` (único gate disponible) |
| Full suite command | `npm run build` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | Notes |
|--------|----------|-----------|-------------------|-------|
| REQ-1 | CRUD puestos | manual | `npm run build` | Sin framework de tests |
| REQ-2 | StaffProfile extendido con puestoId | manual | `npm run build` | Validar migration |
| REQ-3 | AsistenciaPersonal upsert idempotente | manual | `npm run build` | Probar doble POST |
| REQ-4 | PeriodoNomina estados | manual | `npm run build` | — |
| REQ-5 | NominaDetalle calculado correctamente | manual | `npm run build` | — |
| REQ-6 | Aprobar crea Gasto en cuenta 602 | manual | `npm run build` | Verificar en BD |
| REQ-7 | Vista admin personal | manual | visual | — |
| REQ-8 | Vista admin asistencia checklist | manual | visual | — |
| REQ-9 | Vista admin panel nómina | manual | visual | — |

### Wave 0 Gaps

- [ ] No se requiere setup de testing — convención del proyecto es zero tests

---

## Security Domain

`security_enforcement: true`, `security_asvs_level: 1` — aplica.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | `authMiddleware` existente (JWT) |
| V3 Session Management | no | Sin cambios a sesiones |
| V4 Access Control | yes | `requireRole('ADMIN')` por ruta — CRÍTICO: asistencia del empleado solo puede ver/editar la suya propia |
| V5 Input Validation | yes | Zod en todos los endpoints nuevos |
| V6 Cryptography | no | Sin campos de contraseña o datos sensibles nuevos |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Empleado que modifica asistencia de otro | Spoofing / Tampering | Endpoint de autoregistro usa `req.user!.id` server-side — no acepta `userId` del body |
| Doble aprobación de nómina | Tampering | Validar `estado === 'BORRADOR'` antes de transacción; retornar 400 si ya procesado |
| Acceso a historial de otro empleado | Information Disclosure | `GET /personal/mi-nomina` filtra por `req.user!.id`; admin usa endpoint diferente |
| Inyección en concepto de Gasto | Tampering | El concepto se construye server-side desde datos de BD — no se usa input del cliente en el concepto |

---

## Environment Availability

Fase puramente de código — no requiere herramientas externas nuevas. MySQL ya corriendo (usado por todas las fases anteriores).

| Dependency | Required By | Available | Notes |
|------------|------------|-----------|-------|
| MySQL | Prisma migrations | Se asume ✓ | Requerido por todas las fases anteriores |
| Node.js / npm | Build | Se asume ✓ | — |

---

## Open Questions

1. **¿Quién puede ver la lista de personal completa (GET /admin/personal)?**
   - Lo que sabemos: ADMIN crea/edita puestos y aprueba nómina. INSTRUCTOR puede marcar asistencia de cualquier empleado.
   - Lo que no está claro: ¿Puede INSTRUCTOR ver el listado completo de staff con salarios?
   - Recomendación: Restringir la vista de salarios a ADMIN únicamente. La ruta de asistencia por semana puede abrirse a INSTRUCTOR pero sin exponer `salarioSemanal`.

2. **¿Recálculo automático de `NominaDetalle` si se agregan asistencias después de crear el período?**
   - Lo que sabemos: El período se crea en BORRADOR y solo se aprueba cuando el admin está listo.
   - Lo que no está claro: ¿Necesita un botón "Recalcular" en el panel de nómina?
   - Recomendación: Incluir endpoint `POST /admin/nomina/periodos/:id/recalcular` que re-cuenta asistencias y actualiza detalles (solo si `estado === 'BORRADOR'`).

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| Nómina manual en hoja de cálculo | Módulo integrado en la app | Elimina error humano y vincula directo a contabilidad |

**No hay cambios de paradigma tecnológico en esta fase** — es extensión directa de patrones establecidos.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `mysql` corriendo en el entorno de desarrollo para la migración | Environment Availability | La migración falla — requerirá setup manual |

**Todas las demás afirmaciones son VERIFIED o CITED desde el código fuente del proyecto.**

---

## Sources

### Primary (HIGH confidence — código fuente verificado)

- `apps/api/prisma/schema.prisma` — modelos existentes, enum Role, relaciones StaffProfile/User/Gasto
- `apps/api/src/database/seed-cuentas.ts` — catálogo de cuentas contables (cuenta 501 vs 602)
- `apps/api/src/services/membership.service.ts` — patrón autoCreateIngreso/autoCreateGasto, $transaction
- `apps/api/src/routes/reservaciones.routes.ts` — patrón $transaction con efectos contables, requireRole
- `apps/api/src/routes/inventario.routes.ts` — patrón CRUD admin con router.use(requireRole('ADMIN'))
- `apps/api/src/routes/index.ts` — montaje de rutas, prefijos
- `apps/api/src/middlewares/auth.middleware.ts` — authMiddleware, req.user
- `apps/api/src/middlewares/role.middleware.ts` — requireRole
- `apps/web/src/hooks/useContabilidad.ts` — patrón useQuery/useMutation, queryKey naming
- `apps/web/src/components/layout/Sidebar.tsx` — estructura de navegación admin
- `.planning/codebase/CONVENTIONS.md` — naming, response shape, patterns
- `.planning/codebase/TESTING.md` — zero tests, solo build check
- `.planning/codebase/STACK.md` — versiones verificadas de dependencias

### Secondary (MEDIUM confidence)

- `.planning/phases/23-nomina-personal/23-CONTEXT.md` — decisiones de diseño del usuario

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — todo verificado en package.json y código fuente
- Arquitectura de patrones: HIGH — derivada directamente de inventario.routes.ts y membership.service.ts
- Cuenta contable correcta: HIGH — verificada en seed-cuentas.ts (602, no 501)
- Pitfalls: HIGH — derivados del análisis del código existente

**Research date:** 2026-06-28
**Valid until:** 2026-07-28 (stack estable, sin dependencias externas)
