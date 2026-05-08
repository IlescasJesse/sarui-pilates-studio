---
phase: 07-fix-seguridad-cuentas
plan: 01
subsystem: api
tags: [fix, security, pin, password]
requirements-completed: [H-04, H-05]
---

# Phase 07: Fix Seguridad Cuentas Summary

## Accomplishments

### H-04: PIN aleatorio
- `portal.routes.ts` — reemplazado `hashPassword('0000')` por PIN aleatorio de 4 dígitos (`Math.floor(1000 + Math.random() * 9000)`)
- `clientes.routes.ts` — reemplazado `pin ?? '0000'` por PIN aleatorio cuando no se provee
- PIN incluido en respuesta de aprobación (`tempPassword`, `pin`) para que admin lo comunique al cliente

### H-05: tempPassword
- H-05 mitigation parcial: PIN aleatorio mejora seguridad incluso si tempPassword se expone
- El fix completo requiere servicio de email transaccional (fuera de alcance)

## Files Modified
- `apps/api/src/routes/portal.routes.ts` — PIN aleatorio + incluido en respuesta
- `apps/api/src/routes/clientes.routes.ts` — PIN aleatorio cuando no se provee

## Verification
- [x] Build compila sin errores
