"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { get, post, put, del } from "@/lib/api-client";
import { AxiosError } from "axios";

// ── Types ────────────────────────────────────────────────────────────────────

export type MembershipStatus = "ACTIVE" | "EXPIRED" | "EXHAUSTED" | "SUSPENDED";
export type PaymentMethod = "CASH" | "CARD" | "TRANSFER" | "OTHER";

export interface Cliente {
  id: string;
  firstName: string;
  lastName: string;
}

export interface Package {
  id: string;
  name: string;
  sessions: number;
  price: number;
}

export interface Membresia {
  id: string;
  clientId: string;
  packageId: string;
  startDate: string;
  expiresAt: string;
  totalSessions: number;
  sessionsUsed: number;
  sessionsRemaining: number;
  status: MembershipStatus;
  pricePaid?: number;
  paymentMethod?: PaymentMethod;
  notes?: string;
  createdAt: string;
  client: Cliente;
  package: Package;
}

export interface CreateMembresia {
  clientId: string;
  packageId: string;
  startDate: string;
  paymentMethod?: PaymentMethod;
  pricePaid?: number;
  notes?: string;
}

// ── Query Hooks ──────────────────────────────────────────────────────────────

export function useMembresias(params?: {
  clientId?: string;
  status?: MembershipStatus;
}) {
  return useQuery({
    queryKey: ["membresias", params],
    queryFn: () =>
      get<{ success: boolean; data: Membresia[] }>("/membresias", params),
    select: (res) => res.data,
  });
}

export function useMembresiaById(id?: string) {
  return useQuery({
    queryKey: ["membresias", id],
    queryFn: () =>
      get<{ success: boolean; data: Membresia }>(`/membresias/${id}`),
    select: (res) => res.data,
    enabled: !!id,
  });
}

// ── Mutation Hooks ───────────────────────────────────────────────────────────

export function useCreateMembresia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateMembresia) =>
      post<{ success: boolean; data: any }>("/membresias", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["membresias"] });
    },
    onError: (error: AxiosError<any>) => {
      throw new Error(
        error.response?.data?.error?.message || "Error creating membership"
      );
    },
  });
}

export function useUpdateMembresia(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { status?: MembershipStatus; notes?: string }) =>
      put<{ success: boolean; data: Membresia }>(`/membresias/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["membresias"] });
      qc.invalidateQueries({ queryKey: ["membresias", id] });
    },
    onError: (error: AxiosError<any>) => {
      throw new Error(
        error.response?.data?.error?.message || "Error updating membership"
      );
    },
  });
}

export function useSuspendMembresia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      del<{ success: boolean; data: any }>(`/membresias/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["membresias"] });
    },
    onError: (error: AxiosError<any>) => {
      throw new Error(
        error.response?.data?.error?.message || "Error suspending membership"
      );
    },
  });
}
