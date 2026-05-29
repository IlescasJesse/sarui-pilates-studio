import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

// ── Types ──────────────────────────────────────────────────────────────────

export interface EstadoResultados {
  mes: number; anio: number;
  ingresos: { manuales: number; membresiasMP: number; totalClases: number; total: number };
  costoServicio: { detalle: Array<{ concepto: string; monto: number; cuenta: string }>; total: number };
  utilidadBruta: number; margenBruto: number;
  gastosOperativos: { detalle: Array<{ concepto: string; monto: number; cuenta: string }>; total: number };
  utilidadNeta: number; margenNeto: number; esBeneficio: boolean;
}

export interface FlujoEfectivo {
  mes: number; anio: number;
  operativo: { entradas: number; salidas: number; neto: number };
  inversion: {
    pagosRealizados: number; neto: number;
    detalle: Array<{ concepto: string; categoria: string; monto: number; fecha: string; nota?: string }>;
  };
  flujoNeto: number;
}

export interface BalanceGeneral {
  activos: { caja: number; equipo: number; totalActivos: number };
  pasivos: { inversionesPendientes: number; totalPasivos: number };
  capital: { totalInvertido: number; totalPagado: number; pendiente: number; patrimonio: number };
  inversiones: InversionCapital[];
}

export interface Kpis {
  mes: number; anio: number;
  clases: { total: number; spotsDisponibles: number; spotsOcupados: number; tasaOcupacion: number };
  unitEconomics: {
    ingresoPromedioPorClase: number; ingresoPromedioPorSpot: number;
    costoPromedioPorClase: number; margenPromedioPorClase: number;
  };
  clientes: { activos: number; ticketPromedio: number; reservacionesConfirmadas: number };
}

export interface InversionCapital {
  id: string; concepto: string; montoTotal: number; fecha: string;
  categoria: 'EQUIPO' | 'LOCAL' | 'REMODELACION' | 'TECNOLOGIA' | 'OTRO';
  notas?: string; creadoEn: string;
  pagos: Array<{ id: string; monto: number; fecha: string; nota?: string }>;
  pagado: number; pendiente: number; liquidada: boolean;
}

// ── Hooks ──────────────────────────────────────────────────────────────────

export function useEstadoResultados(mes: number, anio: number) {
  return useQuery<EstadoResultados>({
    queryKey: ['finanzas-er', mes, anio],
    queryFn: async () => {
      const res = await apiClient.get('/finanzas/estado-resultados', { params: { mes, anio } });
      return res.data.data;
    },
  });
}

export function useFlujoEfectivo(mes: number, anio: number) {
  return useQuery<FlujoEfectivo>({
    queryKey: ['finanzas-flujo', mes, anio],
    queryFn: async () => {
      const res = await apiClient.get('/finanzas/flujo-efectivo', { params: { mes, anio } });
      return res.data.data;
    },
  });
}

export function useBalanceGeneral() {
  return useQuery<BalanceGeneral>({
    queryKey: ['finanzas-balance'],
    queryFn: async () => {
      const res = await apiClient.get('/finanzas/balance-general');
      return res.data.data;
    },
  });
}

export function useKpis(mes: number, anio: number) {
  return useQuery<Kpis>({
    queryKey: ['finanzas-kpis', mes, anio],
    queryFn: async () => {
      const res = await apiClient.get('/finanzas/kpis', { params: { mes, anio } });
      return res.data.data;
    },
  });
}

export function useInversiones() {
  return useQuery<InversionCapital[]>({
    queryKey: ['finanzas-inversiones'],
    queryFn: async () => {
      const res = await apiClient.get('/finanzas/inversiones');
      return res.data.data;
    },
  });
}

export function useCrearInversion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { concepto: string; montoTotal: number; fecha: string; categoria: string; notas?: string }) =>
      apiClient.post('/finanzas/inversiones', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finanzas-inversiones'] });
      qc.invalidateQueries({ queryKey: ['finanzas-balance'] });
    },
  });
}

export function useEliminarInversion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/finanzas/inversiones/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finanzas-inversiones'] });
      qc.invalidateQueries({ queryKey: ['finanzas-balance'] });
    },
  });
}

export function useRegistrarPagoInversion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; monto: number; fecha: string; nota?: string }) =>
      apiClient.post(`/finanzas/inversiones/${id}/pago`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finanzas-inversiones'] });
      qc.invalidateQueries({ queryKey: ['finanzas-balance'] });
      qc.invalidateQueries({ queryKey: ['finanzas-flujo'] });
    },
  });
}

export function useEliminarPagoInversion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ invId, pagoId }: { invId: string; pagoId: string }) =>
      apiClient.delete(`/finanzas/inversiones/${invId}/pago/${pagoId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finanzas-inversiones'] });
      qc.invalidateQueries({ queryKey: ['finanzas-balance'] });
    },
  });
}
