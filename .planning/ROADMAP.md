### Phase 23: Módulo de Nómina y Personal
**Goal**: Gestión de personal, puestos y pago de nómina semanal integrado con contabilidad
**Status**: planned
**Priority**: high
**Plans:** 7/7 plans complete

**Success Criteria:**
1. Modelo `Puesto`: id, nombre, salarioSemanal — CRUD desde admin
2. `StaffProfile` extendido: puestoId, fechaIngreso, activo
3. Modelo `AsistenciaPersonal`: userId, fecha, presente (bool), observaciones
4. Modelo `PeriodoNomina`: fechaInicio, fechaFin, estado (BORRADOR/APROBADO/PAGADO)
5. Modelo `NominaDetalle`: periodoId, userId, diasTrabajados, salarioBruto, deducciones, netoAPagar
6. Al aprobar nómina → auto-crear `Gasto` por empleado (cuenta 602 Sueldos y salarios) dentro de tx
7. Vista admin: gestión de personal con puesto + salario asignado
8. Vista admin: checklist de asistencia semanal por empleado
9. Vista admin: panel de nómina — resumen, ajustes manuales, botón aprobar, historial

**Plans:**
- [x] 23-01-PLAN.md — [BLOCKING] Schema Prisma (4 modelos + enum) + migración DB
- [x] 23-02-PLAN.md — Backend: CRUD Puestos + Personal (StaffProfile)
- [x] 23-03-PLAN.md — Backend: Asistencia (autoregistro server-date + admin retroactivo)
- [x] 23-04-PLAN.md — Backend: Nómina service + aprobación + Gasto cuenta 602
- [x] 23-05-PLAN.md — Frontend: hook + page shell + Tab Personal + Sidebar
- [x] 23-06-PLAN.md — Frontend: Tab Asistencia (checklist semanal autoguardado)
- [x] 23-07-PLAN.md — Frontend: Tab Nómina (panel períodos + ajuste inline + aprobar/pagar)

**Notes:**
- Salario fijo semanal sin bonos en v1
- Personal: instructores + recepcionistas + admin (cualquier User con StaffProfile)
- Crear nuevo puesto desde el mismo form de asignación
- Integración con módulo contable existente (Gasto + CuentaContable cuenta 602 — NO 501; 501 es Honorarios instructores)
