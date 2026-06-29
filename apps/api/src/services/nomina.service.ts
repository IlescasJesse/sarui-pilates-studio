import { Prisma } from '@prisma/client';

/**
 * Creates an accounting expense (Gasto) entry inside an existing transaction.
 * Upserts the target accounting account so it is safe even on a fresh catalog.
 * Used by the payroll approval flow (cuenta 602 - Sueldos y salarios).
 *
 * @returns The created Gasto ID.
 */
export async function autoCreateGasto(
  tx: Prisma.TransactionClient,
  params: {
    monto: number;
    concepto: string;
    fecha: Date;
    cuentaCodigo: string;
    cuentaNombre: string;
    creadoPorId: string;
  }
): Promise<string> {
  const cuenta = await tx.cuentaContable.upsert({
    where: { codigo: params.cuentaCodigo },
    create: {
      codigo: params.cuentaCodigo,
      nombre: params.cuentaNombre,
      tipo: 'GASTO',
    },
    update: {},
  });

  const gasto = await tx.gasto.create({
    data: {
      cuentaContableId: cuenta.id,
      concepto: params.concepto,
      monto: params.monto,
      fecha: params.fecha,
      creadoPorId: params.creadoPorId,
    },
  });

  return gasto.id;
}

/**
 * Calculates (or recalculates) NominaDetalle rows for all active staff with a puesto.
 * - diasTrabajados = count of AsistenciaPersonal where presente=true in [inicio, fin].
 * - salarioBruto = puesto.salarioSemanal (weekly salary, informational).
 * - netoAPagar = round((salarioSemanal / 7) * diasTrabajados, 2).
 * - deducciones default 0 on create; preserved on update (not overwritten).
 * - Employees with zero attendance get a row with netoAPagar=0 (not omitted).
 */
export async function calcularDetallesPeriodo(
  tx: Prisma.TransactionClient,
  periodoId: string,
  inicio: Date,
  fin: Date
): Promise<void> {
  // Delete stale rows so deactivated staff don't remain in the period
  await tx.nominaDetalle.deleteMany({ where: { periodoId } });

  const staffList = await tx.staffProfile.findMany({
    where: { activo: true, puestoId: { not: null } },
    include: { puesto: true },
  });

  for (const staff of staffList) {
    if (!staff.puesto) continue;

    const dias = await tx.asistenciaPersonal.count({
      where: {
        userId: staff.userId,
        presente: true,
        fecha: { gte: inicio, lte: fin },
      },
    });

    const bruto = Number(staff.puesto.salarioSemanal);
    const neto = Math.round((bruto / 7) * dias * 100) / 100;

    await tx.nominaDetalle.create({
      data: {
        periodoId,
        userId: staff.userId,
        diasTrabajados: dias,
        salarioBruto: bruto,
        deducciones: 0,
        netoAPagar: neto,
      },
    });
  }
}
