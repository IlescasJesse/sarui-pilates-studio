import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Puesto {
  id: string;
  nombre: string;
  salarioSemanal: number;
}

export interface StaffProfile {
  id: string;
  nombre: string;
  apellido: string;
  telefono?: string;
  puestoId?: string;
  puesto?: Puesto;
  fechaIngreso: string;
  activo: boolean;
  userId?: string;
}

export interface AsistenciaDia {
  fecha: string;
  presente: boolean;
  staffId: string;
}

export interface AsistenciaSemana {
  staff: StaffProfile;
  dias: AsistenciaDia[];
}

export interface NominaDetalle {
  id: string;
  staffId: string;
  staff: StaffProfile;
  diasTrabajados: number;
  salarioBruto: number;
  deducciones: number;
  netoAPagar: number;
}

export type EstadoNomina = 'BORRADOR' | 'APROBADO' | 'PAGADO';

export interface PeriodoNomina {
  id: string;
  fechaInicio: string;
  fechaFin: string;
  estado: EstadoNomina;
  creadoEn: string;
  detalles: NominaDetalle[];
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export function usePuestos() {
  return useQuery<Puesto[]>({
    queryKey: ['personal-puestos'],
    queryFn: async () => {
      const res = await apiClient.get('/personal/puestos');
      return res.data.data;
    },
  });
}

export function useStaff() {
  return useQuery<StaffProfile[]>({
    queryKey: ['personal-staff'],
    queryFn: async () => {
      const res = await apiClient.get('/personal/staff');
      return res.data.data;
    },
  });
}

export function useAsistenciaSemana(inicio: string, enabled = true) {
  return useQuery<AsistenciaSemana[]>({
    queryKey: ['personal-asistencia', inicio],
    queryFn: async () => {
      const res = await apiClient.get('/personal/asistencia/admin', {
        params: { inicio },
      });
      return res.data.data;
    },
    enabled: !!inicio && enabled,
  });
}

export function useNomina() {
  return useQuery<PeriodoNomina[]>({
    queryKey: ['personal-nomina'],
    queryFn: async () => {
      const res = await apiClient.get('/personal/nomina/periodos');
      return res.data.data;
    },
  });
}

// ─── Mutations: Puestos ───────────────────────────────────────────────────────

export function useCrearPuesto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { nombre: string; salarioSemanal: number }) =>
      apiClient.post('/personal/puestos', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['personal-puestos'] }),
  });
}

export function useEditarPuesto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<{ nombre: string; salarioSemanal: number }> }) =>
      apiClient.patch(`/personal/puestos/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['personal-puestos'] }),
  });
}

export function useEliminarPuesto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/personal/puestos/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['personal-puestos'] }),
  });
}

// ─── Mutations: Staff ─────────────────────────────────────────────────────────

export function useCrearStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      nombre: string;
      apellido: string;
      telefono?: string;
      puestoId?: string;
      fechaIngreso: string;
      activo: boolean;
    }) => apiClient.post('/personal/staff', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['personal-staff'] });
      qc.invalidateQueries({ queryKey: ['personal-puestos'] });
    },
  });
}

export function useEditarStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<{
        nombre: string;
        apellido: string;
        telefono: string;
        puestoId: string;
        fechaIngreso: string;
        activo: boolean;
      }>;
    }) => apiClient.patch(`/personal/staff/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['personal-staff'] });
      qc.invalidateQueries({ queryKey: ['personal-puestos'] });
    },
  });
}

export function useEliminarStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/personal/staff/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['personal-staff'] });
      qc.invalidateQueries({ queryKey: ['personal-puestos'] });
    },
  });
}

// ─── Mutations: Asistencia ────────────────────────────────────────────────────

export function useMarcarAsistenciaAdmin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { staffId: string; fecha: string; presente: boolean }) =>
      apiClient.patch('/personal/asistencia/admin', data),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['personal-asistencia'] });
    },
  });
}

// ─── Mutations: Nómina ────────────────────────────────────────────────────────

export function useCrearPeriodo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { fechaInicio: string; fechaFin: string }) =>
      apiClient.post('/personal/nomina/periodos', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['personal-nomina'] }),
  });
}

export function useRecalcularPeriodo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.post(`/personal/nomina/periodos/${id}/recalcular`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['personal-nomina'] }),
  });
}

export function useAjustarDetalle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { deducciones?: number; netoAPagar?: number };
    }) => apiClient.patch(`/personal/nomina/detalles/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['personal-nomina'] }),
  });
}

export function useAprobarNomina() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.post(`/personal/nomina/periodos/${id}/aprobar`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['personal-nomina'] });
      qc.invalidateQueries({ queryKey: ['contabilidad-gastos'] });
    },
  });
}

export function useMarcarPagado() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.post(`/personal/nomina/periodos/${id}/pagar`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['personal-nomina'] }),
  });
}
