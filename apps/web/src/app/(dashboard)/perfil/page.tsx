"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { User, Lock, Users, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { usePerfil, useUpdatePerfil, useChangePassword } from "@/hooks/usePerfil";
import { useUsuarios, useCrearUsuario, useToggleUsuario, type CrearUsuarioData } from "@/hooks/useUsuarios";
import { useAuth } from "@/hooks/useAuth";

const perfilSchema = z.object({
  firstName: z.string().min(1, "Requerido"),
  lastName:  z.string().min(1, "Requerido"),
  phone:     z.string().optional(),
});

const passwordSchema = z.object({
  passwordActual: z.string().min(1, "Requerido"),
  passwordNuevo:  z.string().min(6, "Mínimo 6 caracteres"),
  confirmar:      z.string().min(1, "Requerido"),
}).refine((d) => d.passwordNuevo === d.confirmar, {
  message: "Las contraseñas no coinciden",
  path: ["confirmar"],
});

const crearUsuarioSchema = z.object({
  email:     z.string().email("Correo inválido"),
  password:  z.string().min(6, "Mínimo 6 caracteres"),
  role:      z.enum(["ADMIN", "INSTRUCTOR", "RECEPCIONISTA"]),
  firstName: z.string().min(1, "Requerido"),
  lastName:  z.string().min(1, "Requerido"),
  phone:     z.string().optional(),
});

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  INSTRUCTOR: "Instructor",
  RECEPCIONISTA: "Recepcionista",
  CLIENT: "Cliente",
};

const ROLE_COLORS: Record<string, string> = {
  ADMIN: "bg-[#254F40]/10 text-[#254F40] border-[#254F40]/20",
  INSTRUCTOR: "bg-blue-50 text-blue-700 border-blue-200",
  RECEPCIONISTA: "bg-yellow-50 text-yellow-700 border-yellow-200",
  CLIENT: "bg-gray-50 text-gray-600 border-gray-200",
};

type Tab = "perfil" | "seguridad" | "equipo";

export default function PerfilPage() {
  const { user } = useAuth();
  const { data: perfil, isLoading } = usePerfil();
  const updatePerfil  = useUpdatePerfil();
  const changePass    = useChangePassword();
  const isAdmin       = user?.role === "admin";

  const [tab, setTab] = useState<Tab>("perfil");
  const [crearOpen, setCrearOpen] = useState(false);

  const perfilForm = useForm({ resolver: zodResolver(perfilSchema), values: {
    firstName: perfil?.perfil?.firstName ?? "",
    lastName:  perfil?.perfil?.lastName  ?? "",
    phone:     perfil?.perfil?.phone     ?? "",
  }});

  const passForm = useForm({ resolver: zodResolver(passwordSchema) });
  const crearForm = useForm<CrearUsuarioData>({ resolver: zodResolver(crearUsuarioSchema) });

  const onSavePerfil = perfilForm.handleSubmit(async (data) => {
    try {
      await updatePerfil.mutateAsync(data);
      toast.success("Perfil actualizado");
    } catch { toast.error("Error al guardar"); }
  });

  const onChangePass = passForm.handleSubmit(async ({ passwordActual, passwordNuevo }) => {
    try {
      await changePass.mutateAsync({ passwordActual, passwordNuevo });
      toast.success("Contraseña actualizada");
      passForm.reset();
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message ?? "Error al cambiar contraseña";
      toast.error(msg);
    }
  });

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin w-6 h-6 text-[#254F40]" /></div>;
  }

  const tabs: { id: Tab; label: string; icon: React.ElementType; adminOnly?: boolean }[] = [
    { id: "perfil",    label: "Mi perfil",   icon: User },
    { id: "seguridad", label: "Seguridad",   icon: Lock },
    { id: "equipo",    label: "Equipo",      icon: Users, adminOnly: true },
  ];

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-[#254F40]/10">
          <User className="w-5 h-5 text-[#254F40]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#254F40]">Mi cuenta</h1>
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            {perfil?.email}
            <Badge className={`text-xs border ${ROLE_COLORS[perfil?.role ?? ""] ?? ""}`} variant="outline">
              {ROLE_LABELS[perfil?.role ?? ""] ?? perfil?.role}
            </Badge>
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {tabs.filter(t => !t.adminOnly || isAdmin).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === id
                ? "border-[#254F40] text-[#254F40]"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {/* TAB: Perfil */}
      {tab === "perfil" && (
        <Card>
          <CardHeader><CardTitle className="text-base">Información personal</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={onSavePerfil} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Nombre</label>
                  <Input {...perfilForm.register("firstName")} placeholder="Nombre" />
                  {perfilForm.formState.errors.firstName && (
                    <p className="text-xs text-red-500">{perfilForm.formState.errors.firstName.message}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Apellido</label>
                  <Input {...perfilForm.register("lastName")} placeholder="Apellido" />
                  {perfilForm.formState.errors.lastName && (
                    <p className="text-xs text-red-500">{perfilForm.formState.errors.lastName.message}</p>
                  )}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Teléfono</label>
                <Input {...perfilForm.register("phone")} placeholder="Ej: 951 234 5678" />
              </div>
              <Button type="submit" disabled={updatePerfil.isPending} className="bg-[#254F40] hover:bg-[#254F40]/90">
                {updatePerfil.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Guardar cambios
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* TAB: Seguridad */}
      {tab === "seguridad" && (
        <Card>
          <CardHeader><CardTitle className="text-base">Cambiar contraseña</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={onChangePass} className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">Contraseña actual</label>
                <Input type="password" {...passForm.register("passwordActual")} />
                {passForm.formState.errors.passwordActual && (
                  <p className="text-xs text-red-500">{passForm.formState.errors.passwordActual.message as string}</p>
                )}
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Nueva contraseña</label>
                <Input type="password" {...passForm.register("passwordNuevo")} />
                {passForm.formState.errors.passwordNuevo && (
                  <p className="text-xs text-red-500">{passForm.formState.errors.passwordNuevo.message as string}</p>
                )}
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Confirmar nueva contraseña</label>
                <Input type="password" {...passForm.register("confirmar")} />
                {passForm.formState.errors.confirmar && (
                  <p className="text-xs text-red-500">{passForm.formState.errors.confirmar.message as string}</p>
                )}
              </div>
              <Button type="submit" disabled={changePass.isPending} className="bg-[#254F40] hover:bg-[#254F40]/90">
                {changePass.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Actualizar contraseña
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* TAB: Equipo (solo Admin) */}
      {tab === "equipo" && isAdmin && (
        <EquipoTab crearOpen={crearOpen} setCrearOpen={setCrearOpen} crearForm={crearForm} />
      )}
    </div>
  );
}

// ── Componente Equipo ────────────────────────────────────────
function EquipoTab({ crearOpen, setCrearOpen, crearForm }: {
  crearOpen: boolean;
  setCrearOpen: (v: boolean) => void;
  crearForm: ReturnType<typeof useForm<CrearUsuarioData>>;
}) {
  const { data: usuarios, isLoading } = useUsuarios();
  const crearUsuario = useCrearUsuario();
  const toggleUsuario = useToggleUsuario();

  const onCrear = crearForm.handleSubmit(async (data) => {
    try {
      await crearUsuario.mutateAsync(data);
      toast.success("Usuario creado exitosamente");
      setCrearOpen(false);
      crearForm.reset();
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message ?? "Error al crear usuario";
      toast.error(msg);
    }
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-muted-foreground">Usuarios del sistema ({usuarios?.length ?? 0})</h2>
        <Button onClick={() => setCrearOpen(true)} size="sm" className="bg-[#254F40] hover:bg-[#254F40]/90">
          <Users className="w-4 h-4 mr-2" /> Nuevo usuario
        </Button>
      </div>

      {/* Tabla de usuarios */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center p-8"><Loader2 className="animate-spin w-5 h-5 text-[#254F40]" /></div>
          ) : (
            <table className="sarui-table w-full">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Correo</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {(usuarios ?? []).map((u) => (
                  <tr key={u.id}>
                    <td className="font-medium">{u.firstName} {u.lastName}</td>
                    <td className="text-muted-foreground text-sm">{u.email}</td>
                    <td>
                      <Badge className={`text-xs border ${ROLE_COLORS[u.role] ?? ""}`} variant="outline">
                        {ROLE_LABELS[u.role]}
                      </Badge>
                    </td>
                    <td>
                      <span className={`text-xs font-medium ${u.isActive ? "text-emerald-600" : "text-red-500"}`}>
                        {u.isActive ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td>
                      <Button
                        variant="ghost" size="sm"
                        disabled={toggleUsuario.isPending}
                        onClick={() => toggleUsuario.mutate({ id: u.id, isActive: !u.isActive })}
                        className="text-xs"
                      >
                        {u.isActive ? "Desactivar" : "Activar"}
                      </Button>
                    </td>
                  </tr>
                ))}
                {!isLoading && (usuarios ?? []).length === 0 && (
                  <tr><td colSpan={5} className="text-center py-8 text-muted-foreground text-sm">Sin usuarios registrados</td></tr>
                )}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Dialog crear usuario */}
      {crearOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-semibold text-[#254F40]">Nuevo usuario</h3>
            <form onSubmit={onCrear} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Nombre</label>
                  <Input {...crearForm.register("firstName")} placeholder="Nombre" />
                  {crearForm.formState.errors.firstName && <p className="text-xs text-red-500">{crearForm.formState.errors.firstName.message}</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Apellido</label>
                  <Input {...crearForm.register("lastName")} placeholder="Apellido" />
                  {crearForm.formState.errors.lastName && <p className="text-xs text-red-500">{crearForm.formState.errors.lastName.message}</p>}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Correo electrónico</label>
                <Input type="email" {...crearForm.register("email")} placeholder="correo@ejemplo.com" />
                {crearForm.formState.errors.email && <p className="text-xs text-red-500">{crearForm.formState.errors.email.message}</p>}
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Contraseña temporal</label>
                <Input type="password" {...crearForm.register("password")} placeholder="Mínimo 6 caracteres" />
                {crearForm.formState.errors.password && <p className="text-xs text-red-500">{crearForm.formState.errors.password.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Teléfono</label>
                  <Input {...crearForm.register("phone")} placeholder="Opcional" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Rol</label>
                  <select
                    {...crearForm.register("role")}
                    className="w-full px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Seleccionar rol</option>
                    <option value="ADMIN">Admin</option>
                    <option value="INSTRUCTOR">Instructor</option>
                    <option value="RECEPCIONISTA">Recepcionista</option>
                  </select>
                  {crearForm.formState.errors.role && <p className="text-xs text-red-500">{crearForm.formState.errors.role.message}</p>}
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => { setCrearOpen(false); crearForm.reset(); }}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={crearUsuario.isPending} className="flex-1 bg-[#254F40] hover:bg-[#254F40]/90">
                  {crearUsuario.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Crear usuario
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
