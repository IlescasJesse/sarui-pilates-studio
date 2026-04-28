"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { get, post, put, del } from "@/lib/api-client";
import { AxiosError } from "axios";

// ── Types ────────────────────────────────────────────────────────────────────

export type InstructorSpecialty = "REFORMER" | "MAT" | "BARRE";

export interface Instructor {
  id: string;
  firstName: string;
  lastName: string;
  phone?: string;
  bio?: string;
  specialties: InstructorSpecialty[];
  avatarUrl?: string;
  createdAt: string;
  user: {
    email: string;
    isActive: boolean;
  };
  _count?: {
    classes: number;
  };
}

export interface CreateInstructorDto {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  bio?: string;
  specialties?: InstructorSpecialty[];
}

export interface UpdateInstructorDto {
  firstName?: string;
  lastName?: string;
  phone?: string;
  bio?: string;
  specialties?: InstructorSpecialty[];
}

// ── Query Hooks ──────────────────────────────────────────────────────────────

export function useInstructores() {
  return useQuery({
    queryKey: ["instructores"],
    queryFn: () =>
      get<{ success: boolean; data: Instructor[] }>("/instructores"),
    select: (res) => res.data,
  });
}

export function useInstructorById(id?: string) {
  return useQuery({
    queryKey: ["instructores", id],
    queryFn: () =>
      get<{ success: boolean; data: Instructor }>(`/instructores/${id}`),
    select: (res) => res.data,
    enabled: !!id,
  });
}

// ── Mutation Hooks ───────────────────────────────────────────────────────────

export function useCreateInstructor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateInstructorDto) =>
      post<{ success: boolean; data: any }>("/instructores", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["instructores"] });
    },
    onError: (error: AxiosError<any>) => {
      throw new Error(
        error.response?.data?.error?.message || "Error creating instructor"
      );
    },
  });
}

export function useUpdateInstructor(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateInstructorDto) =>
      put<{ success: boolean; data: Instructor }>(`/instructores/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["instructores"] });
      qc.invalidateQueries({ queryKey: ["instructores", id] });
    },
    onError: (error: AxiosError<any>) => {
      throw new Error(
        error.response?.data?.error?.message || "Error updating instructor"
      );
    },
  });
}

export function useDeleteInstructor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      del<{ success: boolean; data: any }>(`/instructores/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["instructores"] });
    },
    onError: (error: AxiosError<any>) => {
      throw new Error(
        error.response?.data?.error?.message || "Error deleting instructor"
      );
    },
  });
}
