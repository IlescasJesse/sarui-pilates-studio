# Phase 23 Context — Módulo de Nómina y Personal

**Date:** 2026-06-17
**Phase:** 23 — Módulo de Nómina y Personal
**Status:** Context captured — ready for plan-phase

---

## <domain>
Gestión de personal del estudio (instructores, recepcionistas, admin), registro de asistencia semanal y cálculo + aprobación de nómina con integración automática al módulo contable.
</domain>

---

## <decisions>

### Puestos y Personal
- CRUD de puestos con `nombre` + `salarioSemanal` (Decimal)
- Cualquier `User` puede tener `StaffProfile` → extender con `puestoId`, `fechaIngreso`, `activo`
- Admin puede crear nuevo puesto en el mismo flujo de asignación (no requiere pantalla separada)
- Personal incluye: instructores, recepcionistas, admin (todos los roles del sistema)

### Asistencia
- **Modelo:** checklist diario — campo `presente: Boolean` por empleado por fecha (no entrada/salida con hora)
- **¿Quién marca?** El propio empleado se autoregistra desde su perfil
- **Restricción temporal:** solo puede marcar el día actual (fecha servidor, no cliente)
- **Corrección admin:** admin puede editar cualquier fecha retroactivamente
- **Idempotente:** upsert por `(userId, fecha)` — marcar dos veces no duplica

### Cálculo de Nómina
- Salario fijo semanal sin bonos en v1
- Fórmula: `netoAPagar = (salarioSemanal / 7) * diasTrabajados`
- `diasTrabajados` = count de registros `AsistenciaPersonal` con `presente=true` en el período
- Sin IMSS/ISR en v1 — campo `deducciones` existe pero default 0
- Admin puede ajustar `deducciones` y `netoAPagar` manualmente antes de aprobar

### Flujo de Aprobación
- Estados: `BORRADOR → APROBADO → PAGADO`
- Un solo nivel: solo ADMIN puede aprobar
- Al aprobar (`APROBADO`): dentro de una `$transaction` crear un `Gasto` por cada `NominaDetalle` con:
  - `cuentaCodigo: '501'`, `cuentaNombre: 'Sueldos y Salarios'`
  - `concepto: 'Nómina {fechaInicio}–{fechaFin} — {nombre empleado}'`
  - `monto: netoAPagar`
- Sin notificaciones push en v1 (fuera de scope)

### Roles de Acceso
- Empleados: solo ven su propio historial de asistencia y recibos de nómina (read-only)
- ADMIN/INSTRUCTOR: pueden ver y marcar asistencia de cualquier empleado
- Solo ADMIN: crear/editar puestos, gestionar personal, aprobar nómina

</decisions>

---

## <canonical_refs>
- `apps/api/prisma/schema.prisma` — modelos existentes: `User`, `StaffProfile`, `Gasto`, `CuentaContable`, `Instructor`
- `apps/api/src/services/membership.service.ts` — patrón `autoCreateIngreso` → replicar para `autoCreateGasto` en nómina
- `apps/api/src/routes/reservaciones.routes.ts` — patrón `$transaction` con efectos contables
- `.planning/codebase/CONVENTIONS.md` — convenciones de rutas y naming
- `.planning/codebase/INTEGRATIONS.md` — tabla de modelos existentes
</canonical_refs>

---

## <code_context>
### Modelos existentes relevantes
- `StaffProfile` (staff_profiles): `id, userId, firstName, lastName, phone, avatarUrl` — **extender** con `puestoId`, `fechaIngreso`, `activo`
- `Gasto` (gastos): `cuentaContableId, concepto, monto, fecha, origen, creadoPorId` — reutilizar para salida de nómina
- `CuentaContable`: ya existe cuenta 501 Sueldos (creada por seed-cuentas.ts)
- `User.role`: enum existente `ADMIN | INSTRUCTOR | CLIENT` — no agregar nuevos roles

### Nuevos modelos a crear
```prisma
model Puesto {
  id              String        @id @default(cuid())
  nombre          String        @unique
  salarioSemanal  Decimal       @db.Decimal(10, 2)
  activo          Boolean       @default(true)
  createdAt       DateTime      @default(now())
  staffProfiles   StaffProfile[]
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
  @@map("periodos_nomina")
}

model NominaDetalle {
  id              String        @id @default(cuid())
  periodoId       String
  userId          String
  diasTrabajados  Int
  salarioBruto    Decimal       @db.Decimal(10, 2)
  deducciones     Decimal       @db.Decimal(10, 2) @default(0)
  netoAPagar      Decimal       @db.Decimal(10, 2)
  gastoId         String?       @unique
  periodo         PeriodoNomina @relation(fields: [periodoId], references: [id])
  user            User          @relation(fields: [userId], references: [id])
  @@unique([periodoId, userId])
  @@map("nomina_detalles")
}

enum EstadoNomina {
  BORRADOR
  APROBADO
  PAGADO
}
```

### Patrón de ruta API (seguir convenciones existentes)
- `GET/POST /api/v1/admin/puestos`
- `PATCH/DELETE /api/v1/admin/puestos/:id`
- `GET/POST /api/v1/admin/personal` (staff)
- `GET/POST /api/v1/asistencia` (empleado autoregistra)
- `GET /api/v1/admin/asistencia?semana=YYYY-MM-DD` (admin lee)
- `GET/POST /api/v1/admin/nomina/periodos`
- `POST /api/v1/admin/nomina/periodos/:id/aprobar`
- `GET /api/v1/nomina/mi-historial` (empleado)
</code_context>

---

## <deferred_ideas>
- Bonos / comisiones por clases impartidas → fase futura
- IMSS / ISR automático → fase futura
- Notificaciones al empleado al aprobar nómina → fase futura
- Entrada/salida con hora para pago por horas → fase futura
- Exportar recibo PDF → fase futura
</deferred_ideas>
