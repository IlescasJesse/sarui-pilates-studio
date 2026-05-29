import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import { prisma } from '../config/database';
import { runJobNow } from '../workers/scheduler';
import { healthPingJob } from '../workers/jobs/health-ping.job';
import { generarHorarioJob } from '../workers/jobs/generar-horario.job';
import { corteDeCajaJob, computeCorteCaja } from '../workers/jobs/corte-de-caja.job';
import { revisarStockJob } from '../workers/jobs/revisar-stock.job';
import { ApiSuccess, ApiError } from '../utils/response';

const router = Router();

router.use(authMiddleware);
router.use(requireRole('ADMIN'));

// ─────────────────────────────────────────────────────────────────────────────
// JOBS
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/v1/admin/jobs/logs?limit=50&jobName=xxx&status=ERROR
router.get('/jobs/logs', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string || '50', 10), 200);
    const jobName = req.query.jobName as string | undefined;
    const status = req.query.status as string | undefined;

    const logs = await prisma.jobLog.findMany({
      where: {
        ...(jobName ? { jobName } : {}),
        ...(status ? { status: status as 'RUNNING' | 'SUCCESS' | 'ERROR' } : {}),
      },
      orderBy: { ranAt: 'desc' },
      take: limit,
    });

    ApiSuccess(res, logs);
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/admin/jobs/run/:jobName
router.post('/jobs/run/:jobName', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const jobName = req.params.jobName as string;

    const jobMap: Record<string, () => Promise<void>> = {
      'health-ping': healthPingJob,
      'generar-horario': generarHorarioJob,
      'corte-de-caja': corteDeCajaJob,
      'revisar-stock': revisarStockJob,
      // Phase 21 will add: 'comisiones': comisionesJob
    };

    const fn = jobMap[jobName];
    if (!fn) {
      ApiError(res, 'NOT_FOUND', `Job "${jobName}" no existe. Disponibles: ${Object.keys(jobMap).join(', ')}`, 404);
      return;
    }

    const result = await runJobNow(jobName, fn);
    ApiSuccess(res, result);
  } catch (error) {
    next(error);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// CORTES DE CAJA
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/v1/admin/cortes-caja?from=2026-05-01&to=2026-05-31&instructorId=xxx
router.get('/cortes-caja', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { from, to, instructorId } = req.query as Record<string, string>;

    const cortes = await prisma.corteCaja.findMany({
      where: {
        ...(from || to ? {
          fecha: {
            ...(from ? { gte: new Date(from) } : {}),
            ...(to ? { lte: new Date(to) } : {}),
          },
        } : {}),
        ...(instructorId ? { instructorId } : {}),
      },
      include: {
        clase: { select: { title: true, startAt: true, endAt: true, tipoActividadId: true } },
        instructor: { select: { firstName: true, lastName: true } },
      },
      orderBy: { fecha: 'desc' },
    });

    const totales = cortes.reduce(
      (acc, c) => ({
        ingresoDirecto: acc.ingresoDirecto + Number(c.ingresoDirecto),
        ingresoMembresia: acc.ingresoMembresia + Number(c.ingresoMembresia),
        ingresoTotal: acc.ingresoTotal + Number(c.ingresoTotal),
        reservaciones: acc.reservaciones + c.totalReservaciones,
      }),
      { ingresoDirecto: 0, ingresoMembresia: 0, ingresoTotal: 0, reservaciones: 0 }
    );

    ApiSuccess(res, { cortes, totales });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/admin/cortes-caja/generar  — corte manual por claseId
router.post('/cortes-caja/generar', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { claseId } = req.body as { claseId?: string };
    if (!claseId) {
      ApiError(res, 'VALIDATION_ERROR', 'claseId requerido', 400);
      return;
    }

    const existing = await prisma.corteCaja.findUnique({ where: { claseId } });
    if (existing) {
      ApiError(res, 'CONFLICT', 'Ya existe un corte para esta clase', 409);
      return;
    }

    const data = await computeCorteCaja(claseId);
    const corte = await prisma.corteCaja.create({ data });
    ApiSuccess(res, corte, 201);
  } catch (error) {
    next(error);
  }
});

export default router;
