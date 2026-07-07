import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function dt(isoDate: string, hour: number, minute = 0): Date {
  return new Date(`${isoDate}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00.000Z`);
}

function addMinutes(d: Date, m: number): Date {
  return new Date(d.getTime() + m * 60_000);
}

const REFORMER: Array<{ date: string; hour: number; minute?: number; tipo: 'FLOW' | 'POWER' | 'MOBILITY'; cancelled?: boolean }> = [
  { date: '2026-06-16', hour: 7,  tipo: 'MOBILITY' },
  { date: '2026-06-16', hour: 8,  tipo: 'POWER' },
  { date: '2026-06-16', hour: 9,  tipo: 'FLOW' },
  { date: '2026-06-16', hour: 17, tipo: 'FLOW' },
  { date: '2026-06-16', hour: 18, tipo: 'FLOW' },
  { date: '2026-06-16', hour: 19, tipo: 'FLOW', cancelled: true },
  { date: '2026-06-17', hour: 7,  tipo: 'POWER' },
  { date: '2026-06-17', hour: 8,  tipo: 'FLOW' },
  { date: '2026-06-17', hour: 9,  tipo: 'MOBILITY' },
  { date: '2026-06-17', hour: 17, tipo: 'POWER' },
  { date: '2026-06-17', hour: 18, tipo: 'MOBILITY' },
  { date: '2026-06-17', hour: 19, tipo: 'MOBILITY' },
  { date: '2026-06-18', hour: 7,  tipo: 'MOBILITY' },
  { date: '2026-06-18', hour: 8,  tipo: 'POWER' },
  { date: '2026-06-18', hour: 9,  tipo: 'POWER' },
  { date: '2026-06-18', hour: 17, tipo: 'MOBILITY' },
  { date: '2026-06-18', hour: 18, tipo: 'FLOW' },
  { date: '2026-06-18', hour: 19, tipo: 'POWER' },
  { date: '2026-06-19', hour: 7,  tipo: 'POWER' },
  { date: '2026-06-19', hour: 8,  tipo: 'FLOW' },
  { date: '2026-06-19', hour: 9,  tipo: 'MOBILITY' },
  { date: '2026-06-19', hour: 17, tipo: 'POWER' },
  { date: '2026-06-19', hour: 18, tipo: 'POWER' },
  { date: '2026-06-19', hour: 19, tipo: 'FLOW' },
  { date: '2026-06-20', hour: 7,  tipo: 'FLOW' },
  { date: '2026-06-20', hour: 8,  tipo: 'POWER' },
  { date: '2026-06-20', hour: 9,  tipo: 'POWER' },
  { date: '2026-06-20', hour: 17, tipo: 'POWER' },
  { date: '2026-06-20', hour: 18, tipo: 'FLOW' },
  { date: '2026-06-20', hour: 19, tipo: 'POWER' },
  { date: '2026-06-21', hour: 7,  minute: 30, tipo: 'MOBILITY' },
  { date: '2026-06-21', hour: 8,  minute: 30, tipo: 'MOBILITY' },
];

const MAT: Array<{ date: string; hour: number; minute?: number; tipo: 'MAT' | 'GAP' }> = [
  { date: '2026-06-16', hour: 7,  tipo: 'MAT' },
  { date: '2026-06-16', hour: 8,  tipo: 'GAP' },
  { date: '2026-06-16', hour: 9,  tipo: 'MAT' },
  { date: '2026-06-16', hour: 17, tipo: 'MAT' },
  { date: '2026-06-16', hour: 18, tipo: 'GAP' },
  { date: '2026-06-16', hour: 19, tipo: 'MAT' },
  { date: '2026-06-17', hour: 7,  tipo: 'MAT' },
  { date: '2026-06-17', hour: 8,  tipo: 'MAT' },
  { date: '2026-06-17', hour: 9,  tipo: 'MAT' },
  { date: '2026-06-17', hour: 17, tipo: 'MAT' },
  { date: '2026-06-17', hour: 18, tipo: 'MAT' },
  { date: '2026-06-17', hour: 19, tipo: 'MAT' },
  { date: '2026-06-18', hour: 7,  tipo: 'MAT' },
  { date: '2026-06-18', hour: 8,  tipo: 'GAP' },
  { date: '2026-06-18', hour: 9,  tipo: 'MAT' },
  { date: '2026-06-18', hour: 17, tipo: 'MAT' },
  { date: '2026-06-18', hour: 18, tipo: 'GAP' },
  { date: '2026-06-18', hour: 19, tipo: 'MAT' },
  { date: '2026-06-19', hour: 7,  tipo: 'MAT' },
  { date: '2026-06-19', hour: 8,  tipo: 'MAT' },
  { date: '2026-06-19', hour: 9,  tipo: 'MAT' },
  { date: '2026-06-19', hour: 17, tipo: 'MAT' },
  { date: '2026-06-19', hour: 18, tipo: 'MAT' },
  { date: '2026-06-19', hour: 19, tipo: 'MAT' },
  { date: '2026-06-20', hour: 7,  tipo: 'MAT' },
  { date: '2026-06-20', hour: 8,  tipo: 'GAP' },
  { date: '2026-06-20', hour: 9,  tipo: 'MAT' },
  { date: '2026-06-20', hour: 17, tipo: 'MAT' },
  { date: '2026-06-20', hour: 18, tipo: 'GAP' },
  { date: '2026-06-20', hour: 19, tipo: 'MAT' },
  { date: '2026-06-21', hour: 7,  minute: 30, tipo: 'MAT' },
  { date: '2026-06-21', hour: 8,  minute: 30, tipo: 'MAT' },
];

async function main() {
  console.log('🌱 Creando clases semana 16–21 Jun 2026...\n');

  // Buscar tiposActividad existentes por nombre
  const taReformer = await prisma.tipoActividad.findFirst({ where: { nombre: { contains: 'Reformer' } } });
  const taMat      = await prisma.tipoActividad.findFirst({ where: { nombre: { contains: 'Mat' } } });

  if (!taReformer || !taMat) {
    console.error('❌ No se encontraron tiposActividad (Reformer / Mat). Corre seed completo primero en dev.');
    process.exit(1);
  }

  // Usar el primer instructor activo que exista
  const instructor = await prisma.instructor.findFirst({ where: { deletedAt: null } });
  if (!instructor) {
    console.error('❌ No hay instructores en DB. Crea uno primero en /instructores.');
    process.exit(1);
  }

  const instructorId = instructor.id;
  let created = 0;

  for (const c of REFORMER) {
    const startAt = dt(c.date, c.hour, c.minute ?? 0);
    await prisma.class.create({
      data: {
        instructorId,
        type: c.tipo,
        subtype: 'REFORMER',
        tipoActividadId: taReformer.id,
        title: `Reformer ${c.tipo.charAt(0) + c.tipo.slice(1).toLowerCase()}`,
        startAt,
        endAt: addMinutes(startAt, 55),
        capacity: 6,
        isCancelled: c.cancelled ?? false,
        cancelReason: c.cancelled ? 'Clase cancelada' : null,
      },
    });
    created++;
  }

  for (const c of MAT) {
    const startAt = dt(c.date, c.hour, c.minute ?? 0);
    await prisma.class.create({
      data: {
        instructorId,
        type: c.tipo,
        subtype: 'MAT',
        tipoActividadId: taMat.id,
        title: c.tipo === 'GAP' ? 'Mat GAP' : 'Pilates Mat',
        startAt,
        endAt: addMinutes(startAt, 55),
        capacity: 10,
      },
    });
    created++;
  }

  console.log(`✅ ${created} clases creadas (${REFORMER.length} Reformer + ${MAT.length} Mat)`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
