import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import { prisma } from '../config/database';
import { ApiSuccess, ApiError } from '../utils/response';
import { z } from 'zod';

const router = Router();

router.use(authMiddleware);

const tipoMembresiaSchema = z.object({
  nombre: z.string().trim().min(1, 'El nombre es requerido'),
  descripcion: z.string().trim().optional(),
  duracionDias: z.number().int().min(1, 'La duración debe ser al menos 1 día'),
  actividadIds: z.array(z.string().trim()).default([]),
  isActive: z.boolean().default(true),
});

// GET /api/v1/tipo-membresias
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tiposMembresia = await prisma.tipoMembresia.findMany({
      where: { deletedAt: null },
      orderBy: { nombre: 'asc' },
      include: {
        actividades: {
          include: {
            tipoActividad: { select: { id: true, nombre: true, color: true } },
          },
        },
      },
    });

    ApiSuccess(res, tiposMembresia);
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/tipo-membresias
router.post(
  '/',
  requireRole('ADMIN'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parseResult = tipoMembresiaSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Datos inválidos',
            details: parseResult.error.errors.map((e: z.ZodIssue) => ({
              field: e.path.join('.'),
              message: e.message,
            })),
          },
        });
        return;
      }

      const { actividadIds, ...rest } = parseResult.data;
      const tipoMembresia = await prisma.tipoMembresia.create({
        data: {
          ...rest,
          actividades: {
            create: actividadIds.map((id) => ({ tipoActividadId: id })),
          },
        },
        include: {
          actividades: {
            include: { tipoActividad: { select: { id: true, nombre: true, color: true } } },
          },
        },
      });

      ApiSuccess(res, tipoMembresia, 201);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/v1/tipo-membresias/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tipoMembresia = await prisma.tipoMembresia.findUnique({
      where: { id: req.params.id },
      include: {
        actividades: {
          include: { tipoActividad: { select: { id: true, nombre: true, color: true } } },
        },
      },
    });

    if (!tipoMembresia) {
      ApiError(res, 'NOT_FOUND', 'Tipo de membresía no encontrado', 404);
      return;
    }

    ApiSuccess(res, tipoMembresia);
  } catch (error) {
    next(error);
  }
});

// PUT /api/v1/tipo-membresias/:id
router.put(
  '/:id',
  requireRole('ADMIN'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parseResult = tipoMembresiaSchema.partial().safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Datos inválidos' },
        });
        return;
      }

      const { actividadIds, ...rest } = parseResult.data;

      const tipoMembresia = await prisma.$transaction(async (tx) => {
        const updated = await tx.tipoMembresia.update({
          where: { id: req.params.id },
          data: rest,
        });

        if (actividadIds !== undefined) {
          await tx.tipoMembresiaActividad.deleteMany({
            where: { tipoMembresiaId: req.params.id },
          });
          if (actividadIds.length > 0) {
            await tx.tipoMembresiaActividad.createMany({
              data: actividadIds.map((id) => ({
                tipoMembresiaId: req.params.id,
                tipoActividadId: id,
              })),
            });
          }
        }

        return tx.tipoMembresia.findUnique({
          where: { id: updated.id },
          include: {
            actividades: {
              include: { tipoActividad: { select: { id: true, nombre: true, color: true } } },
            },
          },
        });
      });

      ApiSuccess(res, tipoMembresia);
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/v1/tipo-membresias/:id (soft delete)
router.delete(
  '/:id',
  requireRole('ADMIN'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await prisma.tipoMembresia.update({
        where: { id: req.params.id },
        data: { isActive: false, deletedAt: new Date() },
      });

      ApiSuccess(res, { mensaje: 'Tipo de membresía desactivado' });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
