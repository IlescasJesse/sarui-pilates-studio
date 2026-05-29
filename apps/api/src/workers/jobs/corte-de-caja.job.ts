import { prisma } from '../../config/database';
import { Prisma } from '@prisma/client';

// Mexico City CST = UTC-6. Day boundary: 06:00 UTC = 00:00 MX.
const MX_OFFSET_MS = 6 * 60 * 60 * 1000;

function todayBoundariesUTC(): { start: Date; end: Date } {
  const now = new Date();
  const mxNow = new Date(now.getTime() - MX_OFFSET_MS);
  const mxMidnight = new Date(mxNow);
  mxMidnight.setUTCHours(0, 0, 0, 0);

  const start = new Date(mxMidnight.getTime() + MX_OFFSET_MS); // 06:00 UTC
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
}

export async function computeCorteCaja(claseId: string): Promise<{
  claseId: string;
  instructorId: string;
  fecha: Date;
  totalReservaciones: number;
  ingresoDirecto: Prisma.Decimal;
  ingresoMembresia: Prisma.Decimal;
  ingresoTotal: Prisma.Decimal;
}> {
  const clase = await prisma.class.findUnique({
    where: { id: claseId },
    select: { instructorId: true, startAt: true, isCancelled: true, deletedAt: true },
  });

  if (!clase) throw new Error(`Clase ${claseId} no encontrada`);
  if (clase.isCancelled) throw new Error(`Clase ${claseId} está cancelada`);
  if (clase.deletedAt) throw new Error(`Clase ${claseId} eliminada`);

  const reservaciones = await prisma.reservation.findMany({
    where: {
      classId: claseId,
      deletedAt: null,
      status: { in: ['CONFIRMED', 'ATTENDED'] },
    },
    select: {
      id: true,
      membershipId: true,
      membership: {
        select: {
          package: { select: { price: true, sessions: true } },
        },
      },
    },
  });

  const totalReservaciones = reservaciones.length;

  // Direct income: payments linked to a reservation of this class (walk-in / MP clase suelta)
  const directPayments = await prisma.payment.findMany({
    where: {
      reservationId: { in: reservaciones.map((r) => r.id) },
      status: 'PAID',
    },
    select: { amount: true },
  });
  const ingresoDirectoNum = directPayments.reduce((s, p) => s + Number(p.amount), 0);

  // Membership income: prorate package price / sessions for each membership reservation
  const ingresoMembresiaNum = reservaciones
    .filter((r) => r.membershipId && r.membership?.package)
    .reduce((s, r) => {
      const pkg = r.membership!.package!;
      return s + Number(pkg.price) / pkg.sessions;
    }, 0);

  const ingresoTotalNum = ingresoDirectoNum + ingresoMembresiaNum;

  return {
    claseId,
    instructorId: clase.instructorId,
    fecha: clase.startAt,
    totalReservaciones,
    ingresoDirecto: new Prisma.Decimal(ingresoDirectoNum.toFixed(2)),
    ingresoMembresia: new Prisma.Decimal(ingresoMembresiaNum.toFixed(2)),
    ingresoTotal: new Prisma.Decimal(ingresoTotalNum.toFixed(2)),
  };
}

export async function corteDeCajaJob(): Promise<void> {
  const { start, end } = todayBoundariesUTC();

  // Classes that ended today, not cancelled, not deleted, no corte yet
  const clases = await prisma.class.findMany({
    where: {
      deletedAt: null,
      isCancelled: false,
      endAt: { gte: start, lt: end },
      corteCaja: null,
    },
    select: { id: true },
  });

  if (clases.length === 0) {
    console.log('[corte-de-caja] No hay clases terminadas hoy sin corte.');
    return;
  }

  let created = 0;
  for (const { id } of clases) {
    try {
      const data = await computeCorteCaja(id);
      await prisma.corteCaja.create({ data });
      created++;
    } catch (err) {
      console.error(`[corte-de-caja] Error en clase ${id}:`, err instanceof Error ? err.message : err);
    }
  }

  console.log(`[corte-de-caja] ${created}/${clases.length} cortes generados.`);
}
