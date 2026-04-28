import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import { prisma } from '../config/database';
import { ApiSuccess, ApiError } from '../utils/response';
import { z } from 'zod';
import type { ModalidadActividad } from '@prisma/client';

const router = Router();

router.use(authMiddleware);

const tipoActividadSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  descripcion: z.string().optional(),
  modalidad: z.enum(['SESION_UNICA', 'POR_PAQUETE']),
  sesiones: z.number().int().min(1).optional().nullable(),
  costo: z.number().positive('El costo debe ser positivo'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color hex inválido').optional(),
  isActive: z.boolean().default(true),
}).refine(
  (data) => {
    if (data.modalidad === 'POR_PAQUETE') {
      return data.sesiones !== null && data.sesiones !== undefined && data.sesiones > 0;
    }
    return true;
  },
  {
    message: 'Las sesiones son requeridas cuando la modalidad es POR_PAQUETE',
    path: ['sesiones'],
  }
);

// GET /api/v1/tipo-actividades
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { activos } = req.query as Record<string, string>;

    const where: Record<string, unknown> = {};
    if (activos === 'true') {
      where.isActive = true;
    }

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

      const data = parseResult.data;
      const tipoActividad = await prisma.tipoActividad.create({
        data: {
          nombre: data.nombre,
          descripcion: data.descripcion,
          modalidad: data.modalidad as ModalidadActividad,
          sesiones: data.sesiones ?? undefined,
          costo: data.costo,
          color: data.color,
          isActive: data.isActive,
        },
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
      // Create a partial version of the schema for updates
      const updateSchema = z.object({
        nombre: z.string().min(1).optional(),
        descripcion: z.string().optional(),
        modalidad: z.enum(['SESION_UNICA', 'POR_PAQUETE']).optional(),
        sesiones: z.number().int().min(1).optional().nullable(),
        costo: z.number().positive().optional(),
        color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
        isActive: z.boolean().optional(),
      });

      const parseResult = updateSchema.safeParse(req.body);
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

      const data = parseResult.data;
      const updateData: Record<string, unknown> = {};

      if (data.nombre !== undefined) updateData.nombre = data.nombre;
      if (data.descripcion !== undefined) updateData.descripcion = data.descripcion;
      if (data.modalidad !== undefined) updateData.modalidad = data.modalidad;
      if (data.sesiones !== undefined) updateData.sesiones = data.sesiones;
      if (data.costo !== undefined) updateData.costo = data.costo;
      if (data.color !== undefined) updateData.color = data.color;
      if (data.isActive !== undefined) updateData.isActive = data.isActive;

      const tipoActividad = await prisma.tipoActividad.update({
        where: { id: req.params.id },
        data: updateData,
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
        data: {
          isActive: false,
          deletedAt: new Date(),
        },
      });

      ApiSuccess(res, { mensaje: 'Tipo de actividad desactivado exitosamente' });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
