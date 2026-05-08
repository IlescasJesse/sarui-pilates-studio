# Phase 6: Fix Contabilidad MP — Context

**Requirements:** H-03

**Problema:** Ni el webhook ni el fallback `verificar-pago-paquete` crean un registro `Ingreso` cuando un pago MP es aprobado.

**Modelo Ingreso** requiere:
- `cuentaContableId` — references CuentaContable
- `concepto` — descripción del ingreso
- `monto` — monto del pago
- `fecha` — fecha del pago
- `origen` — `PORTAL_MERCADOPAGO`
- `referenciaId` — membership ID (opcional)
- `creadoPorId` — user ID

**Flujos a modificar:**
1. `webhook.routes.ts:83-113` — membership upsert para paquete MP. No tiene req.user.
2. `portal.routes.ts:827-857` — mismo upsert en fallback. Tiene req.user autenticado.

**Decisión:** Para webhook sin auth, buscar primer admin como creador. Para portal, usar req.user.id.
