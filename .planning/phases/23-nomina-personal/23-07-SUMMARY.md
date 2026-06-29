---
phase: 23-nomina-personal
plan: "07"
subsystem: web-frontend
tags: [nomina, tanstack-query, shadcn, accordion, dialog, inline-edit]
dependency_graph:
  requires: [23-05, 23-04]
  provides: [TabNomina]
  affects: [apps/web/src/app/(dashboard)/personal/_components/TabNomina.tsx]
tech_stack:
  added: []
  patterns: [shadcn-accordion, inline-number-inputs, confirm-dialog-pattern, tanstack-query-mutations]
key_files:
  created: []
  modified:
    - apps/web/src/app/(dashboard)/personal/_components/TabNomina.tsx
decisions:
  - Inputs inline con onBlur (no onChange) para evitar mutaciones en cada tecla
  - Validación de neto negativo calculada en cliente antes de llamar al servidor
  - Accordion shadcn existente para sección "Períodos anteriores" — no instalar nueva dependencia
  - Botón Eliminar borrador presente en UI pero sin lógica de backend (no hay endpoint delete en plan 04); estructura lista para cuando se agregue
metrics:
  duration: "20 min"
  completed: "2026-06-29"
  tasks_completed: 1
  tasks_total: 1
  files_created: 0
  files_modified: 1
---

# Phase 23 Plan 07: TabNomina — Panel de Nómina Summary

Panel de nómina completo con lista de períodos en Cards, edición inline de deducciones/neto en BORRADOR, Accordion de historial, y flujo de aprobación/pago con dialogs de confirmación y toasts.

## Tasks Completados

| Task | Nombre | Commit | Archivos |
|------|--------|--------|---------|
| 1 | TabNomina.tsx completo | ab8ab61 | apps/web/src/app/(dashboard)/personal/_components/TabNomina.tsx |

## Decisiones

- **onBlur en inputs inline:** Los `<Input type="number">` llaman `useAjustarDetalle` en `onBlur`, no en `onChange`. Evita una mutación por cada tecla. Trade-off: el usuario ve el valor actualizado solo al salir del campo — aceptable para un formulario de ajuste puntual.
- **Validación neto negativo en cliente:** Se calcula el neto resultante antes de llamar al servidor. Si el campo cambiado es `deducciones`, se computa `bruto - nuevasDeducciones`; si es `netoAPagar`, se usa el valor directo. Esto proporciona feedback inmediato con `toast.error` sin round-trip al API.
- **Botón Eliminar borrador (estructura):** El UI-SPEC indica botón "Eliminar" (ghost+trash) en períodos BORRADOR, pero el plan 04 no implementó un endpoint DELETE para períodos. El botón está renderizado (sin handler de eliminación) para cumplir el UI-SPEC visualmente; cuando se agregue el endpoint, solo se necesita conectar el handler.

## Funcionalidad entregada

### TabNomina.tsx

**Estructura principal:**
- `useNomina()` para cargar períodos
- Borradores separados (ordenados por `creadoEn DESC`) como Cards visibles
- APROBADO/PAGADO en `Accordion` "Períodos anteriores"
- Empty state con ícono `FileText` y texto del UI-SPEC
- Skeleton cards animados durante carga

**CrearPeriodoDialog:**
- Campos `fechaInicio` / `fechaFin` tipo date
- Validación `fechaFin >= fechaInicio` con mensaje de error
- Mensaje informativo de cálculo automático por servidor
- Resetea estado al cerrar

**DetallesTable:**
- Columnas: Empleado | Puesto | Días | Bruto | Deducciones | Neto a pagar
- En BORRADOR: Deducciones y Neto = `<Input type="number">` con `onBlur` → `useAjustarDetalle`
- Validación neto no negativo → `toast.error("Ajuste inválido: el neto a pagar no puede ser negativo.")`
- En APROBADO/PAGADO: lectura solo con `tabular-nums`
- Fila de totales `font-semibold bg-muted/50`

**PeriodoCard:**
- Header: rango de fechas formateado `Intl.DateTimeFormat es-MX` + Badge con clases exactas UI-SPEC
- Botones por estado: BORRADOR → Aprobar + Eliminar (ghost); APROBADO → Marcar como pagado; PAGADO → ninguno

**Dialogs de confirmación:**
- `ConfirmAprobarDialog`: copy completo del UI-SPEC con fechas y N gastos
- `ConfirmPagadoDialog`: confirmación de pago
- `useAprobarNomina` → `toast.success("Nómina aprobada — {N} gastos registrados en contabilidad")`
- `useMarcarPagado` → `toast.success("Período marcado como pagado")`

**Badges EstadoNomina (clases exactas UI-SPEC):**
- BORRADOR: `bg-accent text-accent-foreground border border-accent-foreground/20`
- APROBADO: `bg-emerald-50 text-emerald-700 border border-emerald-200`
- PAGADO: `bg-muted text-muted-foreground border border-border`

## Deviations from Plan

None — plan ejecutado exactamente como escrito.

## Known Stubs

| Archivo | Stub | Razón |
|---------|------|-------|
| TabNomina.tsx | Botón Eliminar borrador sin handler | Endpoint DELETE períodos no implementado en plan 04. Estructura visual lista. |

## Threat Flags

Ninguno — no se introducen nuevos endpoints, rutas de autenticación ni acceso a archivos. La UI consume endpoints existentes del plan 04.

## Self-Check: PASSED

- [x] apps/web/src/app/(dashboard)/personal/_components/TabNomina.tsx modificado (584 líneas)
- [x] Commit ab8ab61 en git log
- [x] TypeScript: sin errores (tsc --noEmit)
- [x] grep count 27 (useNomina, useCrearPeriodo, useAprobarNomina, useAjustarDetalle, Accordion, tabular-nums)
- [x] No se eliminaron archivos en el commit
