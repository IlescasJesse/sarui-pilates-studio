---
status: partial
phase: 23-nomina-personal
source: [23-VERIFICATION.md]
started: 2026-06-29T00:00:00Z
updated: 2026-06-29T00:00:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Autoguardado de asistencia
expected: Al marcar/desmarcar checkbox aparece Loader2 en esa celda, luego toast de éxito. Sin botón Guardar explícito.
result: [pending]

### 2. Cálculo server-side de nómina
expected: Al crear período, diasTrabajados y netoAPagar calculados correctamente en base a asistencias reales del período.
result: [pending]

### 3. Aprobación atómica
expected: Al aprobar período, se crea Gasto en cuenta 602. Segunda aprobación retorna 409. Sección contabilidad-gastos se invalida.
result: [pending]

### 4. Control de acceso por rol
expected: Columna salario oculta para usuarios no-admin. Admin ve salarios completos.
result: [pending]

### 5. Navegación semanas / días futuros
expected: Selector de semana cambia label y grilla. Checkboxes de días futuros aparecen deshabilitados.
result: [pending]

## Summary

total: 5
passed: 0
issues: 0
pending: 5
skipped: 0
blocked: 0

## Gaps
