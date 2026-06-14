import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import { prisma } from '../config/database';
import { ApiSuccess, ApiError } from '../utils/response';
import { z } from 'zod';
import { PaymentMethod, type ReservationOrigin } from '@prisma/client';
import {
  validateMembershipForClass,
  chargeWalkIn,
  releaseReservationEffects,
} from '../services/reservaciones.service';

const router = Router();

router.use(authMiddleware);

const reservacionSchema = z
  .object({
    clientId: z.string().trim().min(1, 'Client ID is required'),
    classId: z.string().trim().min(1, 'Class ID is required'),
    membershipId: z.string().trim().optional(),
    // origin se deriva server-side de la presencia de membershipId (no se acepta del cliente)
    notes: z.string().trim().optional(),
    // Walk-in single-class charge (optional; old frontend omits these → no charge)
    paymentMethod: z.nativeEnum(PaymentMethod).optional(),
    amount: z
      .number()
      .positive('Amount must be positive')
      .multipleOf(0.01, 'Amount supports up to 2 decimals')
      .optional(),
  })
  .refine((d) => (d.paymentMethod == null) === (d.amount == null), {
    message: 'paymentMethod and amount must be provided together',
    path: ['amount'],
  });

const patchReservacionSchema = z.object({
  status: z.enum(['CONFIRMED', 'CANCELLED', 'ATTENDED', 'NO_SHOW']),
});

// GET /api/v1/reservaciones
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { clientId, classId, status, date } = req.query as Record<string, string>;

    const where: Record<string, unknown> = { deletedAt: null };
    if (clientId) where.clientId = clientId;
    if (classId) where.classId = classId;
    if (status) where.status = status;
    if (date) {
      const start = new Date(date);
      const end = new Date(date);
      end.setDate(end.getDate() + 1);
      where.class = { startAt: { gte: start, lt: end } };
    }

    const reservaciones = await prisma.reservation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        client: { select: { id: true, firstName: true, lastName: true } },
        class: { select: { id: true, title: true, startAt: true, endAt: true, type: true } },
      },
    });

    ApiSuccess(res, reservaciones);
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/reservaciones
router.post(
  '/',
  requireRole('ADMIN', 'INSTRUCTOR'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parseResult = reservacionSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid reservation data',
            details: parseResult.error.errors.map((e) => ({
              field: e.path.join('.'),
              message: e.message,
            })),
          },
        });
        return;
      }

      const { clientId, classId, membershipId, notes, paymentMethod, amount } = parseResult.data;
      // Derivar origin server-side: presencia de membershipId es la única fuente de verdad.
      const origin: ReservationOrigin = membershipId ? 'MEMBERSHIP' : 'WALK_IN';

      const claseExiste = await prisma.class.findUnique({
        where: { id: classId },
        select: { id: true },
      });
      if (!claseExiste) {
        ApiError(res, 'NOT_FOUND', 'Class not found', 404);
        return;
      }

      const existing = await prisma.reservation.findFirst({
        where: { clientId, classId, status: { not: 'CANCELLED' } },
      });
      if (existing) {
        ApiError(res, 'ALREADY_RESERVED', 'Client already has a reservation for this class', 409);
        return;
      }

      // Puede existir una reservación cancelada — la restauramos en vez de crear nueva
      const cancelada = await prisma.reservation.findFirst({
        where: { clientId, classId, status: 'CANCELLED' },
      });

      const reservacion = await prisma.$transaction(async (tx) => {
        // 1) Validar membresía ANTES de tocar spot/reserva.
        const membership = membershipId
          ? await validateMembershipForClass(tx, { membershipId, clientId, classId })
          : null;

        // 2) Incremento atómico: solo actualiza si hay lugares disponibles
        const slotsUpdated = await tx.$executeRaw`
          UPDATE \`classes\` SET spotsBooked = spotsBooked + 1
          WHERE id = ${classId} AND spotsBooked < capacity
        `;
        if (slotsUpdated === 0) {
          throw Object.assign(new Error('CLASS_FULL'), { code: 'CLASS_FULL' });
        }

        const include = {
          client: { select: { id: true, firstName: true, lastName: true } },
          class: { select: { id: true, title: true, startAt: true, type: true, subtype: true } },
          membership: { include: { package: { select: { name: true } } } },
        };

        // 3) Crear o restaurar reserva CONFIRMED
        const result = cancelada
          ? await tx.reservation.update({
              where: { id: cancelada.id },
              data: {
                membershipId: membershipId ?? null,
                origin,
                status: 'CONFIRMED',
                notes: notes ?? null,
                cancelledAt: null,
                portalDeclineReason: null,
                deletedAt: null,
              },
              include,
            })
          : await tx.reservation.create({
              data: { clientId, classId, membershipId, origin, status: 'CONFIRMED', notes },
              include,
            });

        // 4) Consumir sesión de membresía
        if (membershipId && membership) {
          await tx.membership.update({
            where: { id: membershipId },
            data: {
              sessionsUsed: { increment: 1 },
              sessionsRemaining: { decrement: 1 },
              status: membership.sessionsRemaining - 1 <= 0 ? 'EXHAUSTED' : 'ACTIVE',
            },
          });
        }

        // 5) Cobro walk-in — Payment + Ingreso contable (cuenta 402)
        if (origin === 'WALK_IN' && paymentMethod && amount != null) {
          await chargeWalkIn(tx, {
            reservationId: result.id,
            classTitle: result.class.title,
            amount,
            paymentMethod,
            creadoPorId: req.user?.id,
          });
        }

        return result;
      });

      ApiSuccess(res, reservacion, 201);
    } catch (error: unknown) {
      const code = (error as { code?: string }).code;
      if (code === 'CLASS_FULL') return ApiError(res, 'CLASS_FULL', 'Class is at full capacity', 409);
      if (code === 'MEMBERSHIP_MISMATCH') return ApiError(res, 'MEMBERSHIP_MISMATCH', 'Membership does not belong to this client', 400);
      if (code === 'MEMBERSHIP_INVALID') return ApiError(res, 'MEMBERSHIP_INVALID', (error as { detail?: string }).detail ?? 'Membership is not usable', 400);
      if (code === 'CLASS_TYPE_MISMATCH') return ApiError(res, 'CLASS_TYPE_MISMATCH', 'This membership does not apply to this class type', 400);
      next(error);
    }
  }
);

// GET /api/v1/reservaciones/portal  — DEBE ir antes de /:id para que Express no lo capture como parámetro
router.get(
  '/portal',
  requireRole('ADMIN', 'INSTRUCTOR'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { status } = req.query as Record<string, string>;

      const where: Record<string, unknown> = {
        deletedAt: null,
        origin: { in: ['PORTAL', 'PORTAL_REQUEST'] },
      };
      if (status) where.status = status;

      const reservaciones = await prisma.reservation.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          client: { select: { id: true, firstName: true, lastName: true, phone: true } },
          class: {
            include: {
              tipoActividad: { select: { nombre: true, color: true } },
              instructor: { select: { firstName: true, lastName: true } },
            },
          },
        },
      });

      ApiSuccess(res, reservaciones);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/v1/reservaciones/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reservacion = await prisma.reservation.findUnique({
      where: { id: req.params.id as string },
      include: {
        client: true,
        class: { include: { instructor: { select: { id: true, firstName: true, lastName: true } } } },
        membership: { include: { package: true } },
      },
    });

    if (!reservacion) {
      ApiError(res, 'NOT_FOUND', 'Reservation not found', 404);
      return;
    }

    ApiSuccess(res, reservacion);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/v1/reservaciones/:id
router.patch(
  '/:id',
  requireRole('ADMIN'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = patchReservacionSchema.safeParse(req.body);
      if (!parsed.success) {
        ApiError(res, 'VALIDATION_ERROR', 'Invalid reservation status', 400);
        return;
      }
      const { status } = parsed.data;
      const id = req.params.id as string;

      const current = await prisma.reservation.findUnique({
        where: { id },
        select: { status: true, classId: true, membershipId: true },
      });
      if (!current) {
        ApiError(res, 'NOT_FOUND', 'Reservation not found', 404);
        return;
      }

      // No resucitar una reserva cancelada vía PATCH: re-bookear requiere flujo POST.
      if (current.status === 'CANCELLED' && status !== 'CANCELLED') {
        ApiError(res, 'INVALID_TRANSITION', 'Use the reservation flow to re-book a cancelled reservation', 400);
        return;
      }

      // Transición a CANCELLED: liberar spot + restaurar sesión atómicamente.
      if (status === 'CANCELLED' && current.status !== 'CANCELLED') {
        const updated = await prisma.$transaction(async (tx) => {
          const r = await tx.reservation.update({
            where: { id },
            data: { status: 'CANCELLED', cancelledAt: new Date() },
          });
          await releaseReservationEffects(tx, current);
          return r;
        });
        ApiSuccess(res, updated);
        return;
      }

      // Resto de transiciones (CONFIRMED/ATTENDED/NO_SHOW): solo actualizar status.
      const reservacion = await prisma.reservation.update({ where: { id }, data: { status } });
      ApiSuccess(res, reservacion);
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/v1/reservaciones/:id
router.delete(
  '/:id',
  requireRole('ADMIN'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const reservacion = await prisma.reservation.findUnique({
        where: { id },
        select: { id: true, status: true, membershipId: true, classId: true },
      });

      if (!reservacion) {
        ApiError(res, 'NOT_FOUND', 'Reservación no encontrada', 404);
        return;
      }

      // Idempotente: si ya está cancelada no liberar de nuevo.
      if (reservacion.status === 'CANCELLED') {
        ApiSuccess(res, { message: 'Reservación ya estaba cancelada' });
        return;
      }

      await prisma.$transaction(async (tx) => {
        await tx.reservation.update({
          where: { id },
          data: { status: 'CANCELLED', cancelledAt: new Date() },
        });
        await releaseReservationEffects(tx, reservacion);
      });

      ApiSuccess(res, { message: 'Reservación cancelada' });
    } catch (error) {
      next(error);
    }
  }
);

// PATCH /api/v1/reservaciones/:id/aprobar
router.patch(
  '/:id/aprobar',
  requireRole('ADMIN', 'INSTRUCTOR'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const reservacion = await prisma.reservation.findUnique({ where: { id } });

      if (!reservacion) {
        ApiError(res, 'NOT_FOUND', 'Reservación no encontrada', 404);
        return;
      }
      if (reservacion.status !== 'PENDING_APPROVAL') {
        ApiError(res, 'INVALID_STATUS', 'Solo se pueden aprobar solicitudes pendientes', 400);
        return;
      }

      const clientInfo = await prisma.client.findUnique({
        where: { id: reservacion.clientId },
        select: { firstName: true, lastName: true, phone: true, qrCode: true },
      });

      const updated = await prisma.reservation.update({
        where: { id },
        data: { status: 'CONFIRMED' },
        include: {
          client: { select: { firstName: true, lastName: true, phone: true } },
          class: { select: { title: true, startAt: true } },
        },
      });

      const classDate = new Date(updated.class.startAt).toLocaleDateString('es-MX', {
        weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
      });
      const waMsg = encodeURIComponent(
        `✅ ¡Hola ${clientInfo?.firstName}! Tu reservación en Sarui Studio está confirmada:\n\n` +
        `📅 ${classDate}\n` +
        `🏋️ ${updated.class.title ?? 'Clase'}\n\n` +
        `🔑 Tu código QR para el kiosk: ${clientInfo?.qrCode ?? ''}\n\n` +
        `📍 Preséntalo en la entrada del estudio.`
      );
      const waLink = clientInfo?.phone
        ? `https://wa.me/${clientInfo.phone.replace(/[^0-9]/g, '')}?text=${waMsg}`
        : null;

      ApiSuccess(res, { ...updated, waLink });
    } catch (error) {
      next(error);
    }
  }
);

// PATCH /api/v1/reservaciones/:id/declinar
router.patch(
  '/:id/declinar',
  requireRole('ADMIN', 'INSTRUCTOR'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const { razon } = req.body as { razon?: string };

      const reservacion = await prisma.reservation.findUnique({ where: { id } });

      if (!reservacion) {
        ApiError(res, 'NOT_FOUND', 'Reservación no encontrada', 404);
        return;
      }
      if (reservacion.status !== 'PENDING_APPROVAL') {
        ApiError(res, 'INVALID_STATUS', 'Solo se pueden declinar solicitudes pendientes', 400);
        return;
      }

      const updated = await prisma.$transaction(async (tx) => {
        const r = await tx.reservation.update({
          where: { id },
          data: { status: 'CANCELLED', cancelledAt: new Date(), portalDeclineReason: razon ?? null },
        });
        await releaseReservationEffects(tx, reservacion);
        return r;
      });

      ApiSuccess(res, updated);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
