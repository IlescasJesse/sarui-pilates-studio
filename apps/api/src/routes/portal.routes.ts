import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { ApiSuccess, ApiError } from '../utils/response';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import { createPreference, getPayment } from '../services/mercadopago.service';
import { z } from 'zod';

const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/portal/clases  — público, sin auth
// Devuelve clases disponibles en los próximos 30 días con spots libres
// ─────────────────────────────────────────────────────────────────────────────
router.get('/clases', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const now = new Date();
    const in30Days = new Date();
    in30Days.setDate(in30Days.getDate() + 30);

    const clases = await prisma.class.findMany({
      where: {
        deletedAt: null,
        isActive: true,
        isCancelled: false,
        startAt: { gte: now, lte: in30Days },
      },
      orderBy: { startAt: 'asc' },
      include: {
        instructor: { select: { id: true, firstName: true, lastName: true } },
        tipoActividad: {
          select: { id: true, nombre: true, color: true, modalidad: true, costo: true },
        },
      },
    });

    const result = clases.map((c) => ({
      id: c.id,
      title: c.title ?? c.tipoActividad?.nombre ?? 'Clase',
      tipoActividad: c.tipoActividad,
      instructor: c.instructor,
      startAt: c.startAt.toISOString(),
      endAt: c.endAt.toISOString(),
      capacity: c.capacity,
      spotsBooked: c.spotsBooked,
      spotsLeft: c.capacity - c.spotsBooked,
      location: c.location,
      costo: c.tipoActividad?.costo ?? null,
    }));

    ApiSuccess(res, result);
  } catch (error) {
    next(error);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/portal/clases/:id  — público
// ─────────────────────────────────────────────────────────────────────────────
router.get('/clases/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const clase = await prisma.class.findUnique({
      where: { id: req.params.id, deletedAt: null, isActive: true, isCancelled: false },
      include: {
        instructor: { select: { id: true, firstName: true, lastName: true } },
        tipoActividad: {
          select: { id: true, nombre: true, color: true, modalidad: true, costo: true },
        },
      },
    });

    if (!clase) {
      ApiError(res, 'NOT_FOUND', 'Clase no encontrada o no disponible', 404);
      return;
    }

    ApiSuccess(res, {
      id: clase.id,
      title: clase.title ?? clase.tipoActividad?.nombre ?? 'Clase',
      tipoActividad: clase.tipoActividad,
      instructor: clase.instructor,
      startAt: clase.startAt.toISOString(),
      endAt: clase.endAt.toISOString(),
      capacity: clase.capacity,
      spotsBooked: clase.spotsBooked,
      spotsLeft: clase.capacity - clase.spotsBooked,
      location: clase.location,
      costo: clase.tipoActividad?.costo ?? null,
    });
  } catch (error) {
    next(error);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// A partir de aquí requiere auth de CLIENT
// ─────────────────────────────────────────────────────────────────────────────
router.use(authMiddleware);
router.use(requireRole('CLIENT', 'ADMIN'));

const reservaSchema = z.object({
  claseId: z.string().min(1),
  pagarAhora: z.boolean(),
  // Requerido si pagarAhora = false
  portalWaConfirmed: z.boolean().optional(),
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/portal/reservaciones
// Crea una reservación desde el portal con o sin pago
// ─────────────────────────────────────────────────────────────────────────────
router.post('/reservaciones', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parse = reservaSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Datos inválidos',
          details: parse.error.errors,
        },
      });
      return;
    }

    const { claseId, pagarAhora, portalWaConfirmed } = parse.data;

    if (!pagarAhora && !portalWaConfirmed) {
      ApiError(res, 'WA_REQUIRED', 'Debes confirmar que ya contactaste al estudio por WhatsApp', 400);
      return;
    }

    // Obtener el cliente asociado al usuario autenticado
    const client = await prisma.client.findUnique({
      where: { userId: req.user!.id, deletedAt: null },
      include: { user: { select: { email: true } } },
    });

    if (!client) {
      ApiError(res, 'CLIENT_NOT_FOUND', 'Perfil de cliente no encontrado', 404);
      return;
    }

    // Verificar que la clase existe y tiene spots
    const clase = await prisma.class.findUnique({
      where: { id: claseId, deletedAt: null, isActive: true, isCancelled: false },
      include: { tipoActividad: true },
    });

    if (!clase) {
      ApiError(res, 'NOT_FOUND', 'Clase no encontrada o no disponible', 404);
      return;
    }

    if (clase.spotsBooked >= clase.capacity) {
      ApiError(res, 'CLASS_FULL', 'La clase ya no tiene lugares disponibles', 409);
      return;
    }

    // Verificar que no tenga reservación previa para esta clase
    const existing = await prisma.reservation.findFirst({
      where: {
        clientId: client.id,
        classId: claseId,
        status: { notIn: ['CANCELLED'] },
        deletedAt: null,
      },
    });

    if (existing) {
      ApiError(res, 'ALREADY_RESERVED', 'Ya tienes una reservación para esta clase', 409);
      return;
    }

    if (pagarAhora) {
      // ── Flujo con pago ────────────────────────────────────────────────────
      // 1. Crear reservación con status PENDING_APPROVAL (se confirma al pagar)
      const reservacion = await prisma.$transaction(async (tx) => {
        const r = await tx.reservation.create({
          data: {
            clientId: client.id,
            classId: claseId,
            origin: 'PORTAL',
            status: 'PENDING_APPROVAL',
            portalWaConfirmed: false,
          },
        });

        await tx.class.update({
          where: { id: claseId },
          data: { spotsBooked: { increment: 1 } },
        });

        return r;
      });

      // 2. Crear preferencia de MercadoPago
      const monto = Number(clase.tipoActividad?.costo ?? 0);
      if (monto === 0) {
        ApiError(res, 'INVALID_AMOUNT', 'Esta clase no tiene costo configurado', 400);
        return;
      }

      const preference = await createPreference({
        reservationId: reservacion.id,
        clientName: `${client.firstName} ${client.lastName}`,
        clientEmail: client.user.email,
        claseTitle: clase.title ?? clase.tipoActividad?.nombre ?? 'Clase',
        claseDate: clase.startAt.toLocaleDateString('es-MX', { dateStyle: 'long' }),
        amount: monto,
      });

      // 3. Guardar preferenceId en la reservación
      await prisma.reservation.update({
        where: { id: reservacion.id },
        data: { mercadoPagoPreferenceId: preference.id },
      });

      ApiSuccess(res, {
        reservacionId: reservacion.id,
        preferenceId: preference.id,
        checkoutUrl: preference.init_point,
        tipo: 'CON_PAGO',
      }, 201);

    } else {
      // ── Flujo sin pago (solicitud) ────────────────────────────────────────
      const reservacion = await prisma.$transaction(async (tx) => {
        const r = await tx.reservation.create({
          data: {
            clientId: client.id,
            classId: claseId,
            origin: 'PORTAL_REQUEST',
            status: 'PENDING_APPROVAL',
            portalWaConfirmed: true,
          },
          include: {
            class: {
              include: { tipoActividad: { select: { nombre: true } } },
            },
          },
        });

        await tx.class.update({
          where: { id: claseId },
          data: { spotsBooked: { increment: 1 } },
        });

        return r;
      });

      ApiSuccess(res, {
        reservacionId: reservacion.id,
        tipo: 'SOLICITUD',
        mensaje: 'Tu solicitud fue enviada. El equipo la revisará pronto.',
      }, 201);
    }
  } catch (error) {
    next(error);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/portal/mis-agendas  — cliente autenticado
// ─────────────────────────────────────────────────────────────────────────────
router.get('/mis-agendas', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const client = await prisma.client.findUnique({
      where: { userId: req.user!.id, deletedAt: null },
    });

    if (!client) {
      ApiError(res, 'CLIENT_NOT_FOUND', 'Perfil de cliente no encontrado', 404);
      return;
    }

    const reservaciones = await prisma.reservation.findMany({
      where: {
        clientId: client.id,
        origin: { in: ['PORTAL', 'PORTAL_REQUEST'] },
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        class: {
          include: {
            instructor: { select: { firstName: true, lastName: true } },
            tipoActividad: { select: { nombre: true, color: true } },
          },
        },
      },
    });

    ApiSuccess(res, reservaciones);
  } catch (error) {
    next(error);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/portal/verificar-pago
// Fallback para confirmar un pago desde la página de éxito cuando el webhook
// no puede alcanzar localhost. Verifica el pago directamente con MercadoPago.
// ─────────────────────────────────────────────────────────────────────────────
router.post('/verificar-pago', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { paymentId } = req.body as { paymentId?: string };

    if (!paymentId) {
      ApiError(res, 'MISSING_PAYMENT_ID', 'Se requiere paymentId', 400);
      return;
    }

    const payment = await getPayment(paymentId);
    const reservationId = payment.external_reference;

    if (!reservationId) {
      ApiError(res, 'INVALID_PAYMENT', 'Pago sin referencia de reservación', 400);
      return;
    }

    const reservacion = await prisma.reservation.findUnique({
      where: { id: reservationId },
    });

    if (!reservacion) {
      ApiError(res, 'NOT_FOUND', 'Reservación no encontrada', 404);
      return;
    }

    if (payment.status === 'approved' && reservacion.status === 'PENDING_APPROVAL') {
      await prisma.$transaction(async (tx) => {
        await tx.reservation.update({
          where: { id: reservationId },
          data: { status: 'CONFIRMED', mercadoPagoPaymentId: String(paymentId) },
        });

        await tx.payment.upsert({
          where: { reservationId },
          create: {
            reservationId,
            amount: payment.transaction_amount ?? 0,
            method: 'CARD',
            status: 'PAID',
            reference: String(paymentId),
            paidAt: new Date(),
          },
          update: {
            status: 'PAID',
            paidAt: new Date(),
            reference: String(paymentId),
          },
        });
      });
    }

    ApiSuccess(res, { status: payment.status, reservacionStatus: 'CONFIRMED' });
  } catch (error) {
    next(error);
  }
});

export default router;
