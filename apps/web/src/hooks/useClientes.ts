"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { get, post, put, del } from "@/lib/api-client";
import { AxiosError } from "axios";

// ── Types ────────────────────────────────────────────────────────────────────

export interface Cliente {
  id: string;
  firstName: string;
  lastName: string;
  phone?: string;
  birthDate?: string;
  qrCode: string;
  createdAt: string;
  user: {
    email: string;
    isActive: boolean;
  };
  _count?: {
    reservations: number;
  };
}

export interface ClientesResponse {
  clientes: Cliente[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface CreateClienteDto {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  birthDate?: string;
  notes?: string;
}

export interface UpdateClienteDto {
  firstName?: string;
  lastName?: string;
  phone?: string;
  birthDate?: string;
  notes?: string;
}

// ── Query Hooks ──────────────────────────────────────────────────────────────

export function useClientes(params?: { search?: string; page?: number }) {
  return useQuery({
    queryKey: ["clientes", params],
    queryFn: () =>
      get<{ success: boolean; data: ClientesResponse }>("/clientes", params),
    select: (res) => res.data,
  });
}

export function useClienteById(id?: string) {
  return useQuery({
    queryKey: ["clientes", id],
    queryFn: () =>
      get<{ success: boolean; data: Cliente }>(`/clientes/${id}`),
    select: (res) => res.data,
    enabled: !!id,
  });
}

// ── Mutation Hooks ───────────────────────────────────────────────────────────

export function useCreateCliente() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateClienteDto) =>
      post<{ success: boolean; data: any }>("/clientes", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clientes"] });
    },
    onError: (error: AxiosError<any>) => {
      throw new Error(
        error.response?.data?.error?.message || "Error creating client"
      );
    },
  });
}

export function useUpdateCliente(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateClienteDto) =>
      put<{ success: boolean; data: Cliente }>(`/clientes/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clientes"] });
      qc.invalidateQueries({ queryKey: ["clientes", id] });
    },
    onError: (error: AxiosError<any>) => {
      throw new Error(
        error.response?.data?.error?.message || "Error updating client"
      );
    },
  });
}

export function useDeleteCliente() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      del<{ success: boolean; data: any }>(`/clientes/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clientes"] });
    },
    onError: (error: AxiosError<any>) => {
      throw new Error(
        error.response?.data?.error?.message || "Error deleting client"
      );
    },
  });
}
