# Phase 1: Debug Asignación de Clases (500) - Context

**Gathered:** 2026-05-06
**Status:** Ready for planning

<domain>
## Phase Boundary

Eliminar el error 500 al asignar un cliente a una clase tanto desde el dashboard admin (`POST /api/v1/reservaciones`) como desde el portal público (`POST /api/v1/portal/reservaciones`). Identificar causa raíz, aplicar fix, y limpiar el código de los endpoints afectados.

</domain>

<decisions>
## Implementation Decisions

### Debug Strategy
- **D-01:** Reproducir el error primero mediante llamada directa al API (curl/fetch) para obtener stack trace completo
- **D-02:** Usar logs del servidor API para ver el error exacto antes de modificar código

### Fix Scope
- **D-03:** Arreglar la causa del 500 y hacer cleanup del endpoint (extraer lógica a service layer, mejorar validaciones) — no solo parchar
- **D-04:** No reescribir toda la arquitectura de reservaciones — scope es fix + cleanup

### Error Handling
- **D-05:** Si el 500 es causado por validación de datos (membresía inválida, clase llena, etc.), registrar en audit log + devolver respuesta 4xx clara al cliente
- **D-06:** Mantener envelope `{ success: false, error: { code, message } }` consistente en todos los errores

### Known Suspects (from code review)
- **S-01:** Dashboard route (`reservaciones.routes.ts:146-159`) — `membership` puede ser null si membershipId no pertenece a ningún registro, pero no hay null check antes de acceder `membership.sessionsRemaining`
- **S-02:** Portal route (`portal.routes.ts:910-925`) — `Payment.upsert` usa `where: { reservationId }` pero no hay índice unique explícito en el schema para `reservationId` en Payment (solo `@unique` en la relación)
- **S-03:** Portal route (`portal.routes.ts:584`) — `payment.transaction_amount ?? 0` podría ser null si `getPayment()` falla silenciosamente
- **S-04:** `PaymentMethod` enum no incluye `MERCADO_PAGO` en el schema pero el roadmap v0.2 lo menciona como fix pendiente

### Agent's Discretion
- Exacta causa raíz del 500 (se determinará con debugging)
- Qué tanto cleanup hacer en los endpoints (mínimo: null checks y validaciones; máximo: extract to service)
- Si agregar tests unitarios para los endpoints fixeados

</decisions>

<canonical_refs>
## Canonical References

### Reservation endpoints
- `apps/api/src/routes/reservaciones.routes.ts` — Dashboard reservation endpoint (POST /api/v1/reservaciones, líneas 52-174)
- `apps/api/src/routes/portal.routes.ts` — Portal reservation endpoint (POST /api/v1/portal/reservaciones, líneas 498-661)

### Database schema
- `apps/api/prisma/schema.prisma` — Reservation model (líneas 384-427), Payment model (líneas 464-488), Membership model (líneas 304-340)

### Response utilities
- `apps/api/src/utils/response.ts` — ApiSuccess/ApiError envelope patterns

### Auth middleware
- `apps/api/src/middlewares/auth.middleware.ts` — JWT verification
- `apps/api/src/middlewares/role.middleware.ts` — Role-based access control

### MercadoPago service
- `apps/api/src/services/mercadopago.service.ts` — createPreference, getPayment

### Roadmap upstream fixes
- `ROADMAP.md` (root) — "Stabilize Payment Flow" phase menciona: Add MERCADO_PAGO to PaymentMethod enum, Fix webhook signature validation, Create Ingreso records

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `reservacionSchema` (Zod) — validation schema en `reservaciones.routes.ts:13-19`, reutilizable
- `reservaSchema` (Zod) — validation schema en `portal.routes.ts:491-496`, reutilizable
- `ApiSuccess`/`ApiError` — response envelope en `apps/api/src/utils/response.ts`
- `$executeRaw` atomic spot increment — pattern existente en ambos endpoints (líneas 106-109, 573-576)
- `$transaction` wrapper — pattern existente para operations atómicas

### Established Patterns
- Inline route handlers (no controllers) — la mayoría de la lógica vive en los archivos de routes
- Service layer solo para kiosk, auth, mercadopago, audit, qr, clientes
- Zod inline validation con `safeParse`
- `next(error)` para errores inesperados → global error handler

### Integration Points
- Dashboard `POST /api/v1/reservaciones` → incrementa spotsBooked, crea reservation, decrementa membresía
- Portal `POST /api/v1/portal/reservaciones` → crea reservation PENDING_APPROVAL + MercadoPago preference
- Webhook `POST /api/v1/portal/webhook/mercadopago` → confirma payment + reservation
- `verificar-pago` → fallback polling de MercadoPago

</code_context>

<deferred>
## Deferred Ideas

- Extraer TODA la lógica de reservaciones a un `reservation.service.ts` centralizado (scope creep — fase separada)
- Agregar testing infrastructure para endpoints (ya está en roadmap v0.2)
- Refactorizar todos los routes inline a controller pattern (scope creep)

</deferred>

---

*Phase: 01-debug-asignacion-clases*
*Context gathered: 2026-05-06*
