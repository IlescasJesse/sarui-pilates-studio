// ─── Auth ────────────────────────────────────────────────────────────────────

export type UserRole = "admin" | "instructor" | "reception" | "client";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  createdAt: string;
}

// ─── Clients ─────────────────────────────────────────────────────────────────

export interface Cliente {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string;
  fechaNacimiento?: string;
  qrToken: string;
  pin: string;
  activo: boolean;
  notas?: string;
  createdAt: string;
}

// ─── Packages ────────────────────────────────────────────────────────────────

export type TipoClase = "Flow" | "Power" | "Mobility" | "Mat";

export interface Paquete {
  id: string;
  nombre: string;
  descripcion?: string;
  sesiones: number;
  diasValidez: number;
  precio: number;
  tipo: TipoClase | "mixto";
  activo: boolean;
}

// ─── Memberships ──────────────────────────────────────────────────────────────

export type EstadoMembresia = "activa" | "vencida" | "suspendida" | "cancelada";

export interface Membresia {
  id: string;
  clienteId: string;
  cliente?: Pick<Cliente, "id" | "nombre" | "apellido" | "email">;
  paqueteId: string;
  paquete?: Pick<Paquete, "id" | "nombre" | "sesiones" | "precio">;
  sesionesRestantes: number;
  sesionesUsadas: number;
  fechaInicio: string;
  fechaVencimiento: string;
  estado: EstadoMembresia;
  precio: number;
  notas?: string;
  createdAt: string;
}

// ─── Classes ─────────────────────────────────────────────────────────────────

export interface Instructora {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string;
  especialidades: TipoClase[];
  activa: boolean;
}

export interface Clase {
  id: string;
  titulo: string;
  tipo: TipoClase;
  descripcion?: string;
  instructoraId: string;
  instructora?: Pick<Instructora, "id" | "nombre" | "apellido">;
  fechaInicio: string;
  fechaFin: string;
  capacidadMaxima: number;
  reservacionesCount: number;
  precio?: number;
  recurrente: boolean;
  activa: boolean;
}

// ─── Reservations ─────────────────────────────────────────────────────────────

export type EstadoReservacion =
  | "confirmada"
  | "cancelada"
  | "lista_espera"
  | "asistio"
  | "no_asistio";

export interface Reservacion {
  id: string;
  claseId: string;
  clase?: Pick<Clase, "id" | "titulo" | "tipo" | "fechaInicio">;
  membresiaId: string;
  clienteId: string;
  cliente?: Pick<Cliente, "id" | "nombre" | "apellido">;
  estado: EstadoReservacion;
  checkinAt?: string;
  createdAt: string;
}

// ─── Pagination ──────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── API error shape ──────────────────────────────────────────────────────────

export interface ApiError {
  message: string;
  statusCode: number;
  errors?: Record<string, string[]>;
}
