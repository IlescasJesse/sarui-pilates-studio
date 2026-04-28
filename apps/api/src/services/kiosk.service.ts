import { prisma } from '../config/database';
import { AttendanceLog } from '../models/AttendanceLog.model';
import { createError } from '../middlewares/error.middleware';
import { CheckInInput } from '../validators/kiosk.validator';
import { comparePassword } from '../utils/bcrypt';

const CHECKIN_WINDOW_MINUTES = 15;
const ON_TIME_WINDOW_MINUTES = 10;

export type AttendanceStatusResult = 'ON_TIME' | 'LATE';

export interface CheckInResult {
  success: boolean;
  cliente: {
    nombre: string;
    clase: string;
    sesionesRestantes: number | null;
  };
  status: AttendanceStatusResult;
  message: string;
}

export async function checkIn(
  payload: CheckInInput,
  ip: string
): Promise<CheckInResult> {
  // Find client by QR code or PIN
  let client;

  if (payload.qrCode) {
    client = await prisma.client.findUnique({
      where: { qrCode: payload.qrCode },
    });
  } else if (payload.pin) {
    // PIN is stored hashed with bcrypt; need to fetch all clients and compare manually
    // This is not ideal for performance, but necessary since bcrypt comparison is async
    const clients = await prisma.client.findMany({
      where: {
        deletedAt: null,
      },
    });

    // Compare PIN with all clients' hashed PINs
    for (const c of clients) {
      try {
        const isMatch = await comparePassword(payload.pin, c.pin);
        if (isMatch) {
          client = c;
          break;
        }
      } catch {
        // Invalid hash format, skip this client
        continue;
      }
    }
  }

  if (!client) {
    await AttendanceLog.create({
      clientId: 'UNKNOWN',
      classId: 'UNKNOWN',
      method: payload.qrCode ? 'QR' : 'PIN',
      result: 'DENIED',
      reason: 'Client not found',
      ip,
    });
    throw createError('Client not found', 404, 'CLIENT_NOT_FOUND');
  }

  if (client.deletedAt) {
    await AttendanceLog.create({
      clientId: client.id,
      classId: 'UNKNOWN',
      method: payload.qrCode ? 'QR' : 'PIN',
      result: 'DENIED',
      reason: 'Client account is deleted',
      ip,
    });
    throw createError('Client account not found', 404, 'CLIENT_NOT_FOUND');
  }

  // Find a confirmed reservation within ±15 min of any class starting around now
  const now = new Date();
  const windowStart = new Date(now.getTime() - CHECKIN_WINDOW_MINUTES * 60 * 1000);
  const windowEnd = new Date(now.getTime() + CHECKIN_WINDOW_MINUTES * 60 * 1000);

  const reservation = await prisma.reservation.findFirst({
    where: {
      clientId: client.id,
      status: 'CONFIRMED',
      class: {
        startAt: {
          gte: windowStart,
          lte: windowEnd,
        },
        isCancelled: false,
        isActive: true,
      },
    },
    include: {
      class: true,
      membership: true,
    },
    orderBy: {
      class: {
        startAt: 'asc',
      },
    },
  });

  if (!reservation) {
    await AttendanceLog.create({
      clientId: client.id,
      classId: 'NONE',
      method: payload.qrCode ? 'QR' : 'PIN',
      result: 'DENIED',
      reason: 'No active reservation found for current time window',
      ip,
    });
    throw createError(
      'No active reservation found for the current time',
      404,
      'RESERVATION_NOT_FOUND'
    );
  }

  const classStart = reservation.class.startAt;
  const minutesSinceStart = Math.floor(
    (now.getTime() - classStart.getTime()) / (60 * 1000)
  );

  const attendanceStatus: AttendanceStatusResult =
    minutesSinceStart <= ON_TIME_WINDOW_MINUTES ? 'ON_TIME' : 'LATE';

  const prismaAttendanceStatus =
    attendanceStatus === 'ON_TIME' ? 'ON_TIME' : 'LATE';

  // Atomically mark attendance and update reservation
  await prisma.$transaction([
    prisma.attendance.create({
      data: {
        clientId: client.id,
        reservationId: reservation.id,
        status: prismaAttendanceStatus,
        checkedInAt: now,
        checkInMethod: payload.qrCode ? 'QR' : 'PIN',
      },
    }),
    prisma.reservation.update({
      where: { id: reservation.id },
      data: { status: 'ATTENDED', checkedInAt: now },
    }),
  ]);

  // Sessions were already decremented when the reservation was created — just read current value
  let sesionesRestantes: number | null = null;

  if (reservation.membershipId) {
    const membership = await prisma.membership.findUnique({
      where: { id: reservation.membershipId },
      select: { sessionsRemaining: true },
    });
    sesionesRestantes = membership?.sessionsRemaining ?? null;
  }

  // Build class display name
  const claseName =
    reservation.class.title ??
    `${reservation.class.type} ${reservation.class.subtype}`;

  // Log to MongoDB
  await AttendanceLog.create({
    clientId: client.id,
    classId: reservation.class.id,
    method: payload.qrCode ? 'QR' : 'PIN',
    result: 'SUCCESS',
    reason: attendanceStatus,
    ip,
  });

  return {
    success: true,
    cliente: {
      nombre: `${client.firstName} ${client.lastName}`,
      clase: claseName,
      sesionesRestantes,
    },
    status: attendanceStatus,
    message:
      attendanceStatus === 'ON_TIME'
        ? 'Check-in exitoso — a tiempo!'
        : 'Check-in exitoso — marcado como tarde.',
  };
}
