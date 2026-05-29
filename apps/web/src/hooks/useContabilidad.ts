import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export type TipoCuenta = 'ACTIVO' | 'PASIVO' | 'CAPITAL' | 'INGRESO' | 'COSTO' | 'GASTO';
export type OrigenIngreso = 'MEMBRESIA_MANUAL' | 'PAQUETE_MANUAL' | 'PORTAL_MERCADOPAGO' | 'WALK_IN' | 'OTRO';

export interface CuentaContable {
  id: string;
  codigo: string;
  nombre: string;
  tipo: TipoCuenta;
  descripcion?: string;
  isActive: boolean;
}

export interface Gasto {
  id: string;
  concepto: string;
  monto: number;
  fecha: string;
  comprobante?: string;
  notas?: string;
  cuentaContable: { codigo: string; nombre: string; tipo: TipoCuenta };
  creadoPor: { email: string };
}

export interface Ingreso {
  id: string;
  concepto: string;
  monto: number;
  fecha: string;
  origen: OrigenIngreso;
  comprobante?: string;
  notas?: string;
  cuentaContable: { codigo: string; nombre: string; tipo: TipoCuenta };
  creadoPor: { email: string };
}

export interface CorteCaja {
  id: string;
  claseId: string;
  instructorId: string;
  fecha: string;
  totalReservaciones: number;
  ingresoDirecto: number;
  ingresoMembresia: number;
  ingresoTotal: number;
  creadoEn: string;
  clase: { title: string | null; startAt: string; endAt: string };
  instructor: { firstName: string; lastName: string };
}

export interface CortesCajaResponse {
  cortes: CorteCaja[];
  totales: { ingresoDirecto: number; ingresoMembresia: number; ingresoTotal: number; reservaciones: number };
}

export interface ReporteContable {
  mes: number;
  anio: number;
  totalIngresos: number;
  totalGastos: number;
  balance: number;
  ingresosRegistrados: number;
  ingresosMembresias: number;
  ingresosCortesCaja: number;
  totalClasesConCorte: number;
  desglosePorCuenta: Array<{ codigo: string; nombre: string; tipo: string; total: number }>;
  gastos: Gasto[];
  ingresos: Ingreso[];
  membresiasPagadas: Array<{ pricePaid: number; createdAt: string; package: { name: string } }>;
}

// Cuentas
export function useCuentas(tipo?: TipoCuenta) {
  return useQuery<CuentaContable[]>({
    queryKey: ['contabilidad-cuentas', tipo],
    queryFn: async () => {
      const res = await apiClient.get('/contabilidad/cuentas', { params: tipo ? { tipo } : {} });
      return res.data.data;
    },
  });
}

export function useCrearCuenta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Pick<CuentaContable, 'codigo' | 'nombre' | 'tipo'> & { descripcion?: string }) =>
      apiClient.post('/contabilidad/cuentas', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contabilidad-cuentas'] }),
  });
}

// Gastos
export function useGastos(mes?: number, anio?: number) {
  return useQuery<Gasto[]>({
    queryKey: ['contabilidad-gastos', mes, anio],
    queryFn: async () => {
      const res = await apiClient.get('/contabilidad/gastos', { params: mes && anio ? { mes, anio } : {} });
      return res.data.data;
    },
  });
}

export function useCrearGasto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { cuentaContableId: string; concepto: string; monto: number; fecha: string; comprobante?: string; notas?: string }) =>
      apiClient.post('/contabilidad/gastos', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contabilidad-gastos'] });
      qc.invalidateQueries({ queryKey: ['contabilidad-reporte'] });
    },
  });
}

export function useEliminarGasto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/contabilidad/gastos/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contabilidad-gastos'] });
      qc.invalidateQueries({ queryKey: ['contabilidad-reporte'] });
    },
  });
}

// Ingresos
export function useIngresos(mes?: number, anio?: number) {
  return useQuery<Ingreso[]>({
    queryKey: ['contabilidad-ingresos', mes, anio],
    queryFn: async () => {
      const res = await apiClient.get('/contabilidad/ingresos', { params: mes && anio ? { mes, anio } : {} });
      return res.data.data;
    },
  });
}

export function useCrearIngreso() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { cuentaContableId: string; concepto: string; monto: number; fecha: string; origen: OrigenIngreso; notas?: string; comprobante?: string }) =>
      apiClient.post('/contabilidad/ingresos', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contabilidad-ingresos'] });
      qc.invalidateQueries({ queryKey: ['contabilidad-reporte'] });
    },
  });
}

export function useEliminarIngreso() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/contabilidad/ingresos/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contabilidad-ingresos'] });
      qc.invalidateQueries({ queryKey: ['contabilidad-reporte'] });
    },
  });
}

// Cortes de Caja
export function useCortesCaja(mes?: number, anio?: number) {
  return useQuery<CortesCajaResponse>({
    queryKey: ['contabilidad-cortes-caja', mes, anio],
    queryFn: async () => {
      const res = await apiClient.get('/contabilidad/cortes-caja', {
        params: mes && anio ? { mes, anio } : {},
      });
      return res.data.data;
    },
  });
}

// Reporte
export function useReporteContable(mes: number, anio: number) {
  return useQuery<ReporteContable>({
    queryKey: ['contabilidad-reporte', mes, anio],
    queryFn: async () => {
      const res = await apiClient.get('/contabilidad/reporte', { params: { mes, anio } });
      return res.data.data;
    },
  });
}
