import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import { prisma } from '../config/database';
import { ApiSuccess, ApiError } from '../utils/response';
import { hashPassword } from '../utils/bcrypt';
import { z } from 'zod';

const router = Router();

router.use(authMiddleware);
router.use(requireRole('ADMIN'));

const instructorSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required'),
  lastName: z.string().trim().min(1, 'Last name is required'),
  email: z.string().trim().email('Invalid email'),
  password: z.string().trim().min(8, 'Password must be at least 8 characters'),
  phone: z.string().trim().optional(),
  bio: z.string().trim().optional(),
  specialties: z.array(z.string().trim()).optional(),
});

// GET /api/v1/instructores
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const instructores = await prisma.instructor.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        bio: true,
        specialties: true,
        avatarUrl: true,
        createdAt: true,
        user: { select: { email: true, isActive: true } },
        _count: { select: { classes: true } },
      },
      orderBy: { firstName: 'asc' },
    });

    const result = instructores.map((i) => ({
      ...i,
      specialties: i.specialties ? JSON.parse(i.specialties) : [],
    }));

    ApiSuccess(res, result);
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/instructores
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parseResult = instructorSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid instructor data',
          details: parseResult.error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
      });
      return;
    }

    const { password, email, specialties, ...rest } = parseResult.data;
    const hashedPassword = await hashPassword(password);

    const instructor = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: 'INSTRUCTOR',
        instructor: {
          create: {
            ...rest,
            specialties: specialties ? JSON.stringify(specialties) : null,
          },
        },
      },
      select: {
        id: true,
        email: true,
        role: true,
        instructor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            bio: true,
            specialties: true,
            createdAt: true,
          },
        },
      },
    });

    ApiSuccess(res, instructor, 201);
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/instructores/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const instructor = await prisma.instructor.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        bio: true,
        specialties: true,
        avatarUrl: true,
        createdAt: true,
        user: { select: { email: true, isActive: true } },
        classes: {
          where: { deletedAt: null },
          orderBy: { startAt: 'desc' },
          take: 10,
          select: {
            id: true,
            title: true,
            type: true,
            subtype: true,
            startAt: true,
            endAt: true,
            isCancelled: true,
          },
        },
      },
    });

    if (!instructor) {
      ApiError(res, 'NOT_FOUND', 'Instructor not found', 404);
      return;
    }

    ApiSuccess(res, {
      ...instructor,
      specialties: instructor.specialties ? JSON.parse(instructor.specialties) : [],
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/v1/instructores/:id
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const updateSchema = instructorSchema.omit({ password: true, email: true }).partial();
    const parseResult = updateSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid data' },
      });
      return;
    }

    const { specialties, ...rest } = parseResult.data;
    const instructor = await prisma.instructor.update({
      where: { id: req.params.id },
      data: {
        ...rest,
        ...(specialties !== undefined ? { specialties: JSON.stringify(specialties) } : {}),
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        bio: true,
        specialties: true,
      },
    });

    ApiSuccess(res, {
      ...instructor,
      specialties: instructor.specialties ? JSON.parse(instructor.specialties) : [],
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/v1/instructores/:id — soft delete
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.instructor.update({
      where: { id: req.params.id },
      data: { deletedAt: new Date() },
    });

    ApiSuccess(res, { message: 'Instructor deactivated successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
