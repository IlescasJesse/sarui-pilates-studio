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
  title: z.string().optional(),
  tipoActividadId: z.string().optional(),
  type: z.enum(['FLOW', 'POWER', 'MOBILITY', 'MAT']).optional(),
  subtype: z.enum(['REFORMER', 'MAT']).optional(),
  instructorId: z.string().min(1, 'El instructor es requerido'),
  startAt: z.string().datetime('Fecha de inicio inválida'),
  endAt: z.string().datetime('Fecha de fin inválida'),
  capacity: z.number().int().min(1).max(50).default(12),
  location: z.string().optional(),
  notes: z.string().optional(),
});

const patchClaseSchema = z.object({
  startAt: z.string().datetime().optional(),
  endAt: z.string().datetime().optional(),
  instructorId: z.string().optional(),
  capacity: z.number().int().min(1).max(50).optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
  isCancelled: z.boolean().optional(),
  cancelReason: z.string().optional(),
  isActive: z.boolean().optional(),
});

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
          select: { id: true, nombre: true, color: true, modalidad: true },
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
            select: { id: true, nombre: true, color: true, modalidad: true },
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
      where: { id: req.params.id },
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

      const { startAt, endAt, ...rest } = parseResult.data;
      const clase = await prisma.class.update({
        where: { id: req.params.id },
        data: {
          ...rest,
          ...(startAt ? { startAt: new Date(startAt) } : {}),
          ...(endAt ? { endAt: new Date(endAt) } : {}),
        },
        include: {
          instructor: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      });

      ApiSuccess(res, clase);
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
        where: { id: req.params.id },
        data: { isCancelled: true, isActive: false },
      });

      ApiSuccess(res, { message: 'Class cancelled successfully' });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
