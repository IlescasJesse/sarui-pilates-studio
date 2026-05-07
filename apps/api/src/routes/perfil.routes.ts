import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { hashPassword, comparePassword } from '../utils/bcrypt';
import { authMiddleware } from '../middlewares/auth.middleware';
import { prisma } from '../config/database';
import { ApiSuccess, ApiError } from '../utils/response';

const router = Router();
router.use(authMiddleware);

const updatePerfilSchema = z.object({
  firstName: z.string().min(1).max(80).optional(),
  lastName:  z.string().min(1).max(80).optional(),
  phone:     z.string().max(20).optional(),
  avatarUrl: z.string().url().optional(),
});

const changePasswordSchema = z.object({
  passwordActual: z.string().min(1),
  passwordNuevo:  z.string().min(6, 'Mínimo 6 caracteres'),
});

// GET /api/v1/perfil
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id, role } = req.user!;

    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, role: true, isActive: true, createdAt: true },
    });
    if (!user) { ApiError(res, 'NOT_FOUND', 'Usuario no encontrado', 404); return; }

    let perfil = null;

    if (role === 'INSTRUCTOR') {
      perfil = await prisma.instructor.findUnique({
        where: { userId: id },
        select: { id: true, firstName: true, lastName: true, phone: true, bio: true, avatarUrl: true, specialties: true },
      });
    } else if (role === 'ADMIN' || role === 'RECEPCIONISTA') {
      perfil = await prisma.staffProfile.findUnique({
        where: { userId: id },
        select: { id: true, firstName: true, lastName: true, phone: true, avatarUrl: true },
      });
    } else if (role === 'CLIENT') {
      perfil = await prisma.client.findUnique({
        where: { userId: id },
        select: { id: true, firstName: true, lastName: true, phone: true },
      });
    }

    ApiSuccess(res, { ...user, perfil });
  } catch (error) { next(error); }
});

// PUT /api/v1/perfil
router.put('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id, role } = req.user!;
    const parse = updatePerfilSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', details: parse.error.errors } });
      return;
    }
    const data = parse.data;

    if (role === 'INSTRUCTOR') {
      await prisma.instructor.update({ where: { userId: id }, data });
    } else if (role === 'ADMIN' || role === 'RECEPCIONISTA') {
      await prisma.staffProfile.upsert({
        where: { userId: id },
        update: data,
        create: { userId: id, firstName: data.firstName ?? '', lastName: data.lastName ?? '', ...data },
      });
    }

    ApiSuccess(res, { mensaje: 'Perfil actualizado' });
  } catch (error) { next(error); }
});

// PUT /api/v1/perfil/password
router.put('/password', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.user!;
    const parse = changePasswordSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', details: parse.error.errors } });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) { ApiError(res, 'NOT_FOUND', 'Usuario no encontrado', 404); return; }

    const valido = await comparePassword(parse.data.passwordActual, user.password);
    if (!valido) { ApiError(res, 'INVALID_PASSWORD', 'Contraseña actual incorrecta', 400); return; }

    const hash = await hashPassword(parse.data.passwordNuevo);
    await prisma.user.update({ where: { id }, data: { password: hash } });

    ApiSuccess(res, { mensaje: 'Contraseña actualizada' });
  } catch (error) { next(error); }
});

export default router;
