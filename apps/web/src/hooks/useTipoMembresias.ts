"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface TipoActividadResumen {
  id: string;
  nombre: string;
  color?: string;
}

export interface TipoMembresiaActividad {
  id: string;
  tipoActividadId: string;
  tipoActividad: TipoActividadResumen;
}

export interface TipoMembresia {
  id: string;
  nombre: string;
  descripcion?: string;
  duracionDias: number;
  isActive: boolean;
  actividades: TipoMembresiaActividad[];
  createdAt: string;
  updatedAt: string;
}

export interface TipoMembresiaDto {
  nombre: string;
  descripcion?: string;
  duracionDias: number;
  actividadIds: string[];
  isActive?: boolean;
}

async function fetchTipoMembresias() {
  const res = await apiClient.get<{ success: boolean; data: TipoMembresia[] }>(
    "/tipo-membresias"
  );
  return res.data.data;
}

export function useTipoMembresias() {
  return useQuery({
    queryKey: ["tipo-membresias"],
    queryFn: fetchTipoMembresias,
  });
}

export function useCreateTipoMembresia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: TipoMembresiaDto) =>
      apiClient
        .post<{ success: boolean; data: TipoMembresia }>("/tipo-membresias", data)
        .then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tipo-membresias"] }),
  });
}

export function useUpdateTipoMembresia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: TipoMembresiaDto & { id: string }) =>
      apiClient
        .put<{ success: boolean; data: TipoMembresia }>(`/tipo-membresias/${id}`, data)
        .then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tipo-membresias"] }),
  });
}

export function useDeleteTipoMembresia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete(`/tipo-membresias/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tipo-membresias"] }),
  });
}
