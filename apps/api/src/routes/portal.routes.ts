import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { env } from '../config/env';
import { ApiSuccess, ApiError } from '../utils/response';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import { createPreference, getPayment, createPackagePreference } from '../services/mercadopago.service';
import { PaymentMethod } from '@prisma/client';
import { hashPassword } from '../utils/bcrypt';
import QRCode from 'qrcode';
import { z } from 'zod';

const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/portal/clases  — público, sin auth
// Devuelve clases disponibles en los próximos 30 días con spots libres
// ─────────────────────────────────────────────────────────────────────────────
router.get('/clases', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const now = new Date();
    const in30Days = new Date();
    in30Days.setDate(in30Days.getDate() + 30);

    const clases = await prisma.class.findMany({
      where: {
        deletedAt: null,
        isActive: true,
        isCancelled: false,
        startAt: { gte: now, lte: in30Days },
      },
      orderBy: { startAt: 'asc' },
      include: {
        instructor: { select: { id: true, firstName: true, lastName: true } },
        tipoActividad: {
          select: {
            id: true,
            nombre: true,
            color: true,
            paquetes: {
              where: { sessions: 1, isActive: true },
              select: { price: true },
              take: 1,
            },
          },
        },
      },
    });

    const result = clases.map((c) => ({
      id: c.id,
      title: c.title ?? c.tipoActividad?.nombre ?? 'Clase',
      tipoActividad: c.tipoActividad,
      instructor: c.instructor,
      startAt: c.startAt.toISOString(),
      endAt: c.endAt.toISOString(),
      capacity: c.capacity,
      spotsBooked: c.spotsBooked,
      spotsLeft: c.capacity - c.spotsBooked,
      location: c.location,
      costo: c.tipoActividad?.paquetes?.[0]?.price ?? null,
    }));

    ApiSuccess(res, result);
  } catch (error) {
    next(error);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/portal/clases/:id  — público
// ─────────────────────────────────────────────────────────────────────────────
router.get('/clases/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const clase = await prisma.class.findUnique({
      where: { id: req.params.id, deletedAt: null, isActive: true, isCancelled: false },
      include: {
        instructor: { select: { id: true, firstName: true, lastName: true } },
        tipoActividad: {
          select: {
            id: true,
            nombre: true,
            color: true,
            paquetes: {
              where: { sessions: 1, isActive: true },
              select: { price: true },
              take: 1,
            },
          },
        },
      },
    });

    if (!clase) {
      ApiError(res, 'NOT_FOUND', 'Clase no encontrada o no disponible', 404);
      return;
    }

    ApiSuccess(res, {
      id: clase.id,
      title: clase.title ?? clase.tipoActividad?.nombre ?? 'Clase',
      tipoActividad: clase.tipoActividad,
      instructor: clase.instructor,
      startAt: clase.startAt.toISOString(),
      endAt: clase.endAt.toISOString(),
      capacity: clase.capacity,
      spotsBooked: clase.spotsBooked,
      spotsLeft: clase.capacity - clase.spotsBooked,
      location: clase.location,
      costo: clase.tipoActividad?.paquetes?.[0]?.price ?? null,
    });
  } catch (error) {
    next(error);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/portal/solicitar-cuenta  — público, sin auth
// ─────────────────────────────────────────────────────────────────────────────
const solicitudSchema = z.object({
  nombre:   z.string().min(1).max(80),
  apellido: z.string().min(1).max(80),
  email:    z.string().email(),
  telefono: z.string().min(7).max(20),
  mensaje:  z.string().max(500).optional(),
});

router.post('/solicitar-cuenta', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parse = solicitudSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Datos inválidos', details: parse.error.errors },
      });
      return;
    }

    const existe = await prisma.solicitudCuenta.findFirst({
      where: { email: parse.data.email, status: 'PENDIENTE' },
    });
    if (existe) {
      ApiError(res, 'ALREADY_REQUESTED', 'Ya tienes una solicitud pendiente con ese correo', 409);
      return;
    }

    const solicitud = await prisma.solicitudCuenta.create({ data: parse.data });
    ApiSuccess(res, solicitud, 201);
  } catch (error) {
    next(error);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/portal/solicitudes  — solo ADMIN
// ─────────────────────────────────────────────────────────────────────────────
router.get('/solicitudes', authMiddleware, requireRole('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.query as { status?: string };
    const validStatuses = ['PENDIENTE', 'APROBADA', 'RECHAZADA'] as const;
    type SolicitudStatus = typeof validStatuses[number];
    const whereStatus = status && (validStatuses as readonly string[]).includes(status)
      ? { status: status as SolicitudStatus }
      : undefined;
    const solicitudes = await prisma.solicitudCuenta.findMany({
      where: whereStatus,
      orderBy: { createdAt: 'desc' },
    });
    ApiSuccess(res, solicitudes);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/v1/portal/solicitudes/:id  — solo ADMIN (aprobar/rechazar)
router.patch('/solicitudes/:id', authMiddleware, requireRole('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status } = req.body as { status: string };
    if (!['APROBADA', 'RECHAZADA'].includes(status)) {
      ApiError(res, 'INVALID_STATUS', 'Status debe ser APROBADA o RECHAZADA', 400);
      return;
    }

    const solicitud = await prisma.solicitudCuenta.findUnique({ where: { id } });
    if (!solicitud) {
      ApiError(res, 'NOT_FOUND', 'Solicitud no encontrada', 404);
      return;
    }

    if (status === 'APROBADA') {
      const existingUser = await prisma.user.findUnique({ where: { email: solicitud.email } });
      if (existingUser) {
        ApiError(res, 'EMAIL_TAKEN', 'Ya existe un usuario con ese correo', 409);
        return;
      }

      const { v4: uuidv4 } = await import('uuid');
      const tempPassword = Math.random().toString(36).slice(2, 10);
      const hashedPassword = await hashPassword(tempPassword);
      const hashedPin = await hashPassword('0000');
      const qrCode = uuidv4();

      const [updatedSolicitud, cliente] = await prisma.$transaction([
        prisma.solicitudCuenta.update({
          where: { id },
          data: { status: 'APROBADA' },
        }),
        prisma.user.create({
          data: {
            email: solicitud.email,
            password: hashedPassword,
            role: 'CLIENT',
            client: {
              create: {
                firstName: solicitud.nombre,
                lastName: solicitud.apellido,
                phone: solicitud.telefono,
                qrCode,
                pin: hashedPin,
              },
            },
          },
          select: {
            id: true,
            email: true,
            client: {
              select: { id: true, firstName: true, lastName: true, phone: true, qrCode: true },
            },
          },
        }),
      ]);

      ApiSuccess(res, { solicitud: updatedSolicitud, cliente, tempPassword });
      return;
    }

    const solicitudActualizada = await prisma.solicitudCuenta.update({
      where: { id },
      data: { status: 'RECHAZADA' },
    });
    ApiSuccess(res, { solicitud: solicitudActualizada });
  } catch (error) {
    next(error);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/portal/buscar-cliente — público, widget landing
// Verifica email → devuelve estado + QR + membresías activas + token provisional
// ─────────────────────────────────────────────────────────────────────────────
const buscarClienteSchema = z.object({ email: z.string().email() });

router.post('/buscar-cliente', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parse = buscarClienteSchema.safeParse(req.body);
    if (!parse.success) {
      ApiError(res, 'VALIDATION_ERROR', 'Email inválido', 400);
      return;
    }

    const { email } = parse.data;

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        client: {
          include: {
            memberships: {
              where: {
                status: 'ACTIVE',
                expiresAt: { gt: new Date() },
                sessionsRemaining: { gt: 0 },
                deletedAt: null,
              },
              include: {
                package: {
                  select: {
                    name: true,
                    category: true,
                    classSubtype: true,
                    tipoActividadId: true,
                    tipoActividad: { select: { nombre: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user || !user.client) {
      const solicitud = await prisma.solicitudCuenta.findFirst({
        where: { email },
        orderBy: { createdAt: 'desc' },
      });
      if (solicitud) {
        const statusMap: Record<string, string> = { PENDIENTE: 'pendiente', APROBADA: 'aprobada_sin_cuenta', RECHAZADA: 'rechazada' };
        ApiSuccess(res, { status: statusMap[solicitud.status] ?? 'pendiente' });
        return;
      }
      ApiSuccess(res, { status: 'not_found' });
      return;
    }

    const provisionalToken = jwt.sign(
      { clientId: user.client.id, userId: user.id, email: user.email, type: 'provisional' },
      env.JWT_SECRET,
      { expiresIn: '30m' }
    );

    ApiSuccess(res, {
      status: 'found',
      nombre: `${user.client.firstName} ${user.client.lastName}`,
      qrCode: user.client.qrCode,
      provisionalToken,
      memberships: user.client.memberships.map((m) => ({
        id: m.id,
        packageName: m.package.name,
        category: m.package.category,
        classSubtype: m.package.classSubtype ?? null,
        tipoActividadId: m.package.tipoActividadId ?? null,
        tipoActividadNombre: m.package.tipoActividad?.nombre ?? null,
        sessionsRemaining: m.sessionsRemaining,
        expiresAt: m.expiresAt,
      })),
    });
  } catch (error) {
    next(error);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/portal/reservar-provisional — token provisional (30 min)
// Crea reserva usando una membresía activa del cliente; valida tipo de clase
// ─────────────────────────────────────────────────────────────────────────────
const reservaProvSchema = z.object({
  claseId:      z.string().min(1),
  membresiaId:  z.string().min(1),
  token:        z.string().min(1),
});

router.post('/reservar-provisional', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parse = reservaProvSchema.safeParse(req.body);
    if (!parse.success) {
      ApiError(res, 'VALIDATION_ERROR', 'Datos inválidos', 400);
      return;
    }

    const { claseId, membresiaId, token } = parse.data;

    // Verificar token provisional
    let decoded: { clientId: string; type: string };
    try {
      decoded = jwt.verify(token, env.JWT_SECRET) as { clientId: string; type: string };
    } catch {
      ApiError(res, 'TOKEN_INVALID', 'Token expirado o inválido', 401);
      return;
    }
    if (decoded.type !== 'provisional') {
      ApiError(res, 'TOKEN_INVALID', 'Token inválido', 401);
      return;
    }

    const clientId = decoded.clientId;

    // Cargar clase y membresía en paralelo
    const [clase, membresia] = await Promise.all([
      prisma.class.findUnique({
        where: { id: claseId },
        include: { tipoActividad: { select: { id: true, nombre: true } } },
      }),
      prisma.membership.findUnique({
        where: { id: membresiaId },
        include: { package: { select: { classSubtype: true, tipoActividadId: true, category: true } } },
      }),
    ]);

    if (!clase) { ApiError(res, 'CLASS_NOT_FOUND', 'Clase no encontrada', 404); return; }
    if (!membresia || membresia.clientId !== clientId) {
      ApiError(res, 'MEMBERSHIP_NOT_FOUND', 'Membresía no encontrada', 404); return;
    }
    if (membresia.status !== 'ACTIVE' || membresia.sessionsRemaining <= 0) {
      ApiError(res, 'NO_SESSIONS', 'Sin sesiones disponibles en esta membresía', 400); return;
    }
    if (new Date(membresia.expiresAt) < new Date()) {
      ApiError(res, 'MEMBERSHIP_EXPIRED', 'La membresía ha expirado', 400); return;
    }

    // Verificar que el tipo de clase sea compatible con el paquete
    const pkg = membresia.package;
    if (pkg.tipoActividadId && clase.tipoActividad && pkg.tipoActividadId !== clase.tipoActividad.id) {
      ApiError(res, 'CLASS_TYPE_MISMATCH',
        `Tu paquete es para ${clase.tipoActividad.nombre}. Esta clase no aplica.`, 400);
      return;
    }

    // Verificar spot disponible
    const spotsUsed = await prisma.reservation.count({
      where: { classId: claseId, status: { in: ['PENDING_APPROVAL', 'CONFIRMED'] } },
    });
    if (clase.capacity !== null && spotsUsed >= clase.capacity) {
      ApiError(res, 'CLASS_FULL', 'No hay lugares disponibles', 400); return;
    }

    // Verificar no duplicado
    const existente = await prisma.reservation.findUnique({
      where: { clientId_classId: { clientId, classId: claseId } },
    });
    if (existente) {
      ApiError(res, 'ALREADY_RESERVED', 'Ya tienes una reservación para esta clase', 409); return;
    }

    // Crear reserva y descontar sesión atómicamente
    await prisma.$transaction([
      prisma.reservation.create({
        data: {
          clientId,
          classId: claseId,
          membershipId: membresiaId,
          status: 'CONFIRMED',
          origin: 'PORTAL',
        },
      }),
      prisma.membership.update({
        where: { id: membresiaId },
        data: {
          sessionsUsed:      { increment: 1 },
          sessionsRemaining: { decrement: 1 },
        },
      }),
    ]);

    ApiSuccess(res, { mensaje: 'Reservación confirmada' }, 201);
  } catch (error) {
    next(error);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/portal/paquetes  — público, lista paquetes activos
// ─────────────────────────────────────────────────────────────────────────────
router.get('/paquetes', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const paquetes = await prisma.package.findMany({
      where: { isActive: true, deletedAt: null },
      include: { tipoActividad: { select: { nombre: true, color: true } } },
      orderBy: { price: 'asc' },
    });
    ApiSuccess(res, paquetes);
  } catch (error) {
    next(error);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// A partir de aquí requiere auth de CLIENT
// ─────────────────────────────────────────────────────────────────────────────
router.use(authMiddleware);
router.use(requireRole('CLIENT', 'ADMIN'));

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/portal/mi-qr  — cliente autenticado, devuelve su QR como imagen
// ─────────────────────────────────────────────────────────────────────────────
router.get('/mi-qr', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const client = await prisma.client.findUnique({
      where: { userId: req.user!.id },
      select: { id: true, firstName: true, lastName: true, phone: true, qrCode: true },
    });
    if (!client) {
      ApiError(res, 'CLIENT_NOT_FOUND', 'Perfil de cliente no encontrado', 404);
      return;
    }
    const qrImage = await QRCode.toDataURL(client.qrCode, { width: 300, margin: 2 });
    ApiSuccess(res, {
      clientId: client.id,
      name: `${client.firstName} ${client.lastName}`,
      phone: client.phone,
      qrCode: client.qrCode,
      qrImage,
    });
  } catch (error) {
    next(error);
  }
});

const reservaSchema = z.object({
  claseId: z.string().min(1),
  pagarAhora: z.boolean(),
  // Requerido si pagarAhora = false
  portalWaConfirmed: z.boolean().optional(),
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/portal/reservaciones
// Crea una reservación desde el portal con o sin pago
// ─────────────────────────────────────────────────────────────────────────────
router.post('/reservaciones', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parse = reservaSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Datos inválidos',
          details: parse.error.errors,
        },
      });
      return;
    }

    const { claseId, pagarAhora, portalWaConfirmed } = parse.data;

    if (!pagarAhora && !portalWaConfirmed) {
      ApiError(res, 'WA_REQUIRED', 'Debes confirmar que ya contactaste al estudio por WhatsApp', 400);
      return;
    }

    // Obtener el cliente asociado al usuario autenticado
    const client = await prisma.client.findUnique({
      where: { userId: req.user!.id, deletedAt: null },
      include: { user: { select: { email: true } } },
    });

    if (!client) {
      ApiError(res, 'CLIENT_NOT_FOUND', 'Perfil de cliente no encontrado', 404);
      return;
    }

    // Verificar que la clase existe y tiene spots
    const clase = await prisma.class.findUnique({
      where: { id: claseId, deletedAt: null, isActive: true, isCancelled: false },
      include: {
        tipoActividad: {
          select: {
            nombre: true,
            paquetes: { where: { sessions: 1, isActive: true }, select: { price: true }, take: 1 },
          },
        },
      },
    });

    if (!clase) {
      ApiError(res, 'NOT_FOUND', 'Clase no encontrada o no disponible', 404);
      return;
    }

    // Verificar que no tenga reservación previa para esta clase
    const existing = await prisma.reservation.findFirst({
      where: {
        clientId: client.id,
        classId: claseId,
        status: { notIn: ['CANCELLED'] },
        deletedAt: null,
      },
    });

    if (existing) {
      ApiError(res, 'ALREADY_RESERVED', 'Ya tienes una reservación para esta clase', 409);
      return;
    }

    if (pagarAhora) {
      // ── Flujo con pago ────────────────────────────────────────────────────
      // 1. Crear reservación con status PENDING_APPROVAL (se confirma al pagar)
      const reservacion = await prisma.$transaction(async (tx) => {
        // UPDATE atómico: solo incrementa si hay lugar — previene race condition
        const updated = await tx.$executeRaw`
          UPDATE \`Class\` SET spotsBooked = spotsBooked + 1
          WHERE id = ${claseId} AND spotsBooked < capacity AND deletedAt IS NULL
        `;
        if (updated === 0) throw Object.assign(new Error('CLASS_FULL'), { code: 'CLASS_FULL' });

        const r = await tx.reservation.create({
          data: {
            clientId: client.id,
            classId: claseId,
            origin: 'PORTAL',
            status: 'PENDING_APPROVAL',
            portalWaConfirmed: false,
          },
        });

        return r;
      });

      // 2. Crear preferencia de MercadoPago — precio de sesión única del paquete
      const monto = Number(clase.tipoActividad?.paquetes?.[0]?.price ?? 0);
      if (monto === 0) {
        ApiError(res, 'INVALID_AMOUNT', 'Esta clase no tiene costo configurado', 400);
        return;
      }

      const preference = await createPreference({
        reservationId: reservacion.id,
        clientName: `${client.firstName} ${client.lastName}`,
        clientEmail: client.user.email,
        claseTitle: clase.title ?? clase.tipoActividad?.nombre ?? 'Clase',
        claseDate: clase.startAt.toLocaleDateString('es-MX', { dateStyle: 'long' }),
        amount: monto,
      });

      // 3. Guardar preferenceId en la reservación
      await prisma.reservation.update({
        where: { id: reservacion.id },
        data: { mercadoPagoPreferenceId: preference.id },
      });

      ApiSuccess(res, {
        reservacionId: reservacion.id,
        preferenceId: preference.id,
        checkoutUrl: preference.init_point,
        tipo: 'CON_PAGO',
      }, 201);

    } else {
      // ── Flujo sin pago (solicitud) ────────────────────────────────────────
      const reservacion = await prisma.$transaction(async (tx) => {
        const updated = await tx.$executeRaw`
          UPDATE \`Class\` SET spotsBooked = spotsBooked + 1
          WHERE id = ${claseId} AND spotsBooked < capacity AND deletedAt IS NULL
        `;
        if (updated === 0) throw Object.assign(new Error('CLASS_FULL'), { code: 'CLASS_FULL' });

        const r = await tx.reservation.create({
          data: {
            clientId: client.id,
            classId: claseId,
            origin: 'PORTAL_REQUEST',
            status: 'PENDING_APPROVAL',
            portalWaConfirmed: true,
          },
          include: {
            class: {
              include: { tipoActividad: { select: { nombre: true } } },
            },
          },
        });

        return r;
      });

      ApiSuccess(res, {
        reservacionId: reservacion.id,
        tipo: 'SOLICITUD',
        mensaje: 'Tu solicitud fue enviada. El equipo la revisará pronto.',
      }, 201);
    }
  } catch (error) {
    if ((error as { code?: string }).code === 'CLASS_FULL') {
      ApiError(res, 'CLASS_FULL', 'La clase ya no tiene lugares disponibles', 409);
      return;
    }
    next(error);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/portal/mis-agendas  — cliente autenticado
// ─────────────────────────────────────────────────────────────────────────────
router.get('/mis-agendas', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const client = await prisma.client.findUnique({
      where: { userId: req.user!.id, deletedAt: null },
    });

    if (!client) {
      ApiError(res, 'CLIENT_NOT_FOUND', 'Perfil de cliente no encontrado', 404);
      return;
    }

    const reservaciones = await prisma.reservation.findMany({
      where: {
        clientId: client.id,
        origin: { in: ['PORTAL', 'PORTAL_REQUEST'] },
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        class: {
          include: {
            instructor: { select: { firstName: true, lastName: true } },
            tipoActividad: { select: { nombre: true, color: true } },
          },
        },
      },
    });

    ApiSuccess(res, reservaciones);
  } catch (error) {
    next(error);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/portal/verificar-pago
// Fallback para confirmar un pago desde la página de éxito cuando el webhook
// no puede alcanzar localhost. Verifica el pago directamente con MercadoPago.
// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/portal/mis-membresias  — membresías activas del cliente
// ─────────────────────────────────────────────────────────────────────────────
router.get('/mis-membresias', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const client = await prisma.client.findUnique({
      where: { userId: req.user!.id, deletedAt: null },
    });
    if (!client) {
      ApiError(res, 'CLIENT_NOT_FOUND', 'Perfil no encontrado', 404);
      return;
    }

    const now = new Date();
    const membresias = await prisma.membership.findMany({
      where: {
        clientId: client.id,
        deletedAt: null,
        status: 'ACTIVE',
        expiresAt: { gt: now },
        sessionsRemaining: { gt: 0 },
      },
      include: {
        package: { include: { tipoActividad: { select: { nombre: true, color: true } } } },
      },
      orderBy: { expiresAt: 'asc' },
    });

    ApiSuccess(res, membresias);
  } catch (error) {
    next(error);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/portal/comprar-paquete  — crea preference MP para un paquete
// ─────────────────────────────────────────────────────────────────────────────
router.post('/comprar-paquete', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { packageId } = req.body as { packageId?: string };
    if (!packageId) {
      ApiError(res, 'MISSING_PACKAGE', 'Se requiere packageId', 400);
      return;
    }

    const client = await prisma.client.findUnique({
      where: { userId: req.user!.id, deletedAt: null },
      include: { user: { select: { email: true } } },
    });
    if (!client) {
      ApiError(res, 'CLIENT_NOT_FOUND', 'Perfil no encontrado', 404);
      return;
    }

    const pkg = await prisma.package.findFirst({
      where: { id: packageId, isActive: true, deletedAt: null },
    });
    if (!pkg) {
      ApiError(res, 'NOT_FOUND', 'Paquete no encontrado', 404);
      return;
    }

    const preference = await createPackagePreference({
      packageId: pkg.id,
      clientId: client.id,
      clientName: `${client.firstName} ${client.lastName}`,
      clientEmail: client.user.email,
      packageName: pkg.name,
      sessions: pkg.sessions,
      amount: Number(pkg.price),
    });

    ApiSuccess(res, { preferenceId: preference.id, checkoutUrl: preference.init_point });
  } catch (error) {
    next(error);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/portal/verificar-pago-paquete  — fallback si el webhook no llega
// ─────────────────────────────────────────────────────────────────────────────
router.post('/verificar-pago-paquete', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { paymentId } = req.body as { paymentId?: string };
    if (!paymentId) {
      ApiError(res, 'MISSING_PAYMENT_ID', 'Se requiere paymentId', 400);
      return;
    }

    const payment = await getPayment(paymentId);
    const externalRef = payment.external_reference;

    if (!externalRef?.startsWith('PKG:')) {
      ApiError(res, 'INVALID_PAYMENT', 'Pago no corresponde a un paquete', 400);
      return;
    }

    const parts = externalRef.split(':');
    if (parts.length !== 3) {
      ApiError(res, 'INVALID_PAYMENT', 'Referencia de pago malformada', 400);
      return;
    }
    const packageId = parts[1];
    const clientId = parts[2];

    const client = await prisma.client.findUnique({
      where: { userId: req.user!.id, deletedAt: null },
    });
    if (!client || client.id !== clientId) {
      ApiError(res, 'FORBIDDEN', 'No tienes acceso a este pago', 403);
      return;
    }

    if (payment.status === 'approved') {
      const pkg = await prisma.package.findFirst({ where: { id: packageId, deletedAt: null } });
      if (pkg) {
        const nowDate = new Date();
        const expiresAt = new Date(nowDate);
        expiresAt.setDate(expiresAt.getDate() + pkg.validityDays);
        const mpPaymentId = String(paymentId);

        await prisma.$transaction(async (tx) => {
          const membership = await tx.membership.upsert({
            where: { mercadoPagoPaymentId: mpPaymentId },
            create: {
              clientId,
              packageId,
              status: 'ACTIVE',
              totalSessions: pkg.sessions,
              sessionsUsed: 0,
              sessionsRemaining: pkg.sessions,
              startDate: nowDate,
              expiresAt,
              pricePaid: pkg.price,
              paymentStatus: 'PAID',
              paymentMethod: 'MERCADO_PAGO' as PaymentMethod,
              mercadoPagoPaymentId: mpPaymentId,
            },
            update: {},
          });

          await tx.payment.create({
            data: {
              membershipId: membership.id,
              amount: payment.transaction_amount ?? pkg.price,
              method: 'MERCADO_PAGO' as PaymentMethod,
              status: 'PAID',
              reference: mpPaymentId,
              paidAt: nowDate,
            },
          });
        });
      }
    }

    ApiSuccess(res, { status: payment.status });
  } catch (error) {
    next(error);
  }
});

router.post('/verificar-pago', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { paymentId } = req.body as { paymentId?: string };

    if (!paymentId) {
      ApiError(res, 'MISSING_PAYMENT_ID', 'Se requiere paymentId', 400);
      return;
    }

    const payment = await getPayment(paymentId);
    const reservationId = payment.external_reference;

    if (!reservationId) {
      ApiError(res, 'INVALID_PAYMENT', 'Pago sin referencia de reservación', 400);
      return;
    }

    const client = await prisma.client.findUnique({
      where: { userId: req.user!.id, deletedAt: null },
    });

    const reservacion = await prisma.reservation.findUnique({
      where: { id: reservationId },
    });

    if (!reservacion) {
      ApiError(res, 'NOT_FOUND', 'Reservación no encontrada', 404);
      return;
    }

    // Validar que la reservación pertenece al cliente autenticado
    if (!client || reservacion.clientId !== client.id) {
      ApiError(res, 'FORBIDDEN', 'No tienes acceso a esta reservación', 403);
      return;
    }

    // Si el pago fue aprobado, actualizar la reservación
    if (payment.status === 'approved' && reservacion.status === 'PENDING_APPROVAL') {
      await prisma.$transaction(async (tx) => {
        await tx.reservation.update({
          where: { id: reservationId },
          data: { status: 'CONFIRMED', mercadoPagoPaymentId: String(paymentId) },
        });

        await tx.payment.upsert({
          where: { reservationId },
          create: {
            reservationId,
            amount: payment.transaction_amount ?? 0,
            method: 'CARD',
            status: 'PAID',
            reference: String(paymentId),
            paidAt: new Date(),
          },
          update: {
            status: 'PAID',
            paidAt: new Date(),
            reference: String(paymentId),
          },
        });
      });
    }

    // Obtener el estado actualizado de la reservación después de la transacción
    const updatedReservacion = await prisma.reservation.findUnique({
      where: { id: reservationId },
    });

    ApiSuccess(res, {
      status: payment.status,
      reservacionStatus: updatedReservacion?.status ?? reservacion.status,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
