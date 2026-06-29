import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import { prisma } from '../config/database';
import { ApiSuccess, ApiError } from '../utils/response';

const router = Router();
router.use(authMiddleware);

// --- Schemas ---

const autoregistroSchema = z.object({
  presente: z.boolean().optional(),
  observaciones: z.string().optional(),
});

const adminMarcarSchema = z.object({
  staffId: z.string().min(1),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  presente: z.boolean(),
  observaciones: z.string().optional(),
});

// --- Employee endpoints ---

// POST /personal/asistencia/hoy  — autoregistro idempotente (solo HOY, fecha del servidor)
router.post(
  '/hoy',
  requireRole('ADMIN', 'INSTRUCTOR', 'RECEPCIONISTA'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parse = autoregistroSchema.safeParse(req.body);
      if (!parse.success) {
        ApiError(res, 'VALIDATION_ERROR', 'Datos inválidos', 400);
        return;
      }
      const { presente, observaciones } = parse.data;

      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);

      const registro = await prisma.asistenciaPersonal.upsert({
        where: {
          userId_fecha: {
            userId: req.user!.id,
            fecha: hoy,
          },
        },
        create: {
          userId: req.user!.id,
          fecha: hoy,
          presente: presente ?? true,
          observaciones,
        },
        update: {
          presente: presente ?? true,
          observaciones,
        },
      });

      ApiSuccess(res, registro);
    } catch (error) {
      next(error);
    }
  }
);

// GET /personal/asistencia/mi-semana?inicio=YYYY-MM-DD  — historial propio
router.get(
  '/mi-semana',
  requireRole('ADMIN', 'INSTRUCTOR', 'RECEPCIONISTA'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { inicio } = req.query as Record<string, string>;
      if (!inicio || !/^\d{4}-\d{2}-\d{2}$/.test(inicio)) {
        ApiError(res, 'VALIDATION_ERROR', 'Parámetro inicio requerido (YYYY-MM-DD)', 400);
        return;
      }

      const [iy, im, id2] = inicio.split('-').map(Number);
      const fechaInicio = new Date(Date.UTC(iy, im - 1, id2));
      const fechaFin = new Date(Date.UTC(iy, im - 1, id2 + 6, 23, 59, 59, 999));

      const items = await prisma.asistenciaPersonal.findMany({
        where: {
          userId: req.user!.id,
          fecha: {
            gte: fechaInicio,
            lte: fechaFin,
          },
        },
        orderBy: { fecha: 'asc' },
      });

      ApiSuccess(res, items);
    } catch (error) {
      next(error);
    }
  }
);

// --- Admin endpoints ---

// GET /personal/asistencia/admin?inicio=YYYY-MM-DD  — grilla semanal de todo el staff
router.get(
  '/admin',
  requireRole('ADMIN', 'INSTRUCTOR'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { inicio } = req.query as Record<string, string>;
      if (!inicio || !/^\d{4}-\d{2}-\d{2}$/.test(inicio)) {
        ApiError(res, 'VALIDATION_ERROR', 'Parámetro inicio requerido (YYYY-MM-DD)', 400);
        return;
      }

      const [ay, am, ad] = inicio.split('-').map(Number);
      const fechaInicio = new Date(Date.UTC(ay, am - 1, ad));
      const fechaFin = new Date(Date.UTC(ay, am - 1, ad + 6, 23, 59, 59, 999));

      const [staffList, asistencias] = await Promise.all([
        prisma.staffProfile.findMany({
          where: { activo: true },
          include: {
            user: { select: { id: true, email: true, role: true } },
            puesto: { select: { id: true, nombre: true } }, // NO incluir salarioSemanal
          },
        }),
        prisma.asistenciaPersonal.findMany({
          where: {
            fecha: {
              gte: fechaInicio,
              lte: fechaFin,
            },
          },
          orderBy: { fecha: 'asc' },
        }),
      ]);

      // Group into AsistenciaSemana[] structure expected by the frontend
      const result = staffList.map((s) => {
        const { firstName, lastName, ...rest } = s as any;
        return {
          staff: { ...rest, nombre: firstName, apellido: lastName },
          dias: asistencias
            .filter((a) => a.userId === s.userId)
            .map((a) => ({
              fecha: a.fecha.toISOString(),
              presente: a.presente,
              staffId: s.id,
            })),
        };
      });

      ApiSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
);

// PATCH /personal/asistencia/admin  — edición retroactiva (solo ADMIN)
router.patch(
  '/admin',
  requireRole('ADMIN'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parse = adminMarcarSchema.safeParse(req.body);
      if (!parse.success) {
        ApiError(res, 'VALIDATION_ERROR', 'Datos inválidos', 400);
        return;
      }
      const { staffId, fecha: fechaStr, presente, observaciones } = parse.data;

      const staff = await prisma.staffProfile.findUnique({ where: { id: staffId } });
      if (!staff) {
        ApiError(res, 'NOT_FOUND', 'Perfil de personal no encontrado', 404);
        return;
      }
      const userId = staff.userId;

      const [y, m, d] = fechaStr.split('-').map(Number);
      const fecha = new Date(Date.UTC(y, m - 1, d));

      const registro = await prisma.asistenciaPersonal.upsert({
        where: {
          userId_fecha: {
            userId,
            fecha,
          },
        },
        create: { userId, fecha, presente, observaciones },
        update: { presente, observaciones },
      });

      ApiSuccess(res, registro);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
