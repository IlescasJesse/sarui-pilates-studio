import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import { prisma } from '../config/database';
import { ApiSuccess, ApiError } from '../utils/response';
import { z } from 'zod';

const router = Router();

router.use(authMiddleware);

const membresiaSchema = z.object({
  clientId: z.string().min(1, 'Client ID is required'),
  packageId: z.string().min(1, 'Package ID is required'),
  startDate: z.string().datetime('Invalid start date'),
  paymentMethod: z.enum(['CASH', 'CARD', 'TRANSFER', 'OTHER']).optional(),
  pricePaid: z.number().positive().optional(),
  notes: z.string().optional(),
});

// GET /api/v1/membresias
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { clientId, status } = req.query as Record<string, string>;

    const where: Record<string, unknown> = { deletedAt: null };
    if (clientId) where.clientId = clientId;
    if (status) where.status = status;

    const membresias = await prisma.membership.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        client: {
          select: { id: true, firstName: true, lastName: true },
        },
        package: {
          select: { id: true, name: true, sessions: true, price: true },
        },
      },
    });

    ApiSuccess(res, membresias);
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/membresias
router.post(
  '/',
  requireRole('ADMIN'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parseResult = membresiaSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid membership data',
            details: parseResult.error.errors.map((e) => ({
              field: e.path.join('.'),
              message: e.message,
            })),
          },
        });
        return;
      }

      const pkg = await prisma.package.findUnique({
        where: { id: parseResult.data.packageId },
      });

      if (!pkg) {
        ApiError(res, 'NOT_FOUND', 'Package not found', 404);
        return;
      }

      const startDate = new Date(parseResult.data.startDate);
      const expiresAt = new Date(startDate);
      expiresAt.setDate(expiresAt.getDate() + pkg.validityDays);

      const membresia = await prisma.membership.create({
        data: {
          clientId: parseResult.data.clientId,
          packageId: parseResult.data.packageId,
          startDate,
          expiresAt,
          totalSessions: pkg.sessions,
          sessionsUsed: 0,
          sessionsRemaining: pkg.sessions,
          status: 'ACTIVE',
          pricePaid: parseResult.data.pricePaid ?? Number(pkg.price),
          paymentMethod: parseResult.data.paymentMethod ?? null,
          notes: parseResult.data.notes,
        },
        include: {
          client: { select: { id: true, firstName: true, lastName: true } },
          package: { select: { id: true, name: true, sessions: true } },
        },
      });

      ApiSuccess(res, membresia, 201);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/v1/membresias/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const membresia = await prisma.membership.findUnique({
      where: { id: req.params.id },
      include: {
        client: { select: { id: true, firstName: true, lastName: true } },
        package: true,
        reservations: {
          include: {
            class: { select: { id: true, title: true, type: true, startAt: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!membresia) {
      ApiError(res, 'NOT_FOUND', 'Membership not found', 404);
      return;
    }

    ApiSuccess(res, membresia);
  } catch (error) {
    next(error);
  }
});

// PUT /api/v1/membresias/:id
router.put(
  '/:id',
  requireRole('ADMIN'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const updateSchema = z.object({
        status: z.enum(['ACTIVE', 'EXPIRED', 'EXHAUSTED', 'SUSPENDED']).optional(),
        notes: z.string().optional(),
        expiresAt: z.string().datetime().optional(),
      });

      const parseResult = updateSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid data' },
        });
        return;
      }

      const { expiresAt, ...rest } = parseResult.data;
      const membresia = await prisma.membership.update({
        where: { id: req.params.id },
        data: {
          ...rest,
          ...(expiresAt ? { expiresAt: new Date(expiresAt) } : {}),
        },
      });

      ApiSuccess(res, membresia);
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/v1/membresias/:id
router.delete(
  '/:id',
  requireRole('ADMIN'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await prisma.membership.update({
        where: { id: req.params.id },
        data: { status: 'SUSPENDED' },
      });

      ApiSuccess(res, { message: 'Membership suspended successfully' });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
