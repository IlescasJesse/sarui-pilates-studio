import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import { prisma } from '../config/database';
import { ApiSuccess, ApiError } from '../utils/response';

const router = Router();
router.use(authMiddleware);

// ─── Schemas ────────────────────────────────────────────────────────────────

const puestoSchema = z.object({
  nombre: z.string().trim().min(1),
  salarioSemanal: z.coerce.number().positive(),
  activo: z.boolean().optional(),
});

const staffSchema = z.object({
  userId: z.string().min(1),
  nombre: z.string().trim().min(1),
  apellido: z.string().trim().min(1),
  phone: z.string().optional(),
  puestoId: z.string().optional(),
  fechaIngreso: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  activo: z.boolean().optional(),
  nuevoPuesto: z.object({
    nombre: z.string().min(1),
    salarioSemanal: z.coerce.number().positive(),
  }).optional(),
});

// ─── Response mapper ─────────────────────────────────────────────────────────

function mapStaff<T extends { firstName: string; lastName: string }>(s: T) {
  const { firstName, lastName, ...rest } = s as any;
  return { ...rest, nombre: firstName, apellido: lastName };
}

// ─── Puestos ─────────────────────────────────────────────────────────────────

// GET /puestos
router.get('/puestos', requireRole('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const items = await prisma.puesto.findMany({ orderBy: { nombre: 'asc' } });
    ApiSuccess(res, items);
  } catch (error) { next(error); }
});

// POST /puestos
router.post('/puestos', requireRole('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parse = puestoSchema.safeParse(req.body);
    if (!parse.success) {
      ApiError(res, 'VALIDATION_ERROR', 'Datos inválidos', 400);
      return;
    }
    const puesto = await prisma.puesto.create({ data: parse.data });
    ApiSuccess(res, puesto, 201);
  } catch (error: any) {
    if (error?.code === 'P2002') {
      ApiError(res, 'DUPLICATE', 'Ya existe un puesto con ese nombre', 409);
      return;
    }
    next(error);
  }
});

// PATCH /puestos/:id
router.patch('/puestos/:id', requireRole('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const parse = puestoSchema.partial().safeParse(req.body);
    if (!parse.success) {
      ApiError(res, 'VALIDATION_ERROR', 'Datos inválidos', 400);
      return;
    }
    const puesto = await prisma.puesto.update({ where: { id }, data: parse.data });
    ApiSuccess(res, puesto);
  } catch (error: any) {
    if (error?.code === 'P2025') {
      ApiError(res, 'NOT_FOUND', 'Puesto no encontrado', 404);
      return;
    }
    next(error);
  }
});

// DELETE /puestos/:id
router.delete('/puestos/:id', requireRole('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const count = await prisma.staffProfile.count({ where: { puestoId: id } });
    if (count > 0) {
      ApiError(res, 'IN_USE', 'No se puede eliminar: hay empleados asignados', 409);
      return;
    }
    await prisma.puesto.delete({ where: { id } });
    ApiSuccess(res, { ok: true });
  } catch (error: any) {
    if (error?.code === 'P2025') {
      ApiError(res, 'NOT_FOUND', 'Puesto no encontrado', 404);
      return;
    }
    next(error);
  }
});

// ─── Staff (StaffProfile) ────────────────────────────────────────────────────

// GET /staff
router.get('/staff', requireRole('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const items = await prisma.staffProfile.findMany({
      include: {
        user: { select: { id: true, email: true, role: true } },
        puesto: true,
      },
      orderBy: { firstName: 'asc' },
    });
    ApiSuccess(res, items.map(mapStaff));
  } catch (error) { next(error); }
});

// POST /staff
router.post('/staff', requireRole('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parse = staffSchema.safeParse(req.body);
    if (!parse.success) {
      ApiError(res, 'VALIDATION_ERROR', 'Datos inválidos', 400);
      return;
    }
    const { userId, nombre, apellido, phone, fechaIngreso, activo, nuevoPuesto } = parse.data;
    let { puestoId } = parse.data;

    let staff;
    if (nuevoPuesto && !puestoId) {
      const result = await prisma.$transaction(async (tx) => {
        const puesto = await tx.puesto.create({ data: nuevoPuesto });
        return tx.staffProfile.create({
          data: {
            userId,
            firstName: nombre,
            lastName: apellido,
            phone,
            puestoId: puesto.id,
            fechaIngreso: fechaIngreso ? new Date(fechaIngreso) : undefined,
            activo: activo ?? true,
          },
          include: {
            user: { select: { id: true, email: true, role: true } },
            puesto: true,
          },
        });
      });
      staff = result;
    } else {
      staff = await prisma.staffProfile.create({
        data: {
          userId,
          firstName: nombre,
          lastName: apellido,
          phone,
          puestoId: puestoId ?? undefined,
          fechaIngreso: fechaIngreso ? new Date(fechaIngreso) : undefined,
          activo: activo ?? true,
        },
        include: {
          user: { select: { id: true, email: true, role: true } },
          puesto: true,
        },
      });
    }

    ApiSuccess(res, mapStaff(staff), 201);
  } catch (error: any) {
    if (error?.code === 'P2002') {
      ApiError(res, 'DUPLICATE', 'Ese usuario ya tiene perfil de personal', 409);
      return;
    }
    next(error);
  }
});

// PATCH /staff/:id
router.patch('/staff/:id', requireRole('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const parse = staffSchema.partial().safeParse(req.body);
    if (!parse.success) {
      ApiError(res, 'VALIDATION_ERROR', 'Datos inválidos', 400);
      return;
    }
    const { nombre, apellido, phone, puestoId, fechaIngreso, activo } = parse.data;
    const updated = await prisma.staffProfile.update({
      where: { id },
      data: {
        ...(nombre !== undefined && { firstName: nombre }),
        ...(apellido !== undefined && { lastName: apellido }),
        ...(phone !== undefined && { phone }),
        ...(puestoId !== undefined && { puestoId }),
        ...(fechaIngreso !== undefined && { fechaIngreso: new Date(fechaIngreso) }),
        ...(activo !== undefined && { activo }),
      },
      include: {
        user: { select: { id: true, email: true, role: true } },
        puesto: true,
      },
    });
    ApiSuccess(res, mapStaff(updated));
  } catch (error: any) {
    if (error?.code === 'P2025') {
      ApiError(res, 'NOT_FOUND', 'Perfil de personal no encontrado', 404);
      return;
    }
    next(error);
  }
});

// DELETE /staff/:id
router.delete('/staff/:id', requireRole('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    await prisma.staffProfile.delete({ where: { id } });
    ApiSuccess(res, { ok: true });
  } catch (error: any) {
    if (error?.code === 'P2025') {
      ApiError(res, 'NOT_FOUND', 'Perfil de personal no encontrado', 404);
      return;
    }
    next(error);
  }
});

export default router;
