import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import { prisma } from '../config/database';
import { ApiSuccess, ApiError } from '../utils/response';

const router = Router();
router.use(authMiddleware);
router.use(requireRole('ADMIN'));

const crearUsuarioSchema = z.object({
  email:     z.string().email('Correo inválido'),
  password:  z.string().min(6, 'Mínimo 6 caracteres'),
  role:      z.enum(['ADMIN', 'INSTRUCTOR', 'RECEPCIONISTA']),
  firstName: z.string().min(1).max(80),
  lastName:  z.string().min(1).max(80),
  phone:     z.string().max(20).optional(),
  // Solo instructores
  bio:          z.string().optional(),
  specialties:  z.array(z.string()).optional(),
});

// GET /api/v1/usuarios — lista staff (no clientes)
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const usuarios = await prisma.user.findMany({
      where: {
        role: { in: ['ADMIN', 'INSTRUCTOR', 'RECEPCIONISTA'] },
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, email: true, role: true, isActive: true, createdAt: true,
        instructor:   { select: { firstName: true, lastName: true, phone: true, avatarUrl: true } },
        staffProfile: { select: { firstName: true, lastName: true, phone: true, avatarUrl: true } },
      },
    });

    // Normaliza firstName/lastName al mismo nivel para simplicidad en frontend
    const data = usuarios.map((u) => {
      const profile = u.instructor ?? u.staffProfile;
      return {
        id: u.id,
        email: u.email,
        role: u.role,
        isActive: u.isActive,
        createdAt: u.createdAt,
        firstName: profile?.firstName ?? '',
        lastName:  profile?.lastName  ?? '',
        phone:     profile?.phone     ?? null,
        avatarUrl: (profile as { avatarUrl?: string | null } | null)?.avatarUrl ?? null,
      };
    });

    ApiSuccess(res, data);
  } catch (error) { next(error); }
});

// POST /api/v1/usuarios
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parse = crearUsuarioSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', details: parse.error.errors } });
      return;
    }

    const { email, password, role, firstName, lastName, phone, bio, specialties } = parse.data;

    const existe = await prisma.user.findUnique({ where: { email } });
    if (existe) { ApiError(res, 'CONFLICT', 'Este correo ya está registrado', 409); return; }

    const hash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hash,
        role,
        ...(role === 'INSTRUCTOR'
          ? { instructor: { create: { firstName, lastName, phone, bio, specialties: JSON.stringify(specialties ?? []) } } }
          : { staffProfile: { create: { firstName, lastName, phone } } }
        ),
      },
      select: {
        id: true, email: true, role: true, isActive: true, createdAt: true,
        instructor:   { select: { firstName: true, lastName: true } },
        staffProfile: { select: { firstName: true, lastName: true } },
      },
    });

    ApiSuccess(res, user, 201);
  } catch (error) { next(error); }
});

// PATCH /api/v1/usuarios/:id/activar
router.patch('/:id/activar', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { isActive } = req.body as { isActive: boolean };
    if (req.params.id === req.user!.id) {
      ApiError(res, 'FORBIDDEN', 'No puedes desactivar tu propia cuenta', 400);
      return;
    }
    const user = await prisma.user.update({ where: { id: req.params.id }, data: { isActive } });
    ApiSuccess(res, { id: user.id, isActive: user.isActive });
  } catch (error) { next(error); }
});

export default router;
