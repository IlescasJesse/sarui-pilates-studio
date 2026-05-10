"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api-client";
import { UserCog, Plus, Shield, Loader2, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

const ROLES = ["ADMIN", "INSTRUCTOR", "RECEPCIONISTA", "CLIENT"] as const;

const userSchema = z.object({
  email: z.string().email("Correo inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
  role: z.enum(ROLES),
  firstName: z.string().min(1, "Requerido"),
  lastName: z.string().min(1, "Requerido"),
  phone: z.string().optional(),
});

type UserForm = z.infer<typeof userSchema>;

interface Usuario {
  id: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  firstName?: string;
  lastName?: string;
  phone?: string | null;
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrador",
  INSTRUCTOR: "Instructor",
  RECEPCIONISTA: "Recepcionista",
  CLIENT: "Cliente",
};

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<UserForm>({
    resolver: zodResolver(userSchema),
    defaultValues: { role: "INSTRUCTOR", phone: "" },
  });

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/usuarios");
      setUsuarios(res.data?.data ?? []);
    } catch {
      toast.error("Error al cargar usuarios");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const onSubmit = async (data: UserForm) => {
    setSubmitting(true);
    try {
      await apiClient.post("/usuarios", data);
      toast.success("Usuario creado");
      setOpen(false);
      form.reset();
      load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ?? "Error al crear";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (id: string, current: boolean) => {
    try {
      await apiClient.patch(`/usuarios/${id}/activar`, { isActive: !current });
      load();
    } catch {
      toast.error("Error al actualizar");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#254F40]/10">
            <UserCog className="w-5 h-5 text-[#254F40]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#254F40]">Usuarios</h1>
            <p className="text-sm text-muted-foreground">Gestión de usuarios del sistema</p>
          </div>
        </div>
        <Button onClick={() => setOpen(true)} className="bg-[#254F40] hover:bg-[#254F40]/90">
          <Plus className="w-4 h-4 mr-2" /> Nuevo Usuario
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Crear usuario</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Nombre</label>
                <Input {...form.register("firstName")} placeholder="Nombre" />
                {form.formState.errors.firstName && <p className="text-xs text-red-500">{form.formState.errors.firstName.message}</p>}
              </div>
              <div>
                <label className="text-sm font-medium">Apellido</label>
                <Input {...form.register("lastName")} placeholder="Apellido" />
                {form.formState.errors.lastName && <p className="text-xs text-red-500">{form.formState.errors.lastName.message}</p>}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Correo</label>
              <Input type="email" {...form.register("email")} placeholder="correo@ejemplo.com" />
              {form.formState.errors.email && <p className="text-xs text-red-500">{form.formState.errors.email.message}</p>}
            </div>
            <div>
              <label className="text-sm font-medium">Contraseña</label>
              <Input type="password" {...form.register("password")} placeholder="••••••" />
              {form.formState.errors.password && <p className="text-xs text-red-500">{form.formState.errors.password.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Rol</label>
                <select {...form.register("role")} className="w-full border rounded-md px-3 py-2 text-sm">
                  {ROLES.map((r) => (
                    <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Teléfono</label>
                <Input {...form.register("phone")} placeholder="Opcional" />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={submitting} className="bg-[#254F40] hover:bg-[#254F40]/90">
                {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Crear
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-[#254F40]/50" />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#254F40]/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#254F40]/10 bg-[#254F40]/5">
                <th className="text-left px-4 py-3 font-medium text-[#254F40]">Nombre</th>
                <th className="text-left px-4 py-3 font-medium text-[#254F40]">Correo</th>
                <th className="text-left px-4 py-3 font-medium text-[#254F40]">Rol</th>
                <th className="text-left px-4 py-3 font-medium text-[#254F40]">Estado</th>
                <th className="text-right px-4 py-3 font-medium text-[#254F40]">Acción</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id} className="border-b border-[#254F40]/5 hover:bg-[#254F40]/[0.02]">
                  <td className="px-4 py-3 font-medium text-[#254F40]">
                    {u.firstName ? `${u.firstName} ${u.lastName ?? ""}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-[#254F40]/10 text-[#254F40]">
                      <Shield className="w-3 h-3" />
                      {ROLE_LABELS[u.role] ?? u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {u.isActive ? (
                      <span className="text-green-600 text-xs flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Activo</span>
                    ) : (
                      <span className="text-red-500 text-xs flex items-center gap-1"><XCircle className="w-3 h-3" /> Inactivo</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => toggleActive(u.id, u.isActive)}
                      className="text-xs text-[#254F40]/60 hover:text-[#254F40] underline"
                    >
                      {u.isActive ? "Desactivar" : "Activar"}
                    </button>
                  </td>
                </tr>
              ))}
              {usuarios.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-muted-foreground">Sin usuarios</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
