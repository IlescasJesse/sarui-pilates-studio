# Hallazgos — Auditoría de Código

**Fecha:** 2026-05-08
**Fases cubiertas:** 1-4
**Origen:** CONCERNS.md + verificación contra código vivo + revisión de cambios en fases 1-3

---

## Resumen

| Severidad | Conteo | Hallazgos |
|-----------|--------|-----------|
| 🔴 Critical | 3 | sessionsRemaining inconsistente, MEMBERSHIP_STATUS no se setea EXHAUSTED en portal, Ingreso no se auto-crea en pagos MP |
| 🟡 High | 7 | PIN default '0000', tempPassword en texto plano, JWT en localStorage, QR leak en buscar-cliente, webhook sin validacion en dev, sin rate limiting, portal sin cancelacion |
| 🔵 Medium | 5 | portal.routes.ts >500 lines, logica duplicada activacion membresia, verificar-pago hardcoded (FIXED), MongoDB sin uso, sin tests |
| ⚡ Low | 6 | Sin paginacion en /clases, CalendarioClases.tsx 698 lines, ReservacionesSection.tsx 567 lines, $executeRaw MySQL-specific, spotsLeft stale, code smells as PaymentMethod |

---

## Bugs

### 🔴 Critical

#### ~~H-01: sessionsRemaining inconsistente entre flujos~~ ✅ FIXED
- **Archivo:** `apps/api/src/routes/reservaciones.routes.ts:150-156`, `apps/api/src/routes/portal.routes.ts:428-435`
- **Descripción:** El contador `sessionsRemaining` se decrementa al reservar pero NO se restaura al cancelar. El webhook y el flujo `verificar-pago-paquete` setean `sessionsRemaining` solo al crear la membresía, nunca lo ajustan después de eventos subsecuentes. Con el tiempo, `sessionsUsed + sessionsRemaining != totalSessions`.
- **Estado:** ✅ Corregido. Los 3 flujos de cancelación (portal DELETE /reservaciones/:id, webhook, admin PATCH /:id) restauran sessionsRemaining + sessionsUsed. El flujo `reservar-provisional` y admin `POST /reservaciones` setean EXHAUSTED cuando corresponde (ver H-02).
- **Severidad:** 🔴 Critical
- **Origen:** CONCERNS.md

#### ~~H-02: MEMBERSHIP_STATUS nunca se setea EXHAUSTED vía portal~~ ✅ FIXED
- **Archivo:** `apps/api/src/routes/portal.routes.ts:428-435`
- **Descripción:** El admin flow (`reservaciones.routes.ts:156`) setea `status: 'EXHAUSTED'` cuando `sessionsRemaining` llega a 0. El portal (`/reservar-provisional` y `/reservaciones`) solo decrementa el contador pero nunca actualiza el status.
- **Estado:** ✅ Corregido. `reservar-provisional` ya usa `membresia.sessionsRemaining - 1 <= 0 ? 'EXHAUSTED' : 'ACTIVE'`. Admin `POST /reservaciones` también usa el mismo patrón.
- **Severidad:** 🔴 Critical
- **Origen:** CONCERNS.md / Verificado en código

#### H-03: Ingreso no se auto-crea en pagos de MercadoPago
- **Archivo:** `apps/api/src/routes/webhook.routes.ts`, `apps/api/src/routes/portal.routes.ts`
- **Descripción:** El módulo de contabilidad (`contabilidad.routes.ts`) tiene CRUD de `Ingreso`, pero ni el webhook ni el fallback `verificar-pago-paquete` crean un registro `Ingreso` cuando un pago es aprobado. Los ingresos de MP no aparecen en el libro contable automáticamente.
- **Impacto:** Reportes financieros inexactos — el módulo contable solo muestra entradas manuales.
- **Severidad:** 🔴 Critical
- **Sugerencia de Fix:** En ambos flujos (webhook + fallback), después de crear la membresía y el payment, crear también un registro `Ingreso` con monto, concepto, y referencia al payment.
- **Origen:** CONCERNS.md / Verificado en código

---

### 🟡 High (Security & Bloqueantes)

#### H-04: PIN default '0000' en creación de cuentas
- **Archivo:** `apps/api/src/routes/portal.routes.ts:202`, `apps/api/src/routes/clientes.routes.ts:106`
- **Descripción:** Cuando se aprueba una solicitud de cuenta, el PIN se setea a `hashPassword('0000')`. Lo mismo ocurre en creación manual de clientes cuando no se provee PIN. No hay flujo de force-change-PIN.
- **Impacto:** Cualquiera que conozca el QR del cliente e intente `0000` puede hacer check-in en kiosko si el cliente no ha cambiado su PIN.
- **Severidad:** 🟡 High
- **Sugerencia de Fix:** Generar PIN aleatorio de 4 dígitos en la creación e incluirlo en la respuesta de aprobación junto a `tempPassword`. Agregar endpoint `PATCH /portal/cambiar-pin`.
- **Origen:** CONCERNS.md / Verificado en código

#### H-05: tempPassword expuesta en texto plano en respuesta API
- **Archivo:** `apps/api/src/routes/portal.routes.ts:235`
- **Descripción:** `tempPassword` se devuelve en JSON de `PATCH /api/v1/portal/solicitudes/:id`. Visible en logs del servidor, devtools del browser, y cualquier intermediario HTTP sin TLS.
- **Impacto:** La contraseña inicial del portal del cliente es interceptable.
- **Severidad:** 🟡 High
- **Sugerencia de Fix:** Enviar tempPassword por email transaccional. Hasta implementar email, documentar el riesgo y forzar HTTPS en producción.
- **Origen:** CONCERNS.md / Verificado en código

#### H-06: JWT tokens almacenados en localStorage
- **Archivo:** `apps/web/src/hooks/useAuth.ts:84-86`, `apps/web/src/app/portal/login/page.tsx:79-80`, `apps/web/src/lib/api-client.ts:25`
- **Descripción:** Admin dashboard guarda JWT en `localStorage` vía `useAuth.ts`. Portal también guarda token como `sarui_token`. Cualquier vulnerabilidad XSS puede exfiltrar los tokens.
- **Impacto:** Account takeover si hay XSS en cualquier página del dashboard o portal.
- **Severidad:** 🟡 High
- **Sugerencia de Fix:** Migrar tokens a `httpOnly` cookies. Para el portal, implementar endpoint API que setee la cookie.
- **Origen:** CONCERNS.md / Verificado en código

#### H-07: buscar-cliente expone QR code sin autenticación
- **Archivo:** `apps/api/src/routes/portal.routes.ts:317`
- **Descripción:** `POST /portal/buscar-cliente` devuelve `qrCode` (UUID usado para check-in en kiosko) para cualquier email conocido, sin autenticación.
- **Impacto:** El QR que permite check-in físico es obtenible por cualquiera que conozca el email del cliente.
- **Severidad:** 🟡 High
- **Sugerencia de Fix:** Remover `qrCode` de la respuesta de `buscar-cliente`. No sirve propósito en la UI del widget. El QR ya está disponible autenticado vía `GET /portal/mi-qr`.
- **Origen:** CONCERNS.md / Verificado en código

#### H-08: Webhook MP sin validación de firma fuera de producción
- **Archivo:** `apps/api/src/config/env.ts:22`, `apps/api/src/routes/webhook.routes.ts:12-19`
- **Descripción:** `MP_WEBHOOK_SECRET` default es `''`. En cualquier entorno donde no esté configurado (dev, staging), la validación de firma se salta con un `console.warn`. Zod solo lo exige en `NODE_ENV=production`.
- **Impacto:** Endpoint de webhook acepta POST requests sin firma válida en entornos no productivos.
- **Severidad:** 🟡 High
- **Sugerencia de Fix:** Agregar check que falle cerrado si `MP_WEBHOOK_SECRET` está vacío independientemente de `NODE_ENV`. Usar un secret de prueba para desarrollo local.
- **Origen:** CONCERNS.md / Verificado en código

#### H-09: Sin rate limiting en endpoints públicos del portal
- **Archivo:** `apps/api/src/routes/portal.routes.ts:129-153, 255-333`
- **Descripción:** `/portal/solicitar-cuenta`, `/portal/buscar-cliente`, `/portal/login` no tienen rate limiting. `kiosk.routes.ts` usa `express-rate-limit` pero las rutas del portal no.
- **Impacto:** Posible enumeración de emails registrados, abuso del formulario de solicitud, ataques de fuerza bruta al login.
- **Severidad:** 🟡 High
- **Sugerencia de Fix:** Aplicar `express-rate-limit` a todas las rutas públicas del portal. Considerar CAPTCHA o throttling por IP.
- **Origen:** CONCERNS.md / Verificado en código

#### H-10: Portal sin endpoint de cancelación de reservación
- **Archivo:** `apps/api/src/routes/portal.routes.ts` — sin ruta DELETE
- **Descripción:** No existe `DELETE /portal/reservaciones/:id` o similar. Los clientes no pueden cancelar sus reservaciones desde el portal. Solo admin/instructor tienen ruta de cancelación en `reservaciones.routes.ts`.
- **Impacto:** UX del portal incompleta — política de cancelación de 5 horas no se puede enforce del lado del cliente.
- **Severidad:** 🟡 High
- **Sugerencia de Fix:** Implementar `DELETE /api/v1/portal/reservaciones/:id` que valide la política de 5h, decremente `spotsBooked`, restaure sesiones si `MEMBERSHIP`, y setee `cancelledOnTime`.
- **Origen:** CONCERNS.md / Verificado en código

---

### 🔵 Medium

#### H-11: portal.routes.ts excede límite de 500 líneas (947 líneas)
- **Archivo:** `apps/api/src/routes/portal.routes.ts` — 947 líneas
- **Descripción:** Mezcla rutas públicas, auth, kiosko, MercadoPago, activación de membresías, y generación QR. Violación de la convención del proyecto de <500 líneas.
- **Impacto:** Alta carga cognitiva, testing difícil, riesgo de merge conflicts.
- **Severidad:** 🔵 Medium
- **Sugerencia de Fix:** Dividir en `portal-public.routes.ts`, `portal-auth.routes.ts`, `portal-payment.routes.ts`. Extraer lógica de activación a `services/membership.service.ts`.
- **Origen:** CONCERNS.md / Verificado en código

#### ~~H-12: Lógica de activación de membresía duplicada~~ ✅ FIXED
- **Archivo:** `apps/api/src/routes/webhook.routes.ts:83-113`, `apps/api/src/routes/portal.routes.ts:826-857`
- **Descripción:** Webhook y fallback `verificar-pago-paquete` contienen bloques casi idénticos de `upsert` + `payment.create`. Cualquier cambio debe aplicarse en ambos.
- **Estado:** ✅ Corregido. Lógica extraída a `services/membership.service.ts:activateMembershipFromPayment()`. Ambos flujos la consumen. También se unificó `autoCreateIngreso` dentro del mismo servicio.
- **Severidad:** 🔵 Medium
- **Origen:** CONCERNS.md / Verificado en código

#### ~~H-13: verificar-pago retorna reservacionStatus hardcoded~~ ✅ FIXED
- **Archivo:** `apps/api/src/routes/portal.routes.ts:938-940`
- **Descripción:** Anteriormente retornaba `reservacionStatus: 'CONFIRMED'` hardcoded aunque el pago estuviera `pending`.
- **Estado:** ✅ Corregido. Ahora lee `updatedReservacion?.status ?? reservacion.status` de la DB.
- **Origen:** CONCERNS.md / Verificado en código — resuelto

#### H-14: MongoDB conectado y configurado sin uso
- **Archivo:** `apps/api/src/config/mongodb.ts`, `apps/api/src/config/env.ts:12`
- **Descripción:** MongoDB/Mongoose se conecta al inicio pero ningún módulo de dominio crea documentos MongoDB. Conexión abierta innecesaria.
- **Impacto:** Startup cost innecesario, complejidad agregada sin beneficio.
- **Severidad:** 🔵 Medium
- **Sugerencia de Fix:** Remover MongoDB hasta que se necesite, o documentar para qué está reservado (audit logs, sesiones).
- **Origen:** CONCERNS.md / Verificado en código

#### H-15: Sin tests en todo el proyecto
- **Archivo:** `apps/api/src/routes/`, `apps/api/src/services/` — sin archivos de test
- **Descripción:** No se encontraron archivos de test en ninguna parte del proyecto. El webhook, flujo de pago, reservaciones, y lógica de sesiones no tienen cobertura.
- **Impacto:** Regresiones en payment y booking pasan desapercibidas. El bypass de webhook en dev significa que el flujo de pago completo solo es testeable en producción.
- **Severidad:** 🔵 Medium
- **Sugerencia de Fix:** Priorizar tests para `webhook.routes.ts`, `portal.routes.ts` (activación membresía), y `$executeRaw` de booking atómico.
- **Origen:** CONCERNS.md / Verificado en código

---

### ⚡ Low (Tech Debt & Mejoras)

#### H-16: GET /portal/clases sin paginación
- **Archivo:** `apps/api/src/routes/portal.routes.ts:20-68`
- **Descripción:** Query trae todas las clases no canceladas de los próximos 30 días sin `take`/`skip`. Dependiendo de densidad de clases, pueden ser 100+ registros con relaciones anidadas.
- **Severidad:** ⚡ Low
- **Sugerencia de Fix:** Agregar query params `?page` / `?limit` con default 20-30. Agregar índice compuesto en `(startAt, isActive, isCancelled, deletedAt)`.
- **Origen:** CONCERNS.md / Verificado en código

#### H-17: CalendarioClases.tsx — 698 líneas
- **Archivo:** `apps/web/src/components/clases/CalendarioClases.tsx` — 698 líneas
- **Descripción:** Componente monolítico de calendario sin code splitting. UI, data fetching, y lógica de negocio co-localizadas.
- **Severidad:** ⚡ Low
- **Sugerencia de Fix:** Extraer event rendering a subcomponentes; considerar lazy loading de la librería de calendario.
- **Origen:** CONCERNS.md / Verificado (creció de 696 a 698 líneas post-Fase 2)

#### H-18: $executeRaw usa sintaxis MySQL (backticks)
- **Archivo:** `apps/api/src/routes/portal.routes.ts:573-577, 624-628`, `apps/api/src/routes/reservaciones.routes.ts:107-108`
- **Descripción:** El raw SQL usa backtick-quoted `` `Class` `` que es sintaxis MySQL. Cambiar de base de datos rompería estas consultas silenciosamente.
- **Severidad:** ⚡ Low
- **Sugerencia de Fix:** Mantener el patrón raw SQL para atomicidad, pero agregar comentario explicitando la dependencia MySQL-only.
- **Origen:** CONCERNS.md / Verificado en código

#### H-19: spotsLeft computado de snapshot stale
- **Archivo:** `apps/api/src/routes/portal.routes.ts:60, 109`
- **Descripción:** `spotsLeft = capacity - spotsBooked`. `spotsBooked` puede desfasarse si una transacción falla a medio camino (raw SQL incrementa spotsBooked pero insert de reservación falla).
- **Severidad:** ⚡ Low
- **Sugerencia de Fix:** Considerar job periódico de reconciliación o compute desde `COUNT` en vez de columna cachead.
- **Origen:** CONCERNS.md / Verificado en código

#### H-20: ReservacionesSection.tsx — 567 líneas
- **Archivo:** `apps/web/src/components/landing/ReservacionesSection.tsx` — 567 líneas
- **Descripción:** Componente grande del widget de landing del kiosko con flujo de reservación provisional. Cualquier cambio riesgo de romper el widget completo.
- **Severidad:** ⚡ Low
- **Sugerencia de Fix:** Extraer el multi-step form en step components separados antes de hacer cambios.
- **Origen:** CONCERNS.md / Verificado en código

#### H-21: as PaymentMethod casts persisten (ahora seguros pero code smell)
- **Archivo:** `apps/api/src/routes/webhook.routes.ts:97, 107`, `apps/api/src/routes/portal.routes.ts:840, 850`
- **Descripción:** Los casts `'MERCADO_PAGO' as PaymentMethod` continúan existiendo. Ya no causan error porque el enum incluye `MERCADO_PAGO` (fixed en Fase 1), pero indican que los tipos de Prisma quizás no se regeneraron.
- **Severidad:** ⚡ Low
- **Sugerencia de Fix:** Remover los casts `as PaymentMethod` y regenerar tipos con `npx prisma generate`.
- **Origen:** CONCERNS.md / Verificación post-Fase 1 — persisten

---

## Recomendaciones

### Prioridad Inmediata (Critical)
1. Arreglar consistencia de `sessionsRemaining` en flujo de cancelaciones
2. Agregar `EXHAUSTED` status en ruta de reservación del portal
3. Auto-crear `Ingreso` en pagos MP exitosos (webhook + fallback)

### Prioridad Alta (Security)
4. Reemplazar PIN default '0000' con PIN aleatorio
5. Implementar envío de `tempPassword` por email
6. Migrar JWT de localStorage a httpOnly cookies
7. Remover `qrCode` de respuesta de `buscar-cliente`
8. Forzar validación de webhook secret incluso fuera de producción
9. Agregar rate limiting a rutas públicas del portal
10. Implementar endpoint de cancelación en portal

### Prioridad Media (Tech Debt)
11. Refactorizar `portal.routes.ts` en múltiples archivos
12. Extraer lógica duplicada de activación de membresía a servicio compartido
13. Remover o documentar conexión MongoDB no utilizada
14. Agregar tests unitarios para flujos críticos (pago, reservación, sesiones)

### Prioridad Baja (Mejoras)
15. Agregar paginación a `GET /portal/clases`
16. Refactorizar componentes frontend grandes (CalendarioClases, ReservacionesSection)
17. Documentar dependencia MySQL en raw SQL
18. Remover type casts `as PaymentMethod` innecesarios
19. Agregar job de reconciliación para `spotsBooked`

---

## Errores Producción (2026-05-08)

### H-11: Raw SQL usa `Class` en vez de `classes`
- **Archivos:** `portal.routes.ts:590,640`, `reservaciones.routes.ts:107`
- **Descripción:** Las consultas raw SQL usan `` `Class` `` pero Prisma mapea el modelo a `classes` via `@@map`. MySQL no encuentra la tabla porque el nombre real es `classes`.
- **Impacto:** `POST /api/v1/reservaciones` falla con 500: `Table 'sarui_studio.Class' doesn't exist`
- **Severidad:** 🔴 Critical
- **Fix:** Se reemplazó `` `Class` `` por `` `classes` `` en los 3 `$executeRaw`
- **Commit:** `bb91886`

### H-12: Migración faltante — `memberships.mercadoPagoPaymentId`
- **Archivos:** `schema.prisma:323`, `routes/portal.routes.ts`, `routes/webhook.routes.ts`
- **Descripción:** El campo `mercadoPagoPaymentId` existe en el schema de Prisma pero nunca se generó una migración. La BD no tiene la columna.
- **Impacto:** `GET /api/v1/membresias` falla con 500: `Column 'memberships.mercadoPagoPaymentId' doesn't exist`
- **Severidad:** 🔴 Critical
- **Fix:** Se creó migración `20260508000000_add_memberships_mp_payment_id` con `ALTER TABLE memberships ADD COLUMN mercadoPagoPaymentId`
- **Commit:** `bb91886`

---

## Mejoras Portal (2026-05-08)

### F-01: Validación de membresías en portal + pago parcial
- **Descripción:** Al reservar desde el portal, si el cliente no tiene membresías activas se oculta la opción "Enviar solicitud sin pago" y se fuerza el pago. Se agregó opción de pago parcial con monto personalizado.
- **Archivos backend:**
  - `portal.routes.ts` — validación de membresías activas antes de crear reservación; soporte para `pagoParcial`/`montoPagado` en schema; nota `PAGO_PARCIAL:monto/completo` en `reservation.notes`
  - `webhook.routes.ts` — detecta `PAGO_PARCIAL` en notes y marca `isPartial: true` en el Payment
  - `schema.prisma` — `Payment.isPartial` Boolean @default(false)
  - Migración: `20260508210000_add_payment_is_partial`
- **Archivos frontend:**
  - `agendar/[claseId]/page.tsx` — usa `useMisMembresias()` para ocultar "Sin pago" si no hay membresías; muestra costo en card "Pagar ahora"; toggle + input de pago parcial en resumen
  - `usePortal.ts` — tipado extendido con `pagoParcial`, `montoPagado`
- **Commit:** _(este commit)_
