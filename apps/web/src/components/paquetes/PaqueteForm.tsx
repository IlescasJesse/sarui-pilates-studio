"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useCreatePaquete,
  useUpdatePaquete,
  usePaqueteById,
} from "@/hooks/usePaquetes";
import { useTipoActividades } from "@/hooks/useTipoActividades";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// ── Esquema Zod ──────────────────────────────────────────────────────────────

const paqueteSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  tipoActividadId: z.string().min(1, "Selecciona un tipo de actividad"),
  sessions: z.coerce.number().int().min(1, "Mínimo 1 sesión"),
  price: z.coerce.number().positive("El precio debe ser mayor a 0"),
  validityDays: z.coerce.number().int().min(1, "Mínimo 1 día de vigencia"),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

type PaqueteFormData = z.infer<typeof paqueteSchema>;

// ── Props ────────────────────────────────────────────────────────────────────

interface PaqueteFormProps {
  isOpen: boolean;
  onClose: () => void;
  paqueteId?: string;
  onSuccess?: () => void;
}

// ── Componente ───────────────────────────────────────────────────────────────

export function PaqueteForm({ isOpen, onClose, paqueteId, onSuccess }: PaqueteFormProps) {
  const isEditMode = !!paqueteId;
  const { data: existingPaquete } = usePaqueteById(paqueteId);
  const createMutation = useCreatePaquete();
  const updateMutation = useUpdatePaquete(paqueteId ?? "");

  // Solo actividades POR_PAQUETE
  const { data: tiposActividad = [] } = useTipoActividades();
  const actividadesPorPaquete = tiposActividad.filter(
    (t) => t.modalidad === "POR_PAQUETE" && t.isActive
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<PaqueteFormData>({
    resolver: zodResolver(paqueteSchema),
    defaultValues: {
      name: "",
      tipoActividadId: "",
      sessions: 1,
      price: 0,
      validityDays: 30,
      description: "",
      isActive: true,
    },
  });

  useEffect(() => {
    if (isEditMode && existingPaquete) {
      reset({
        name: existingPaquete.name,
        tipoActividadId: existingPaquete.tipoActividadId ?? "",
        sessions: existingPaquete.sessions,
        price: existingPaquete.price,
        validityDays: existingPaquete.validityDays,
        description: existingPaquete.description ?? "",
        isActive: existingPaquete.isActive,
      });
    } else if (!isEditMode) {
      reset({
        name: "",
        tipoActividadId: "",
        sessions: 1,
        price: 0,
        validityDays: 30,
        description: "",
        isActive: true,
      });
    }
  }, [isEditMode, existingPaquete, reset, isOpen]);

  const onSubmit = async (data: PaqueteFormData) => {
    try {
      if (isEditMode) {
        await updateMutation.mutateAsync(data);
      } else {
        await createMutation.mutateAsync(data);
      }
      reset();
      onClose();
      onSuccess?.();
    } catch (err) {
      // el hook lanza el mensaje del servidor
      alert((err as Error).message);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#254F40]">
            {isEditMode ? "Editar paquete" : "Nuevo paquete"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-1">
          {/* Tipo de actividad */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de actividad
            </label>
            <select
              {...register("tipoActividadId")}
              className="w-full h-10 px-3 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background"
            >
              <option value="">Selecciona una actividad...</option>
              {actividadesPorPaquete.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nombre}
                </option>
              ))}
            </select>
            {errors.tipoActividadId && (
              <p className="text-xs text-destructive mt-1">{errors.tipoActividadId.message}</p>
            )}
            {actividadesPorPaquete.length === 0 && (
              <p className="text-xs text-amber-600 mt-1">
                No hay actividades "por paquete" registradas. Créalas primero en la pestaña Tipos de Actividad.
              </p>
            )}
          </div>

          {/* Nombre del paquete */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del paquete
            </label>
            <Input
              placeholder="Ej: 10 Sesiones Reformer Flow"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-xs text-destructive mt-1">{errors.name.message}</p>
            )}
          </div>

          {/* Sesiones y Precio */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sesiones
              </label>
              <Input type="number" min="1" {...register("sessions")} />
              {errors.sessions && (
                <p className="text-xs text-destructive mt-1">{errors.sessions.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Precio (MXN)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                <Input type="number" step="0.01" min="0" className="pl-7" {...register("price")} />
              </div>
              {errors.price && (
                <p className="text-xs text-destructive mt-1">{errors.price.message}</p>
              )}
            </div>
          </div>

          {/* Vigencia */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vigencia (días desde activación)
            </label>
            <Input type="number" min="1" {...register("validityDays")} />
            {errors.validityDays && (
              <p className="text-xs text-destructive mt-1">{errors.validityDays.message}</p>
            )}
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción (opcional)
            </label>
            <textarea
              className="w-full h-16 px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none bg-background"
              placeholder="Descripción breve del paquete..."
              {...register("description")}
            />
          </div>

          {/* Activo */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              {...register("isActive")}
              className="w-4 h-4 rounded border-input accent-[#254F40]"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
              Paquete activo
            </label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Guardando..." : isEditMode ? "Actualizar" : "Crear paquete"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
