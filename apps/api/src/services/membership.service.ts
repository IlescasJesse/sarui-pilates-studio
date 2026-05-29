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

  // Idempotency: bail early if this payment was already processed
  const existingPayment = await tx.payment.findFirst({
    where: { reference: params.mpPaymentId },
    select: { membershipId: true },
  });
  if (existingPayment?.membershipId) return { membershipId: existingPayment.membershipId };

  // Stack rule: if active membership of same tipoActividad exists → add sessions + extend expiry
  let membershipId: string;

  const sameTipoMembership = pkg.tipoActividadId
    ? await tx.membership.findFirst({
        where: {
          clientId: params.clientId,
          status: 'ACTIVE',
          sessionsRemaining: { gt: 0 },
          expiresAt: { gt: params.paidAt },
          deletedAt: null,
          package: { tipoActividadId: pkg.tipoActividadId },
        },
        orderBy: { expiresAt: 'desc' },
      })
    : null;

  if (sameTipoMembership) {
    // Extend from whichever is later: current expiry or now
    const baseDate = sameTipoMembership.expiresAt > params.paidAt
      ? sameTipoMembership.expiresAt
      : params.paidAt;
    const newExpiry = new Date(baseDate);
    newExpiry.setDate(newExpiry.getDate() + pkg.validityDays);

    await tx.membership.update({
      where: { id: sameTipoMembership.id },
      data: {
        totalSessions: { increment: pkg.sessions },
        sessionsRemaining: { increment: pkg.sessions },
        expiresAt: newExpiry,
      },
    });
    membershipId = sameTipoMembership.id;
  } else {
    // Create new membership (idempotent via mpPaymentId)
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
    membershipId = membership.id;
  }

  await tx.payment.create({
    data: {
      membershipId,
      amount: params.transactionAmount ?? pkg.price,
      method: 'MERCADO_PAGO' as PaymentMethod,
      status: 'PAID',
      reference: params.mpPaymentId,
      paidAt: params.paidAt,
    },
  });

  await autoCreateIngreso(tx, {
    membershipId,
    monto: Number(params.transactionAmount ?? pkg.price),
    concepto: `Membresía ${pkg.name} - MP`,
    fecha: params.paidAt,
    creadoPorId: params.creadoPorId,
  });

  return { membershipId };
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
    create: { codigo: '401-ING', nombre: 'Ingresos por Membresías MP', tipo: 'INGRESO' },
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
