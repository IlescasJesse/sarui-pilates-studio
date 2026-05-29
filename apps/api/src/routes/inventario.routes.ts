import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import { prisma } from '../config/database';
import { ApiSuccess, ApiError } from '../utils/response';

const router = Router();
router.use(authMiddleware);
router.use(requireRole('ADMIN'));

const inventarioSchema = z.object({
  nombre: z.string().trim().min(1),
  categoria: z.enum(['EQUIPAMIENTO', 'CONSUMIBLE', 'LIMPIEZA', 'ADMINISTRATIVO']),
  cantidad: z.number().int().min(0),
  stockMinimo: z.number().int().min(0).default(0),
  unidad: z.string().trim().min(1),
});

const movimientoSchema = z.object({
  tipo: z.enum(['ENTRADA', 'SALIDA', 'AJUSTE']),
  cantidad: z.number().int().min(1),
  nota: z.string().trim().optional(),
});

// GET /api/v1/inventario
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { categoria, alerta } = req.query as Record<string, string>;
    const items = await prisma.inventario.findMany({
      where: {
        deletedAt: null,
        ...(categoria ? { categoria: categoria as any } : {}),
        ...(alerta === 'true' ? { alerta: true } : {}),
      },
      orderBy: [{ alerta: 'desc' }, { nombre: 'asc' }],
    });
    ApiSuccess(res, items);
  } catch (error) { next(error); }
});

// GET /api/v1/inventario/alertas
router.get('/alertas', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const items = await prisma.inventario.findMany({
      where: { deletedAt: null, alerta: true },
      orderBy: { nombre: 'asc' },
    });
    ApiSuccess(res, items);
  } catch (error) { next(error); }
});

// GET /api/v1/inventario/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const item = await prisma.inventario.findUnique({
      where: { id, deletedAt: null },
      include: {
        movimientos: {
          orderBy: { creadoEn: 'desc' },
          take: 50,
          include: { usuario: { select: { id: true, email: true } } },
        },
      },
    });
    if (!item) { ApiError(res, 'NOT_FOUND', 'Item no encontrado', 404); return; }
    ApiSuccess(res, item);
  } catch (error) { next(error); }
});

// POST /api/v1/inventario
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parse = inventarioSchema.safeParse(req.body);
    if (!parse.success) {
      ApiError(res, 'VALIDATION_ERROR', 'Datos inválidos', 400);
      return;
    }
    const { cantidad, stockMinimo } = parse.data;
    const item = await prisma.inventario.create({
      data: {
        ...parse.data,
        alerta: cantidad <= stockMinimo,
        ultimaActualizacion: new Date(),
      },
    });
    ApiSuccess(res, item, 201);
  } catch (error) { next(error); }
});

// PATCH /api/v1/inventario/:id
router.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const parse = inventarioSchema.partial().safeParse(req.body);
    if (!parse.success) { ApiError(res, 'VALIDATION_ERROR', 'Datos inválidos', 400); return; }

    const current = await prisma.inventario.findUnique({ where: { id, deletedAt: null } });
    if (!current) { ApiError(res, 'NOT_FOUND', 'Item no encontrado', 404); return; }

    const newCantidad = parse.data.cantidad ?? current.cantidad;
    const newStockMin = parse.data.stockMinimo ?? current.stockMinimo;

    const item = await prisma.inventario.update({
      where: { id },
      data: {
        ...parse.data,
        alerta: newCantidad <= newStockMin,
        ultimaActualizacion: new Date(),
      },
    });
    ApiSuccess(res, item);
  } catch (error) { next(error); }
});

// DELETE /api/v1/inventario/:id  (soft delete)
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    await prisma.inventario.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    ApiSuccess(res, { mensaje: 'Item eliminado' });
  } catch (error) { next(error); }
});

// POST /api/v1/inventario/:id/movimiento
router.post('/:id/movimiento', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const parse = movimientoSchema.safeParse(req.body);
    if (!parse.success) { ApiError(res, 'VALIDATION_ERROR', 'Datos inválidos', 400); return; }

    const { tipo, cantidad, nota } = parse.data;

    const item = await prisma.inventario.findUnique({ where: { id, deletedAt: null } });
    if (!item) { ApiError(res, 'NOT_FOUND', 'Item no encontrado', 404); return; }

    let nuevaCantidad = item.cantidad;
    if (tipo === 'ENTRADA') nuevaCantidad += cantidad;
    else if (tipo === 'SALIDA') nuevaCantidad -= cantidad;
    else nuevaCantidad = cantidad; // AJUSTE = valor absoluto

    if (nuevaCantidad < 0) {
      ApiError(res, 'STOCK_INSUFICIENTE', 'Cantidad resultante sería negativa', 400);
      return;
    }

    const [movimiento] = await prisma.$transaction([
      prisma.movimientoInventario.create({
        data: {
          inventarioId: id,
          tipo,
          cantidad,
          nota,
          usuarioId: req.user!.id,
        },
      }),
      prisma.inventario.update({
        where: { id },
        data: {
          cantidad: nuevaCantidad,
          alerta: nuevaCantidad <= item.stockMinimo,
          ultimaActualizacion: new Date(),
        },
      }),
    ]);

    ApiSuccess(res, movimiento, 201);
  } catch (error) { next(error); }
});

export default router;
