"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface TipoActividad {
  id: string;
  nombre: string;
  descripcion?: string;
  color?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

async function fetchTipoActividades(soloActivos = false) {
  const res = await apiClient.get<{ success: boolean; data: TipoActividad[] }>(
    "/tipo-actividades",
    soloActivos ? { params: { activos: true } } : undefined
  );
  return res.data.data;
}

export function useTipoActividades(soloActivos = false) {
  return useQuery({
    queryKey: ["tipo-actividades", soloActivos],
    queryFn: () => fetchTipoActividades(soloActivos),
  });
}

export function useCreateTipoActividad() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<TipoActividad, "id" | "createdAt" | "updatedAt">) =>
      apiClient
        .post<{ success: boolean; data: TipoActividad }>("/tipo-actividades", data)
        .then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tipo-actividades"] }),
  });
}

export function useUpdateTipoActividad() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<TipoActividad> & { id: string }) =>
      apiClient
        .put<{ success: boolean; data: TipoActividad }>(`/tipo-actividades/${id}`, data)
        .then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tipo-actividades"] }),
  });
}

export function useDeleteTipoActividad() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete(`/tipo-actividades/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tipo-actividades"] }),
  });
}
