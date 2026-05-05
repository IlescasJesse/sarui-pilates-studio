import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const cuentasSAT = [
  // ACTIVOS
  { codigo: '101', nombre: 'Caja / Efectivo',              tipo: 'ACTIVO', descripcion: 'Dinero en caja física' },
  { codigo: '102', nombre: 'Bancos',                        tipo: 'ACTIVO', descripcion: 'Saldo en cuentas bancarias' },
  { codigo: '103', nombre: 'Cuentas por cobrar clientes',  tipo: 'ACTIVO', descripcion: 'Cobros pendientes de clientes' },
  { codigo: '104', nombre: 'Equipo y mobiliario',          tipo: 'ACTIVO', descripcion: 'Reformers, mats, mobiliario del estudio' },
  // PASIVOS
  { codigo: '201', nombre: 'IVA trasladado por pagar',     tipo: 'PASIVO', descripcion: 'IVA cobrado a clientes pendiente de entero' },
  { codigo: '202', nombre: 'ISR retenido por pagar',       tipo: 'PASIVO', descripcion: 'ISR retenido a colaboradores' },
  { codigo: '203', nombre: 'Proveedores',                  tipo: 'PASIVO', descripcion: 'Cuentas por pagar a proveedores' },
  // CAPITAL
  { codigo: '301', nombre: 'Capital social',               tipo: 'CAPITAL', descripcion: 'Aportaciones de los socios' },
  { codigo: '302', nombre: 'Utilidades del ejercicio',     tipo: 'CAPITAL', descripcion: 'Resultado neto acumulado' },
  // INGRESOS
  { codigo: '401', nombre: 'Ingresos por membresías',      tipo: 'INGRESO', descripcion: 'Venta de membresías y paquetes de clases' },
  { codigo: '402', nombre: 'Ingresos por sesiones sueltas', tipo: 'INGRESO', descripcion: 'Walk-in, clases individuales sin membresía' },
  { codigo: '403', nombre: 'Ingresos por pagos digitales', tipo: 'INGRESO', descripcion: 'Cobros vía MercadoPago desde el portal' },
  { codigo: '499', nombre: 'Otros ingresos',               tipo: 'INGRESO', descripcion: 'Ingresos varios no clasificados' },
  // COSTOS
  { codigo: '501', nombre: 'Sueldos y salarios instructores', tipo: 'COSTO', descripcion: 'Pago a instructores de planta' },
  { codigo: '502', nombre: 'Honorarios instructores freelance', tipo: 'COSTO', descripcion: 'Pago por honorarios a instructores externos' },
  // GASTOS
  { codigo: '601', nombre: 'Renta del local',              tipo: 'GASTO', descripcion: 'Arrendamiento del espacio del estudio' },
  { codigo: '602', nombre: 'Servicios (luz, agua, internet)', tipo: 'GASTO', descripcion: 'Servicios básicos del estudio' },
  { codigo: '603', nombre: 'Mantenimiento y equipo',       tipo: 'GASTO', descripcion: 'Reparaciones, mantenimiento de reformers y equipo' },
  { codigo: '604', nombre: 'Publicidad y marketing',       tipo: 'GASTO', descripcion: 'Redes sociales, diseño, promociones' },
  { codigo: '605', nombre: 'Gastos de administración',     tipo: 'GASTO', descripcion: 'Papelería, software, servicios administrativos' },
  { codigo: '606', nombre: 'Comisiones bancarias y MP',    tipo: 'GASTO', descripcion: 'Comisiones MercadoPago y cargos bancarios' },
  { codigo: '607', nombre: 'Consumibles y materiales',     tipo: 'GASTO', descripcion: 'Toallas, gel, accesorios de clases' },
  { codigo: '608', nombre: 'Capacitación y certificaciones', tipo: 'GASTO', descripcion: 'Cursos y certificaciones para instructores' },
  { codigo: '699', nombre: 'Otros gastos',                 tipo: 'GASTO', descripcion: 'Gastos varios no clasificados' },
] as const;

async function main() {
  console.log('Cargando catálogo de cuentas SAT...');
  let creadas = 0;
  let omitidas = 0;

  for (const cuenta of cuentasSAT) {
    const existe = await prisma.cuentaContable.findUnique({ where: { codigo: cuenta.codigo } });
    if (existe) { omitidas++; continue; }
    await prisma.cuentaContable.create({ data: cuenta });
    creadas++;
  }

  console.log(`✓ ${creadas} cuentas creadas, ${omitidas} ya existían.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
