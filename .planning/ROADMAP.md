# Roadmap

## Current Version: v0.3 — Bug Fixes & Help Center

### Phase 1: Debug Asignación de Clases (500)
**Goal**: Eliminar el error 500 al asignar un cliente a una clase tanto en dashboard como en portal
**Status**: pending
**Priority**: critical
**Requirements**: BUG-01

**Success Criteria:**
1. Staff puede asignar un cliente a una clase desde el dashboard sin error 500
2. Cliente puede reservar una clase desde el portal sin error 500
3. Se identifica la causa raíz del error (endpoint, validación, o DB)

**Notes:**
- Investigar logs del API para ver el stack trace del 500
- Revisar rutas de asignación: dashboard usa `/api/v1/clientes/:id/asignar` o similar, portal usa `/api/v1/portal/reservaciones`
- Verificar constraints de Prisma en tablas de reservaciones

### Phase 2: Fix Selección de Horas en Calendario
**Goal**: Las horas seleccionadas en el calendario del admin se reflejan visualmente
**Status**: pending
**Priority**: high
**Requirements**: BUG-02

**Success Criteria:**
1. Al dar click en una franja horaria, visualmente se marca/selecciona
2. La hora seleccionada se guarda correctamente en el form de la clase
3. El calendario muestra las franjas creadas correctamente

**Notes:**
- FullCalendar en dashboard — revisar eventos `select` y callbacks
- Verificar si el problema es de state (useState no actualiza) o de FullCalendar config (selectable, slotMinTime, etc.)
- Revisar componente que maneja el calendario de clases

### Phase 3: Página de Ayuda en Dashboard
**Goal**: Crear sección de ayuda/soporte integrada en el dashboard con manuales para staff y clientes
**Status**: pending
**Priority**: medium
**Requirements**: HELP-01, HELP-02, HELP-03

**Success Criteria:**
1. Link de "Ayuda" visible en el sidebar del dashboard
2. Página de ayuda con navegación entre manual de admin y manual de cliente
3. Manual de admin cubre: gestión de clientes, clases, membresías, reservaciones
4. Manual de cliente cubre: reservar clases, pagar, cancelar
5. Contenido con los colores de marca `#254F40`, `#F6FFB5`, `#FDFFEC`

**Notes:**
- Componente MDX o contenido renderizado directamente — no PDF
- Sección nueva en `(dashboard)/ayuda/` o `(dashboard)/soporte/`
- UI limpia con búsqueda y secciones colapsables

### Phase 4: Audit & Reporte de Hallazgos
**Goal**: Investigar y documentar otros bugs y áreas grises encontrados durante la ejecución
**Status**: pending
**Priority**: medium
**Requirements**: AUDIT-01

**Success Criteria:**
1. Documento con hallazgos entregado al usuario
2. Cada hallazgo clasificado por severidad (critical, high, medium, low)
3. Recomendaciones de trabajo futuro incluidas

**Notes:**
- Ya conocidos: tokens en localStorage, PIN full table scan, portal layout bug, tipos duplicados
- Buscar adicionalmente: validaciones faltantes, errores silenciosos, UX inconsistencies

---

## Future: v0.4 — Área Contable

### Phase 5: Dashboard Contable
**Goal**: Vista del área contable con resumen financiero, gráficos y reportes
**Status**: deferred
**Requirements**: ACCT-01, ACCT-02, ACCT-03, ACCT-04

**Success Criteria:**
1. Dashboard muestra ingresos totales, gastos, y balance
2. Reporte de membresías activas con sus ingresos
3. Ranking de clases más rentables
4. Gráficos de tendencias de pago (mensual/semanal)
5. Integración con datos existentes de pagos y membresías
