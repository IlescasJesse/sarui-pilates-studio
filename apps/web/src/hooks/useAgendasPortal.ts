"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { get, patch } from "@/lib/api-client";

export interface AgendaPortalAdmin {
  id: string;
  status: string;
  origin: string;
  portalWaConfirmed: boolean;
  portalDeclineReason: string | null;
  createdAt: string;
  client: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string | null;
  };
  class: {
    id: string;
    title: string | null;
    startAt: string;
    endAt: string;
    tipoActividad: { nombre: string; color: string } | null;
    instructor: { firstName: string; lastName: string };
  };
}

interface ApiResp<T> {
  success: boolean;
  data: T;
}

export function useAgendasPortal(status?: string) {
  return useQuery({
    queryKey: ["reservaciones", "portal", status],
    queryFn: () =>
      get<ApiResp<AgendaPortalAdmin[]>>("/reservaciones/portal", status ? { status } : undefined).then(
        (r) => (r as ApiResp<AgendaPortalAdmin[]>).data
      ),
  });
}

export function useAprobarAgenda() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      patch<ApiResp<AgendaPortalAdmin>>(`/reservaciones/${id}/aprobar`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reservaciones", "portal"] }),
  });
}

export function useDeclinarAgenda() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, razon }: { id: string; razon?: string }) =>
      patch<ApiResp<AgendaPortalAdmin>>(`/reservaciones/${id}/declinar`, { razon }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reservaciones", "portal"] }),
  });
}
