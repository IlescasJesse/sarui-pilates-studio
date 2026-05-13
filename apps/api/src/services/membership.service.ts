import { Prisma, PaymentMethod } from '@prisma/client';

export async function activateMembershipFromPayment(
  tx: Prisma.TransactionClient,
  params: {
    packageId: string;
    clientId: string;
    mpPaymentId: string;
    transactionAmount: number | null | undefined;
    paidAt: Date;
    creadoPorId?: string;
  }
): Promise<{ membershipId: string }> {
  const pkg = await tx.package.findFirst({
    where: { id: params.packageId, deletedAt: null },
  });
  if (!pkg) throw new Error(`Package ${params.packageId} not found`);

  const expiresAt = new Date(params.paidAt);
  expiresAt.setDate(expiresAt.getDate() + pkg.validityDays);

  const membership = await tx.membership.upsert({
    where: { mercadoPagoPaymentId: params.mpPaymentId },
    create: {
      clientId: params.clientId,
      packageId: params.packageId,
      status: 'ACTIVE',
      totalSessions: pkg.sessions,
      sessionsUsed: 0,
      sessionsRemaining: pkg.sessions,
      startDate: params.paidAt,
      expiresAt,
      pricePaid: pkg.price,
      paymentStatus: 'PAID',
      paymentMethod: 'MERCADO_PAGO' as PaymentMethod,
      mercadoPagoPaymentId: params.mpPaymentId,
    },
    update: {},
  });

  await tx.payment.create({
    data: {
      membershipId: membership.id,
      amount: params.transactionAmount ?? pkg.price,
      method: 'MERCADO_PAGO' as PaymentMethod,
      status: 'PAID',
      reference: params.mpPaymentId,
      paidAt: params.paidAt,
    },
  });

  await autoCreateIngreso(tx, {
    membershipId: membership.id,
    monto: Number(params.transactionAmount ?? pkg.price),
    concepto: `Membresía ${pkg.name} - MP`,
    fecha: params.paidAt,
    creadoPorId: params.creadoPorId,
  });

  return { membershipId: membership.id };
}

async function autoCreateIngreso(
  tx: Prisma.TransactionClient,
  params: {
    membershipId: string;
    monto: number;
    concepto: string;
    fecha: Date;
    creadoPorId?: string;
  }
): Promise<void> {
  const cuenta = await tx.cuentaContable.upsert({
    where: { codigo: '401-ING' },
    create: {
      codigo: '401-ING',
      nombre: 'Ingresos por Membresías MP',
      tipo: 'INGRESO',
    },
    update: {},
  });

  let creadoPorId = params.creadoPorId;
  if (!creadoPorId) {
    const admin = await tx.user.findFirst({ where: { role: 'ADMIN' }, select: { id: true } });
    if (!admin) {
      console.warn('[membership] No se encontró admin para crear Ingreso automático');
      return;
    }
    creadoPorId = admin.id;
  }

  await tx.ingreso.create({
    data: {
      cuentaContableId: cuenta.id,
      concepto: params.concepto,
      monto: params.monto,
      fecha: params.fecha,
      origen: 'PORTAL_MERCADOPAGO',
      referenciaId: params.membershipId,
      creadoPorId,
    },
  });
}
