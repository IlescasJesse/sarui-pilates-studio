import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import { prisma } from '../config/database';
import { ApiSuccess, ApiError } from '../utils/response';
import { autoCreateGasto, calcularDetallesPeriodo } from '../services/nomina.service';

const router = Router();
router.use(authMiddleware);

const periodoSchema = z.object({
  fechaInicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  fechaFin: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

const ajusteSchema = z.object({
  deducciones: z.coerce.number().min(0),
  netoAPagar: z.coerce.number().min(0),
});

// GET /periodos — list all periods with details
router.get('/periodos', requireRole('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const periodos = await prisma.periodoNomina.findMany({
      include: {
        detalles: {
          include: {
            user: {
              include: {
                staffProfile: {
                  include: { puesto: true },
                },
              },
            },
          },
        },
      },
      orderBy: { creadoEn: 'desc' },
    });
    ApiSuccess(res, periodos);
  } catch (error) { next(error); }
});

// POST /periodos — create period + calculate details in one transaction
router.post('/periodos', requireRole('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = periodoSchema.safeParse(req.body);
    if (!parsed.success) {
      return ApiError(res, 'VALIDATION_ERROR', 'Datos inválidos', 400);
    }
    const { fechaInicio, fechaFin } = parsed.data;
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);

    if (fin < inicio) {
      return ApiError(res, 'INVALID_DATES', 'fechaFin debe ser mayor o igual a fechaInicio', 400);
    }

    const periodo = await prisma.$transaction(async (tx) => {
      const p = await tx.periodoNomina.create({
        data: {
          fechaInicio: inicio,
          fechaFin: fin,
          creadoPorId: req.user!.id,
        },
      });
      await calcularDetallesPeriodo(tx, p.id, inicio, fin);
      return tx.periodoNomina.findUnique({
        where: { id: p.id },
        include: {
          detalles: {
            include: {
              user: {
                include: {
                  staffProfile: {
                    include: { puesto: true },
                  },
                },
              },
            },
          },
        },
      });
    });

    ApiSuccess(res, periodo, 201);
  } catch (error) { next(error); }
});

// POST /periodos/:id/recalcular — recalculate details (only BORRADOR)
router.post('/periodos/:id/recalcular', requireRole('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params as { id: string };
    const period = await prisma.periodoNomina.findUnique({ where: { id } });
    if (!period) return ApiError(res, 'NOT_FOUND', 'Período no encontrado', 404);
    if (period.estado !== 'BORRADOR') {
      return ApiError(res, 'INVALID_STATUS', 'Solo se pueden recalcular períodos en BORRADOR', 409);
    }

    const updated = await prisma.$transaction(async (tx) => {
      await calcularDetallesPeriodo(tx, id, period.fechaInicio, period.fechaFin);
      return tx.periodoNomina.findUnique({
        where: { id },
        include: {
          detalles: {
            include: {
              user: {
                include: {
                  staffProfile: {
                    include: { puesto: true },
                  },
                },
              },
            },
          },
        },
      });
    });

    ApiSuccess(res, updated);
  } catch (error) { next(error); }
});

// PATCH /detalles/:id — manually adjust deducciones and netoAPagar (only BORRADOR period)
router.patch('/detalles/:id', requireRole('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params as { id: string };
    const parsed = ajusteSchema.safeParse(req.body);
    if (!parsed.success) {
      return ApiError(res, 'VALIDATION_ERROR', 'Datos inválidos', 400);
    }
    const { deducciones, netoAPagar } = parsed.data;

    const detalle = await prisma.nominaDetalle.findUnique({
      where: { id },
      include: { periodo: true },
    });
    if (!detalle) return ApiError(res, 'NOT_FOUND', 'Detalle no encontrado', 404);
    if (detalle.periodo.estado !== 'BORRADOR') {
      return ApiError(res, 'INVALID_STATUS', 'Solo se pueden ajustar detalles de períodos en BORRADOR', 409);
    }
    if (netoAPagar < 0) {
      return ApiError(res, 'INVALID_VALUE', 'netoAPagar no puede ser negativo', 400);
    }

    const updated = await prisma.nominaDetalle.update({
      where: { id },
      data: { deducciones, netoAPagar },
    });
    ApiSuccess(res, updated);
  } catch (error) { next(error); }
});

// POST /periodos/:id/aprobar — approve period and create Gasto per detail (atomic)
router.post('/periodos/:id/aprobar', requireRole('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params as { id: string };
    const periodo = await prisma.periodoNomina.findUnique({
      where: { id },
      include: {
        detalles: {
          include: {
            user: {
              include: { staffProfile: true },
            },
          },
        },
      },
    });
    if (!periodo) return ApiError(res, 'NOT_FOUND', 'Período no encontrado', 404);
    if (periodo.estado !== 'BORRADOR') {
      return ApiError(res, 'INVALID_STATUS', 'Solo se pueden aprobar períodos en BORRADOR', 409);
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.periodoNomina.update({
        where: { id },
        data: { estado: 'APROBADO' },
      });

      for (const detalle of periodo.detalles) {
        const sp = detalle.user.staffProfile;
        const nombre = sp
          ? `${sp.firstName} ${sp.lastName}`
          : detalle.user.email;

        const fechaLabel = `${periodo.fechaInicio.toISOString().slice(0, 10)}–${periodo.fechaFin.toISOString().slice(0, 10)}`;

        const gastoId = await autoCreateGasto(tx, {
          monto: Number(detalle.netoAPagar),
          concepto: `Nómina ${fechaLabel} — ${nombre}`,
          fecha: periodo.fechaFin,
          cuentaCodigo: '602',
          cuentaNombre: 'Sueldos y salarios',
          creadoPorId: req.user!.id,
        });

        await tx.nominaDetalle.update({
          where: { id: detalle.id },
          data: { gastoId },
        });
      }

      return tx.periodoNomina.findUnique({
        where: { id },
        include: {
          detalles: {
            include: {
              user: {
                include: {
                  staffProfile: {
                    include: { puesto: true },
                  },
                },
              },
            },
          },
        },
      });
    });

    ApiSuccess(res, result);
  } catch (error) { next(error); }
});

// POST /periodos/:id/pagar — mark APROBADO period as PAGADO
router.post('/periodos/:id/pagar', requireRole('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params as { id: string };
    const periodo = await prisma.periodoNomina.findUnique({ where: { id } });
    if (!periodo) return ApiError(res, 'NOT_FOUND', 'Período no encontrado', 404);
    if (periodo.estado !== 'APROBADO') {
      return ApiError(res, 'INVALID_STATUS', 'Solo se pueden marcar como PAGADO los períodos APROBADOS', 409);
    }

    const updated = await prisma.periodoNomina.update({
      where: { id },
      data: { estado: 'PAGADO' },
    });
    ApiSuccess(res, updated);
  } catch (error) { next(error); }
});

// GET /mi-historial — employee's own payroll history (no userId param accepted)
router.get('/mi-historial', requireRole('ADMIN', 'INSTRUCTOR', 'RECEPCIONISTA'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const detalles = await prisma.nominaDetalle.findMany({
      where: { userId: req.user!.id },
      include: { periodo: true },
      orderBy: { periodo: { creadoEn: 'desc' } },
    });
    ApiSuccess(res, detalles);
  } catch (error) { next(error); }
});

export default router;
