"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { scaleIn } from "@/lib/animations";
import { useTipoActividades } from "@/hooks/useTipoActividades";
import {
  useCreateTipoMembresia,
  useUpdateTipoMembresia,
  type TipoMembresia,
} from "@/hooks/useTipoMembresias";

const DURACIONES = [
  { dias: 30,  label: "Mensual (30 días)" },
  { dias: 60,  label: "Bimestral (60 días)" },
  { dias: 90,  label: "Trimestral (90 días)" },
  { dias: 180, label: "Semestral (180 días)" },
  { dias: 365, label: "Anual (365 días)" },
];

const schema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  descripcion: z.string().optional(),
  duracionDias: z.coerce.number().int().min(1, "La duración es requerida"),
  isActive: z.boolean().default(true),
});

type FormData = z.infer<typeof schema>;

interface TipoMembresiaFormProps {
  open: boolean;
  onClose: () => void;
  editando?: TipoMembresia | null;
}

export function TipoMembresiaForm({ open, onClose, editando }: TipoMembresiaFormProps) {
  const { data: actividades = [] } = useTipoActividades();
  const createMutation = useCreateTipoMembresia();
  const updateMutation = useUpdateTipoMembresia();
  const [actividadIds, setActividadIds] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { nombre: "", descripcion: "", duracionDias: 30, isActive: true },
  });

  useEffect(() => {
    if (editando) {
      reset({
        nombre: editando.nombre,
        descripcion: editando.descripcion ?? "",
        duracionDias: editando.duracionDias,
        isActive: editando.isActive,
      });
      setActividadIds(editando.actividades.map((a) => a.tipoActividadId));
    } else {
      reset({ nombre: "", descripcion: "", duracionDias: 30, isActive: true });
      setActividadIds([]);
    }
  }, [editando, open, reset]);

  const toggleActividad = (id: string) => {
    setActividadIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const onSubmit = async (data: FormData) => {
    try {
      const payload = { ...data, actividadIds };
      if (editando) {
        await updateMutation.mutateAsync({ id: editando.id, ...payload });
      } else {
        await createMutation.mutateAsync(payload);
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
        className="relative z-10 bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto"
        variants={scaleIn}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        <h2 className="text-lg font-semibold text-[#254F40] mb-1">
          {editando ? "Editar membresía" : "Nueva membresía"}
        </h2>
        <p className="text-sm text-muted-foreground mb-5">
          Define el tipo de membresía por tiempo
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
            <Input {...register("nombre")} placeholder="Ej: Mensual Reformer, Trimestral Mix..." />
            {errors.nombre && (
              <p className="text-xs text-destructive mt-1">{errors.nombre.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Duración</label>
            <select
              {...register("duracionDias")}
              className="w-full h-10 px-3 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background"
            >
              {DURACIONES.map((d) => (
                <option key={d.dias} value={d.dias}>{d.label}</option>
              ))}
            </select>
            {errors.duracionDias && (
              <p className="text-xs text-destructive mt-1">{errors.duracionDias.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipos de actividad incluidos
            </label>
            {actividades.length === 0 ? (
              <p className="text-xs text-amber-600">
                Crea tipos de actividad primero en la pestaña correspondiente.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {actividades.filter((a) => a.isActive).map((act) => {
                  const selected = actividadIds.includes(act.id);
                  return (
                    <button
                      key={act.id}
                      type="button"
                      onClick={() => toggleActividad(act.id)}
                      className={`relative flex items-center gap-2 px-3 py-2 rounded-lg border-2 text-sm text-left transition-all ${
                        selected
                          ? "border-[#254F40] bg-[#254F40]/5 text-[#254F40]"
                          : "border-border text-muted-foreground hover:border-[#254F40]/40"
                      }`}
                    >
                      {act.color && (
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: act.color }} />
                      )}
                      <span className="flex-1 truncate">{act.nombre}</span>
                      {selected && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
            {actividadIds.length === 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                Sin actividades seleccionadas — la membresía cubre todas.
              </p>
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
              {isPending ? "Guardando..." : editando ? "Actualizar" : "Crear membresía"}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
