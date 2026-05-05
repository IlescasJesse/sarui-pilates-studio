import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface PerfilData {
  id: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  perfil: {
    firstName: string;
    lastName: string;
    phone?: string;
    avatarUrl?: string;
    bio?: string;
    specialties?: string;
  } | null;
}

export function usePerfil() {
  return useQuery<PerfilData>({
    queryKey: ['perfil'],
    queryFn: async () => {
      const res = await apiClient.get('/perfil');
      return res.data.data;
    },
  });
}

export function useUpdatePerfil() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<{ firstName: string; lastName: string; phone: string; avatarUrl: string }>) =>
      apiClient.put('/perfil', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['perfil'] }),
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (data: { passwordActual: string; passwordNuevo: string }) =>
      apiClient.put('/perfil/password', data),
  });
}
