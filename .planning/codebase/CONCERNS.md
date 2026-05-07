# Codebase Concerns

**Analysis Date:** 2026-05-05

---

## Tech Debt

**`MERCADO_PAGO` is not in the `PaymentMethod` enum:**
- Issue: The schema defines `PaymentMethod` as `CASH | CARD | TRANSFER | OTHER`. Code in `webhook.routes.ts` and `portal.routes.ts` writes `'MERCADO_PAGO' as PaymentMethod` via TypeScript type assertion, bypassing compile-time safety. If Prisma enforces the enum at the DB level this will cause a runtime error on first live payment.
- Files: `apps/api/prisma/schema.prisma` (lines 107–112), `apps/api/src/routes/webhook.routes.ts` (lines 97, 107), `apps/api/src/routes/portal.routes.ts` (lines 840, 850)
- Impact: Hard runtime crash the first time a MercadoPago payment is processed in production. The `as PaymentMethod` cast silences the TypeScript error but does not add the value to the DB enum.
- Fix approach: Add `MERCADO_PAGO` to the `PaymentMethod` enum in `schema.prisma`, run `prisma migrate dev`, remove the type casts.

**`sessionsRemaining` is a stored denormalized counter, not always kept consistent:**
- Issue: `sessionsRemaining` is set at membership creation (`pkg.sessions`) and decremented on reservation. However, the portal's `/reservar-provisional` flow decrements it (`portal.routes.ts` lines 431–432), and the admin's `reservaciones.routes.ts` also decrements it (line 154–155) and sets `EXHAUSTED` when 0. The webhook/`verificar-pago-paquete` path sets `sessionsRemaining` only at membership creation, never adjusting it after subsequent events (e.g., cancellations in `reservaciones.routes.ts` line 343 do not restore sessions). A drift between `sessionsUsed + sessionsRemaining != totalSessions` is possible over time.
- Files: `apps/api/src/routes/reservaciones.routes.ts` (lines 150–156, 343), `apps/api/src/routes/portal.routes.ts` (lines 431–432)
- Impact: Clients may be denied sessions they are entitled to, or receive extra sessions after cancellations.
- Fix approach: Ensure every reservation cancellation that consumed a session also increments `sessionsRemaining` and decrements `sessionsUsed`. Consider a DB trigger or a service-layer function as the single source for session mutations.

**`portal.routes.ts` exceeds 500-line limit (934 lines) and mixes too many concerns:**
- Issue: `portal.routes.ts` contains public routes, AUTH routes, kiosk-adjacent token logic, MercadoPago payment logic, membership activation, and QR generation all in one file. Project convention is files under 500 lines.
- Files: `apps/api/src/routes/portal.routes.ts` (934 lines)
- Impact: Increases cognitive load, makes targeted testing difficult, and raises the risk of merge conflicts.
- Fix approach: Split into `portal-public.routes.ts` (unauthenticated), `portal-auth.routes.ts` (CLIENT-auth), and `portal-payment.routes.ts` (MP + membership activation). Extract membership-activation logic into `apps/api/src/services/membership.service.ts`.

**Duplicate membership-activation logic in two places:**
- Issue: The MP webhook (`webhook.routes.ts` lines 83–113) and the fallback polling endpoint `verificar-pago-paquete` (`portal.routes.ts` lines 826–857) contain almost identical `upsert` + `payment.create` blocks. Any bug fix or behaviour change must be applied in both places.
- Files: `apps/api/src/routes/webhook.routes.ts` (lines 83–113), `apps/api/src/routes/portal.routes.ts` (lines 826–857)
- Impact: Logic drift between the two paths; the fallback silently diverges from the canonical webhook flow.
- Fix approach: Extract a shared `activateMembershipFromPayment(mpPaymentId, packageId, clientId)` function into `apps/api/src/services/membership.service.ts` and call it from both routes.

**Default PIN `'0000'` assigned to new portal clients:**
- Issue: When an admin approves a `SolicitudCuenta`, a new client is created with PIN `hashPassword('0000')` (`portal.routes.ts` line 202). The same default is used in `clientes.routes.ts` line 106 when no PIN is supplied. A weak default PIN for kiosk access is a security concern.
- Files: `apps/api/src/routes/portal.routes.ts` (line 202), `apps/api/src/routes/clientes.routes.ts` (line 106)
- Impact: Any person who knows the client's QR code and tries `0000` gains kiosk check-in access unless the client has changed their PIN. There is no current force-change-PIN flow.
- Fix approach: Generate a random 4-digit PIN on account creation and include it in the approval response alongside `tempPassword`, so the admin can communicate it to the client. Add a `PATCH /portal/cambiar-pin` endpoint.

**`tempPassword` exposed in plaintext in API response:**
- Issue: On account approval, `tempPassword` is returned in the JSON body of `PATCH /api/v1/portal/solicitudes/:id` (`portal.routes.ts` line 235). This is the initial user password for portal login, sent over HTTP to the admin UI.
- Files: `apps/api/src/routes/portal.routes.ts` (line 235)
- Impact: The password is visible in server logs, browser devtools, and any HTTP intermediary that lacks TLS. There is no email or out-of-band delivery.
- Fix approach: Send the temp password via email to the client's address at approval time using a transactional email service (no such service is currently integrated). Until email is available, at minimum document the risk and enforce HTTPS in production.

---

## Known Bugs

**`verificar-pago` fallback always returns `reservacionStatus: 'CONFIRMED'` even when not confirmed:**
- Symptoms: `POST /api/v1/portal/verificar-pago` responds `{ status: payment.status, reservacionStatus: 'CONFIRMED' }` unconditionally (`portal.routes.ts` line 928), even if `payment.status` was `'pending'` and the reservation was not updated.
- Files: `apps/api/src/routes/portal.routes.ts` (line 928)
- Trigger: Client lands on success page with a `pending` payment status. The frontend may show "confirmed" incorrectly.
- Fix approach: Return the actual `reservacion.status` from the DB, not a hardcoded string.

**Portal cancellation flow missing — `spotsBooked` never decremented from portal:**
- Symptoms: There is no `DELETE /portal/reservaciones/:id` or cancel endpoint in `portal.routes.ts`. Clients cannot cancel their portal reservations from the portal UI. The only cancel path is the admin/instructor route in `reservaciones.routes.ts`.
- Files: `apps/api/src/routes/portal.routes.ts` (entire file — no cancel route), `apps/web/src/app/portal/mis-agendas/page.tsx`
- Trigger: Client books a class and wants to cancel before the 5-hour window.
- Fix approach: Implement `DELETE /api/v1/portal/reservaciones/:id` that validates the 5-hour cancellation policy, decrements `spotsBooked`, restores sessions if `MEMBERSHIP` origin, and sets `cancelledOnTime`.

**`MEMBERSHIP_STATUS` never set to `EXHAUSTED` after portal-path reservation:**
- Symptoms: The admin reservation flow in `reservaciones.routes.ts` (line 156) sets `status: 'EXHAUSTED'` when sessions hit 0. The portal `/reservar-provisional` and portal `/reservaciones` flows only decrement the counter but never set the status to `EXHAUSTED`.
- Files: `apps/api/src/routes/portal.routes.ts` (lines 428–435)
- Trigger: A client uses their last session via the portal. Their membership status stays `ACTIVE` even with 0 sessions.
- Fix approach: After decrementing, add `status: membership.sessionsRemaining - 1 <= 0 ? 'EXHAUSTED' : 'ACTIVE'` to the update (matching the pattern in `reservaciones.routes.ts` line 156).

---

## Security Considerations

**`MP_WEBHOOK_SECRET` defaults to empty string — webhook validation disabled in dev and any environment missing the var:**
- Risk: In any environment where `MP_WEBHOOK_SECRET` is not set (all non-production environments, and production if the var is missing), the webhook accepts all POST requests without signature validation.
- Files: `apps/api/src/config/env.ts` (line 22), `apps/api/src/routes/webhook.routes.ts` (lines 12–19)
- Current mitigation: A one-time `console.warn` is logged. The Zod schema enforces the var in `production` NODE_ENV, but `NODE_ENV` must be correctly set.
- Recommendations: Add a staging/production check that fails closed if `MP_WEBHOOK_SECRET` is empty regardless of `NODE_ENV`. Consider a test secret for local dev instead of silently bypassing.

**No rate limiting on public portal endpoints:**
- Risk: `POST /portal/solicitar-cuenta`, `POST /portal/buscar-cliente`, `POST /portal/login` are unauthenticated and have no rate limiting. `buscar-cliente` returns membership and QR data for any email, enabling enumeration of registered clients.
- Files: `apps/api/src/routes/portal.routes.ts` (lines 129–153, 255–333)
- Current mitigation: None. `kiosk.routes.ts` uses `express-rate-limit` but portal routes do not.
- Recommendations: Apply `express-rate-limit` to all public portal routes, especially `buscar-cliente`. Consider requiring CAPTCHA or throttling by IP.

**JWT tokens stored in `localStorage` (XSS-accessible):**
- Risk: Both the admin dashboard (`useAuth.ts`) and the client portal (`portal/login/page.tsx`, `portal-client.ts`) store JWT access tokens in `localStorage`. Any XSS vulnerability on the page can exfiltrate the token.
- Files: `apps/web/src/hooks/useAuth.ts` (lines 84–86), `apps/web/src/app/portal/login/page.tsx` (lines 79–80), `apps/web/src/lib/api-client.ts` (line 25)
- Current mitigation: None specific to token storage.
- Recommendations: Move tokens to `httpOnly` cookies for the admin dashboard at minimum. For the portal, this requires an API-side cookie-setting endpoint, which is a larger change.

**`/buscar-cliente` leaks client QR code to any requester with a valid email:**
- Risk: `POST /portal/buscar-cliente` returns `qrCode` (the raw UUID used for kiosk check-in) and `provisionalToken` for any known email address without authentication.
- Files: `apps/api/src/routes/portal.routes.ts` (lines 314–329)
- Current mitigation: The provisional token expires in 30 minutes. The QR code itself never rotates.
- Recommendations: Remove `qrCode` from the `buscar-cliente` response; it serves no UI purpose there. The QR is available authenticated via `GET /portal/mi-qr`.

---

## Performance Bottlenecks

**`GET /portal/clases` has no pagination — returns all classes in the next 30 days:**
- Problem: Query fetches all non-cancelled classes for the next 30 days including instructor and tipoActividad relations in a single query.
- Files: `apps/api/src/routes/portal.routes.ts` (lines 20–68)
- Cause: No `take`/`skip` parameters. Depending on class density this could be 100+ rows with nested relations.
- Improvement path: Add optional `?page` / `?limit` query params with a default of 20–30 records. Add a composite index on `(startAt, isActive, isCancelled, deletedAt)` in `schema.prisma`.

**`CalendarioClases.tsx` is 696 lines — largest frontend file:**
- Problem: Monolithic calendar component with no code splitting.
- Files: `apps/web/src/components/clases/CalendarioClases.tsx`
- Cause: UI, data fetching, and business logic are co-located.
- Improvement path: Extract event rendering into sub-components; consider lazy loading the calendar library.

---

## Fragile Areas

**`$executeRaw` SQL in portal reservation creation is MySQL-specific:**
- Files: `apps/api/src/routes/portal.routes.ts` (lines 573–577, 624–628), `apps/api/src/routes/reservaciones.routes.ts` (lines 107–108)
- Why fragile: The raw SQL uses backtick-quoted table name `` `Class` `` which is MySQL syntax. Switching databases or running Prisma's `migrate reset` with a different collation could silently break the atomic spot check.
- Safe modification: Keep the raw SQL pattern — it provides the needed atomicity — but add a comment explaining the MySQL-only dependency. Any DB migration must verify this query.

**`spotsLeft` is computed from a stale snapshot (`capacity - spotsBooked`) on every class list call:**
- Files: `apps/api/src/routes/portal.routes.ts` (lines 60, 109)
- Why fragile: `spotsBooked` can lag real reservation counts if a transaction fails mid-way (e.g., the raw SQL increments `spotsBooked` but the reservation insert fails). Over time `spotsBooked` can diverge from `COUNT(reservations WHERE status NOT IN CANCELLED)`.
- Safe modification: Add a periodic reconciliation job or a DB trigger. For reads, consider always computing from `COUNT` rather than the cached column.

**`ReservacionesSection.tsx` is 567 lines — the landing widget:**
- Files: `apps/web/src/components/landing/ReservacionesSection.tsx`
- Why fragile: Large component with the kiosk-landing provisional-reservation flow; any change risks breaking the entire widget.
- Safe modification: Extract the multi-step form into separate step components before making changes.

---

## Scaling Limits

**MongoDB is imported and configured but not used for any current domain logic:**
- Current capacity: MongoDB is connected at startup (`apps/api/src/config/mongodb.ts`) but no route or service creates MongoDB documents.
- Limit: Unnecessary open connection and startup cost.
- Scaling path: Remove MongoDB config and dependency until it is needed, or document what it is reserved for (e.g., audit logs, sessions).

---

## Dependencies at Risk

**`MERCADO_PAGO` value cast via `as PaymentMethod` will fail at Prisma level:**
- Risk: Prisma generates and enforces its DB enum from `schema.prisma`. `'MERCADO_PAGO'` is not in the `PaymentMethod` enum definition; Prisma will reject the value at runtime even if TypeScript compiles.
- Impact: All MercadoPago payment confirmations (both webhook and fallback) will throw a Prisma validation error.
- Migration plan: Add `MERCADO_PAGO` to the enum and migrate before enabling live payments.

---

## Missing Critical Features

**No email notifications for any event:**
- Problem: Account approvals deliver `tempPassword` in the API response only. Portal booking confirmations, cancellations, and payment failures generate no client-facing notifications.
- Blocks: Fully self-service portal onboarding; client cannot receive their credentials without manual admin communication.

**No portal cancellation endpoint:**
- Problem: Clients have no way to cancel a reservation from the portal UI. Only admin/instructor routes support cancellation.
- Blocks: Self-service portal UX; 5-hour cancellation policy cannot be enforced client-side.

**`Ingreso` records are never auto-created on MercadoPago payment:**
- Problem: The accounting module (`contabilidad.routes.ts`) has `Ingreso` CRUD but neither the webhook nor the `verificar-pago-paquete` fallback creates an `Ingreso` record when a payment is approved. MercadoPago revenue does not appear in the accounting ledger automatically.
- Blocks: Accurate financial reporting; the contabilidad module shows manual entries only.
- Files: `apps/api/src/routes/webhook.routes.ts` (no Ingreso create), `apps/api/src/routes/portal.routes.ts` (no Ingreso create)

---

## Test Coverage Gaps

**No test files found anywhere in the project:**
- What's not tested: All API routes, webhook signature validation, session counter logic, payment flow, atomic spot booking, membership activation.
- Files: `apps/api/src/routes/`, `apps/api/src/services/`
- Risk: Regressions in payment and booking logic will go undetected. The webhook bypass in dev means the full payment path is only testable in production.
- Priority: High — especially for `webhook.routes.ts`, `portal.routes.ts` membership activation, and the `$executeRaw` atomic booking pattern.

---

*Concerns audit: 2026-05-05*
