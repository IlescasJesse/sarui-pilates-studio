import { Prisma, PaymentMethod } from '@prisma/client';
import { autoCreateIngreso } from './membership.service';

// ──────────────────────────────────────────────────────────────────────────────
// Membership validation
// ──────────────────────────────────────────────────────────────────────────────

type MembershipRow = Prisma.MembershipGetPayload<{
  include: { package: { select: { tipoActividadId: true } } };
}>;

export async function validateMembershipForClass(
  tx: Prisma.TransactionClient,
  params: { membershipId: string; clientId: string; classId: string },
): Promise<MembershipRow> {
  const { membershipId, clientId, classId } = params;

  const membership = await tx.membership.findUnique({
    where: { id: membershipId },
    include: { package: { select: { tipoActividadId: true } } },
  });

  if (!membership || membership.deletedAt) {
    throw Object.assign(new Error('MEMBERSHIP_INVALID'), {
      code: 'MEMBERSHIP_INVALID',
      detail: 'Membership not found',
    });
  }
  if (membership.clientId !== clientId) {
    throw Object.assign(new Error('MEMBERSHIP_MISMATCH'), { code: 'MEMBERSHIP_MISMATCH' });
  }
  if (
    membership.status !== 'ACTIVE' ||
    membership.sessionsRemaining <= 0 ||
    membership.expiresAt <= new Date()
  ) {
    throw Object.assign(new Error('MEMBERSHIP_INVALID'), {
      code: 'MEMBERSHIP_INVALID',
      detail:
        membership.sessionsRemaining <= 0
          ? 'Membership has no sessions remaining'
          : membership.expiresAt <= new Date()
            ? 'Membership has expired'
            : 'Membership is not active',
    });
  }

  // Decisión 2026-05-28: check de tipo de actividad POR CLASE.
  const pkgTipoId = membership.package.tipoActividadId;
  if (pkgTipoId) {
    const clase = await tx.class.findUnique({
      where: { id: classId },
      select: { tipoActividadId: true },
    });
    if (clase?.tipoActividadId && clase.tipoActividadId !== pkgTipoId) {
      throw Object.assign(new Error('CLASS_TYPE_MISMATCH'), { code: 'CLASS_TYPE_MISMATCH' });
    }
  }

  return membership;
}

// ──────────────────────────────────────────────────────────────────────────────
// Walk-in charge — Payment + Ingreso contable (cuenta 402)
// ──────────────────────────────────────────────────────────────────────────────

export async function chargeWalkIn(
  tx: Prisma.TransactionClient,
  params: {
    reservationId: string;
    classTitle: string | null;
    amount: number;
    paymentMethod: PaymentMethod;
    creadoPorId?: string;
  },
): Promise<void> {
  const { reservationId, classTitle, amount, paymentMethod, creadoPorId } = params;
  const now = new Date();

  // payment.reservationId es @unique; una reserva restaurada puede ya tener uno.
  const existing = await tx.payment.findUnique({
    where: { reservationId },
    select: { id: true },
  });

  if (existing) {
    await tx.payment.update({
      where: { id: existing.id },
      data: { amount, method: paymentMethod, status: 'PAID', paidAt: now },
    });
  } else {
    await tx.payment.create({
      data: { reservationId, amount, method: paymentMethod, status: 'PAID', paidAt: now },
    });
  }

  await autoCreateIngreso(tx, {
    monto: amount,
    concepto: `Clase suelta - ${classTitle ?? 'Walk-in'}`,
    fecha: now,
    origen: 'WALK_IN',
    referenciaId: reservationId,
    cuentaCodigo: '402',
    cuentaNombre: 'Ingresos por clases sueltas',
    creadoPorId,
  });
}

// ──────────────────────────────────────────────────────────────────────────────
// Spot + session release on cancellation
// Decremento condicional (spotsBooked > 0) evita valores negativos en
// doble-cancelación. Reusado por PATCH /:id, DELETE /:id y /:id/declinar.
// ──────────────────────────────────────────────────────────────────────────────

export async function releaseReservationEffects(
  tx: Prisma.TransactionClient,
  reserva: { classId: string; membershipId: string | null },
): Promise<void> {
  await tx.$executeRaw`
    UPDATE \`classes\` SET spotsBooked = spotsBooked - 1
    WHERE id = ${reserva.classId} AND spotsBooked > 0
  `;
  if (reserva.membershipId) {
    const membership = await tx.membership.findUnique({
      where: { id: reserva.membershipId },
      select: { id: true },
    });
    if (membership) {
      await tx.membership.update({
        where: { id: reserva.membershipId },
        data: {
          sessionsRemaining: { increment: 1 },
          sessionsUsed: { decrement: 1 },
          status: 'ACTIVE',
        },
      });
    }
  }
}
