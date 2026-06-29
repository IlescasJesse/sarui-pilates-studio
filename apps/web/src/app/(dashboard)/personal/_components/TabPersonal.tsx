"use client";

import { useState } from "react";
import { Plus, MoreVertical, Edit, Trash2, Loader2, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useStaff,
  usePuestos,
  useCrearStaff,
  useEditarStaff,
  useEliminarStaff,
  useCrearPuesto,
  useEliminarPuesto,
  type StaffProfile,
  type Puesto,
} from "@/hooks/usePersonal";
import { useAuth } from "@/hooks/useAuth";

function fmt(n: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);
}

// ─── Types ─────────────────────────────────────────────────────────────────────

interface StaffFormData {
  email: string;
  password: string;
  role: "ADMIN" | "INSTRUCTOR" | "RECEPCIONISTA";
  nombre: string;
  apellido: string;
  telefono: string;
  puestoId: string;
  fechaIngreso: string;
  activo: boolean;
}

interface PuestoFormData {
  nombre: string;
  salarioSemanal: string;
}

const defaultStaffForm: StaffFormData = {
  email: "",
  password: "",
  role: "RECEPCIONISTA",
  nombre: "",
  apellido: "",
  telefono: "",
  puestoId: "",
  fechaIngreso: new Date().toISOString().split("T")[0],
  activo: true,
};

const defaultPuestoForm: PuestoFormData = {
  nombre: "",
  salarioSemanal: "",
};

// ─── Skeleton Rows ─────────────────────────────────────────────────────────────

function SkeletonRows() {
  return (
    <>
      {[1, 2, 3].map((i) => (
        <tr key={i}>
          <td colSpan={5}>
            <div className="h-10 w-full animate-pulse bg-muted rounded my-1" />
          </td>
        </tr>
      ))}
    </>
  );
}

// ─── Dialog: Puesto ────────────────────────────────────────────────────────────

interface PuestoDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (puesto: Puesto) => void;
}

function PuestoDialog({ open, onClose, onCreated }: PuestoDialogProps) {
  const [form, setForm] = useState<PuestoFormData>(defaultPuestoForm);
  const [errors, setErrors] = useState<Partial<PuestoFormData>>({});
  const crearPuesto = useCrearPuesto();

  const validate = () => {
    const e: Partial<PuestoFormData> = {};
    if (!form.nombre.trim()) e.nombre = "Requerido";
    const sal = parseFloat(form.salarioSemanal);
    if (isNaN(sal) || sal <= 0) e.salarioSemanal = "Debe ser mayor a 0";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    try {
      const res = await crearPuesto.mutateAsync({
        nombre: form.nombre.trim(),
        salarioSemanal: parseFloat(form.salarioSemanal),
      });
      toast.success("Puesto creado");
      onCreated?.(res.data.data as Puesto);
      setForm(defaultPuestoForm);
      onClose();
    } catch {
      toast.error("No se pudo crear el puesto");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Nuevo puesto</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1">
            <label className="text-sm font-medium">Nombre del puesto</label>
            <Input
              value={form.nombre}
              onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
              placeholder="Ej: Instructor"
            />
            {errors.nombre && <p className="text-xs text-destructive">{errors.nombre}</p>}
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Salario semanal (MXN)</label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={form.salarioSemanal}
              onChange={(e) => setForm((f) => ({ ...f, salarioSemanal: e.target.value }))}
              placeholder="0.00"
            />
            {errors.salarioSemanal && <p className="text-xs text-destructive">{errors.salarioSemanal}</p>}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button
            onClick={handleSubmit}
            disabled={crearPuesto.isPending}
            className="bg-[#254F40] hover:bg-[#254F40]/90"
          >
            {crearPuesto.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Crear puesto
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Dialog: Empleado ──────────────────────────────────────────────────────────

interface StaffDialogProps {
  open: boolean;
  onClose: () => void;
  staff?: StaffProfile;
  puestos: Puesto[];
}

function StaffDialog({ open, onClose, staff, puestos: initialPuestos }: StaffDialogProps) {
  const { data: freshPuestos } = usePuestos();
  const puestos = freshPuestos ?? initialPuestos;

  const [form, setForm] = useState<StaffFormData>(
    staff
      ? {
          email: staff.user?.email ?? "",
          password: "",
          role: (staff.user?.role ?? "RECEPCIONISTA") as StaffFormData["role"],
          nombre: staff.nombre,
          apellido: staff.apellido,
          telefono: staff.telefono ?? "",
          puestoId: staff.puestoId ?? "",
          fechaIngreso: staff.fechaIngreso.split("T")[0],
          activo: staff.activo,
        }
      : defaultStaffForm
  );
  const [errors, setErrors] = useState<Partial<Record<keyof StaffFormData, string>>>({});
  const [showInlinePuesto, setShowInlinePuesto] = useState(false);
  const [inlinePuesto, setInlinePuesto] = useState<PuestoFormData>(defaultPuestoForm);
  const [inlinePuestoErrors, setInlinePuestoErrors] = useState<Partial<PuestoFormData>>({});

  const crearStaff = useCrearStaff();
  const editarStaff = useEditarStaff();
  const crearPuesto = useCrearPuesto();

  const isEditing = !!staff;

  const validate = () => {
    const e: Partial<Record<keyof StaffFormData, string>> = {};
    if (!isEditing) {
      if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Email válido requerido";
      if (form.password.length < 6) e.password = "Mínimo 6 caracteres";
    }
    if (!form.nombre.trim()) e.nombre = "Requerido";
    if (!form.apellido.trim()) e.apellido = "Requerido";
    if (!form.fechaIngreso) e.fechaIngreso = "Requerido";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateInlinePuesto = () => {
    const e: Partial<PuestoFormData> = {};
    if (!inlinePuesto.nombre.trim()) e.nombre = "Requerido";
    const sal = parseFloat(inlinePuesto.salarioSemanal);
    if (isNaN(sal) || sal <= 0) e.salarioSemanal = "Debe ser mayor a 0";
    setInlinePuestoErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCrearPuestoInline = async () => {
    if (!validateInlinePuesto()) return;
    try {
      const res = await crearPuesto.mutateAsync({
        nombre: inlinePuesto.nombre.trim(),
        salarioSemanal: parseFloat(inlinePuesto.salarioSemanal),
      });
      const nuevoPuesto = res.data.data as Puesto;
      setForm((f) => ({ ...f, puestoId: nuevoPuesto.id }));
      setShowInlinePuesto(false);
      setInlinePuesto(defaultPuestoForm);
      toast.success("Puesto creado y seleccionado");
    } catch {
      toast.error("No se pudo crear el puesto");
    }
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    const payload = {
      ...(isEditing ? {} : {
        email: form.email.trim(),
        password: form.password,
        role: form.role,
      }),
      nombre: form.nombre.trim(),
      apellido: form.apellido.trim(),
      telefono: form.telefono.trim() || undefined,
      puestoId: form.puestoId || undefined,
      fechaIngreso: form.fechaIngreso,
      activo: form.activo,
    };
    try {
      if (isEditing) {
        await editarStaff.mutateAsync({ id: staff.id, data: payload });
        toast.success("Empleado actualizado");
      } else {
        await crearStaff.mutateAsync(payload as Parameters<typeof crearStaff.mutateAsync>[0]);
        toast.success("Empleado agregado");
      }
      onClose();
    } catch {
      toast.error("No se pudo guardar el empleado");
    }
  };

  const isPending = crearStaff.isPending || editarStaff.isPending;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar empleado" : "Agregar empleado"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {!isEditing && (
            <>
              <div className="space-y-1">
                <label className="text-sm font-medium">Email (acceso al sistema)</label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="empleado@sarui.mx"
                />
                {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Contraseña</label>
                  <Input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                    placeholder="Mínimo 6 caracteres"
                  />
                  {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Rol</label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as StaffFormData["role"] }))}
                    className="w-full px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="RECEPCIONISTA">Recepcionista</option>
                    <option value="INSTRUCTOR">Instructor</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
              </div>
            </>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">Nombre</label>
              <Input
                value={form.nombre}
                onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                placeholder="Nombre"
              />
              {errors.nombre && <p className="text-xs text-destructive">{errors.nombre}</p>}
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Apellido</label>
              <Input
                value={form.apellido}
                onChange={(e) => setForm((f) => ({ ...f, apellido: e.target.value }))}
                placeholder="Apellido"
              />
              {errors.apellido && <p className="text-xs text-destructive">{errors.apellido}</p>}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Teléfono (opcional)</label>
            <Input
              value={form.telefono}
              onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))}
              placeholder="+52 55 0000 0000"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Puesto</label>
            <select
              value={form.puestoId}
              onChange={(e) => {
                if (e.target.value === "__nuevo__") {
                  setShowInlinePuesto(true);
                } else {
                  setForm((f) => ({ ...f, puestoId: e.target.value }));
                }
              }}
              className="w-full px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Sin puesto asignado</option>
              {puestos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre} — {fmt(p.salarioSemanal)}/sem
                </option>
              ))}
              <option value="__nuevo__">+ Crear puesto nuevo</option>
            </select>
          </div>

          {/* Inline puesto form */}
          {showInlinePuesto && (
            <div className="border border-border rounded-lg p-3 space-y-2 bg-muted/30">
              <p className="text-sm font-medium text-[#254F40]">Nuevo puesto</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium">Nombre</label>
                  <Input
                    value={inlinePuesto.nombre}
                    onChange={(e) => setInlinePuesto((f) => ({ ...f, nombre: e.target.value }))}
                    placeholder="Ej: Recepcionista"
                    className="text-sm"
                  />
                  {inlinePuestoErrors.nombre && (
                    <p className="text-xs text-destructive">{inlinePuestoErrors.nombre}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">Salario semanal (MXN)</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={inlinePuesto.salarioSemanal}
                    onChange={(e) => setInlinePuesto((f) => ({ ...f, salarioSemanal: e.target.value }))}
                    placeholder="0.00"
                    className="text-sm"
                  />
                  {inlinePuestoErrors.salarioSemanal && (
                    <p className="text-xs text-destructive">{inlinePuestoErrors.salarioSemanal}</p>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowInlinePuesto(false);
                    setInlinePuesto(defaultPuestoForm);
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={crearPuesto.isPending}
                  onClick={handleCrearPuestoInline}
                  className="bg-[#254F40] hover:bg-[#254F40]/90"
                >
                  {crearPuesto.isPending && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                  Guardar puesto
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-sm font-medium">Fecha de ingreso</label>
            <Input
              type="date"
              value={form.fechaIngreso}
              onChange={(e) => setForm((f) => ({ ...f, fechaIngreso: e.target.value }))}
            />
            {errors.fechaIngreso && <p className="text-xs text-destructive">{errors.fechaIngreso}</p>}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="activo-check"
              checked={form.activo}
              onChange={(e) => setForm((f) => ({ ...f, activo: e.target.checked }))}
              className="w-4 h-4 rounded border-input"
            />
            <label htmlFor="activo-check" className="text-sm font-medium cursor-pointer">
              Empleado activo
            </label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending}
            className="bg-[#254F40] hover:bg-[#254F40]/90"
          >
            {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isEditing ? "Guardar cambios" : "Agregar empleado"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Dialog: Confirmar eliminar ────────────────────────────────────────────────

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  onConfirm: () => void;
  onClose: () => void;
  isPending?: boolean;
}

function ConfirmDialog({ open, title, description, onConfirm, onClose, isPending }: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">{description}</p>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Eliminar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── TabPersonal ───────────────────────────────────────────────────────────────

export function TabPersonal() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const { data: staff, isLoading: loadingStaff, isError: errorStaff } = useStaff();
  const { data: puestos = [] } = usePuestos();
  const eliminarStaff = useEliminarStaff();
  const eliminarPuesto = useEliminarPuesto();

  const [staffDialogOpen, setStaffDialogOpen] = useState(false);
  const [puestoDialogOpen, setPuestoDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffProfile | undefined>();
  const [confirmEliminarStaff, setConfirmEliminarStaff] = useState<StaffProfile | null>(null);
  const [confirmEliminarPuesto, setConfirmEliminarPuesto] = useState<Puesto | null>(null);

  const handleOpenAdd = () => {
    setEditingStaff(undefined);
    setStaffDialogOpen(true);
  };

  const handleOpenEdit = (s: StaffProfile) => {
    setEditingStaff(s);
    setStaffDialogOpen(true);
  };

  const handleEliminarStaff = async () => {
    if (!confirmEliminarStaff) return;
    try {
      await eliminarStaff.mutateAsync(confirmEliminarStaff.id);
      toast.success("Empleado eliminado");
    } catch {
      toast.error("No se pudo eliminar el empleado");
    } finally {
      setConfirmEliminarStaff(null);
    }
  };

  const handleEliminarPuesto = async () => {
    if (!confirmEliminarPuesto) return;
    try {
      await eliminarPuesto.mutateAsync(confirmEliminarPuesto.id);
      toast.success("Puesto eliminado");
    } catch {
      toast.error("No se pudo eliminar el puesto. Verifica que no haya empleados asignados.");
    } finally {
      setConfirmEliminarPuesto(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Actions bar */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {isAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPuestoDialogOpen(true)}
            >
              <Plus className="w-4 h-4 mr-1" /> Nuevo puesto
            </Button>
          )}
        </div>
        {isAdmin && (
          <Button
            onClick={handleOpenAdd}
            className="bg-[#254F40] hover:bg-[#254F40]/90"
          >
            <Plus className="w-4 h-4 mr-2" /> Agregar empleado
          </Button>
        )}
      </div>

      {/* Error state */}
      {errorStaff && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center">
          <p className="text-sm text-destructive font-medium">
            No se pudo cargar el personal. Verifica tu conexión e intenta de nuevo.
          </p>
        </div>
      )}

      {/* Table */}
      {!errorStaff && (
        <Card>
          <CardContent className="p-0">
            <table className="sarui-table w-full">
              <thead>
                <tr>
                  <th>Empleado</th>
                  <th>Puesto</th>
                  {isAdmin && <th className="text-right">Salario semanal</th>}
                  <th>Estado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {loadingStaff ? (
                  <SkeletonRows />
                ) : (staff ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 5 : 4} className="py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <UserRound className="w-10 h-10 text-muted-foreground/40" />
                        <div>
                          <p className="font-medium text-sm">Sin empleados registrados</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Agrega el primer perfil de empleado para empezar a registrar asistencia y calcular nómina.
                          </p>
                        </div>
                        {isAdmin && (
                          <Button
                            size="sm"
                            onClick={handleOpenAdd}
                            className="bg-[#254F40] hover:bg-[#254F40]/90"
                          >
                            Agregar empleado
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  (staff ?? []).map((s) => (
                    <tr
                      key={s.id}
                      className="cursor-pointer hover:bg-muted/30 transition-colors"
                      onClick={() => isAdmin && handleOpenEdit(s)}
                    >
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-[#254F40]/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-semibold text-[#254F40]">
                              {s.nombre[0]}{s.apellido[0]}
                            </span>
                          </div>
                          <span className="font-medium">{s.nombre} {s.apellido}</span>
                        </div>
                      </td>
                      <td className="text-sm text-muted-foreground">
                        {s.puesto?.nombre ?? "Sin puesto asignado"}
                      </td>
                      {isAdmin && (
                        <td className="text-right tabular-nums text-sm">
                          {s.puesto ? fmt(s.puesto.salarioSemanal) : "—"}
                        </td>
                      )}
                      <td>
                        {s.activo ? (
                          <Badge
                            variant="outline"
                            className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs"
                          >
                            Activo
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-muted text-muted-foreground border border-border text-xs"
                          >
                            Inactivo
                          </Badge>
                        )}
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        {isAdmin && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="w-8 h-8">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleOpenEdit(s)}>
                                <Edit className="w-4 h-4 mr-2" /> Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => setConfirmEliminarStaff(s)}
                              >
                                <Trash2 className="w-4 h-4 mr-2" /> Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Puestos list (admin only) */}
      {isAdmin && puestos.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            Puestos ({puestos.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {puestos.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-card text-sm"
              >
                <span>{p.nombre}</span>
                <span className="text-muted-foreground text-xs">— {fmt(p.salarioSemanal)}/sem</span>
                <button
                  onClick={() => setConfirmEliminarPuesto(p)}
                  className="ml-1 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dialogs */}
      <PuestoDialog
        open={puestoDialogOpen}
        onClose={() => setPuestoDialogOpen(false)}
      />

      <StaffDialog
        open={staffDialogOpen}
        onClose={() => {
          setStaffDialogOpen(false);
          setEditingStaff(undefined);
        }}
        staff={editingStaff}
        puestos={puestos}
      />

      <ConfirmDialog
        open={!!confirmEliminarStaff}
        title="Eliminar empleado"
        description={
          confirmEliminarStaff
            ? `¿Eliminar a ${confirmEliminarStaff.nombre} ${confirmEliminarStaff.apellido}? Esta acción no se puede deshacer.`
            : ""
        }
        onConfirm={handleEliminarStaff}
        onClose={() => setConfirmEliminarStaff(null)}
        isPending={eliminarStaff.isPending}
      />

      <ConfirmDialog
        open={!!confirmEliminarPuesto}
        title="Eliminar puesto"
        description={
          confirmEliminarPuesto
            ? `¿Eliminar "${confirmEliminarPuesto.nombre}"? Solo se puede eliminar si no hay empleados asignados.`
            : ""
        }
        onConfirm={handleEliminarPuesto}
        onClose={() => setConfirmEliminarPuesto(null)}
        isPending={eliminarPuesto.isPending}
      />
    </div>
  );
}
