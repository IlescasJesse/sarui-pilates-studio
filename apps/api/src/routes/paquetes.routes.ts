import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import { prisma } from '../config/database';
import { ApiSuccess, ApiError } from '../utils/response';
import { z } from 'zod';
import type { PackageCategory, ClassSubtype } from '@prisma/client';

const router = Router();

router.use(authMiddleware);

const paqueteSchema = z.object({
  name: z.string().trim().min(1, 'El nombre del paquete es requerido'),
  tipoActividadId: z.string().trim().min(1, 'El tipo de actividad es requerido'),
  category: z.enum(['REFORMER', 'MAT', 'MIX']).optional(),
  classSubtype: z.enum(['REFORMER', 'MAT']).optional(),
  description: z.string().trim().optional(),
  sessions: z.number().int().min(1, 'Debe tener al menos 1 sesión'),
  price: z.number().positive('El precio debe ser positivo'),
  validityDays: z.number().int().min(1, 'La vigencia debe ser al menos 1 día'),
  isActive: z.boolean().default(true),
});

// GET /api/v1/paquetes
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const paquetes = await prisma.package.findMany({
      where: { deletedAt: null },
      orderBy: { price: 'asc' },
      include: {
        tipoActividad: {
          select: { id: true, nombre: true, color: true },
        },
      },
    });
    ApiSuccess(res, paquetes);
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/paquetes
router.post(
  '/',
  requireRole('ADMIN'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parseResult = paqueteSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid package data',
            details: parseResult.error.errors.map((e) => ({
              field: e.path.join('.'),
              message: e.message,
            })),
          },
        });
        return;
      }

      const { classSubtype, category, ...rest } = parseResult.data;
      const paquete = await prisma.package.create({
        data: {
          ...rest,
          category: (category ?? 'REFORMER') as PackageCategory,
          ...(classSubtype ? { classSubtype: classSubtype as ClassSubtype } : {}),
        },
        include: {
          tipoActividad: { select: { id: true, nombre: true, color: true } },
        },
      });

      ApiSuccess(res, paquete, 201);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/v1/paquetes/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const paquete = await prisma.package.findUnique({
      where: { id: req.params.id },
      include: {
        tipoActividad: { select: { id: true, nombre: true, color: true } },
      },
    });

    if (!paquete) {
      ApiError(res, 'NOT_FOUND', 'Paquete no encontrado', 404);
      return;
    }

    ApiSuccess(res, paquete);
  } catch (error) {
    next(error);
  }
});

// PUT /api/v1/paquetes/:id
router.put(
  '/:id',
  requireRole('ADMIN'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parseResult = paqueteSchema.partial().safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid data' },
        });
        return;
      }

      const paquete = await prisma.package.update({
        where: { id: req.params.id },
        data: parseResult.data,
      });

      ApiSuccess(res, paquete);
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/v1/paquetes/:id
router.delete(
  '/:id',
  requireRole('ADMIN'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await prisma.package.update({
        where: { id: req.params.id },
        data: { isActive: false },
      });

      ApiSuccess(res, { message: 'Package deactivated successfully' });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
