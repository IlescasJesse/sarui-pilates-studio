import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import { prisma } from '../config/database';
import { ApiSuccess, ApiError } from '../utils/response';

const router = Router();
router.use(authMiddleware);
router.use(requireRole('ADMIN', 'RECEPCIONISTA'));

// ── Cuentas Contables ────────────────────────────────────────

const cuentaSchema = z.object({
  codigo:      z.string().min(1).max(10),
  nombre:      z.string().min(1).max(120),
  tipo:        z.enum(['ACTIVO', 'PASIVO', 'CAPITAL', 'INGRESO', 'COSTO', 'GASTO']),
  descripcion: z.string().optional(),
});

// GET /api/v1/contabilidad/cuentas
router.get('/cuentas', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tipo } = req.query as { tipo?: string };
    const cuentas = await prisma.cuentaContable.findMany({
      where: { ...(tipo ? { tipo: tipo as any } : {}), isActive: true },
      orderBy: { codigo: 'asc' },
    });
    ApiSuccess(res, cuentas);
  } catch (error) { next(error); }
});

// POST /api/v1/contabilidad/cuentas — solo ADMIN
router.post('/cuentas', requireRole('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parse = cuentaSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', details: parse.error.errors } });
      return;
    }
    const existe = await prisma.cuentaContable.findUnique({ where: { codigo: parse.data.codigo } });
    if (existe) { ApiError(res, 'CONFLICT', 'Ya existe una cuenta con ese código', 409); return; }
    const cuenta = await prisma.cuentaContable.create({ data: parse.data });
    ApiSuccess(res, cuenta, 201);
  } catch (error) { next(error); }
});

// DELETE /api/v1/contabilidad/cuentas/:id — solo ADMIN (soft)
router.delete('/cuentas/:id', requireRole('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.cuentaContable.update({ where: { id: req.params.id }, data: { isActive: false } });
    ApiSuccess(res, { mensaje: 'Cuenta desactivada' });
  } catch (error) { next(error); }
});

// ── Gastos ───────────────────────────────────────────────────

const gastoSchema = z.object({
  cuentaContableId: z.string().min(1),
  concepto:         z.string().min(1).max(200),
  monto:            z.number().positive('El monto debe ser mayor a 0'),
  fecha:            z.string().datetime(),
  comprobante:      z.string().max(100).optional(),
  notas:            z.string().optional(),
});

// GET /api/v1/contabilidad/gastos
router.get('/gastos', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { mes, anio, cuentaId } = req.query as Record<string, string>;
    const where: Record<string, any> = {};

    if (mes && anio) {
      const inicio = new Date(Number(anio), Number(mes) - 1, 1);
      const fin    = new Date(Number(anio), Number(mes), 0, 23, 59, 59);
      where.fecha  = { gte: inicio, lte: fin };
    }
    if (cuentaId) where.cuentaContableId = cuentaId;

    const gastos = await prisma.gasto.findMany({
      where,
      orderBy: { fecha: 'desc' },
      include: {
        cuentaContable: { select: { codigo: true, nombre: true, tipo: true } },
        creadoPor:      { select: { email: true } },
      },
    });
    ApiSuccess(res, gastos);
  } catch (error) { next(error); }
});

// POST /api/v1/contabilidad/gastos
router.post('/gastos', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parse = gastoSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', details: parse.error.errors } });
      return;
    }
    const gasto = await prisma.gasto.create({
      data: { ...parse.data, fecha: new Date(parse.data.fecha), creadoPorId: req.user!.id },
      include: { cuentaContable: { select: { codigo: true, nombre: true } } },
    });
    ApiSuccess(res, gasto, 201);
  } catch (error) { next(error); }
});

// DELETE /api/v1/contabilidad/gastos/:id — solo ADMIN
router.delete('/gastos/:id', requireRole('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.gasto.delete({ where: { id: req.params.id } });
    ApiSuccess(res, { mensaje: 'Gasto eliminado' });
  } catch (error) { next(error); }
});

// ── Ingresos ─────────────────────────────────────────────────

const ingresoSchema = z.object({
  cuentaContableId: z.string().min(1),
  concepto:         z.string().min(1).max(200),
  monto:            z.number().positive(),
  fecha:            z.string().datetime(),
  origen:           z.enum(['MEMBRESIA_MANUAL', 'PAQUETE_MANUAL', 'PORTAL_MERCADOPAGO', 'WALK_IN', 'OTRO']),
  referenciaId:     z.string().optional(),
  comprobante:      z.string().max(100).optional(),
  notas:            z.string().optional(),
});

// GET /api/v1/contabilidad/ingresos
router.get('/ingresos', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { mes, anio, cuentaId } = req.query as Record<string, string>;
    const where: Record<string, any> = {};

    if (mes && anio) {
      const inicio = new Date(Number(anio), Number(mes) - 1, 1);
      const fin    = new Date(Number(anio), Number(mes), 0, 23, 59, 59);
      where.fecha  = { gte: inicio, lte: fin };
    }
    if (cuentaId) where.cuentaContableId = cuentaId;

    const ingresos = await prisma.ingreso.findMany({
      where,
      orderBy: { fecha: 'desc' },
      include: {
        cuentaContable: { select: { codigo: true, nombre: true, tipo: true } },
        creadoPor:      { select: { email: true } },
      },
    });
    ApiSuccess(res, ingresos);
  } catch (error) { next(error); }
});

// POST /api/v1/contabilidad/ingresos
router.post('/ingresos', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parse = ingresoSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', details: parse.error.errors } });
      return;
    }
    const ingreso = await prisma.ingreso.create({
      data: { ...parse.data, fecha: new Date(parse.data.fecha), creadoPorId: req.user!.id },
      include: { cuentaContable: { select: { codigo: true, nombre: true } } },
    });
    ApiSuccess(res, ingreso, 201);
  } catch (error) { next(error); }
});

// DELETE /api/v1/contabilidad/ingresos/:id — solo ADMIN
router.delete('/ingresos/:id', requireRole('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.ingreso.delete({ where: { id: req.params.id } });
    ApiSuccess(res, { mensaje: 'Ingreso eliminado' });
  } catch (error) { next(error); }
});

// ── Reporte ──────────────────────────────────────────────────

// GET /api/v1/contabilidad/reporte?mes=5&anio=2026
router.get('/reporte', requireRole('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const mes  = Number(req.query.mes)  || new Date().getMonth() + 1;
    const anio = Number(req.query.anio) || new Date().getFullYear();

    const inicio = new Date(anio, mes - 1, 1);
    const fin    = new Date(anio, mes, 0, 23, 59, 59);
    const rango  = { gte: inicio, lte: fin };

    const [gastos, ingresos, membresiasPagadas] = await Promise.all([
      prisma.gasto.findMany({
        where: { fecha: rango },
        include: { cuentaContable: { select: { codigo: true, nombre: true, tipo: true } } },
      }),
      prisma.ingreso.findMany({
        where: { fecha: rango },
        include: { cuentaContable: { select: { codigo: true, nombre: true, tipo: true } } },
      }),
      // Ingresos automáticos: membresías pagadas en el período
      prisma.membership.findMany({
        where: { createdAt: rango, paymentStatus: 'PAID' },
        select: { pricePaid: true, createdAt: true, package: { select: { name: true } } },
      }),
    ]);

    const totalGastos   = gastos.reduce((s, g) => s + Number(g.monto), 0);
    const totalIngresos = ingresos.reduce((s, i) => s + Number(i.monto), 0);
    const totalMembresias = membresiasPagadas.reduce((s, m) => s + Number(m.pricePaid), 0);
    const totalIngresosConAuto = totalIngresos + totalMembresias;

    // Desglose por cuenta
    const desglosePorCuenta = [
      ...gastos.map(g => ({ ...g.cuentaContable, monto: Number(g.monto), tipo: 'egreso' as const })),
      ...ingresos.map(i => ({ ...i.cuentaContable, monto: Number(i.monto), tipo: 'ingreso' as const })),
    ].reduce((acc: Record<string, any>, item) => {
      const key = item.codigo;
      if (!acc[key]) acc[key] = { codigo: item.codigo, nombre: item.nombre, tipo: item.tipo, total: 0 };
      acc[key].total += item.monto;
      return acc;
    }, {});

    ApiSuccess(res, {
      mes, anio,
      totalIngresos: totalIngresosConAuto,
      totalGastos,
      balance: totalIngresosConAuto - totalGastos,
      ingresosRegistrados: totalIngresos,
      ingresosMembresias: totalMembresias,
      desglosePorCuenta: Object.values(desglosePorCuenta),
      gastos,
      ingresos,
      membresiasPagadas,
    });
  } catch (error) { next(error); }
});

export default router;
