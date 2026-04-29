"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fadeInUp, scaleIn } from "@/lib/animations";
import {
  useCreateTipoActividad,
  useUpdateTipoActividad,
  type TipoActividad,
} from "@/hooks/useTipoActividades";

// ── Esquema Zod ──────────────────────────────────────────────────────────────

const schema = z
  .object({
    nombre: z.string().min(1, "El nombre es requerido"),
    descripcion: z.string().optional(),
    modalidad: z.enum(["SESION_UNICA", "POR_PAQUETE"]),
    costo: z.coerce.number().min(0, "El costo no puede ser negativo").optional(),
    color: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/, "Color hex inválido")
      .default("#254F40"),
  })
  .refine(
    (d) => {
      if (d.modalidad === "SESION_UNICA") {
        return d.costo !== undefined && d.costo > 0;
      }
      return true;
    },
    { message: "El costo es requerido para sesión única", path: ["costo"] }
  );

type FormData = z.infer<typeof schema>;

// ── Props ────────────────────────────────────────────────────────────────────

interface TipoActividadFormProps {
  open: boolean;
  onClose: () => void;
  editando?: TipoActividad | null;
}

// ── Componente ───────────────────────────────────────────────────────────────

export function TipoActividadForm({ open, onClose, editando }: TipoActividadFormProps) {
  const createMutation = useCreateTipoActividad();
  const updateMutation = useUpdateTipoActividad();

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      nombre: "",
      descripcion: "",
      modalidad: "SESION_UNICA",
      costo: undefined,
      color: "#254F40",
    },
  });

  const modalidad = watch("modalidad");

  useEffect(() => {
    if (editando) {
      reset({
        nombre: editando.nombre,
        descripcion: editando.descripcion ?? "",
        modalidad: editando.modalidad,
        costo: editando.costo ?? undefined,
        color: editando.color ?? "#254F40",
      });
    } else {
      reset({
        nombre: "",
        descripcion: "",
        modalidad: "SESION_UNICA",
        costo: undefined,
        color: "#254F40",
      });
    }
  }, [editando, open, reset]);

  const onSubmit = async (data: FormData) => {
    const payload = {
      nombre: data.nombre,
      descripcion: data.descripcion || undefined,
      modalidad: data.modalidad,
      sesiones: null,
      costo: data.modalidad === "SESION_UNICA" ? (data.costo ?? 0) : 0,
      color: data.color,
      isActive: true,
    };
    try {
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
          Define el tipo de clase y cómo se comercializa
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre de la actividad
            </label>
            <Input
              {...register("nombre")}
              placeholder="Ej: Reformer Flow, Mat Power..."
            />
            {errors.nombre && (
              <p className="text-xs text-destructive mt-1">{errors.nombre.message}</p>
            )}
          </div>

          {/* Modalidad — Switch animado */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Modalidad de venta</p>
            <Controller
              name="modalidad"
              control={control}
              render={({ field }) => (
                <div className="grid grid-cols-2 gap-2">
                  {(["SESION_UNICA", "POR_PAQUETE"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => field.onChange(m)}
                      className={`relative py-3 px-4 rounded-lg border-2 text-sm font-medium transition-all duration-150 text-left ${
                        field.value === m
                          ? "border-[#254F40] bg-[#254F40]/5 text-[#254F40]"
                          : "border-border text-muted-foreground hover:border-[#254F40]/40"
                      }`}
                    >
                      <span className="block font-semibold">
                        {m === "SESION_UNICA" ? "Sesión suelta" : "Por paquete"}
                      </span>
                      <span className="block text-xs mt-0.5 font-normal opacity-80">
                        {m === "SESION_UNICA"
                          ? "Se reserva y paga por clase"
                          : "Requiere comprar un paquete"}
                      </span>
                      {field.value === m && (
                        <motion.span
                          layoutId="modalidad-indicator"
                          className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#254F40]"
                          transition={{ type: "spring", stiffness: 500, damping: 35 }}
                        />
                      )}
                    </button>
                  ))}
                </div>
              )}
            />
          </div>

          {/* Costo — solo para SESION_UNICA */}
          <AnimatePresence mode="wait">
            {modalidad === "SESION_UNICA" && (
              <motion.div
                key="costo"
                variants={fadeInUp}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Costo por sesión (MXN)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    $
                  </span>
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    className="pl-7"
                    placeholder="200.00"
                    {...register("costo")}
                  />
                </div>
                {errors.costo && (
                  <p className="text-xs text-destructive mt-1">{errors.costo.message}</p>
                )}
              </motion.div>
            )}
            {modalidad === "POR_PAQUETE" && (
              <motion.div
                key="info-paquete"
                variants={fadeInUp}
                initial="initial"
                animate="animate"
                exit="exit"
                className="rounded-lg bg-[#254F40]/6 border border-[#254F40]/20 p-3"
              >
                <p className="text-xs text-[#254F40] font-medium">
                  El precio se define en cada paquete
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Podrás crear paquetes de 6, 10, 12... sesiones con sus respectivos precios desde la pestaña Paquetes.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Color */}
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
              <span className="text-sm text-muted-foreground font-mono">
                {watch("color")}
              </span>
            </div>
            {errors.color && (
              <p className="text-xs text-destructive mt-1">{errors.color.message}</p>
            )}
          </div>

          {/* Descripción */}
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

          {/* Botones */}
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
