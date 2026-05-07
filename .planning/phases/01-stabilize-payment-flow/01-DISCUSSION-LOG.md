# Phase 1: Stabilize Payment Flow - Discussion Log

**Date:** 2026-05-05
**Mode:** Interactive

## Webhook validation en dev

| Question | Options | Selected |
|----------|---------|----------|
| ¿Cómo manejar validación en dev? | Forzar siempre, Auto-generar secret, Mantener bypass | Forzar siempre |
| Si no hay MP_WEBHOOK_SECRET | Default hardcoded, Generar al startup, Error al boot | Default hardcoded ('dev-webhook-secret-2026') |
| ¿Qué partes validar? | Header + query, Solo header x-signature, Full body | Solo header x-signature |
| Response si firma inválida | 401 + error, 403 sin detalles, 200 silent | 401 + error (INVALID_SIGNATURE) |

## Fallback verificar-pago

| Question | Options | Selected |
|----------|---------|----------|
| ¿Qué hacer con hardcoded CONFIRMED? | Poll MP directo, Eliminar, Poll con rate limit | Poll MP directo |
| ¿Unificar endpoints? | Un unificado, Separados, Con tipo param | Endpoint unificado |
| ¿Cómo consultar MP? | Reutilizar servicio, Directo SDK, Servicio dedicado | Reutilizar mercadopago.service |
| ¿Procesar si approved? | Solo lectura, También confirma, Lectura + trigger | Solo lectura |

## PaymentMethod enum

| Question | Options | Selected |
|----------|---------|----------|
| ¿Dónde agregar? | Prisma enum + migrate, Solo TS types, Prisma string | Prisma enum + migrate |
| ¿Qué actualizar después? | Re-generate types + validators, Solo DB, Full audit | Re-generate types + validators |

## Ingreso records (contabilidad)

| Question | Options | Selected |
|----------|---------|----------|
| ¿Qué datos capturar? | Estándar contable, Mínimo viable, Completo con metadata | Estándar contable |
| ¿Cómo ligar cuentas? | Según tipo pago, Cuenta única, Configurable admin | Según tipo de pago |
| ¿Dónde crear? | Webhook handler, Servicio dedicado, Event-based | Servicio dedicado |
| ¿Transacción? | Misma transacción, Separada, Queue de reintentos | Misma transacción atómica |

## Membership activation logic

| Question | Options | Selected |
|----------|---------|----------|
| ¿Dónde centralizar? | payment-processor.service, Extender mercadopago, Servicios separados | payment-processor.service.ts |
| Responsabilidad service vs routes | Routes thin servicio thick, Servicio hace todo, Servicio solo DB | Routes thin, servicio thick |
| Clave idempotencia | PaymentId MP, External reference, Ambos | PaymentId de MP |

## Reservations stuck en PENDING

| Question | Options | Selected |
|----------|---------|----------|
| ¿Cómo resolver? | Cron job automático, Botón manual, Frontend polling | Cron job automático |
| Threshold | 30 min, 1 hora, 15 min | 30 minutos |

## Pago no encontrado en DB

| Question | Options | Selected |
|----------|---------|----------|
| ¿Cómo responder? | 404 + log auditoría, 200 silencioso, Log + alerta | 404 + log de auditoría |

## Reintentos webhook

| Question | Options | Selected |
|----------|---------|----------|
| Webhook duplicado | 200 si ya existe, Re-procesar si cambió, 409 Conflict | 200 si ya existe |

## Testing local del webhook

| Question | Options | Selected |
|----------|---------|----------|
| ¿Cómo probar localmente? | Script payloads mock, ngrok/tunnel, Sandbox real | Script de payloads mock |
