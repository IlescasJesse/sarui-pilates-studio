import { prisma } from '../../config/database';

// Runs Saturday 23:59 Mexico City (CST = UTC-6).
// Copies THIS week's classes → NEXT week.
// 00:00 MX CST = 06:00 UTC used as day boundary.

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function nextMondayUTC(referenceDate: Date): Date {
  const day = referenceDate.getUTCDay(); // 0=Sun … 6=Sat
  const daysUntilMonday = day === 0 ? 1 : 8 - day;
  const monday = new Date(referenceDate);
  monday.setUTCDate(referenceDate.getUTCDate() + daysUntilMonday);
  monday.setUTCHours(6, 0, 0, 0); // 00:00 MX CST
  return monday;
}

export async function generarHorarioJob(): Promise<void> {
  const now = new Date();

  // Next week: [nextMonday, nextMonday + 7 days)
  const nextMonday = nextMondayUTC(now);
  const followingMonday = new Date(nextMonday.getTime() + SEVEN_DAYS_MS);

  // Idempotency: skip if next week already has classes
  const existingCount = await prisma.class.count({
    where: {
      deletedAt: null,
      startAt: { gte: nextMonday, lt: followingMonday },
    },
  });

  if (existingCount > 0) {
    console.log(`[generar-horario] ${existingCount} clases ya existen para semana ${nextMonday.toISOString().slice(0, 10)} — skip.`);
    return;
  }

  // Source: this week [thisMonday, nextMonday)
  const thisMonday = new Date(nextMonday.getTime() - SEVEN_DAYS_MS);

  const sourceClases = await prisma.class.findMany({
    where: {
      deletedAt: null,
      isCancelled: false,
      startAt: { gte: thisMonday, lt: nextMonday },
    },
    select: {
      instructorId: true,
      type: true,
      subtype: true,
      title: true,
      tipoActividadId: true,
      startAt: true,
      endAt: true,
      capacity: true,
      location: true,
      notes: true,
    },
  });

  if (sourceClases.length === 0) {
    console.log('[generar-horario] Sin clases en semana actual — no hay qué copiar.');
    return;
  }

  await prisma.class.createMany({
    data: sourceClases.map((c) => ({
      instructorId: c.instructorId,
      type: c.type,
      subtype: c.subtype,
      title: c.title,
      tipoActividadId: c.tipoActividadId,
      startAt: new Date(c.startAt.getTime() + SEVEN_DAYS_MS),
      endAt: new Date(c.endAt.getTime() + SEVEN_DAYS_MS),
      capacity: c.capacity,
      spotsBooked: 0,
      location: c.location,
      notes: c.notes,
      isActive: true,
      isCancelled: false,
    })),
  });

  console.log(`[generar-horario] ${sourceClases.length} clases creadas para semana ${nextMonday.toISOString().slice(0, 10)}.`);
}
