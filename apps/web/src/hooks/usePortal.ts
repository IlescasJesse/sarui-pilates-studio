"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { portalPublicClient, portalAuthClient } from "@/lib/portal-client";

// ── Tipos ──────────────────────────────────────────────────────────────────────
export interface ClasePortal {
  id: string;
  title: string;
  tipoActividad: { nombre: string; color: string; modalidad: string; costo: string } | null;
  instructor: { firstName: string; lastName: string };
  startAt: string;
  endAt: string;
  capacity: number;
  spotsBooked: number;
  spotsLeft: number;
  location: string | null;
  costo: string | null;
}

export interface ReservaPortalResponse {
  reservacionId: string;
  tipo: "CON_PAGO" | "SOLICITUD";
  preferenceId?: string;
  checkoutUrl?: string;
  mensaje?: string;
}

export interface AgendaPortal {
  id: string;
  status: string;
  origin: string;
  portalWaConfirmed: boolean;
  createdAt: string;
  class: {
    title: string | null;
    startAt: string;
    endAt: string;
    tipoActividad: { nombre: string; color: string } | null;
    instructor: { firstName: string; lastName: string };
  };
}

// ── Queries ───────────────────────────────────────────────────────────────────
export function useClasesPortal() {
  return useQuery({
    queryKey: ["portal", "clases"],
    queryFn: async () => {
      const res = await portalPublicClient.get<{ success: boolean; data: ClasePortal[] }>(
        "/portal/clases"
      );
      return res.data.data;
    },
    staleTime: 60_000,
  });
}

export function useClasePortal(id: string) {
  return useQuery({
    queryKey: ["portal", "clases", id],
    queryFn: async () => {
      const res = await portalPublicClient.get<{ success: boolean; data: ClasePortal }>(
        `/portal/clases/${id}`
      );
      return res.data.data;
    },
    enabled: !!id,
  });
}

export function useMisAgendas() {
  return useQuery({
    queryKey: ["portal", "mis-agendas"],
    queryFn: async () => {
      const res = await portalAuthClient.get<{ success: boolean; data: AgendaPortal[] }>(
        "/portal/mis-agendas"
      );
      return res.data.data;
    },
  });
}

// ── Mutations ─────────────────────────────────────────────────────────────────
export function useCrearReservaPortal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      claseId: string;
      pagarAhora: boolean;
      portalWaConfirmed?: boolean;
    }) => {
      const res = await portalAuthClient.post<{ success: boolean; data: ReservaPortalResponse }>(
        "/portal/reservaciones",
        data
      );
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["portal"] });
    },
  });
}
