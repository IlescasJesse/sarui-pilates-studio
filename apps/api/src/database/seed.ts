import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Construye un Date en CDMX (UTC-6) para la semana 27 Abr – 2 May 2026 */
function dt(isoDate: string, hour: number, minute = 0): Date {
  // isoDate = 'YYYY-MM-DD', interpretado en UTC para consistencia en DB
  return new Date(`${isoDate}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00.000Z`);
}

function addMinutes(d: Date, m: number): Date {
  return new Date(d.getTime() + m * 60_000);
}

// ── Horario Reformer semana 27 Abr – 2 May 2026 ───────────────────────────────
// Fuente: cartel oficial. Flow/Power/Mobility son variantes de la clase Reformer.
// 19:00 Lunes marcado como cancelado en cartel → isCancelled: true
const REFORMER_SCHEDULE: Array<{ date: string; hour: number; minute?: number; tipo: 'FLOW' | 'POWER' | 'MOBILITY'; cancelled?: boolean }> = [
  // Lunes 27
  { date: '2026-04-27', hour: 7,  tipo: 'MOBILITY' },
  { date: '2026-04-27', hour: 8,  tipo: 'POWER' },
  { date: '2026-04-27', hour: 9,  tipo: 'FLOW' },
  { date: '2026-04-27', hour: 17, tipo: 'FLOW' },
  { date: '2026-04-27', hour: 18, tipo: 'FLOW' },
  { date: '2026-04-27', hour: 19, tipo: 'FLOW', cancelled: true },
  // Martes 28
  { date: '2026-04-28', hour: 7,  tipo: 'POWER' },
  { date: '2026-04-28', hour: 8,  tipo: 'FLOW' },
  { date: '2026-04-28', hour: 9,  tipo: 'MOBILITY' },
  { date: '2026-04-28', hour: 17, tipo: 'POWER' },
  { date: '2026-04-28', hour: 18, tipo: 'MOBILITY' },
  { date: '2026-04-28', hour: 19, tipo: 'MOBILITY' },
  // Miércoles 29
  { date: '2026-04-29', hour: 7,  tipo: 'MOBILITY' },
  { date: '2026-04-29', hour: 8,  tipo: 'POWER' },
  { date: '2026-04-29', hour: 9,  tipo: 'POWER' },
  { date: '2026-04-29', hour: 17, tipo: 'MOBILITY' },
  { date: '2026-04-29', hour: 18, tipo: 'FLOW' },
  { date: '2026-04-29', hour: 19, tipo: 'POWER' },
  // Jueves 30
  { date: '2026-04-30', hour: 7,  tipo: 'POWER' },
  { date: '2026-04-30', hour: 8,  tipo: 'FLOW' },
  { date: '2026-04-30', hour: 9,  tipo: 'MOBILITY' },
  { date: '2026-04-30', hour: 17, tipo: 'POWER' },
  { date: '2026-04-30', hour: 18, tipo: 'POWER' },
  { date: '2026-04-30', hour: 19, tipo: 'FLOW' },
  // Viernes 1
  { date: '2026-05-01', hour: 7,  tipo: 'FLOW' },
  { date: '2026-05-01', hour: 8,  tipo: 'POWER' },
  { date: '2026-05-01', hour: 9,  tipo: 'POWER' },
  { date: '2026-05-01', hour: 17, tipo: 'POWER' },
  { date: '2026-05-01', hour: 18, tipo: 'FLOW' },
  { date: '2026-05-01', hour: 19, tipo: 'POWER' },
  // Sábado 2 (horario especial: 7:30 y 8:30)
  { date: '2026-05-02', hour: 7, minute: 30, tipo: 'MOBILITY' },
  { date: '2026-05-02', hour: 8, minute: 30, tipo: 'MOBILITY' },
];

// ── Horario Mat semana 27 Abr – 2 May 2026 ────────────────────────────────────
// GAP = Glúteos, Abdomen, Piernas — variante de clase Mat
const MAT_SCHEDULE: Array<{ date: string; hour: number; minute?: number; tipo: 'MAT' | 'GAP' }> = [
  // Lunes 27
  { date: '2026-04-27', hour: 7,  tipo: 'MAT' },
  { date: '2026-04-27', hour: 8,  tipo: 'GAP' },
  { date: '2026-04-27', hour: 9,  tipo: 'MAT' },
  { date: '2026-04-27', hour: 17, tipo: 'MAT' },
  { date: '2026-04-27', hour: 18, tipo: 'GAP' },
  { date: '2026-04-27', hour: 19, tipo: 'MAT' },
  // Martes 28
  { date: '2026-04-28', hour: 7,  tipo: 'MAT' },
  { date: '2026-04-28', hour: 8,  tipo: 'MAT' },
  { date: '2026-04-28', hour: 9,  tipo: 'MAT' },
  { date: '2026-04-28', hour: 17, tipo: 'MAT' },
  { date: '2026-04-28', hour: 18, tipo: 'MAT' },
  { date: '2026-04-28', hour: 19, tipo: 'MAT' },
  // Miércoles 29
  { date: '2026-04-29', hour: 7,  tipo: 'MAT' },
  { date: '2026-04-29', hour: 8,  tipo: 'GAP' },
  { date: '2026-04-29', hour: 9,  tipo: 'MAT' },
  { date: '2026-04-29', hour: 17, tipo: 'MAT' },
  { date: '2026-04-29', hour: 18, tipo: 'GAP' },
  { date: '2026-04-29', hour: 19, tipo: 'MAT' },
  // Jueves 30
  { date: '2026-04-30', hour: 7,  tipo: 'MAT' },
  { date: '2026-04-30', hour: 8,  tipo: 'MAT' },
  { date: '2026-04-30', hour: 9,  tipo: 'MAT' },
  { date: '2026-04-30', hour: 17, tipo: 'MAT' },
  { date: '2026-04-30', hour: 18, tipo: 'MAT' },
  { date: '2026-04-30', hour: 19, tipo: 'MAT' },
  // Viernes 1
  { date: '2026-05-01', hour: 7,  tipo: 'MAT' },
  { date: '2026-05-01', hour: 8,  tipo: 'GAP' },
  { date: '2026-05-01', hour: 9,  tipo: 'MAT' },
  { date: '2026-05-01', hour: 17, tipo: 'MAT' },
  { date: '2026-05-01', hour: 18, tipo: 'GAP' },
  { date: '2026-05-01', hour: 19, tipo: 'MAT' },
  // Sábado 2 (horario especial: 7:30 y 8:30)
  { date: '2026-05-02', hour: 7, minute: 30, tipo: 'MAT' },
  { date: '2026-05-02', hour: 8, minute: 30, tipo: 'MAT' },
];

// ── Main ───────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Iniciando seed de Sarui Pilates Studio...\n');

  // ─── Limpiar tablas en orden seguro ──────────────────────────────────────────
  await prisma.attendance.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.class.deleteMany();
  await prisma.package.deleteMany();
  await prisma.tipoActividad.deleteMany();
  await prisma.instructor.deleteMany();
  await prisma.client.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();

  console.log('✓ Tablas limpiadas\n');

  // ─── TIPOS DE ACTIVIDAD ───────────────────────────────────────────────────────
  const [taReformer, taMat, taBarre] = await Promise.all([
    prisma.tipoActividad.create({
      data: {
        nombre: 'Reformer',
        descripcion: 'Pilates con máquina Reformer. Variantes: Flow, Power, Mobility.',
        color: '#254F40',
      },
    }),
    prisma.tipoActividad.create({
      data: {
        nombre: 'Mat',
        descripcion: 'Pilates en colchoneta. Incluye variante GAP (Glúteos, Abdomen, Piernas).',
        color: '#4A7C59',
      },
    }),
    prisma.tipoActividad.create({
      data: {
        nombre: 'Barre',
        descripcion: 'Clases de Barre — fusión de ballet, pilates y yoga.',
        color: '#8B5E83',
      },
    }),
  ]);

  console.log('✓ 3 tipos de actividad creados (Reformer, Mat, Barre)');

  // ─── PAQUETES ─────────────────────────────────────────────────────────────────
  // REFORMER y BARRE tienen los mismos precios. MAT varía.
  const paquetes = await Promise.all([
    // ── Reformer ────────────────────────────────────────────────────────────────
    prisma.package.create({ data: { name: 'Reformer — Sesión Única',  category: 'REFORMER', classSubtype: 'REFORMER', sessions: 1,  price: 200,  validityDays: 1,  tipoActividadId: taReformer.id } }),
    prisma.package.create({ data: { name: 'Reformer — 6 Sesiones',   category: 'REFORMER', classSubtype: 'REFORMER', sessions: 6,  price: 850,  validityDays: 20, tipoActividadId: taReformer.id } }),
    prisma.package.create({ data: { name: 'Reformer — 10 Sesiones',  category: 'REFORMER', classSubtype: 'REFORMER', sessions: 10, price: 1500, validityDays: 30, tipoActividadId: taReformer.id } }),
    prisma.package.create({ data: { name: 'Reformer — 12 Sesiones',  category: 'REFORMER', classSubtype: 'REFORMER', sessions: 12, price: 1800, validityDays: 30, tipoActividadId: taReformer.id } }),
    prisma.package.create({ data: { name: 'Reformer — 20 Sesiones',  category: 'REFORMER', classSubtype: 'REFORMER', sessions: 20, price: 2500, validityDays: 40, tipoActividadId: taReformer.id } }),
    // ── Mat ─────────────────────────────────────────────────────────────────────
    prisma.package.create({ data: { name: 'Mat — Sesión Única',      category: 'MAT',      classSubtype: 'MAT',      sessions: 1,  price: 180,  validityDays: 1,  tipoActividadId: taMat.id } }),
    prisma.package.create({ data: { name: 'Mat — 6 Sesiones',        category: 'MAT',      classSubtype: 'MAT',      sessions: 6,  price: 750,  validityDays: 20, tipoActividadId: taMat.id } }),
    prisma.package.create({ data: { name: 'Mat — 10 Sesiones',       category: 'MAT',      classSubtype: 'MAT',      sessions: 10, price: 1300, validityDays: 30, tipoActividadId: taMat.id } }),
    prisma.package.create({ data: { name: 'Mat — 12 Sesiones',       category: 'MAT',      classSubtype: 'MAT',      sessions: 12, price: 1500, validityDays: 30, tipoActividadId: taMat.id } }),
    prisma.package.create({ data: { name: 'Mat — 20 Sesiones',       category: 'MAT',      classSubtype: 'MAT',      sessions: 20, price: 2200, validityDays: 40, tipoActividadId: taMat.id } }),
    // ── Barre (mismos precios que Reformer) ─────────────────────────────────────
    prisma.package.create({ data: { name: 'Barre — Sesión Única',    category: 'BARRE',    classSubtype: 'BARRE',    sessions: 1,  price: 200,  validityDays: 1,  tipoActividadId: taBarre.id } }),
    prisma.package.create({ data: { name: 'Barre — 6 Sesiones',      category: 'BARRE',    classSubtype: 'BARRE',    sessions: 6,  price: 850,  validityDays: 20, tipoActividadId: taBarre.id } }),
    prisma.package.create({ data: { name: 'Barre — 10 Sesiones',     category: 'BARRE',    classSubtype: 'BARRE',    sessions: 10, price: 1500, validityDays: 30, tipoActividadId: taBarre.id } }),
    prisma.package.create({ data: { name: 'Barre — 12 Sesiones',     category: 'BARRE',    classSubtype: 'BARRE',    sessions: 12, price: 1800, validityDays: 30, tipoActividadId: taBarre.id } }),
    prisma.package.create({ data: { name: 'Barre — 20 Sesiones',     category: 'BARRE',    classSubtype: 'BARRE',    sessions: 20, price: 2500, validityDays: 40, tipoActividadId: taBarre.id } }),
    // ── Mix ─────────────────────────────────────────────────────────────────────
    prisma.package.create({ data: { name: 'Mix — 8 Sesiones (4R+4M)',  category: 'MIX', sessions: 8,  price: 1200, validityDays: 20 } }),
    prisma.package.create({ data: { name: 'Mix — 10 Sesiones (5R+5M)', category: 'MIX', sessions: 10, price: 1400, validityDays: 20 } }),
    prisma.package.create({ data: { name: 'Mix — 12 Sesiones (6R+6M)', category: 'MIX', sessions: 12, price: 1600, validityDays: 20 } }),
  ]);

  console.log(`✓ ${paquetes.length} paquetes creados`);
  console.log('   Reformer: 5 paquetes ($200 – $2,500)');
  console.log('   Mat:      5 paquetes ($180 – $2,200)');
  console.log('   Barre:    5 paquetes ($200 – $2,500)');
  console.log('   Mix:      3 paquetes ($1,200 – $1,600)\n');

  // ─── ADMIN ────────────────────────────────────────────────────────────────────
  const adminPassword = await bcrypt.hash('Sarui2026!', 10);
  await prisma.user.create({
    data: {
      email: 'admin@sarui.mx',
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  console.log('✓ Admin         →  admin@sarui.mx  /  Sarui2026!');

  // ─── INSTRUCTORA ─────────────────────────────────────────────────────────────
  const instructoraPassword = await bcrypt.hash('Instruc2026!', 10);
  const instructoraUser = await prisma.user.create({
    data: {
      email: 'sofia@sarui.mx',
      password: instructoraPassword,
      role: 'INSTRUCTOR',
      instructor: {
        create: {
          firstName: 'Sofía',
          lastName: 'Ramírez',
          phone: '951 100 0001',
          bio: 'Instructora certificada en Pilates Reformer y Mat con 5 años de experiencia.',
          specialties: JSON.stringify(['REFORMER', 'MAT', 'BARRE']),
        },
      },
    },
    include: { instructor: true },
  });

  console.log('✓ Instructora   →  sofia@sarui.mx  /  Instruc2026!');

  // ─── CLIENTE DE PRUEBA ────────────────────────────────────────────────────────
  const clientePassword = await bcrypt.hash('Cliente2026!', 10);
  await prisma.user.create({
    data: {
      email: 'cliente@sarui.mx',
      password: clientePassword,
      role: 'CLIENT',
      client: {
        create: {
          firstName: 'María',
          lastName: 'González',
          phone: '951 200 0001',
          qrCode: uuidv4(),
          pin: await bcrypt.hash('1234', 10),
        },
      },
    },
  });

  console.log('✓ Cliente       →  cliente@sarui.mx  /  Cliente2026!  (PIN: 1234)\n');

  // ─── CLASES — Semana 27 Abr – 2 May 2026 ─────────────────────────────────────
  const instructorId = instructoraUser.instructor!.id;
  let totalClases = 0;

  // Clases Reformer
  for (const c of REFORMER_SCHEDULE) {
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
    totalClases++;
  }

  // Clases Mat
  for (const c of MAT_SCHEDULE) {
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
    totalClases++;
  }

  console.log(`✓ ${totalClases} clases creadas para la semana 27 Abr – 2 May 2026`);
  console.log(`   Reformer: ${REFORMER_SCHEDULE.length} clases (Flow / Power / Mobility)`);
  console.log(`   Mat:      ${MAT_SCHEDULE.length} clases (Mat / GAP)\n`);

  console.log('✅ Seed completado exitosamente!');
  console.log('─────────────────────────────────────────────');
  console.log('  URL:    http://localhost:3000');
  console.log('  Admin:  admin@sarui.mx  /  Sarui2026!');
  console.log('─────────────────────────────────────────────\n');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
