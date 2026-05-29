import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CUENTAS = [
  // ── ACTIVOS ────────────────────────────────────────────────────────────────
  { codigo: '101', nombre: 'Caja',    tipo: 'ACTIVO' as const, descripcion: 'Efectivo en caja física' },
  { codigo: '102', nombre: 'Bancos',  tipo: 'ACTIVO' as const, descripcion: 'Saldo en cuentas bancarias' },
  { codigo: '103', nombre: 'Equipo de pilates', tipo: 'ACTIVO' as const, descripcion: 'Reformers, barras, colchonetas y equipo del estudio' },

  // ── PASIVOS ────────────────────────────────────────────────────────────────
  { codigo: '201', nombre: 'Préstamos bancarios',      tipo: 'PASIVO' as const, descripcion: 'Deuda con bancos o financieras' },
  { codigo: '202', nombre: 'Inversiones por pagar',    tipo: 'PASIVO' as const, descripcion: 'Capital invertido pendiente de reembolso' },
  { codigo: '203', nombre: 'Acreedores diversos',      tipo: 'PASIVO' as const, descripcion: 'Deudas con proveedores u otros' },

  // ── CAPITAL ────────────────────────────────────────────────────────────────
  { codigo: '301', nombre: 'Capital social',           tipo: 'CAPITAL' as const, descripcion: 'Inversión inicial del propietario' },
  { codigo: '302', nombre: 'Utilidades del ejercicio', tipo: 'CAPITAL' as const, descripcion: 'Ganancia acumulada del año' },

  // ── INGRESOS ───────────────────────────────────────────────────────────────
  { codigo: '401', nombre: 'Ingresos por membresías',   tipo: 'INGRESO' as const, descripcion: 'Cobro de membresías mensuales o anuales' },
  { codigo: '402', nombre: 'Ingresos por clases sueltas', tipo: 'INGRESO' as const, descripcion: 'Walk-in, sesiones individuales' },
  { codigo: '403', nombre: 'Ingresos por paquetes',    tipo: 'INGRESO' as const, descripcion: 'Venta de paquetes de clases prepagadas' },
  { codigo: '404', nombre: 'Otros ingresos',           tipo: 'INGRESO' as const, descripcion: 'Ingresos no clasificados en las anteriores' },

  // ── COSTOS ────────────────────────────────────────────────────────────────
  { codigo: '501', nombre: 'Honorarios de instructores', tipo: 'COSTO' as const, descripcion: 'Pago por clase o comisión a instructores' },
  { codigo: '502', nombre: 'Costo de materiales de clase', tipo: 'COSTO' as const, descripcion: 'Consumibles directos de cada clase (ligas, pelotas, etc.)' },

  // ── GASTOS ────────────────────────────────────────────────────────────────
  { codigo: '601', nombre: 'Renta del local',          tipo: 'GASTO' as const, descripcion: 'Arrendamiento mensual del espacio' },
  { codigo: '602', nombre: 'Sueldos y salarios',       tipo: 'GASTO' as const, descripcion: 'Personal administrativo y de limpieza' },
  { codigo: '603', nombre: 'Servicios básicos',        tipo: 'GASTO' as const, descripcion: 'Luz, agua, gas, internet, teléfono' },
  { codigo: '604', nombre: 'Mantenimiento y reparaciones', tipo: 'GASTO' as const, descripcion: 'Reparación de equipo y mantenimiento del local' },
  { codigo: '605', nombre: 'Marketing y publicidad',   tipo: 'GASTO' as const, descripcion: 'Redes sociales, volantes, anuncios digitales' },
  { codigo: '606', nombre: 'Gastos de oficina',        tipo: 'GASTO' as const, descripcion: 'Papelería, impresiones, software' },
  { codigo: '607', nombre: 'Seguros',                  tipo: 'GASTO' as const, descripcion: 'Seguro del local y equipo' },
  { codigo: '608', nombre: 'Depreciación de equipo',   tipo: 'GASTO' as const, descripcion: 'Desgaste anual de reformers y equipo (SAT: 25% anual)' },
  { codigo: '609', nombre: 'Cuotas y suscripciones',   tipo: 'GASTO' as const, descripcion: 'Plataformas digitales, membresías de negocio' },
  { codigo: '610', nombre: 'Otros gastos',             tipo: 'GASTO' as const, descripcion: 'Gastos no clasificados en las anteriores' },
];

async function main() {
  console.log('🌱 Cargando catálogo SAT de cuentas contables...\n');

  let created = 0;
  let skipped = 0;

  for (const cuenta of CUENTAS) {
    const result = await prisma.cuentaContable.upsert({
      where: { codigo: cuenta.codigo },
      update: {},
      create: cuenta,
    });
    if (result) created++;
    else skipped++;
  }

  console.log(`✓ ${CUENTAS.length} cuentas procesadas (upsert — no borra datos existentes)`);
  console.log('\nCatálogo:');
  CUENTAS.forEach(c => console.log(`  ${c.codigo} [${c.tipo}] — ${c.nombre}`));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
