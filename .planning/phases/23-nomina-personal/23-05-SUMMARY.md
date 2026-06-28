---
phase: 23-nomina-personal
plan: "05"
subsystem: web-frontend
tags: [personal, nomina, hooks, tanstack-query, shadcn, sidebar]
dependency_graph:
  requires: [23-02, 23-03, 23-04]
  provides: [usePersonal-hook, /personal-page, TabPersonal, sidebar-entry]
  affects: [Sidebar.tsx, usePersonal.ts, personal/page.tsx, personal/_components/]
tech_stack:
  added: []
  patterns: [tanstack-query-hooks, shadcn-tabs, inline-form-creation, role-based-columns]
key_files:
  created:
    - apps/web/src/hooks/usePersonal.ts
    - apps/web/src/app/(dashboard)/personal/page.tsx
    - apps/web/src/app/(dashboard)/personal/_components/TabPersonal.tsx
    - apps/web/src/app/(dashboard)/personal/_components/TabAsistencia.tsx
    - apps/web/src/app/(dashboard)/personal/_components/TabNomina.tsx
  modified:
    - apps/web/src/components/layout/Sidebar.tsx
decisions:
  - user.role es 'admin' en minúsculas (no 'ADMIN') — ajustado en isAdmin check
  - AlertDialog no instalado en shadcn — confirmar eliminaciones vía Dialog con botones (según UI-SPEC)
  - Stubs TabAsistencia y TabNomina creados para permitir compilación; planes 06/07 los reemplazan
metrics:
  duration: "15 min"
  completed: "2026-06-28"
  tasks_completed: 3
  tasks_total: 3
  files_created: 5
  files_modified: 1
---

# Phase 23 Plan 05: Hook usePersonal + Shell /personal + TabPersonal Summary

Hook TanStack Query completo, shell de página /personal con 3 tabs (shadcn Tabs), Tab Personal con CRUD de empleados/puestos y creación inline de puesto, y entrada Personal en el sidebar.

## Tasks Completados

| Task | Nombre | Commit | Archivos |
|------|--------|--------|---------|
| 1 | Hook usePersonal.ts | 4dcd1ff | apps/web/src/hooks/usePersonal.ts |
| 2 | Shell page.tsx + TabPersonal | abb70ef | personal/page.tsx, _components/ (4 archivos) |
| 3 | Sidebar entrada Personal | 998a0a9 | Sidebar.tsx |

## Decisiones

- **user.role lowercase**: `useAuth` retorna role como `"admin"` (minúsculas). El plan mencionaba `'ADMIN'` pero el código real usa minúsculas. Corregido en `isAdmin = user?.role === "admin"`.
- **AlertDialog**: UI-SPEC menciona que AlertDialog no está instalado. Se usan Dialogs con botones de confirmación para acciones destructivas (eliminar empleado, eliminar puesto).
- **Stubs**: TabAsistencia y TabNomina creados como componentes stub vacíos para que la compilación pase. Los planes 06 y 07 los reemplazan con implementación completa.

## Funcionalidad entregada

### usePersonal.ts
- Tipos: `Puesto`, `StaffProfile`, `AsistenciaDia`, `AsistenciaSemana`, `NominaDetalle`, `EstadoNomina`, `PeriodoNomina`
- Queries: `usePuestos`, `useStaff`, `useAsistenciaSemana(inicio)`, `useNomina`
- Mutations puestos (invalidan `personal-puestos`): `useCrearPuesto`, `useEditarPuesto`, `useEliminarPuesto`
- Mutations staff (invalidan `personal-staff` + `personal-puestos`): `useCrearStaff`, `useEditarStaff`, `useEliminarStaff`
- Mutations asistencia: `useMarcarAsistenciaAdmin` (invalida `personal-asistencia`)
- Mutations nómina: `useCrearPeriodo`, `useRecalcularPeriodo`, `useAjustarDetalle`, `useAprobarNomina` (invalida `personal-nomina` + `contabilidad-gastos`), `useMarcarPagado`

### personal/page.tsx
- Shell "use client" con header h1 "Personal y Nómina" + subtítulo
- `<Tabs defaultValue="personal">` con TabsList (Personal | Asistencia | Nómina)
- Importa TabPersonal, TabAsistencia, TabNomina desde `./_components/`

### TabPersonal.tsx
- Tabla de empleados: Avatar iniciales + Nombre | Puesto | Salario (solo ADMIN) | Estado | Acciones
- Badges activo/inactivo con clases del UI-SPEC (emerald/muted)
- DropdownMenu por fila: Editar / Eliminar
- Dialog agregar/editar con campo Puesto + opción inline "+ Crear puesto nuevo"
- Creación inline de puesto: expande form con nombre + salarioSemanal, crea y selecciona automáticamente
- Botón "+ Nuevo puesto" accesible también fuera del dialog
- Lista de puestos con opción de eliminar (solo admin)
- Empty state, error state con copys del UI-SPEC
- Loading: skeleton rows animados

### Sidebar.tsx
- Importa `Users2` de lucide-react
- Entrada `{ label: "Personal", href: "/personal", icon: Users2 }` insertada después de Instructores

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Ajuste de user.role lowercase**
- **Found during:** Task 2
- **Issue:** El plan especificaba `user.role !== 'ADMIN'` pero `useAuth.ts` retorna `role: "admin" | "instructor" | "reception" | "client"` (minúsculas)
- **Fix:** Cambiado a `user?.role === "admin"` en TabPersonal
- **Files modified:** apps/web/src/app/(dashboard)/personal/_components/TabPersonal.tsx

## Known Stubs

| Archivo | Razón |
|---------|-------|
| apps/web/src/app/(dashboard)/personal/_components/TabAsistencia.tsx | Stub (div vacío) — implementado por plan 23-06 |
| apps/web/src/app/(dashboard)/personal/_components/TabNomina.tsx | Stub (div vacío) — implementado por plan 23-07 |

## Threat Flags

Ninguno — no se introducen nuevos endpoints, rutas de autenticación ni acceso a archivos. La UI consume los endpoints del backend creados en planes 02-04.

## Self-Check: PASSED

- [x] apps/web/src/hooks/usePersonal.ts existe
- [x] apps/web/src/app/(dashboard)/personal/page.tsx existe
- [x] apps/web/src/app/(dashboard)/personal/_components/TabPersonal.tsx existe
- [x] apps/web/src/app/(dashboard)/personal/_components/TabAsistencia.tsx existe
- [x] apps/web/src/app/(dashboard)/personal/_components/TabNomina.tsx existe
- [x] apps/web/src/components/layout/Sidebar.tsx modificado (Users2 + entrada Personal)
- [x] Commits: 4dcd1ff, abb70ef, 998a0a9 en git log
- [x] TypeScript: sin errores (npm run typecheck)
