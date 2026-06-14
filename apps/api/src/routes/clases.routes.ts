import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import { prisma } from '../config/database';
import { ApiSuccess, ApiError } from '../utils/response';
import { z } from 'zod';
import type { ClassType, ClassSubtype } from '@prisma/client';

const router = Router();

router.use(authMiddleware);

const claseSchema = z.object({
  title: z.string().trim().optional(),
  tipoActividadId: z.string().trim().optional(),
  type: z.enum(['FLOW', 'POWER', 'MOBILITY', 'MAT']).optional(),
  subtype: z.enum(['REFORMER', 'MAT']).optional(),
  instructorId: z.string().trim().min(1, 'El instructor es requerido'),
  startAt: z.string().trim().datetime('Fecha de inicio inválida'),
  endAt: z.string().trim().datetime('Fecha de fin inválida'),
  capacity: z.number().int().min(1).max(50).default(12),
  location: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

const patchClaseSchema = z
  .object({
    startAt: z.string().trim().datetime({ message: 'startAt must be ISO datetime' }).optional(),
    endAt: z.string().trim().datetime({ message: 'endAt must be ISO datetime' }).optional(),
    instructorId: z.string().trim().min(1).optional(),
    capacity: z.number().int().min(1).max(50).optional(),
    title: z.string().trim().min(1).max(120).optional(),
    location: z.string().trim().optional(),
    notes: z.string().trim().optional(),
    isCancelled: z.boolean().optional(),
    cancelReason: z.string().trim().optional(),
    isActive: z.boolean().optional(),
  })
  .refine(
    (d) => {
      if (d.startAt && d.endAt) return new Date(d.endAt) > new Date(d.startAt);
      return true;
    },
    { message: 'endAt must be after startAt', path: ['endAt'] }
  );

// GET /api/v1/clases?startDate=&endDate=
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate, instructorId, type } = req.query as Record<string, string>;

    const where: Record<string, unknown> = { deletedAt: null };

    if (startDate || endDate) {
      where.startAt = {
        ...(startDate ? { gte: new Date(startDate) } : {}),
        ...(endDate ? { lte: new Date(endDate) } : {}),
      };
    }

    if (instructorId) where.instructorId = instructorId;
    if (type) where.type = type as ClassType;

    const clases = await prisma.class.findMany({
      where,
      orderBy: { startAt: 'asc' },
      include: {
        instructor: {
          select: { id: true, firstName: true, lastName: true },
        },
        tipoActividad: {
          select: { id: true, nombre: true, color: true },
        },
        _count: { select: { reservations: true } },
      },
    });

    // Devuelve objetos crudos — el frontend hace el mapeo a FullCalendar
    const result = clases.map((c) => ({
      id: c.id,
      title: c.title ?? c.tipoActividad?.nombre ?? c.subtype ?? 'Clase',
      type: c.type,
      subtype: c.subtype,
      tipoActividad: c.tipoActividad ?? null,
      instructor: c.instructor,
      instructorId: c.instructorId,
      startAt: c.startAt.toISOString(),
      endAt: c.endAt.toISOString(),
      capacity: c.capacity,
      spotsBooked: c.spotsBooked,
      enrolled: c._count.reservations,
      location: c.location,
      isCancelled: c.isCancelled,
      isActive: c.isActive,
    }));

    ApiSuccess(res, result);
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/clases
router.post(
  '/',
  requireRole('ADMIN'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parseResult = claseSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid class data',
            details: parseResult.error.errors.map((e) => ({
              field: e.path.join('.'),
              message: e.message,
            })),
          },
        });
        return;
      }

      const data = parseResult.data;
      const clase = await prisma.class.create({
        data: {
          title: data.title,
          ...(data.type ? { type: data.type as ClassType } : {}),
          ...(data.subtype ? { subtype: data.subtype as ClassSubtype } : {}),
          ...(data.tipoActividadId ? { tipoActividadId: data.tipoActividadId } : {}),
          instructorId: data.instructorId,
          startAt: new Date(data.startAt),
          endAt: new Date(data.endAt),
          capacity: data.capacity,
          location: data.location,
          notes: data.notes,
        },
        include: {
          instructor: {
            select: { id: true, firstName: true, lastName: true },
          },
          tipoActividad: {
            select: { id: true, nombre: true, color: true },
          },
        },
      });

      ApiSuccess(res, clase, 201);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/v1/clases/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const clase = await prisma.class.findUnique({
      where: { id: req.params.id as string },
      include: {
        instructor: { select: { id: true, firstName: true, lastName: true } },
        tipoActividad: { select: { id: true, nombre: true, color: true } },
        reservations: {
          where: { status: { not: 'CANCELLED' } },
          include: {
            client: { select: { id: true, firstName: true, lastName: true } },
            membership: { include: { package: { select: { name: true, sessions: true } } } },
          },
        },
      },
    });

    if (!clase) {
      ApiError(res, 'NOT_FOUND', 'Class not found', 404);
      return;
    }

    ApiSuccess(res, clase);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/v1/clases/:id
router.patch(
  '/:id',
  requireRole('ADMIN', 'INSTRUCTOR'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parseResult = patchClaseSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid update data',
            details: parseResult.error.errors.map((e) => ({
              field: e.path.join('.'),
              message: e.message,
            })),
          },
        });
        return;
      }

      const classId = req.params.id as string;
      const body = parseResult.data;

      // Fetch current class
      const existing = await prisma.class.findUnique({
        where: { id: classId },
        select: {
          id: true,
          isCancelled: true,
          deletedAt: true,
          startAt: true,
          endAt: true,
          instructorId: true,
          spotsBooked: true,
        },
      });

      if (!existing) {
        ApiError(res, 'NOT_FOUND', 'Class not found', 404);
        return;
      }

      if (existing.isCancelled || existing.deletedAt !== null) {
        ApiError(res, 'CLASS_NOT_EDITABLE', 'Cannot edit a cancelled or deleted class', 400);
        return;
      }

      const newStartAt = body.startAt ? new Date(body.startAt) : existing.startAt;
      const newEndAt = body.endAt ? new Date(body.endAt) : existing.endAt;
      const newInstructorId = body.instructorId ?? existing.instructorId;

      const scheduleChanging =
        body.startAt !== undefined ||
        body.endAt !== undefined ||
        body.instructorId !== undefined;

      // CLASS_IN_PAST: only block if schedule is changing
      if (scheduleChanging && body.startAt !== undefined) {
        const now = new Date();
        if (newStartAt < now) {
          ApiError(res, 'CLASS_IN_PAST', 'Cannot reschedule a class to a past time', 400);
          return;
        }
      }

      // CAPACITY_BELOW_BOOKED
      if (body.capacity !== undefined && body.capacity < existing.spotsBooked) {
        ApiError(
          res,
          'CAPACITY_BELOW_BOOKED',
          `New capacity (${body.capacity}) is less than current bookings (${existing.spotsBooked})`,
          400
        );
        return;
      }

      // INSTRUCTOR_OVERLAP: check only when schedule or instructor changes
      if (scheduleChanging) {
        const overlap = await prisma.class.findFirst({
          where: {
            id: { not: classId },
            instructorId: newInstructorId,
            isCancelled: false,
            deletedAt: null,
            startAt: { lt: newEndAt },
            endAt: { gt: newStartAt },
          },
          select: {
            id: true,
            title: true,
            startAt: true,
            endAt: true,
          },
        });

        if (overlap) {
          res.status(409).json({
            success: false,
            error: {
              code: 'INSTRUCTOR_OVERLAP',
              message: 'Instructor already has a class scheduled in that time slot',
              conflict: {
                id: overlap.id,
                title: overlap.title,
                startAt: overlap.startAt.toISOString(),
                endAt: overlap.endAt.toISOString(),
              },
            },
          });
          return;
        }
      }

      // Count affected reservations when rescheduling
      let affectedReservations: number | undefined;
      if (body.startAt !== undefined || body.endAt !== undefined) {
        affectedReservations = await prisma.reservation.count({
          where: { classId, status: { not: 'CANCELLED' } },
        });
      }

      // Apply update
      const updated = await prisma.class.update({
        where: { id: classId },
        data: {
          ...(body.title !== undefined ? { title: body.title } : {}),
          ...(body.instructorId !== undefined ? { instructorId: body.instructorId } : {}),
          ...(body.capacity !== undefined ? { capacity: body.capacity } : {}),
          ...(body.location !== undefined ? { location: body.location } : {}),
          ...(body.notes !== undefined ? { notes: body.notes } : {}),
          ...(body.isCancelled !== undefined ? { isCancelled: body.isCancelled } : {}),
          ...(body.cancelReason !== undefined ? { cancelReason: body.cancelReason } : {}),
          ...(body.isActive !== undefined ? { isActive: body.isActive } : {}),
          ...(body.startAt !== undefined ? { startAt: newStartAt } : {}),
          ...(body.endAt !== undefined ? { endAt: newEndAt } : {}),
        },
        include: {
          instructor: {
            select: { id: true, firstName: true, lastName: true },
          },
          tipoActividad: {
            select: { id: true, nombre: true, color: true },
          },
        },
      });

      const responseData =
        affectedReservations !== undefined
          ? { ...updated, affectedReservations }
          : updated;

      ApiSuccess(res, responseData);
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/v1/clases/:id (soft cancel)
router.delete(
  '/:id',
  requireRole('ADMIN'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await prisma.class.update({
        where: { id: req.params.id as string },
        data: { isCancelled: true, isActive: false },
      });

      ApiSuccess(res, { message: 'Class cancelled successfully' });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
