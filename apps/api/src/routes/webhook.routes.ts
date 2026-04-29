import { Router, Request, Response, NextFunction } from 'express';
import { createHmac } from 'crypto';
import { prisma } from '../config/database';
import { getPayment } from '../services/mercadopago.service';
import { ApiSuccess } from '../utils/response';
import { env } from '../config/env';

const router = Router();

function validateMpSignature(req: Request): boolean {
  const secret = env.MP_WEBHOOK_SECRET;
  if (!secret) return true; // sin secret configurado, saltar en dev

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

    // external_reference contiene el reservationId
    const reservationId = payment.external_reference;
    if (!reservationId) {
      res.sendStatus(200);
      return;
    }

    if (payment.status === 'approved') {
      // Confirmar la reservación y registrar el pago
      await prisma.$transaction(async (tx) => {
        const reservacion = await tx.reservation.update({
          where: { id: reservationId },
          data: {
            status: 'CONFIRMED',
            mercadoPagoPaymentId: String(data.id),
          },
          include: { class: true },
        });

        // Crear registro de pago
        await tx.payment.upsert({
          where: { reservationId },
          create: {
            reservationId,
            amount: payment.transaction_amount ?? 0,
            method: 'CARD',
            status: 'PAID',
            reference: String(data.id),
            paidAt: new Date(),
          },
          update: {
            status: 'PAID',
            paidAt: new Date(),
            reference: String(data.id),
          },
        });

        return reservacion;
      });
    } else if (payment.status === 'rejected' || payment.status === 'cancelled') {
      // Cancelar la reservación y liberar el spot
      const reservacion = await prisma.reservation.findUnique({
        where: { id: reservationId },
      });

      if (reservacion && reservacion.status === 'PENDING_APPROVAL') {
        await prisma.$transaction([
          prisma.reservation.update({
            where: { id: reservationId },
            data: { status: 'CANCELLED', cancelledAt: new Date() },
          }),
          prisma.class.update({
            where: { id: reservacion.classId },
            data: { spotsBooked: { decrement: 1 } },
          }),
        ]);
      }
    }

    res.sendStatus(200);
  } catch (error) {
    next(error);
  }
});

export default router;
