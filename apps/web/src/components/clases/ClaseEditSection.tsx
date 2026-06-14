"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/lib/api-client";
import { useInstructores } from "@/hooks/useInstructores";
import { Pencil, X, Clock, UserCheck, AlignLeft, Users } from "lucide-react";
import { useMotionTokens, tokens } from "@/lib/motion";

interface ClaseEditSectionProps {
  claseId: string;
  title: string;
  startAt: string;
  endAt: string;
  capacity: number;
  spotsBooked: number;
  instructorId: string | null;
  instructorName: string;
  onUpdated: () => void;
}

/** Formats an ISO string into the value expected by datetime-local inputs */
function toDatetimeLocal(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Formats a time string like "14:30" for display */
function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function parseBackendError(err: unknown): string {
  const resp = (err as { response?: { data?: { error?: { code?: string; message?: string; conflict?: { title?: string; startAt?: string } } } } })?.response?.data?.error;
  if (!resp) return "Error al guardar los cambios.";
  if (resp.code === "INSTRUCTOR_OVERLAP" && resp.conflict) {
    const hora = resp.conflict.startAt ? formatTime(resp.conflict.startAt) : "";
    return `Conflicto: el instructor ya tiene "${resp.conflict.title}"${hora ? ` a las ${hora}` : ""}.`;
  }
  if (resp.code === "CLASS_IN_PAST") return "No se puede editar una clase que ya pasó.";
  if (resp.code === "CAPACITY_BELOW_BOOKED") return resp.message ?? "La capacidad no puede ser menor a los lugares ya reservados.";
  if (resp.code === "CLASS_NOT_EDITABLE") return "Esta clase no se puede editar en su estado actual.";
  return resp.message ?? "Error al guardar los cambios.";
}

export function ClaseEditSection({
  claseId,
  title,
  startAt,
  endAt,
  capacity,
  spotsBooked,
  instructorId,
  instructorName,
  onUpdated,
}: ClaseEditSectionProps) {
  const qc = useQueryClient();
  const mv = useMotionTokens();
  const { data: instructores = [] } = useInstructores();

  const [editing, setEditing] = useState(false);

  // form state mirrors current values
  const [formTitle, setFormTitle] = useState(title);
  const [formStart, setFormStart] = useState(toDatetimeLocal(startAt));
  const [formEnd, setFormEnd] = useState(toDatetimeLocal(endAt));
  const [formCapacity, setFormCapacity] = useState(String(capacity));
  const [formInstructorId, setFormInstructorId] = useState(instructorId ?? "");
  const [editError, setEditError] = useState<string | null>(null);
  const [affectedNotice, setAffectedNotice] = useState<number | null>(null);

  const editMutation = useMutation({
    mutationFn: async () => {
      const cap = parseInt(formCapacity, 10);
      const payload: Record<string, unknown> = {
        title: formTitle.trim() || undefined,
        startAt: new Date(formStart).toISOString(),
        endAt: new Date(formEnd).toISOString(),
        capacity: isNaN(cap) ? capacity : cap,
        instructorId: formInstructorId || undefined,
      };
      const r = await apiClient.patch<{ success: boolean; data: { affectedReservations?: number } }>(
        `/clases/${claseId}`,
        payload
      );
      return r.data.data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["clase-detalle", claseId] });
      qc.invalidateQueries({ queryKey: ["clases"] });
      setEditing(false);
      setEditError(null);
      const affected = data?.affectedReservations ?? 0;
      if (affected > 0) setAffectedNotice(affected);
      onUpdated();
    },
    onError: (err: unknown) => {
      setEditError(parseBackendError(err));
    },
  });

  function openEdit() {
    // re-sync form state with current prop values
    setFormTitle(title);
    setFormStart(toDatetimeLocal(startAt));
    setFormEnd(toDatetimeLocal(endAt));
    setFormCapacity(String(capacity));
    setFormInstructorId(instructorId ?? "");
    setEditError(null);
    setAffectedNotice(null);
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setEditError(null);
  }

  // ── §2.6 crossFade between read and edit views ──────────────────────────────
  return (
    <AnimatePresence mode="wait">
      {!editing ? (
        <motion.div
          key="read-view"
          variants={mv.crossFade}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="space-y-1 text-sm text-muted-foreground"
        >
          {/* Affected notice persists after saving */}
          {affectedNotice !== null && affectedNotice > 0 && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-2">
              {affectedNotice} {affectedNotice === 1 ? "reservación afectada" : "reservaciones afectadas"} — avisa a los clientes sobre el cambio de horario.
            </p>
          )}
          <span className="flex items-center gap-1.5">
            <AlignLeft className="w-3.5 h-3.5 shrink-0" />
            <span className="font-medium text-foreground">{title}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 shrink-0" />
            {formatTime(startAt)} – {formatTime(endAt)}
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 shrink-0" />
            Capacidad: {capacity}
          </span>
          <span className="flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 shrink-0" />
            {instructorName}
          </span>
          <motion.button
            type="button"
            onClick={openEdit}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-[#254F40] transition-colors mt-1"
            whileHover={mv.reduced ? undefined : { opacity: 0.8, transition: { duration: tokens.duration.quick } }}
          >
            <Pencil className="w-3 h-3" />
            Editar clase
          </motion.button>
        </motion.div>
      ) : (
        <motion.div
          key="edit-view"
          variants={mv.crossFade}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="space-y-3 rounded-lg border border-[#254F40]/20 bg-[#254F40]/5 p-3"
        >
          <p className="text-xs font-semibold text-[#254F40] flex items-center justify-between">
            <span className="flex items-center gap-1.5"><Pencil className="w-3 h-3" /> Editar clase</span>
            <button type="button" onClick={cancelEdit} className="text-muted-foreground hover:text-foreground">
              <X className="w-3.5 h-3.5" />
            </button>
          </p>

          {/* Título */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Título</label>
            <Input
              className="h-8 text-xs"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="Ej. Reformer avanzado"
            />
          </div>

          {/* Horario */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Inicio</label>
              <Input
                type="datetime-local"
                className="h-8 text-xs"
                value={formStart}
                onChange={(e) => setFormStart(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Fin</label>
              <Input
                type="datetime-local"
                className="h-8 text-xs"
                value={formEnd}
                onChange={(e) => setFormEnd(e.target.value)}
              />
            </div>
          </div>

          {/* Capacidad */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Capacidad <span className="font-normal">(mín. {spotsBooked} reservadas)</span>
            </label>
            <Input
              inputMode="numeric"
              className="h-8 text-xs"
              value={formCapacity}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, "");
                setFormCapacity(v);
              }}
              placeholder="Ej. 12"
            />
          </div>

          {/* Instructor */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Instructor</label>
            <select
              className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs"
              value={formInstructorId}
              onChange={(e) => setFormInstructorId(e.target.value)}
            >
              <option value="">Sin instructor</option>
              {instructores.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.firstName} {i.lastName}
                </option>
              ))}
            </select>
          </div>

          {/* Error inline §3.3 — no shake */}
          <AnimatePresence>
            {editError && (
              <motion.p
                key="edit-error"
                variants={mv.fadeInUp}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-2 py-1.5"
              >
                {editError}
              </motion.p>
            )}
          </AnimatePresence>

          <div className="flex gap-2 pt-1">
            <motion.div
              className="flex-1"
              whileHover={mv.reduced ? undefined : { scale: 1.02, transition: { duration: tokens.duration.quick } }}
              whileTap={mv.reduced ? undefined : { scale: 0.98, transition: { duration: tokens.duration.instant } }}
            >
              <Button
                size="sm"
                className="w-full h-7 text-xs bg-[#254F40] hover:bg-[#1d3d32] text-[#F6FFB5]"
                disabled={editMutation.isPending}
                onClick={() => editMutation.mutate()}
              >
                {editMutation.isPending ? "Guardando..." : "Guardar cambios"}
              </Button>
            </motion.div>
            <motion.div
              whileHover={mv.reduced ? undefined : { scale: 1.02, transition: { duration: tokens.duration.quick } }}
              whileTap={mv.reduced ? undefined : { scale: 0.98, transition: { duration: tokens.duration.instant } }}
            >
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                onClick={cancelEdit}
              >
                Cancelar
              </Button>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
