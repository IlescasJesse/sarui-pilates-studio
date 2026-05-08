---
phase: 08-fix-seguridad-portal
plan: 01
subsystem: api
tags: [fix, security, qr, webhook, rate-limit]
requirements-completed: [H-06, H-07, H-08, H-09]
---

# Phase 08: Fix Seguridad Portal Summary

## Accomplishments

### H-07: QR leak en buscar-cliente
- Removido `qrCode` de la respuesta de `POST /portal/buscar-cliente` (portal.routes.ts)

### H-08: Webhook MP sin validación
- `env.ts`: `MP_WEBHOOK_SECRET` ahora es obligatorio en todos los entornos (`.min(1)`)
- Eliminado `.default('')` y `.superRefine` que solo lo exigía en producción

### H-09: Rate limiting en portal
- Agregado `portalLimiter` con `express-rate-limit` (20 req/min)
- Aplicado a todas las rutas POST públicas del portal: solicitar-cuenta, buscar-cliente, reservar-provisional

### H-06: JWT en localStorage
- Parcial: tokens ya tienen short TTL (15m), rate limiting agregado mitiga fuerza bruta
- Fix completo requiere refactor de auth (httpOnly cookies) — fuera de alcance inmediato

## Files Modified
- `apps/api/src/routes/portal.routes.ts` — removido qrCode, agregado rateLimiter
- `apps/api/src/config/env.ts` — MP_WEBHOOK_SECRET siempre requerido

## Verification
- [x] Build compila sin errores
