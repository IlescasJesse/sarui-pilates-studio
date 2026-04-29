"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { get, post, patch, del } from "@/lib/api-client";
import { AxiosError } from "axios";

// ── Types ────────────────────────────────────────────────────────────────────

export type ReservationStatus =
  | "CONFIRMED"
  | "CANCELLED"
  | "ATTENDED"
  | "NO_SHOW"
  | "PENDING_APPROVAL";
export type ReservationOrigin = "MEMBERSHIP" | "WALK_IN" | "PORTAL" | "PORTAL_REQUEST";

export interface Client {
  id: string;
  firstName: string;
  lastName: string;
}

export interface ClassInfo {
  id: string;
  title: string;
  startAt: string;
  endAt: string;
  type: string;
}

export interface Reservacion {
  id: string;
  clientId: string;
  classId: string;
  status: ReservationStatus;
  origin: ReservationOrigin;
  notes?: string;
  createdAt: string;
  client: Client;
  class: ClassInfo;
}

// ── Query Hooks ──────────────────────────────────────────────────────────────

export function useReservaciones(params?: {
  status?: ReservationStatus;
  date?: string;
  clientId?: string;
}) {
  return useQuery({
    queryKey: ["reservaciones", params],
    queryFn: () =>
      get<{ success: boolean; data: Reservacion[] }>("/reservaciones", params),
    select: (res) => res.data,
  });
}

export function useReservacionById(id?: string) {
  return useQuery({
    queryKey: ["reservaciones", id],
    queryFn: () =>
      get<{ success: boolean; data: Reservacion }>(`/reservaciones/${id}`),
    select: (res) => res.data,
    enabled: !!id,
  });
}

// ── Mutation Hooks ───────────────────────────────────────────────────────────

export interface CreateReservacionDto {
  clientId: string;
  classId: string;
  membershipId?: string;
  origin?: "MEMBERSHIP" | "WALK_IN";
  notes?: string;
}

export function useCreateReservacion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateReservacionDto) =>
      post<{ success: boolean; data: any }>("/reservaciones", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reservaciones"] });
      qc.invalidateQueries({ queryKey: ["clases"] });
    },
    onError: (error: AxiosError<any>) => {
      throw new Error(
        error.response?.data?.error?.message || "Error al crear reservación"
      );
    },
  });
}

export function useCancelReservacion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      del<{ success: boolean; data: any }>(`/reservaciones/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reservaciones"] });
    },
    onError: (error: AxiosError<any>) => {
      throw new Error(
        error.response?.data?.error?.message || "Error al cancelar reservación"
      );
    },
  });
}

export function useMarcarAsistencia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: "ATTENDED" | "NO_SHOW" }) =>
      patch<{ success: boolean; data: any }>(`/reservaciones/${id}`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reservaciones"] });
    },
    onError: (error: AxiosError<any>) => {
      throw new Error(
        error.response?.data?.error?.message || "Error al actualizar asistencia"
      );
    },
  });
}
