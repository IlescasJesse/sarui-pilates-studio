"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { scaleIn } from "@/lib/animations";
import {
  useCreateTipoActividad,
  useUpdateTipoActividad,
  type TipoActividad,
} from "@/hooks/useTipoActividades";

const schema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  descripcion: z.string().optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Color hex inválido")
    .default("#254F40"),
});

type FormData = z.infer<typeof schema>;

interface TipoActividadFormProps {
  open: boolean;
  onClose: () => void;
  editando?: TipoActividad | null;
}

export function TipoActividadForm({ open, onClose, editando }: TipoActividadFormProps) {
  const createMutation = useCreateTipoActividad();
  const updateMutation = useUpdateTipoActividad();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { nombre: "", descripcion: "", color: "#254F40" },
  });

  useEffect(() => {
    reset(
      editando
        ? { nombre: editando.nombre, descripcion: editando.descripcion ?? "", color: editando.color ?? "#254F40" }
        : { nombre: "", descripcion: "", color: "#254F40" }
    );
  }, [editando, open, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      if (editando) {
        await updateMutation.mutateAsync({ id: editando.id, ...data, isActive: editando.isActive });
      } else {
        await createMutation.mutateAsync({ ...data, isActive: true });
      }
      onClose();
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  if (!open) return null;

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <motion.div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        className="relative z-10 bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4"
        variants={scaleIn}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        <h2 className="text-lg font-semibold text-[#254F40] mb-1">
          {editando ? "Editar actividad" : "Nueva actividad"}
        </h2>
        <p className="text-sm text-muted-foreground mb-5">
          Define el tipo de clase para el calendario
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre de la actividad
            </label>
            <Input {...register("nombre")} placeholder="Ej: Reformer Flow, Mat Barre..." />
            {errors.nombre && (
              <p className="text-xs text-destructive mt-1">{errors.nombre.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Color en el calendario
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                {...register("color")}
                className="w-10 h-10 rounded cursor-pointer border border-border"
              />
              <span className="text-sm text-muted-foreground font-mono">{watch("color")}</span>
            </div>
            {errors.color && (
              <p className="text-xs text-destructive mt-1">{errors.color.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción (opcional)
            </label>
            <textarea
              {...register("descripcion")}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none h-16 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Descripción breve..."
            />
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Guardando..." : editando ? "Actualizar" : "Crear actividad"}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
