"use client";

import dynamic from "next/dynamic";
import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";
import { apiClient } from "@/lib/api-client";
import { NuevaClaseDialog } from "./NuevaClaseDialog";
import { ClaseEditSection } from "./ClaseEditSection";
import { ReservarLugarPanel } from "./ReservarLugarPanel";
import { Users, X } from "lucide-react";
import { useMotionTokens, tokens } from "@/lib/motion";
import type {
  EventClickArg,
  EventInput,
  BusinessHoursInput,
  DatesSetArg,
  DateSelectArg,
  EventDropArg,
} from "@fullcalendar/core";
import type { EventResizeDoneArg } from "@fullcalendar/interaction";

// ─── SSR-safe FullCalendar ────────────────────────────────────────────────────
const FullCalendarComponent = dynamic(
  async () => {
    const { default: FC } = await import("@fullcalendar/react");
    const { default: timeGridPlugin } = await import("@fullcalendar/timegrid");
    const { default: dayGridPlugin } = await import("@fullcalendar/daygrid");
    const { default: interactionPlugin } = await import("@fullcalendar/interaction");
    function W(props: React.ComponentProps<typeof FC>) {
      return <FC plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]} {...props} />;
    }
    return W;
  },
  { ssr: false }
);

// ─── Colores por actividad ────────────────────────────────────────────────────
export const CLASS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Reformer: { bg: "#254F4018", text: "#254F40", border: "#254F40" },
  Mat:      { bg: "#ede9fe",   text: "#5b21b6", border: "#c4b5fd" },
  Barre:    { bg: "#fce7f3",   text: "#be185d", border: "#f9a8d4" },
  GAP:      { bg: "#fef3c7",   text: "#92400e", border: "#fbbf24" },
  Default:  { bg: "#f3f4f6",   text: "#374151", border: "#d1d5db" },
};

const BUSINESS_HOURS: BusinessHoursInput = [
  { daysOfWeek: [1, 2, 3, 4, 5], startTime: "06:45", endTime: "20:00" },
  { daysOfWeek: [6], startTime: "07:00", endTime: "14:00" },
];

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface ApiClase {
  id: string;
  title?: string;
  type?: string;
  subtype?: string;
  tipoActividad?: { id: string; nombre: string; color?: string | null; modalidad: string } | null;
  instructor: { id: string; firstName: string; lastName: string } | null;
  instructorId: string;
  startAt: string;
  endAt: string;
  capacity: number;
  spotsBooked: number;
  enrolled: number;
  isCancelled: boolean;
  isActive: boolean;
}

interface ClaseDetalle extends ApiClase {
  reservations: Array<{
    id: string;
    status: string;
    client: { id: string; firstName: string; lastName: string };
    membership?: {
      id: string;
      sessionsRemaining: number;
      package: { name: string; sessions: number };
    } | null;
  }>;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function tipoKey(clase: ApiClase): string {
  return clase.tipoActividad?.nombre ?? (
    clase.subtype === "REFORMER" ? "Reformer" :
    clase.subtype === "MAT"      ? "Mat"      :
    clase.subtype === "BARRE"    ? "Barre"    : "Default"
  );
}

function toFCEvent(clase: ApiClase): EventInput {
  const key = tipoKey(clase);
  const colors = CLASS_COLORS[key] ?? CLASS_COLORS.Default;
  return {
    id: clase.id,
    title: clase.isCancelled ? `⊘ ${clase.title ?? key}` : (clase.title ?? key),
    start: clase.startAt,
    end: clase.endAt,
    backgroundColor: colors.bg,
    textColor: colors.text,
    borderColor: colors.border,
    extendedProps: {
      claseId: clase.id,
      isCancelled: clase.isCancelled,
      spotsBooked: clase.spotsBooked ?? 0,
    },
  };
}

async function fetchClasesByRange(startDate: string, endDate: string): Promise<ApiClase[]> {
  const r = await apiClient.get<{ success: boolean; data: ApiClase[] }>("/clases", {
    params: { startDate, endDate },
  });
  return r.data.data;
}

async function fetchClaseDetalle(id: string): Promise<ClaseDetalle> {
  const r = await apiClient.get<{ success: boolean; data: ClaseDetalle }>(`/clases/${id}`);
  return r.data.data;
}

function parseOverlapError(err: unknown): string {
  const resp = (err as { response?: { data?: { error?: { code?: string; message?: string; conflict?: { title?: string; startAt?: string } } } } })?.response?.data?.error;
  if (!resp) return "Error al mover la clase.";
  if (resp.code === "INSTRUCTOR_OVERLAP" && resp.conflict) {
    const hora = resp.conflict.startAt
      ? new Date(resp.conflict.startAt).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", hour12: false })
      : "";
    return `Conflicto: el instructor ya tiene "${resp.conflict.title}"${hora ? ` a las ${hora}` : ""}.`;
  }
  if (resp.code === "CLASS_IN_PAST") return "No se puede mover una clase que ya pasó.";
  if (resp.code === "CLASS_NOT_EDITABLE") return "Esta clase no se puede editar en su estado actual.";
  return resp.message ?? "Error al mover la clase.";
}

// ─── Componente principal ─────────────────────────────────────────────────────
export function CalendarioClases() {
  const qc = useQueryClient();
  const mv = useMotionTokens();
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date } | null>(null);
  const [selectedClaseId, setSelectedClaseId] = useState<string | null>(null);
  const [nuevaClaseSlot, setNuevaClaseSlot] = useState<{ start: Date; end: Date } | null>(null);
  const [nuevaClaseDialogOpen, setNuevaClaseDialogOpen] = useState(false);
  const [dragError, setDragError] = useState<string | null>(null);
  // Key to force-remount the panel when dialog opens on a new class
  const [panelKey, setPanelKey] = useState(0);

  const { data: clases = [], isLoading } = useQuery({
    queryKey: ["clases", dateRange?.start.toISOString().split("T")[0], dateRange?.end.toISOString().split("T")[0]],
    queryFn: () => dateRange
      ? fetchClasesByRange(
          dateRange.start.toISOString().split("T")[0],
          dateRange.end.toISOString().split("T")[0]
        )
      : Promise.resolve([]),
    enabled: !!dateRange,
  });

  const { data: claseDetalle, isLoading: loadingDetalle } = useQuery({
    queryKey: ["clase-detalle", selectedClaseId],
    queryFn: () => fetchClaseDetalle(selectedClaseId!),
    enabled: !!selectedClaseId,
  });

  const moverClaseMutation = useMutation({
    mutationFn: async ({ claseId, startAt, endAt }: { claseId: string; startAt: string; endAt: string }) => {
      const r = await apiClient.patch<{ success: boolean; data: { affectedReservations?: number } }>(
        `/clases/${claseId}`,
        { startAt, endAt }
      );
      return r.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clases"] });
      setDragError(null);
    },
  });

  const handleEventClick = useCallback((arg: EventClickArg) => {
    setSelectedClaseId(arg.event.id);
    setPanelKey((k) => k + 1);
  }, []);

  const handleDatesSet = useCallback((arg: DatesSetArg) => {
    setDateRange({ start: arg.start, end: arg.end });
  }, []);

  const handleSelect = useCallback((arg: DateSelectArg) => {
    setNuevaClaseSlot({ start: arg.start, end: arg.end });
    setNuevaClaseDialogOpen(true);
  }, []);

  const handleEventDrop = useCallback(
    (info: EventDropArg) => {
      const { event, revert } = info;
      if (!event.start || !event.end) { revert(); return; }
      const spotsBooked: number = event.extendedProps.spotsBooked ?? 0;
      const proceed = spotsBooked > 0
        ? window.confirm(`¿Mover "${event.title}" a este horario?\n\nHay reservaciones en esta clase — avisa a los clientes del cambio.`)
        : true;
      if (!proceed) { revert(); return; }
      moverClaseMutation.mutate(
        { claseId: event.id, startAt: event.start.toISOString(), endAt: event.end.toISOString() },
        { onError: (err) => { revert(); setDragError(parseOverlapError(err)); } }
      );
    },
    [moverClaseMutation]
  );

  const handleEventResize = useCallback(
    (info: EventResizeDoneArg) => {
      const { event, revert } = info;
      if (!event.start || !event.end) { revert(); return; }
      const spotsBooked: number = event.extendedProps.spotsBooked ?? 0;
      const proceed = spotsBooked > 0
        ? window.confirm(`¿Cambiar duración de "${event.title}"?\n\nHay reservaciones en esta clase — avisa a los clientes del cambio.`)
        : true;
      if (!proceed) { revert(); return; }
      moverClaseMutation.mutate(
        { claseId: event.id, startAt: event.start.toISOString(), endAt: event.end.toISOString() },
        { onError: (err) => { revert(); setDragError(parseOverlapError(err)); } }
      );
    },
    [moverClaseMutation]
  );

  const fcEvents = clases.map(toFCEvent);
  const disponibles = claseDetalle ? claseDetalle.capacity - (claseDetalle.spotsBooked ?? 0) : 0;

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      {/* Leyenda */}
      <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-border bg-muted/30">
        {Object.entries(CLASS_COLORS).filter(([k]) => k !== "Default").map(([tipo, c]) => (
          <span key={tipo} className="flex items-center gap-1.5 text-xs font-medium">
            <span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: c.bg, border: `1px solid ${c.border}` }} />
            <span style={{ color: c.text }}>{tipo}</span>
          </span>
        ))}
        <span className="ml-auto text-xs text-muted-foreground">Haz clic en un horario libre para crear una clase</span>
      </div>

      {/* Drag error banner */}
      {dragError && (
        <div className="px-4 py-2 bg-destructive/10 border-b border-destructive/20 flex items-center justify-between gap-2">
          <p className="text-xs text-destructive">{dragError}</p>
          <button type="button" onClick={() => setDragError(null)} className="text-destructive/60 hover:text-destructive">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Calendario */}
      <div className="p-4 relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
            <div className="flex flex-col items-center gap-2">
              <div className="w-6 h-6 border-2 border-[#254F40] border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-muted-foreground">Cargando clases...</p>
            </div>
          </div>
        )}
        <FullCalendarComponent
          initialView="timeGridWeek"
          locale="es"
          timeZone="local"
          headerToolbar={{ left: "prev,next today", center: "title", right: "dayGridMonth,timeGridWeek,timeGridDay" }}
          buttonText={{ today: "Hoy", month: "Mes", week: "Semana", day: "Día" }}
          slotMinTime="06:45:00"
          slotMaxTime="20:00:00"
          slotDuration="00:30:00"
          slotLabelInterval="01:00:00"
          allDaySlot={false}
          slotEventOverlap={false}
          nowIndicator
          selectable
          unselectAuto
          editable
          eventDurationEditable
          businessHours={BUSINESS_HOURS}
          events={fcEvents}
          eventClick={handleEventClick}
          select={handleSelect}
          datesSet={handleDatesSet}
          eventDrop={handleEventDrop}
          eventResize={handleEventResize}
          eventAllow={(_dropInfo, draggedEvent) =>
            !(draggedEvent?.extendedProps?.isCancelled === true)
          }
          height="auto"
          firstDay={1}
          eventTimeFormat={{ hour: "2-digit", minute: "2-digit", meridiem: false, hour12: false }}
          slotLabelFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
          dayHeaderFormat={{ weekday: "short", day: "numeric", omitCommas: true }}
        />
      </div>

      {/* ── Diálogo de detalle de clase ── */}
      <Dialog open={!!selectedClaseId} onOpenChange={(o) => !o && setSelectedClaseId(null)}>
        <DialogContent className="max-w-3xl p-0 gap-0 overflow-hidden">
          <DialogTitle className="sr-only">
            {claseDetalle?.title ?? "Detalle de clase"}
          </DialogTitle>
          {loadingDetalle || !claseDetalle ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-6 h-6 border-2 border-[#254F40] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="flex flex-col md:flex-row h-full max-h-[85vh]">

              {/* ── Columna izquierda: info + edición ── */}
              <div className="md:w-[55%] p-6 border-b md:border-b-0 md:border-r border-border overflow-y-auto">
                <DialogHeader className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    {(() => {
                      const key = tipoKey(claseDetalle);
                      const c = CLASS_COLORS[key] ?? CLASS_COLORS.Default;
                      return (
                        <Badge variant="outline" style={{ backgroundColor: c.bg, color: c.text, borderColor: c.border }}>
                          {key}
                        </Badge>
                      );
                    })()}
                    {claseDetalle.isCancelled && <Badge variant="destructive">Cancelada</Badge>}
                  </div>

                  <ClaseEditSection
                    claseId={claseDetalle.id}
                    title={claseDetalle.title ?? tipoKey(claseDetalle)}
                    startAt={claseDetalle.startAt}
                    endAt={claseDetalle.endAt}
                    capacity={claseDetalle.capacity}
                    spotsBooked={claseDetalle.spotsBooked ?? 0}
                    instructorId={claseDetalle.instructor?.id ?? null}
                    instructorName={
                      claseDetalle.instructor
                        ? `${claseDetalle.instructor.firstName} ${claseDetalle.instructor.lastName}`
                        : "Sin instructor"
                    }
                    onUpdated={() => {
                      qc.invalidateQueries({ queryKey: ["clase-detalle", selectedClaseId] });
                    }}
                  />

                  <DialogDescription className="sr-only">
                    {formatDateTime(claseDetalle.startAt)}
                  </DialogDescription>
                </DialogHeader>

                {/* ── Barra de capacidad §2.5 — scaleX (compositor), no width% ── */}
                <div className="mb-5">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> Lugares</span>
                    {/* §2.5 opacity quick fade on re-render */}
                    <motion.span
                      key={disponibles}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: tokens.duration.quick, ease: tokens.easing.easeOut }}
                      className={disponibles <= 0 ? "text-destructive font-medium" : "text-emerald-600 font-medium"}
                    >
                      {disponibles <= 0 ? "Llena" : `${disponibles} disponibles`}
                    </motion.span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    {/* scaleX from 0→ratio, origin-left. Color cross-fades via transition-colors. */}
                    <motion.div
                      className="h-full w-full rounded-full origin-left transition-colors duration-200"
                      style={{
                        backgroundColor: disponibles <= 0 ? "#ef4444" : "#254F40",
                      }}
                      variants={mv.capacityBar(
                        claseDetalle.capacity > 0
                          ? (claseDetalle.spotsBooked ?? 0) / claseDetalle.capacity
                          : 0
                      )}
                      initial="hidden"
                      animate="visible"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {claseDetalle.spotsBooked ?? 0} de {claseDetalle.capacity} lugares ocupados
                  </p>
                </div>

                {/* ── Lista de reservaciones §3.4 stagger ── */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                    Reservaciones ({claseDetalle.reservations?.length ?? 0})
                  </p>
                  {claseDetalle.reservations?.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sin reservaciones aún</p>
                  ) : (
                    <motion.ul
                      className="space-y-1.5"
                      variants={mv.staggerContainer}
                      initial="hidden"
                      animate="visible"
                    >
                      {claseDetalle.reservations?.slice(0, 8).map((r) => (
                        <motion.li
                          key={r.id}
                          variants={mv.staggerItem}
                          className="flex items-center justify-between text-sm bg-muted/40 rounded-lg px-3 py-2"
                        >
                          <span className="font-medium">{r.client.firstName} {r.client.lastName}</span>
                          {/* Badge §3.4 — scale+opacity on mount */}
                          <motion.span
                            variants={mv.reduced ? undefined : {
                              hidden: { opacity: 0, scale: 0.95 },
                              visible: {
                                opacity: 1,
                                scale: 1,
                                transition: { duration: tokens.duration.quick, ease: tokens.easing.easeOut },
                              },
                            }}
                            className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                              r.status === "CONFIRMED" || r.status === "ATTENDED"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : r.status === "PENDING_APPROVAL"
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : "bg-muted text-muted-foreground border-border"
                            }`}
                          >
                            {r.status === "CONFIRMED" ? "Confirmada"
                              : r.status === "ATTENDED" ? "Asistió"
                              : r.status === "PENDING_APPROVAL" ? "Pendiente"
                              : r.status === "CANCELLED" ? "Cancelada"
                              : r.status}
                          </motion.span>
                        </motion.li>
                      ))}
                      {/* Items beyond 8 enter without stagger */}
                      {claseDetalle.reservations?.slice(8).map((r) => (
                        <li key={r.id} className="flex items-center justify-between text-sm bg-muted/40 rounded-lg px-3 py-2">
                          <span className="font-medium">{r.client.firstName} {r.client.lastName}</span>
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                            r.status === "CONFIRMED" || r.status === "ATTENDED"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : r.status === "PENDING_APPROVAL"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-muted text-muted-foreground border-border"
                          }`}>
                            {r.status === "CONFIRMED" ? "Confirmada"
                              : r.status === "ATTENDED" ? "Asistió"
                              : r.status === "PENDING_APPROVAL" ? "Pendiente"
                              : r.status === "CANCELLED" ? "Cancelada"
                              : r.status}
                          </span>
                        </li>
                      ))}
                    </motion.ul>
                  )}
                </div>
              </div>

              {/* ── Columna derecha: reservar lugar ── */}
              <div className="md:w-[45%] p-6 bg-muted/20 overflow-y-auto">
                <p className="text-sm font-semibold text-[#254F40] mb-4">Reservar lugar</p>
                <ReservarLugarPanel
                  key={panelKey}
                  classId={claseDetalle.id}
                  disponibles={disponibles}
                  onSuccess={() => {
                    qc.invalidateQueries({ queryKey: ["clase-detalle", selectedClaseId] });
                    qc.invalidateQueries({ queryKey: ["clases"] });
                  }}
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Diálogo nueva clase */}
      <AnimatePresence>
        {nuevaClaseDialogOpen && nuevaClaseSlot && (
          <NuevaClaseDialog
            slot={nuevaClaseSlot}
            onClose={() => setNuevaClaseDialogOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
