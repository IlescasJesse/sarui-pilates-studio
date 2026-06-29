---
phase: 23-nomina-personal
plan: "06"
subsystem: web-frontend
tags: [personal, asistencia, tanstack-query, autoguardado, grilla-semanal]
dependency_graph:
  requires: [23-05]
  provides: [TabAsistencia]
  affects: [apps/web/src/app/(dashboard)/personal/_components/TabAsistencia.tsx]
tech_stack:
  added: []
  patterns: [tanstack-query-optimistic, date-fns-week-navigation, native-checkbox]
key_files:
  created: []
  modified:
    - apps/web/src/app/(dashboard)/personal/_components/TabAsistencia.tsx
decisions:
  - Checkbox shadcn no instalado — se usa input[type=checkbox] nativo igual que TabPersonal (UI-SPEC prohibe instalar nuevos componentes shadcn en esta fase)
  - opacity-40 aplicado directamente en el input checkbox para dias futuros (no en el td) para evitar duplicar la regla con el disabled del input nativo
  - bg-accent/30 para fila del usuario logueado (distinto de bg-accent/60 de celda presente — coherente con UI-SPEC que reserva bg-accent para celda marcada)
metrics:
  duration: "12 min"
  completed: "2026-06-28"
  tasks_completed: 1
  tasks_total: 1
  files_created: 0
  files_modified: 1
---

# Phase 23 Plan 06: TabAsistencia — Grilla semanal con autoguardado Summary

Componente TabAsistencia con grilla semanal empleados x 7 dias, checkboxes nativos con autoguardado optimista vía useMarcarAsistenciaAdmin, selector de semana con date-fns y navegacion ChevronLeft/ChevronRight, y reglas de permiso por rol.

## Tasks Completados

| Task | Nombre | Commit | Archivos |
|------|--------|--------|---------|
| 1 | TabAsistencia grilla semanal + autoguardado | 71f6d7d | apps/web/src/app/(dashboard)/personal/_components/TabAsistencia.tsx |

## Decisiones

- **Checkbox nativo**: shadcn `Checkbox` no esta instalado (fuera del inventario de la UI-SPEC). Se reemplaza por `input[type="checkbox"]` con `accent-[#254F40]`, igual que el patron de `TabPersonal.tsx`.
- **Permisos por rol**: admin/instructor editan toda la grilla; no-admin solo edita HOY en su propia fila (identidad via `staff.userId === user.id`).
- **Lookup O(1)**: Map de asistencias indexado por `${staffId}_${fechaISO}` construido al recibir datos del query — evita N iteraciones por celda.
- **Pendientes por celda**: Set local `pendingCells` rastreo de mutations en vuelo — muestra Loader2 14px por celda individual sin bloquear el resto de la tabla.

## Funcionalidad entregada

### TabAsistencia.tsx

- Estado `semanaInicio` inicializado con `startOfWeek(new Date(), { weekStartsOn: 1 })` (lunes)
- Selector semana derecha del heading: flechas Button ghost icon + label formato "28 jun – 4 jul 2026" via date-fns/es locale
- `useAsistenciaSemana(semanaInicioStr)` para cargar `{ staff, dias }[]`
- Grilla `<table>`: primera columna sticky con avatar iniciales + nombre (bg-accent/30 si es fila propia)
- 7 columnas de dia: header dia actual en `text-primary font-semibold`, abreviaciones Lun/Mar/Mie/Jue/Vie/Sab/Dom
- Celda presente=true: `bg-accent/60` en el `<td>`
- Dias futuros: checkbox `disabled` + `opacity-40 cursor-not-allowed`
- onChange: `useMarcarAsistenciaAdmin.mutate({ staffId, fecha, presente })` inmediatamente
- Mientras isPending: Loader2 14px en lugar del checkbox
- toast.success("Asistencia guardada") / toast.error("No se pudo guardar la asistencia")
- Empty state "No hay empleados activos para mostrar." si `asistencias.length === 0`
- Loading: Loader2 centrado en el area de la grilla

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Checkbox shadcn no instalado**
- **Found during:** Task 1 — TypeScript error TS2307: Cannot find module '@/components/ui/checkbox'
- **Issue:** El plan especificaba `Checkbox` de shadcn pero el componente no esta instalado. La UI-SPEC prohibe instalar nuevos componentes shadcn en esta fase.
- **Fix:** Reemplazado por `input[type="checkbox"]` nativo con `accent-[#254F40]`, mismo patron usado en `TabPersonal.tsx`
- **Files modified:** apps/web/src/app/(dashboard)/personal/_components/TabAsistencia.tsx
- **Commit:** 71f6d7d

## Known Stubs

Ninguno — TabAsistencia reemplaza el stub creado en el plan 05 con implementacion completa.

## Threat Flags

Ninguno — no se introducen nuevos endpoints, rutas de autenticacion ni acceso a archivos. La UI consume los endpoints del backend creados en planes 02-03.

## Self-Check: PASSED

- [x] apps/web/src/app/(dashboard)/personal/_components/TabAsistencia.tsx existe y tiene 234+ lineas
- [x] grep useAsistenciaSemana|useMarcarAsistenciaAdmin|bg-accent|ChevronLeft|Loader2 retorna 11 (>0)
- [x] npx tsc --noEmit sin errores (0 errores TypeScript)
- [x] Commit 71f6d7d en git log
