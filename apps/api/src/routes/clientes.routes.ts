import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import { prisma } from '../config/database';
import { ApiSuccess, ApiError } from '../utils/response';
import { hashPassword } from '../utils/bcrypt';
import QRCode from 'qrcode';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.use(authMiddleware);
router.use(requireRole('ADMIN'));

const clienteSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  phone: z.string().optional(),
  birthDate: z.string().datetime().optional(),
  notes: z.string().optional(),
  pin: z
    .string()
    .length(4)
    .regex(/^\d{4}$/, 'PIN must be 4 digits')
    .optional(),
});

// GET /api/v1/clientes
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search, page = '1', limit = '20' } = req.query as Record<string, string>;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = search
      ? {
          deletedAt: null as null,
          OR: [
            { firstName: { contains: search } },
            { lastName: { contains: search } },
            { phone: { contains: search } },
            { user: { email: { contains: search } } },
          ],
        }
      : { deletedAt: null as null };

    const [clientes, total] = await Promise.all([
      prisma.client.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
          qrCode: true,
          createdAt: true,
          user: { select: { email: true, isActive: true } },
          _count: { select: { reservations: true } },
        },
      }),
      prisma.client.count({ where }),
    ]);

    ApiSuccess(res, {
      clientes,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/clientes
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parseResult = clienteSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid client data',
          details: parseResult.error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
      });
      return;
    }

    const { v4: uuidv4 } = await import('uuid');
    const qrCode = uuidv4();
    const { email, password, pin, ...clientData } = parseResult.data;
    const hashedPassword = await hashPassword(password ?? Math.random().toString(36).slice(2));
    const hashedPin = await hashPassword(pin ?? '0000');

    const cliente = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: 'CLIENT',
        client: {
          create: {
            ...clientData,
            ...(clientData.birthDate ? { birthDate: new Date(clientData.birthDate) } : {}),
            qrCode,
            pin: hashedPin,
          },
        },
      },
      select: {
        id: true,
        email: true,
        role: true,
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            qrCode: true,
            createdAt: true,
          },
        },
      },
    });

    ApiSuccess(res, cliente, 201);
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/clientes/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cliente = await prisma.client.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { email: true, isActive: true } },
        memberships: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: { package: { select: { name: true, sessions: true } } },
        },
        reservations: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            class: {
              select: { id: true, title: true, type: true, startAt: true },
            },
          },
        },
      },
    });

    if (!cliente) {
      ApiError(res, 'NOT_FOUND', 'Client not found', 404);
      return;
    }

    ApiSuccess(res, cliente);
  } catch (error) {
    next(error);
  }
});

// PUT /api/v1/clientes/:id
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const updateSchema = clienteSchema.omit({ email: true, password: true }).partial();
    const parseResult = updateSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid data' },
      });
      return;
    }

    const { pin, birthDate, ...rest } = parseResult.data;
    const cliente = await prisma.client.update({
      where: { id: req.params.id },
      data: {
        ...rest,
        ...(birthDate ? { birthDate: new Date(birthDate) } : {}),
        ...(pin ? { pin: await hashPassword(pin) } : {}),
      },
    });

    ApiSuccess(res, cliente);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/v1/clientes/:id — soft delete via deletedAt
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.client.update({
      where: { id: req.params.id },
      data: { deletedAt: new Date() },
    });

    ApiSuccess(res, { message: 'Client deactivated successfully' });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/clientes/:id/qr
router.get('/:id/qr', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cliente = await prisma.client.findUnique({
      where: { id: req.params.id },
      select: { id: true, firstName: true, lastName: true, qrCode: true },
    });

    if (!cliente) {
      ApiError(res, 'NOT_FOUND', 'Client not found', 404);
      return;
    }

    const qrDataUrl = await QRCode.toDataURL(cliente.qrCode, {
      width: 300,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' },
    });

    ApiSuccess(res, {
      clientId: cliente.id,
      name: `${cliente.firstName} ${cliente.lastName}`,
      qrCode: cliente.qrCode,
      qrImage: qrDataUrl,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/clientes/:id/qr/regenerar
router.post(
  '/:id/qr/regenerar',
  requireRole('ADMIN'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const nuevoQr = uuidv4();

      const cliente = await prisma.client.update({
        where: { id: req.params.id },
        data: { qrCode: nuevoQr },
        select: { id: true, firstName: true, lastName: true, qrCode: true, phone: true },
      });

      const qrDataUrl = await QRCode.toDataURL(cliente.qrCode, {
        width: 300,
        margin: 2,
        color: { dark: '#000000', light: '#ffffff' },
      });

      ApiSuccess(res, {
        clientId: cliente.id,
        name: `${cliente.firstName} ${cliente.lastName}`,
        phone: cliente.phone,
        qrCode: cliente.qrCode,
        qrImage: qrDataUrl,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
