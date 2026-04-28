import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import { prisma } from '../config/database';
import { ApiSuccess } from '../utils/response';

const router = Router();

router.use(authMiddleware);
router.use(requireRole('ADMIN', 'INSTRUCTOR'));

// GET /api/v1/dashboard
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const [
      totalClientes,
      clientesActivos,
      clasesHoy,
      membresiasActivas,
      reservasHoy,
      clasesEsteMes,
    ] = await Promise.all([
      prisma.client.count({ where: { deletedAt: null } }),
      prisma.client.count({ where: { deletedAt: null } }),
      prisma.class.findMany({
        where: {
          startAt: { gte: today, lt: tomorrow },
          isCancelled: false,
          isActive: true,
        },
        include: {
          instructor: { select: { id: true, firstName: true, lastName: true } },
          _count: { select: { reservations: true } },
        },
        orderBy: { startAt: 'asc' },
      }),
      prisma.membership.count({ where: { status: 'ACTIVE' } }),
      prisma.reservation.count({
        where: {
          createdAt: { gte: today, lt: tomorrow },
          status: 'CONFIRMED',
        },
      }),
      prisma.class.count({
        where: {
          startAt: { gte: startOfMonth, lte: endOfMonth },
        },
      }),
    ]);

    ApiSuccess(res, {
      stats: {
        totalClientes,
        clientesActivos,
        membresiasActivas,
        reservasHoy,
        clasesHoy: clasesHoy.length,
        clasesEsteMes,
      },
      clasesHoy,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/dashboard/stats/weekly
router.get(
  '/stats/weekly',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

      const days: Array<{
        date: string;
        clases: number;
        reservas: number;
      }> = [];

      for (let i = 0; i < 7; i++) {
        const dayStart = new Date(sevenDaysAgo);
        dayStart.setDate(sevenDaysAgo.getDate() + i);
        const dayEnd = new Date(dayStart);
        dayEnd.setDate(dayEnd.getDate() + 1);

        const [clases, reservas] = await Promise.all([
          prisma.class.count({
            where: { startAt: { gte: dayStart, lt: dayEnd } },
          }),
          prisma.reservation.count({
            where: { createdAt: { gte: dayStart, lt: dayEnd } },
          }),
        ]);

        days.push({
          date: dayStart.toISOString().split('T')[0],
          clases,
          reservas,
        });
      }

      ApiSuccess(res, { weekly: days });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
