# Phase 2 Summary: Fix Selección de Horas en Calendario

**Date:** 2026-05-06
**Status:** ✓ Complete

## Problem
Al dar click en una franja horaria del calendario del admin, no se marcaba visualmente la selección. No había feedback visual al seleccionar horas.

## Root Cause
- `selectable: true` faltaba en la configuración de FullCalendar
- No existía handler `select` — solo `dateClick` que abre el diálogo inmediatamente sin selección visual
- El componente nunca permitía al usuario arrastrar/seleccionar un rango de tiempo

## Fix Applied
**File:** `apps/web/src/components/clases/CalendarioClases.tsx`

1. Added `DateSelectArg` import from `@fullcalendar/core`
2. Replaced `handleDateClick` with `handleSelect` that uses actual selected range (`arg.start`, `arg.end`)
3. Added `selectable` and `unselectAuto` to FullCalendar config
4. Replaced `dateClick={handleDateClick}` with `select={handleSelect}`

## Success Criteria
- [x] Al dar click y arrastrar en una franja horaria, visualmente se marca/selecciona
- [x] La hora seleccionada se pasa correctamente al form de NuevaClaseDialog
- [x] El calendario muestra las franjas creadas correctamente (ya funcionaba, sin cambios)

## Notes
- `unselectAuto` ensures selection highlight clears when dialog opens
- User can now drag-select a time range instead of single-click only
- Default slot duration is 30min as configured in `slotDuration`
