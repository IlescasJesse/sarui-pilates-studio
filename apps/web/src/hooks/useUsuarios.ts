import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface UsuarioStaff {
  id: string;
  email: string;
  role: 'ADMIN' | 'INSTRUCTOR' | 'RECEPCIONISTA';
  isActive: boolean;
  createdAt: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  avatarUrl?: string | null;
}

export interface CrearUsuarioData {
  email: string;
  password: string;
  role: 'ADMIN' | 'INSTRUCTOR' | 'RECEPCIONISTA';
  firstName: string;
  lastName: string;
  phone?: string;
  bio?: string;
  specialties?: string[];
}

export function useUsuarios() {
  return useQuery<UsuarioStaff[]>({
    queryKey: ['usuarios'],
    queryFn: async () => {
      const res = await apiClient.get('/usuarios');
      return res.data.data;
    },
  });
}

export function useCrearUsuario() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CrearUsuarioData) => apiClient.post('/usuarios', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['usuarios'] });
      qc.invalidateQueries({ queryKey: ['instructores'] });
    },
  });
}

export function useToggleUsuario() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      apiClient.patch(`/usuarios/${id}/activar`, { isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['usuarios'] }),
  });
}
