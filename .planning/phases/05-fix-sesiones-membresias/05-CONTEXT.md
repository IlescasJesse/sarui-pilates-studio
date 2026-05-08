# Phase 5: Fix Sesiones y Membresías — Context

**Gathered:** 2026-05-08
**Status:** Ready for execution
**Requirements:** H-01, H-02

## H-01: sessionsRemaining inconsistente

**Problema:** Cuando se cancela una reservación, `sessionsRemaining` no se restaura. El contador solo se decrementa al crear la reservación pero nunca se incrementa al cancelar.

**Caminos de cancelación actuales que no restauran sesiones:**
1. `DELETE /api/v1/reservaciones/:id` (admin) — solo setea `status: CANCELLED`
2. `PATCH /:id/declinar` (admin) — decrementa `spotsBooked` pero no toca membresía
3. Webhook MP pago rechazado — decrementa `spotsBooked` pero no toca membresía

**Fix esperado:** Al cancelar una reservación con `membershipId`, restaurar `sessionsRemaining` (+1), decrementar `sessionsUsed` (-1).

## H-02: MEMBERSHIP_STATUS no se setea EXHAUSTED

**Problema:** El flujo de portal (`/reservar-provisional` y `/reservaciones`) solo decrementa `sessionsRemaining` pero nunca setea `status: EXHAUSTED`. El admin flow (`reservaciones.routes.ts:156`) sí lo hace.

**Fix esperado:** Agregar `status: membership.sessionsRemaining - 1 <= 0 ? 'EXHAUSTED' : 'ACTIVE'` al update de membresía en portal.

## Decisiones
- Ambos fixes modifican el mismo flujo de membresía
- `cancelledOnTime` no se usa actualmente — por simplicidad, restaurar sesión en toda cancelación
