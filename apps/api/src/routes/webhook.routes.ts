import { Router, Request, Response, NextFunction } from 'express';
import { createHmac } from 'crypto';
import { prisma } from '../config/database';
import { getPayment } from '../services/mercadopago.service';
import { ApiSuccess } from '../utils/response';
import { env } from '../config/env';
import { activateMembershipFromPayment } from '../services/membership.service';

const router = Router();

let _warnedNoSecret = false;
function validateMpSignature(req: Request): boolean {
  const secret = env.MP_WEBHOOK_SECRET;
  if (!secret) {
    if (!_warnedNoSecret) {
      console.warn('[webhook] MP_WEBHOOK_SECRET no configurado — validación de firma DESACTIVADA (solo dev)');
      _warnedNoSecret = true;
    }
    return true;
  }

  const xSignature = req.headers['x-signature'] as string | undefined;
  const xRequestId = req.headers['x-request-id'] as string | undefined;
  if (!xSignature || !xRequestId) return false;

  const tsMatch = xSignature.match(/ts=([^,]+)/);
  const v1Match = xSignature.match(/v1=([^,]+)/);
  if (!tsMatch || !v1Match) return false;

  const ts = tsMatch[1];
  const v1 = v1Match[1];
  const dataId = (req.body as { data?: { id?: string } })?.data?.id ?? '';

  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
  const expected = createHmac('sha256', secret).update(manifest).digest('hex');

  return expected === v1;
}

// POST /api/v1/portal/webhook/mercadopago
// MercadoPago notifica aquí cuando se procesa un pago
router.post('/mercadopago', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!validateMpSignature(req)) {
      res.sendStatus(401);
      return;
    }

    const { type, data } = req.body as { type: string; data: { id: string } };

    // Solo procesamos notificaciones de pago
    if (type !== 'payment' || !data?.id) {
      res.sendStatus(200);
      return;
    }

    const payment = await getPayment(data.id);

    const externalRef = payment.external_reference;
    if (!externalRef) {
      res.sendStatus(200);
      return;
    }

    // Pago de paquete/membresía: PKG:{packageId}:{clientId}
    if (externalRef.startsWith('PKG:')) {
      const parts = externalRef.split(':');
      if (parts.length !== 3) {
        res.sendStatus(200);
        return;
      }
      const packageId = parts[1];
      const clientId = parts[2];

      if (payment.status === 'approved') {
        await prisma.$transaction(async (tx) => {
          await activateMembershipFromPayment(tx, {
            packageId,
            clientId,
            mpPaymentId: String(data.id),
            transactionAmount: payment.transaction_amount,
            paidAt: new Date(),
          });
        });
      }

      res.sendStatus(200);
      return;
    }

    // Pago de reservación (flujo existente)
    const reservationId = externalRef;

    if (payment.status === 'approved') {
      await prisma.$transaction(async (tx) => {
        const reservacion = await tx.reservation.update({
          where: { id: reservationId },
          data: {
            status: 'CONFIRMED',
            mercadoPagoPaymentId: String(data.id),
          },
          include: { class: true },
        });

        const esParcial = reservacion.notes?.startsWith('PAGO_PARCIAL:') ?? false;

        await tx.payment.upsert({
          where: { reservationId },
          create: {
            reservationId,
            amount: payment.transaction_amount ?? 0,
            method: 'CARD',
            status: 'PAID',
            reference: String(data.id),
            paidAt: new Date(),
            isPartial: esParcial,
          },
          update: {
            status: 'PAID',
            paidAt: new Date(),
            reference: String(data.id),
            isPartial: esParcial,
          },
        });

        return reservacion;
      });
    } else if (payment.status === 'rejected' || payment.status === 'cancelled') {
      const reservacion = await prisma.reservation.findUnique({
        where: { id: reservationId },
      });

      if (reservacion && reservacion.status === 'PENDING_APPROVAL') {
        await prisma.$transaction(async (tx) => {
          await tx.reservation.update({
            where: { id: reservationId },
            data: { status: 'CANCELLED', cancelledAt: new Date() },
          });

          await tx.class.update({
            where: { id: reservacion.classId },
            data: { spotsBooked: { decrement: 1 } },
          });

          if (reservacion.membershipId) {
            const membership = await tx.membership.findUnique({
              where: { id: reservacion.membershipId },
              select: { sessionsRemaining: true, sessionsUsed: true },
            });
            if (membership) {
              await tx.membership.update({
                where: { id: reservacion.membershipId },
                data: {
                  sessionsRemaining: { increment: 1 },
                  sessionsUsed: { decrement: 1 },
                  status: 'ACTIVE',
                },
              });
            }
          }
        });
      }
    }

    res.sendStatus(200);
  } catch (error) {
    next(error);
  }
});

export default router;
