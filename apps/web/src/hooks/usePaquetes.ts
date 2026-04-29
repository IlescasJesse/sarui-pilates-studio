"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { get, post, put, del } from "@/lib/api-client";
import { AxiosError } from "axios";

// ── Types ────────────────────────────────────────────────────────────────────

export type PackageCategory = "REFORMER" | "MAT" | "MIX";
export type ClassSubtype = "REFORMER" | "MAT";

export interface TipoActividadResumen {
  id: string;
  nombre: string;
  color?: string;
}

export interface Paquete {
  id: string;
  name: string;
  tipoActividadId?: string;
  tipoActividad?: TipoActividadResumen;
  category: PackageCategory;
  classSubtype?: ClassSubtype;
  description?: string;
  sessions: number;
  price: number;
  validityDays: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaqueteDto {
  name: string;
  tipoActividadId: string;
  sessions: number;
  price: number;
  validityDays: number;
  description?: string;
  isActive?: boolean;
}

export interface UpdatePaqueteDto {
  name?: string;
  tipoActividadId?: string;
  sessions?: number;
  price?: number;
  validityDays?: number;
  description?: string;
  isActive?: boolean;
}

// ── Query Hooks ──────────────────────────────────────────────────────────────

export function usePaquetes() {
  return useQuery({
    queryKey: ["paquetes"],
    queryFn: () =>
      get<{ success: boolean; data: Paquete[] }>("/paquetes"),
    select: (res) => res.data,
  });
}

export function usePaqueteById(id?: string) {
  return useQuery({
    queryKey: ["paquetes", id],
    queryFn: () =>
      get<{ success: boolean; data: Paquete }>(`/paquetes/${id}`),
    select: (res) => res.data,
    enabled: !!id,
  });
}

// ── Mutation Hooks ───────────────────────────────────────────────────────────

export function useCreatePaquete() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePaqueteDto) =>
      post<{ success: boolean; data: any }>("/paquetes", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["paquetes"] });
    },
    onError: (error: AxiosError<any>) => {
      throw new Error(
        error.response?.data?.error?.message || "Error creating package"
      );
    },
  });
}

export function useUpdatePaquete(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdatePaqueteDto) =>
      put<{ success: boolean; data: Paquete }>(`/paquetes/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["paquetes"] });
      qc.invalidateQueries({ queryKey: ["paquetes", id] });
    },
    onError: (error: AxiosError<any>) => {
      throw new Error(
        error.response?.data?.error?.message || "Error updating package"
      );
    },
  });
}

export function useDeletePaquete() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      del<{ success: boolean; data: any }>(`/paquetes/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["paquetes"] });
    },
    onError: (error: AxiosError<any>) => {
      throw new Error(
        error.response?.data?.error?.message || "Error deleting package"
      );
    },
  });
}
