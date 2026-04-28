"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/lib/api-client";
import { scaleIn } from "@/lib/animations";
import { useTipoActividades } from "@/hooks/useTipoActividades";
import { useInstructores } from "@/hooks/useInstructores";
import { formatDate } from "@/lib/utils";

interface NuevaClaseDialogProps {
  slot: { start: Date; end: Date };
  onClose: () => void;
}

export function NuevaClaseDialog({ slot, onClose }: NuevaClaseDialogProps) {
  const qc = useQueryClient();
  const { data: tiposActividad = [] } = useTipoActividades(true);
  const { data: instructores = [] } = useInstructores();

  const toLocalDatetimeValue = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const [tipoActividadId, setTipoActividadId] = useState("");
  const [instructorId, setInstructorId] = useState("");
  const [startAt, setStartAt] = useState(toLocalDatetimeValue(slot.start));
  const [endAt, setEndAt] = useState(toLocalDatetimeValue(slot.end));
  const [capacidad, setCapacidad] = useState(12);
  const [notas, setNotas] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsPending(true);
    try {
      await apiClient.post("/clases", {
        tipoActividadId,
        instructorId,
        startAt: new Date(startAt).toISOString(),
        endAt: new Date(endAt).toISOString(),
        capacity: capacidad,
        notes: notas || undefined,
      });
      qc.invalidateQueries({ queryKey: ["clases"] });
      onClose();
    } catch (err) {
      setError((err as Error).message ?? "Error al crear la clase");
    } finally {
      setIsPending(false);
    }
  };

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
        <h2 className="text-lg font-semibold text-[#254F40] mb-1">Nueva clase</h2>
        <p className="text-sm text-muted-foreground mb-5">
          {formatDate(slot.start, "EEEE d 'de' MMMM")}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tipo de actividad */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de actividad
            </label>
            <select
              value={tipoActividadId}
              onChange={(e) => setTipoActividadId(e.target.value)}
              required
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Selecciona una actividad...</option>
              {tiposActividad.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Instructor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Instructor
            </label>
            <select
              value={instructorId}
              onChange={(e) => setInstructorId(e.target.value)}
              required
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Selecciona un instructor...</option>
              {instructores.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.firstName} {i.lastName}
                </option>
              ))}
            </select>
          </div>

          {/* Hora inicio y fin */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Inicio
              </label>
              <Input
                type="datetime-local"
                value={startAt}
                onChange={(e) => setStartAt(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fin
              </label>
              <Input
                type="datetime-local"
                value={endAt}
                onChange={(e) => setEndAt(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Capacidad */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Capacidad
            </label>
            <Input
              type="number"
              min={1}
              max={50}
              value={capacidad}
              onChange={(e) => setCapacidad(Number(e.target.value))}
              required
            />
          </div>

          {/* Notas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notas (opcional)
            </label>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none h-16 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Notas adicionales sobre la clase..."
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          {/* Botones */}
          <div className="flex gap-3 justify-end pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Creando..." : "Crear clase"}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
