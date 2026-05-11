import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import { prisma } from '../config/database';
import { ApiSuccess, ApiError } from '../utils/response';
import { z } from 'zod';
import type { ReservationOrigin } from '@prisma/client';

const router = Router();

router.use(authMiddleware);

const reservacionSchema = z.object({
  clientId: z.string().trim().min(1, 'Client ID is required'),
  classId: z.string().trim().min(1, 'Class ID is required'),
  membershipId: z.string().trim().optional(),
  origin: z.enum(['MEMBERSHIP', 'WALK_IN']).default('MEMBERSHIP'),
  notes: z.string().trim().optional(),
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

      const claseExiste = await prisma.class.findUnique({
        where: { id: parseResult.data.classId },
        select: { id: true },
      });
      if (!claseExiste) {
        ApiError(res, 'NOT_FOUND', 'Class not found', 404);
        return;
      }

      const existing = await prisma.reservation.findFirst({
        where: {
          clientId: parseResult.data.clientId,
          classId: parseResult.data.classId,
          status: { not: 'CANCELLED' },
        },
      });
      if (existing) {
        ApiError(res, 'ALREADY_RESERVED', 'Client already has a reservation for this class', 409);
        return;
      }

      // Puede existir una reservación cancelada — la restauramos en vez de crear nueva
      const cancelada = await prisma.reservation.findFirst({
        where: {
          clientId: parseResult.data.clientId,
          classId: parseResult.data.classId,
          status: 'CANCELLED',
        },
      });

      const reservacion = await prisma.$transaction(async (tx) => {
        // Incremento atómico: solo actualiza si hay lugares disponibles
        const slotsUpdated = await tx.$executeRaw`
          UPDATE \`classes\` SET spotsBooked = spotsBooked + 1
          WHERE id = ${parseResult.data.classId} AND spotsBooked < capacity
        `;
        if (slotsUpdated === 0) {
          throw Object.assign(new Error('CLASS_FULL'), { code: 'CLASS_FULL' });
        }

        const include = {
          client: { select: { id: true, firstName: true, lastName: true } },
          class: { select: { id: true, title: true, startAt: true, type: true, subtype: true } },
          membership: { include: { package: { select: { name: true } } } },
        };

        const result = cancelada
          ? await tx.reservation.update({
              where: { id: cancelada.id },
              data: {
                membershipId: parseResult.data.membershipId ?? null,
                origin: parseResult.data.origin as ReservationOrigin,
                status: 'CONFIRMED',
                notes: parseResult.data.notes ?? null,
                cancelledAt: null,
                portalDeclineReason: null,
                deletedAt: null,
              },
              include,
            })
          : await tx.reservation.create({
              data: {
                clientId: parseResult.data.clientId,
                classId: parseResult.data.classId,
                membershipId: parseResult.data.membershipId,
                origin: parseResult.data.origin as ReservationOrigin,
                status: 'CONFIRMED',
                notes: parseResult.data.notes,
              },
              include,
            });

        if (parseResult.data.membershipId) {
          const membership = await tx.membership.findUnique({
            where: { id: parseResult.data.membershipId },
          });
          // Validar que la membresía existe, pertenece al cliente y tiene sesiones
          if (membership && membership.clientId === parseResult.data.clientId && membership.sessionsRemaining > 0) {
            await tx.membership.update({
              where: { id: parseResult.data.membershipId },
              data: {
                sessionsUsed: { increment: 1 },
                sessionsRemaining: { decrement: 1 },
                status: membership.sessionsRemaining - 1 <= 0 ? 'EXHAUSTED' : 'ACTIVE',
              },
            });
          } else if (membership && membership.clientId !== parseResult.data.clientId) {
            // La membresía no pertenece a este cliente — log para auditoría, no error
            console.warn(`Membership ${parseResult.data.membershipId} does not belong to client ${parseResult.data.clientId}`);
          }
        }

        return result;
      });

      ApiSuccess(res, reservacion, 201);
    } catch (error: unknown) {
      if ((error as { code?: string }).code === 'CLASS_FULL') {
        ApiError(res, 'CLASS_FULL', 'Class is at full capacity', 409);
        return;
      }
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
      where: { id: req.params.id },
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
      const { status } = req.body as { status?: string };

      const reservacion = await prisma.reservation.update({
        where: { id: req.params.id },
        data: { status: status as 'CONFIRMED' | 'CANCELLED' | 'ATTENDED' | 'NO_SHOW' },
      });

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
      const reservacion = await prisma.reservation.findUnique({
        where: { id: req.params.id },
        select: { id: true, membershipId: true, classId: true },
      });

      if (!reservacion) {
        ApiError(res, 'NOT_FOUND', 'Reservación no encontrada', 404);
        return;
      }

      await prisma.$transaction(async (tx) => {
        await tx.reservation.update({
          where: { id: req.params.id },
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

      ApiSuccess(res, { message: 'Reservación cancelada' });
    } catch (error) {
      next(error);
    }
  }
);

// PATCH /api/v1/reservaciones/:id/aprobar  — solo ADMIN/INSTRUCTOR
router.patch(
  '/:id/aprobar',
  requireRole('ADMIN', 'INSTRUCTOR'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const reservacion = await prisma.reservation.findUnique({
        where: { id: req.params.id },
      });

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
        where: { id: req.params.id },
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
      const waLink = clientInfo?.phone ? `https://wa.me/${clientInfo.phone.replace(/[^0-9]/g, '')}?text=${waMsg}` : null;

      ApiSuccess(res, { ...updated, waLink });
    } catch (error) {
      next(error);
    }
  }
);

// PATCH /api/v1/reservaciones/:id/declinar  — solo ADMIN/INSTRUCTOR
router.patch(
  '/:id/declinar',
  requireRole('ADMIN', 'INSTRUCTOR'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { razon } = req.body as { razon?: string };

      const reservacion = await prisma.reservation.findUnique({
        where: { id: req.params.id },
      });

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
          where: { id: req.params.id },
          data: {
            status: 'CANCELLED',
            cancelledAt: new Date(),
            portalDeclineReason: razon ?? null,
          },
        });

        // Liberar el spot en la clase
        await tx.class.update({
          where: { id: reservacion.classId },
          data: { spotsBooked: { decrement: 1 } },
        });

        // Restaurar sesión si usó membresía
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

        return r;
      });

      ApiSuccess(res, updated);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
