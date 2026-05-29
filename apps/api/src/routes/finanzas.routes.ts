import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import { prisma } from '../config/database';
import { ApiSuccess, ApiError } from '../utils/response';

const router = Router();
router.use(authMiddleware);
router.use(requireRole('ADMIN'));

function rango(mes: number, anio: number) {
  return {
    gte: new Date(anio, mes - 1, 1),
    lte: new Date(anio, mes, 0, 23, 59, 59),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// ESTADO DE RESULTADOS — "¿Cuánto ganó el negocio este mes?"
// ─────────────────────────────────────────────────────────────────────────────
router.get('/estado-resultados', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const mes  = Number(req.query.mes)  || new Date().getMonth() + 1;
    const anio = Number(req.query.anio) || new Date().getFullYear();
    const fecha = rango(mes, anio);

    const [ingresos, gastos, membresiasPagadas, cortesCaja] = await Promise.all([
      prisma.ingreso.findMany({
        where: { fecha },
        include: { cuentaContable: { select: { tipo: true, nombre: true } } },
      }),
      prisma.gasto.findMany({
        where: { fecha },
        include: { cuentaContable: { select: { tipo: true, nombre: true } } },
      }),
      prisma.membership.findMany({
        where: { createdAt: fecha, paymentStatus: 'PAID' },
        select: { pricePaid: true },
      }),
      prisma.corteCaja.findMany({
        where: { fecha },
        select: { ingresoDirecto: true, ingresoMembresia: true, ingresoTotal: true },
      }),
    ]);

    // Ingresos por origen
    const ingresosMP    = membresiasPagadas.reduce((s, m) => s + Number(m.pricePaid), 0);
    const ingresosManual = ingresos.reduce((s, i) => s + Number(i.monto), 0);
    const ingresosClases = cortesCaja.reduce((s, c) => s + Number(c.ingresoTotal), 0);
    const totalIngresos  = ingresosManual + ingresosMP;

    // Gastos por tipo de cuenta
    const costos   = gastos.filter(g => g.cuentaContable.tipo === 'COSTO');
    const operativos = gastos.filter(g => g.cuentaContable.tipo === 'GASTO');
    const totalCostos    = costos.reduce((s, g) => s + Number(g.monto), 0);
    const totalOperativos = operativos.reduce((s, g) => s + Number(g.monto), 0);
    const totalGastos    = totalCostos + totalOperativos;

    const utilidadBruta  = totalIngresos - totalCostos;
    const utilidadNeta   = totalIngresos - totalGastos;
    const margenBruto    = totalIngresos > 0 ? (utilidadBruta / totalIngresos) * 100 : 0;
    const margenNeto     = totalIngresos > 0 ? (utilidadNeta / totalIngresos) * 100 : 0;

    ApiSuccess(res, {
      mes, anio,
      // ── Ingresos ─────────────────────────────────────────────
      ingresos: {
        manuales: ingresosManual,       // registrados en el módulo de ingresos
        membresiasMP: ingresosMP,       // compras vía MercadoPago
        totalClases: ingresosClases,    // suma de cortes de caja (referencial)
        total: totalIngresos,
      },
      // ── Costos de Servicio ────────────────────────────────────
      costoServicio: {
        detalle: costos.map(g => ({ concepto: g.concepto, monto: Number(g.monto), cuenta: g.cuentaContable.nombre })),
        total: totalCostos,
      },
      utilidadBruta,
      margenBruto: Number(margenBruto.toFixed(1)),
      // ── Gastos Operativos ─────────────────────────────────────
      gastosOperativos: {
        detalle: operativos.map(g => ({ concepto: g.concepto, monto: Number(g.monto), cuenta: g.cuentaContable.nombre })),
        total: totalOperativos,
      },
      // ── Resultado Final ───────────────────────────────────────
      utilidadNeta,
      margenNeto: Number(margenNeto.toFixed(1)),
      esBeneficio: utilidadNeta >= 0,
    });
  } catch (error) { next(error); }
});

// ─────────────────────────────────────────────────────────────────────────────
// FLUJO DE EFECTIVO — "¿Cuánto dinero entró y salió realmente?"
// ─────────────────────────────────────────────────────────────────────────────
router.get('/flujo-efectivo', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const mes  = Number(req.query.mes)  || new Date().getMonth() + 1;
    const anio = Number(req.query.anio) || new Date().getFullYear();
    const fecha = rango(mes, anio);

    const [ingresos, gastos, membresiasPagadas, pagosInversion] = await Promise.all([
      prisma.ingreso.aggregate({ where: { fecha }, _sum: { monto: true } }),
      prisma.gasto.aggregate({ where: { fecha }, _sum: { monto: true } }),
      prisma.membership.aggregate({
        where: { createdAt: fecha, paymentStatus: 'PAID' },
        _sum: { pricePaid: true },
      }),
      prisma.pagoInversion.findMany({
        where: { fecha },
        include: { inversion: { select: { concepto: true, categoria: true } } },
      }),
    ]);

    const entradasOp  = Number(ingresos._sum.monto ?? 0) + Number(membresiasPagadas._sum.pricePaid ?? 0);
    const salidasOp   = Number(gastos._sum.monto ?? 0);
    const netoOperativo = entradasOp - salidasOp;

    const totalPagosInv = pagosInversion.reduce((s, p) => s + Number(p.monto), 0);
    const netoInversion = -totalPagosInv;

    ApiSuccess(res, {
      mes, anio,
      operativo: {
        entradas: entradasOp,
        salidas: salidasOp,
        neto: netoOperativo,
      },
      inversion: {
        pagosRealizados: totalPagosInv,
        neto: netoInversion,
        detalle: pagosInversion.map(p => ({
          concepto: p.inversion.concepto,
          categoria: p.inversion.categoria,
          monto: Number(p.monto),
          fecha: p.fecha,
          nota: p.nota,
        })),
      },
      flujoNeto: netoOperativo + netoInversion,
    });
  } catch (error) { next(error); }
});

// ─────────────────────────────────────────────────────────────────────────────
// BALANCE GENERAL SIMPLIFICADO — "¿Qué tiene el negocio y qué debe?"
// ─────────────────────────────────────────────────────────────────────────────
router.get('/balance-general', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const inversiones = await prisma.inversionCapital.findMany({
      include: { pagos: { select: { monto: true } } },
      orderBy: { fecha: 'asc' },
    });

    const resumenInversiones = inversiones.map(inv => {
      const totalPagado = inv.pagos.reduce((s, p) => s + Number(p.monto), 0);
      const pendiente   = Number(inv.montoTotal) - totalPagado;
      return {
        id: inv.id,
        concepto: inv.concepto,
        categoria: inv.categoria,
        fecha: inv.fecha,
        montoTotal: Number(inv.montoTotal),
        totalPagado,
        pendiente: Math.max(0, pendiente),
        liquidada: pendiente <= 0,
      };
    });

    const totalInvertido = resumenInversiones.reduce((s, i) => s + i.montoTotal, 0);
    const totalPagado    = resumenInversiones.reduce((s, i) => s + i.totalPagado, 0);
    const totalPendiente = resumenInversiones.reduce((s, i) => s + i.pendiente, 0);

    // Caja estimada: suma acumulada de ingresos - gastos - pagos a inversión
    const [sumIngresos, sumGastos, sumMembresias, sumPagosInv] = await Promise.all([
      prisma.ingreso.aggregate({ _sum: { monto: true } }),
      prisma.gasto.aggregate({ _sum: { monto: true } }),
      prisma.membership.aggregate({ where: { paymentStatus: 'PAID' }, _sum: { pricePaid: true } }),
      prisma.pagoInversion.aggregate({ _sum: { monto: true } }),
    ]);

    const cajaEstimada =
      Number(sumIngresos._sum.monto ?? 0) +
      Number(sumMembresias._sum.pricePaid ?? 0) -
      Number(sumGastos._sum.monto ?? 0) -
      Number(sumPagosInv._sum.monto ?? 0);

    ApiSuccess(res, {
      activos: {
        caja: cajaEstimada,
        equipo: totalInvertido,
        totalActivos: cajaEstimada + totalInvertido,
      },
      pasivos: {
        inversionesPendientes: totalPendiente,
        totalPasivos: totalPendiente,
      },
      capital: {
        totalInvertido,
        totalPagado,
        pendiente: totalPendiente,
        patrimonio: cajaEstimada + totalInvertido - totalPendiente,
      },
      inversiones: resumenInversiones,
    });
  } catch (error) { next(error); }
});

// ─────────────────────────────────────────────────────────────────────────────
// KPIs / UNIT ECONOMICS — "¿Cuánto rinde cada clase?"
// ─────────────────────────────────────────────────────────────────────────────
router.get('/kpis', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const mes  = Number(req.query.mes)  || new Date().getMonth() + 1;
    const anio = Number(req.query.anio) || new Date().getFullYear();
    const inicio = new Date(anio, mes - 1, 1);
    const fin    = new Date(anio, mes, 0, 23, 59, 59);

    const [clases, reservaciones, cortesCaja, gastos, membresias] = await Promise.all([
      prisma.class.findMany({
        where: { deletedAt: null, isCancelled: false, startAt: { gte: inicio, lte: fin } },
        select: { id: true, capacity: true, spotsBooked: true, tipoActividadId: true, title: true },
      }),
      prisma.reservation.count({
        where: { deletedAt: null, status: { in: ['CONFIRMED', 'ATTENDED'] }, class: { startAt: { gte: inicio, lte: fin } } },
      }),
      prisma.corteCaja.findMany({
        where: { fecha: { gte: inicio, lte: fin } },
        select: { ingresoTotal: true, totalReservaciones: true, claseId: true },
      }),
      prisma.gasto.aggregate({ where: { fecha: { gte: inicio, lte: fin } }, _sum: { monto: true } }),
      prisma.membership.aggregate({ where: { createdAt: { gte: inicio, lte: fin }, paymentStatus: 'PAID' }, _sum: { pricePaid: true } }),
    ]);

    const totalClases = clases.length;
    const spotsDisponibles = clases.reduce((s, c) => s + c.capacity, 0);
    const spotsOcupados    = clases.reduce((s, c) => s + c.spotsBooked, 0);
    const tasaOcupacion    = spotsDisponibles > 0 ? (spotsOcupados / spotsDisponibles) * 100 : 0;

    const ingresosCortes = cortesCaja.reduce((s, c) => s + Number(c.ingresoTotal), 0);
    const ingresoPromClase = totalClases > 0 ? ingresosCortes / totalClases : 0;
    const ingresoPromSpot  = spotsOcupados > 0 ? ingresosCortes / spotsOcupados : 0;

    const totalGastosMes   = Number(gastos._sum.monto ?? 0);
    const costoPromClase   = totalClases > 0 ? totalGastosMes / totalClases : 0;
    const margenPromClase  = ingresoPromClase > 0 ? ((ingresoPromClase - costoPromClase) / ingresoPromClase) * 100 : 0;

    const ingresosMembresiasMes = Number(membresias._sum.pricePaid ?? 0);
    const clientesActivos = await prisma.client.count({
      where: {
        deletedAt: null,
        memberships: { some: { status: 'ACTIVE', sessionsRemaining: { gt: 0 } } },
      },
    });
    const ticketPromedio = clientesActivos > 0 ? ingresosMembresiasMes / clientesActivos : 0;

    ApiSuccess(res, {
      mes, anio,
      clases: {
        total: totalClases,
        spotsDisponibles,
        spotsOcupados,
        tasaOcupacion: Number(tasaOcupacion.toFixed(1)),
      },
      unitEconomics: {
        ingresoPromedioPorClase: Number(ingresoPromClase.toFixed(2)),
        ingresoPromedioPorSpot: Number(ingresoPromSpot.toFixed(2)),
        costoPromedioPorClase: Number(costoPromClase.toFixed(2)),
        margenPromedioPorClase: Number(margenPromClase.toFixed(1)),
      },
      clientes: {
        activos: clientesActivos,
        ticketPromedio: Number(ticketPromedio.toFixed(2)),
        reservacionesConfirmadas: reservaciones,
      },
    });
  } catch (error) { next(error); }
});

// ─────────────────────────────────────────────────────────────────────────────
// INVERSIONES DE CAPITAL — CRUD
// ─────────────────────────────────────────────────────────────────────────────
const inversionSchema = z.object({
  concepto:   z.string().trim().min(1),
  montoTotal: z.number().positive(),
  fecha:      z.string().datetime(),
  categoria:  z.enum(['EQUIPO', 'LOCAL', 'REMODELACION', 'TECNOLOGIA', 'OTRO']),
  notas:      z.string().trim().optional(),
});

const pagoSchema = z.object({
  monto: z.number().positive(),
  fecha: z.string().datetime(),
  nota:  z.string().trim().optional(),
});

// GET /api/v1/finanzas/inversiones
router.get('/inversiones', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const inversiones = await prisma.inversionCapital.findMany({
      include: { pagos: { orderBy: { fecha: 'asc' } } },
      orderBy: { fecha: 'desc' },
    });
    const data = inversiones.map(inv => {
      const pagado    = inv.pagos.reduce((s, p) => s + Number(p.monto), 0);
      const pendiente = Math.max(0, Number(inv.montoTotal) - pagado);
      return { ...inv, montoTotal: Number(inv.montoTotal), pagado, pendiente, liquidada: pendiente === 0 };
    });
    ApiSuccess(res, data);
  } catch (error) { next(error); }
});

// POST /api/v1/finanzas/inversiones
router.post('/inversiones', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parse = inversionSchema.safeParse(req.body);
    if (!parse.success) { ApiError(res, 'VALIDATION_ERROR', 'Datos inválidos', 400); return; }
    const inv = await prisma.inversionCapital.create({
      data: { ...parse.data, fecha: new Date(parse.data.fecha) },
    });
    ApiSuccess(res, inv, 201);
  } catch (error) { next(error); }
});

// DELETE /api/v1/finanzas/inversiones/:id
router.delete('/inversiones/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    await prisma.pagoInversion.deleteMany({ where: { inversionId: id } });
    await prisma.inversionCapital.delete({ where: { id } });
    ApiSuccess(res, { mensaje: 'Inversión eliminada' });
  } catch (error) { next(error); }
});

// POST /api/v1/finanzas/inversiones/:id/pago
router.post('/inversiones/:id/pago', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id    = req.params.id as string;
    const parse = pagoSchema.safeParse(req.body);
    if (!parse.success) { ApiError(res, 'VALIDATION_ERROR', 'Datos inválidos', 400); return; }

    const inv = await prisma.inversionCapital.findUnique({
      where: { id },
      include: { pagos: { select: { monto: true } } },
    });
    if (!inv) { ApiError(res, 'NOT_FOUND', 'Inversión no encontrada', 404); return; }

    const pagado    = inv.pagos.reduce((s, p) => s + Number(p.monto), 0);
    const pendiente = Number(inv.montoTotal) - pagado;
    if (parse.data.monto > pendiente + 0.01) {
      ApiError(res, 'EXCEDE_MONTO', `El pago ($${parse.data.monto}) excede lo pendiente ($${pendiente.toFixed(2)})`, 400);
      return;
    }

    const pago = await prisma.pagoInversion.create({
      data: { inversionId: id, ...parse.data, fecha: new Date(parse.data.fecha) },
    });
    ApiSuccess(res, pago, 201);
  } catch (error) { next(error); }
});

// DELETE /api/v1/finanzas/inversiones/:id/pago/:pagoId
router.delete('/inversiones/:id/pago/:pagoId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.pagoInversion.delete({ where: { id: req.params.pagoId as string } });
    ApiSuccess(res, { mensaje: 'Pago eliminado' });
  } catch (error) { next(error); }
});

export default router;
