# Roadmap

## Current Version: v0.3 — Bug Fixes & Help Center

### Phase 1: Debug Asignación de Clases (500)
**Goal**: Eliminar el error 500 al asignar un cliente a una clase tanto en dashboard como en portal
**Status**: ✓ complete
**Priority**: critical
**Requirements**: BUG-01
**Plans**: 1 plan

**Success Criteria:**
1. ✓ Staff puede asignar un cliente a una clase desde el dashboard sin error 500
2. ✓ Cliente puede reservar una clase desde el portal sin error 500
3. ✓ Se identifica la causa raíz del error (enum MERCADO_PAGO faltante + null check + validación de membresía)

**Plans:**
- [x] 01-01-PLAN.md — Fix error 500: agregar MERCADO_PAGO al enum, corregir null checks en dashboard y portal

**Notes:**
- Investigar logs del API para ver el stack trace del 500
- Revisar rutas de asignación: dashboard usa `/api/v1/clientes/:id/asignar` o similar, portal usa `/api/v1/portal/reservaciones`
- Verificar constraints de Prisma en tablas de reservaciones

### Phase 2: Fix Selección de Horas en Calendario
**Goal**: Las horas seleccionadas en el calendario del admin se reflejan visualmente
**Status**: ✓ complete
**Priority**: high
**Requirements**: BUG-02

**Success Criteria:**
1. ✓ Al dar click y arrastrar en una franja horaria, visualmente se marca/selecciona
2. ✓ La hora seleccionada se pasa correctamente al form de NuevaClaseDialog
3. ✓ El calendario muestra las franjas creadas correctamente

**Notes:**
- FullCalendar en dashboard — revisar eventos `select` y callbacks
- Verificar si el problema es de state (useState no actualiza) o de FullCalendar config (selectable, slotMinTime, etc.)
- Revisar componente que maneja el calendario de clases

### Phase 3: Página de Ayuda en Dashboard
**Goal**: Crear sección de ayuda/soporte integrada en el dashboard con manuales para staff y clientes
**Status**: ✓ complete
**Priority**: medium
**Requirements**: HELP-01, HELP-02, HELP-03
**Plans**: 3 plans

**Success Criteria:**
1. Link de "Ayuda" visible en el sidebar del dashboard
2. Página de ayuda con navegación entre manual de admin y manual de cliente
3. Manual de admin cubre: gestión de clientes, clases, membresías, reservaciones
4. Manual de cliente cubre: reservar clases, pagar, cancelar
5. Contenido con los colores de marca `#254F40`, `#F6FFB5`, `#FDFFEC`

**Plans:**
- [x] 03-01-PLAN.md — Add "Ayuda" link to sidebar, install Tabs and Accordion components
- [x] 03-02-PLAN.md — Create help page with Tabs, ManualAdmin and ManualCliente components
- [x] 03-03-PLAN.md — Add search/filter functionality to help page

**Notes:**
- Componentes React (.tsx) usando shadcn/ui (Card, Accordion, Tabs) — no MDX
- Sección en `(dashboard)/ayuda/`
- UI limpia con búsqueda y secciones colapsables usando framer-motion

### Phase 4: Audit & Reporte de Hallazgos
**Goal**: Investigar y documentar otros bugs y áreas grises encontrados durante la ejecución
**Status**: ✓ complete
**Priority**: medium
**Requirements**: AUDIT-01
**Plans**: 1 plan

**Success Criteria:**
1. ✓ Documento con hallazgos entregado al usuario (HALLASGOS.md)
2. ✓ Cada hallazgo clasificado por severidad (critical, high, medium, low)
3. ✓ Recomendaciones de trabajo futuro incluidas

**Plans:**
- [x] 04-01-PLAN.md — Audit: verificar CONCERNS.md, revisar fases 1-3, escribir HALLASGOS.md, crear GitHub issues

**Notes:**
- 21 hallazgos documentados (3 critical, 7 high, 5 medium, 6 low)
- 10 GitHub issues creados para Critical + High findings
- 2 fixes ya aplicados detectados (MERCADO_PAGO enum, verificar-pago hardcoded)

---

## v0.3.1 — Hotfixes Post-Auditoría

### Phase 5: Fix Sesiones y Membresías
**Goal**: Corregir consistencia de sessionsRemaining y status EXHAUSTED en flujo portal
**Status**: ✓ complete
**Priority**: critical
**Requirements**: H-01, H-02
**Plans**: 1 plan

**Success Criteria:**
1. ✓ Cancelación de reservación restaura sessionsRemaining y decrementa sessionsUsed
2. ✓ Portal setea MEMBERSHIP_STATUS a EXHAUSTED cuando sessionsRemaining llega a 0

**Plans:**
- [x] 05-01-PLAN.md — EXHAUSTED en portal + sesiones restauradas en DELETE, declinar, webhook

**Notes:**
- 3 cancel paths fixed: DELETE admin, PATCH declinar, webhook rejected
- portal.routes.ts, reservaciones.routes.ts, webhook.routes.ts modificados

### Phase 6: Fix Contabilidad MP
**Goal**: Auto-crear registro Ingreso cuando un pago MP es aprobado
**Status**: ✓ complete
**Priority**: critical
**Requirements**: H-03
**Plans**: 1 plan

**Success Criteria:**
1. ✓ Webhook de MP crea Ingreso al aprobar pago de paquete
2. ✓ Fallback verificar-pago-paquete también crea Ingreso
3. ✓ El módulo contable refleja ingresos de MP automáticamente

**Plans:**
- [x] 06-01-PLAN.md — Ingreso auto-creado en webhook y portal fallback

### Phase 7: Fix Seguridad Cuentas
**Goal**: Eliminar PIN default '0000' y proteger tempPassword
**Status**: ✓ complete
**Priority**: high
**Requirements**: H-04, H-05
**Plans**: 1 plan

**Success Criteria:**
1. ✓ PIN aleatorio de 4 dígitos generado en creación de cuenta
2. ✓ PIN incluido en respuesta de aprobación junto a tempPassword
3. ✓ tempPassword sigue expuesta (requiere email service — fuera de alcance)

**Plans:**
- [x] 07-01-PLAN.md — PIN aleatorio en portal.routes.ts y clientes.routes.ts

### Phase 8: Fix Seguridad Portal
**Goal**: Mitigar vulnerabilidades de seguridad en portal (JWT, QR leak, webhook, rate limit)
**Status**: ✓ complete
**Priority**: high
**Requirements**: H-06, H-07, H-08, H-09
**Plans**: 1 plan

**Success Criteria:**
1. ⚡ JWT en localStorage mitigado (short TTL + rate limiting — refactor completo pendiente)
2. ✓ qrCode removido de respuesta buscar-cliente
3. ✓ Validación de firma webhook ahora obligatoria en todos los entornos
4. ✓ Rate limiting aplicado a rutas públicas del portal (20 req/min)

**Plans:**
- [x] 08-01-PLAN.md — QR leak, webhook, rate limit, JWT mitigación

### Phase 9: Fix Cancelación Portal
**Goal**: Implementar endpoint de cancelación de reservación para clientes
**Status**: ✓ complete
**Priority**: high
**Requirements**: H-10
**Plans**: 1 plan

**Success Criteria:**
1. ✓ DELETE /api/v1/portal/reservaciones/:id implementado
2. ✓ Valida política de cancelación de 5 horas
3. ✓ Decrementa spotsBooked correctamente
4. ✓ Restaura sesiones si la reservación usó membresía

**Plans:**
- [x] 09-01-PLAN.md — DELETE /portal/reservaciones/:id con validaciones

---

## Future: v0.4 — Área Contable

### Phase 10: Dashboard Contable
**Goal**: Vista del área contable con resumen financiero, gráficos y reportes
**Status**: deferred
**Requirements**: ACCT-01, ACCT-02, ACCT-03, ACCT-04

**Success Criteria:**
1. Dashboard muestra ingresos totales, gastos, y balance
2. Reporte de membresías activas con sus ingresos
3. Ranking de clases más rentables
4. Gráficos de tendencias de pago (mensual/semanal)
5. Integración con datos existentes de pagos y membresías

---

## v0.5 — Automatización Operativa

### Phase 18: Job Scheduler Infrastructure
**Goal**: Instalar y configurar infraestructura de tareas asíncronas recurrentes en el API (node-cron + worker pattern sobre Express)
**Status**: pending
**Priority**: critical — bloquea fases 19–22

**Success Criteria:**
1. `node-cron` instalado y configurado en el API
2. Módulo `src/workers/` con patrón base para registrar jobs
3. Jobs se ejecutan en proceso separado (o child process) para no bloquear el servidor HTTP
4. Logs de ejecución de jobs en base de datos (tabla `JobLog`: job_name, status, ran_at, duration_ms, error)
5. Endpoint admin `GET /api/v1/admin/jobs/logs` para inspeccionar ejecuciones

**Notes:**
- Usar `node-cron` (ya compatible con Express/Node, sin Redis)
- Si en el futuro escala → migrar a BullMQ. Por ahora node-cron es suficiente.
- Jobs deben ser idempotentes y tener try/catch con log de error

---

### Phase 19: Horario Automático Semanal
**Goal**: Job que cada lunes copia las clases de la semana anterior y crea el horario de la semana entrante automáticamente
**Status**: pending
**Priority**: high

**Success Criteria:**
1. Job corre automáticamente cada lunes a las 06:00 (hora México)
2. Toma todas las clases de la semana anterior (lun–dom) y las duplica para la semana actual mismos días/horarios/instructor/capacidad
3. Las clases duplicadas inician con `status: PROGRAMADA` y `spotsBooked: 0`
4. Si ya existen clases en esa semana, el job NO duplica (idempotente)
5. Endpoint manual `POST /api/v1/admin/jobs/generar-horario` para ejecutar bajo demanda
6. El dashboard muestra confirmación cuando el horario se auto-generó

**Notes:**
- Offset de fechas: `addWeeks(claseOriginal.fecha, 1)` con date-fns
- Preservar: instructor, tipo, capacidad, hora inicio, hora fin, descripción
- NO preservar: reservaciones, asistencias, spotsBooked

---

### Phase 20: Corte de Caja por Clase
**Goal**: Calcular y registrar el corte de caja de cada clase basado en las reservaciones confirmadas y membresías utilizadas
**Status**: pending
**Priority**: high

**Success Criteria:**
1. Job diario a las 23:30 procesa clases terminadas del día y genera su corte
2. Corte incluye: total reservaciones, ingresos directos (pago en efectivo/MP por clase), ingresos de membresía prorrateados, instructor responsable
3. Tabla `CorteCaja`: id, claseId, fecha, totalReservaciones, ingresoDirecto, ingresoMembresia, ingresoTotal, creadoEn
4. Endpoint `GET /api/v1/admin/cortes-caja?from=&to=&instructorId=` con filtros
5. Vista en dashboard: tabla de cortes con totales por período

**Notes:**
- Ingreso membresía = precio_paquete / sesiones_totales × sesiones_usadas_en_esa_clase
- Clases con status CANCELADA se excluyen del corte
- Corte manual: `POST /api/v1/admin/cortes-caja/generar` con body `{ claseId }`

---

### Phase 21: Comisiones e Informe Contable
**Goal**: Calcular comisiones de instructores por clases impartidas y generar informe contable mensual consolidado
**Status**: pending
**Priority**: high

**Success Criteria:**
1. Tabla `Comision`: id, instructorId, claseId, monto, porcentaje, periodo, status (PENDIENTE/PAGADA), creadoEn
2. Job mensual (día 1 a las 07:00) calcula comisiones del mes anterior por instructor
3. Comisión = porcentaje configurable por instructor × ingresoTotal del corte de caja de cada clase suya
4. Endpoint `GET /api/v1/admin/comisiones?mes=&instructorId=` con filtros
5. Endpoint `PATCH /api/v1/admin/comisiones/:id/pagar` marca comisión como PAGADA
6. Informe contable mensual: `GET /api/v1/admin/contabilidad/informe?mes=` — devuelve ingresos, egresos, comisiones, balance neto
7. Vista dashboard: tabla de comisiones + resumen mensual con gráfica de barras

**Notes:**
- Porcentaje de comisión configurable en tabla `Instructor` (campo `comisionPct DECIMAL(5,2)`)
- Informe exportable a CSV desde el frontend
- Integrar con registros `Ingreso`/`Egreso` ya existentes en el modelo contable

---

### Phase 22: Módulo de Inventario
**Goal**: Gestión básica de inventario de materiales del estudio (mats, blocks, ligas, etc.) con alertas de stock mínimo
**Status**: pending
**Priority**: medium

**Success Criteria:**
1. Tabla `Inventario`: id, nombre, categoria, cantidad, stockMinimo, unidad, ultimaActualizacion
2. Tabla `MovimientoInventario`: id, inventarioId, tipo (ENTRADA/SALIDA/AJUSTE), cantidad, nota, creadoEn, usuarioId
3. CRUD completo: `GET/POST /api/v1/admin/inventario`, `GET/PATCH/DELETE /api/v1/admin/inventario/:id`
4. Endpoint `POST /api/v1/admin/inventario/:id/movimiento` registra entrada o salida
5. Job diario a las 08:00 revisa items con `cantidad <= stockMinimo` y los marca con alerta
6. Endpoint `GET /api/v1/admin/inventario/alertas` devuelve items bajo stock mínimo
7. Vista dashboard: tabla de inventario con badge de alerta rojo en items críticos, historial de movimientos por item

**Notes:**
- Categorías sugeridas: EQUIPAMIENTO, CONSUMIBLE, LIMPIEZA, ADMINISTRATIVO
- No requiere integración con proveedores en esta fase
- Alertas visibles en dashboard (badge en sidebar o notificación en header)
