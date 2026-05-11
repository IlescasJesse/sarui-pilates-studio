import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import { prisma } from '../config/database';
import { ApiSuccess, ApiError } from '../utils/response';
import { z } from 'zod';

const router = Router();

router.use(authMiddleware);

const tipoActividadSchema = z.object({
  nombre: z.string().trim().min(1, 'El nombre es requerido'),
  descripcion: z.string().trim().optional(),
  color: z.string().trim().regex(/^#[0-9A-Fa-f]{6}$/, 'Color hex inválido').optional(),
  isActive: z.boolean().default(true),
});

// GET /api/v1/tipo-actividades
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { activos } = req.query as Record<string, string>;

    const where: Record<string, unknown> = { deletedAt: null };
    if (activos === 'true') where.isActive = true;

    const tiposActividad = await prisma.tipoActividad.findMany({
      where,
      orderBy: { nombre: 'asc' },
    });

    ApiSuccess(res, tiposActividad);
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/tipo-actividades
router.post(
  '/',
  requireRole('ADMIN'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parseResult = tipoActividadSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Datos de tipo de actividad inválidos',
            details: parseResult.error.errors.map((e: z.ZodIssue) => ({
              field: e.path.join('.'),
              message: e.message,
            })),
          },
        });
        return;
      }

      const tipoActividad = await prisma.tipoActividad.create({
        data: parseResult.data,
      });

      ApiSuccess(res, tipoActividad, 201);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/v1/tipo-actividades/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tipoActividad = await prisma.tipoActividad.findUnique({
      where: { id: req.params.id },
    });

    if (!tipoActividad) {
      ApiError(res, 'NOT_FOUND', 'Tipo de actividad no encontrado', 404);
      return;
    }

    ApiSuccess(res, tipoActividad);
  } catch (error) {
    next(error);
  }
});

// PUT /api/v1/tipo-actividades/:id
router.put(
  '/:id',
  requireRole('ADMIN'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parseResult = tipoActividadSchema.partial().safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Datos inválidos' },
        });
        return;
      }

      const tipoActividad = await prisma.tipoActividad.update({
        where: { id: req.params.id },
        data: parseResult.data,
      });

      ApiSuccess(res, tipoActividad);
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/v1/tipo-actividades/:id (soft delete)
router.delete(
  '/:id',
  requireRole('ADMIN'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await prisma.tipoActividad.update({
        where: { id: req.params.id },
        data: { isActive: false, deletedAt: new Date() },
      });

      ApiSuccess(res, { mensaje: 'Tipo de actividad desactivado exitosamente' });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
