"use client";

import dynamic from "next/dynamic";
import { useState, useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDateTime } from "@/lib/utils";
import { apiClient } from "@/lib/api-client";
import { NuevaClaseDialog } from "./NuevaClaseDialog";
import { Users, Clock, UserCheck, Search, CheckCircle, UserPlus, X, Pencil } from "lucide-react";
import { useInstructores } from "@/hooks/useInstructores";
import type {
  EventClickArg,
  EventInput,
  BusinessHoursInput,
  DatesSetArg,
  DateSelectArg,
} from "@fullcalendar/core";

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

interface ClienteOption {
  id: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  memberships?: Array<{
    id: string;
    status: string;
    sessionsRemaining: number;
    package: { name: string };
  }>;
}

// ─── Mapeo API → FullCalendar ─────────────────────────────────────────────────
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
    extendedProps: { claseId: clase.id, isCancelled: clase.isCancelled },
  };
}

// ─── Fetch helpers ────────────────────────────────────────────────────────────
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

async function fetchClienteSearch(search: string): Promise<ClienteOption[]> {
  const r = await apiClient.get<{ success: boolean; data: { clientes: ClienteOption[] } }>("/clientes", {
    params: { search, limit: 10 },
  });
  return r.data.data.clientes ?? [];
}

async function fetchClienteMembresias(clientId: string) {
  const r = await apiClient.get<{ success: boolean; data: ClienteOption["memberships"] }>(
    "/membresias",
    { params: { clientId, status: "ACTIVE" } }
  );
  return r.data.data ?? [];
}

// ─── Componente principal ─────────────────────────────────────────────────────
export function CalendarioClases() {
  const qc = useQueryClient();
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date } | null>(null);
  const [selectedClaseId, setSelectedClaseId] = useState<string | null>(null);
  const [nuevaClaseSlot, setNuevaClaseSlot] = useState<{ start: Date; end: Date } | null>(null);
  const [nuevaClaseDialogOpen, setNuevaClaseDialogOpen] = useState(false);

  // ── Reservation form state
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCliente, setSelectedCliente] = useState<ClienteOption | null>(null);
  const [selectedMembresiaId, setSelectedMembresiaId] = useState("");
  const [reservaOk, setReservaOk] = useState(false);

  // ── Cambio de instructor
  const [editandoInstructor, setEditandoInstructor] = useState(false);
  const [nuevoInstructorId, setNuevoInstructorId] = useState("");
  const { data: instructores = [] } = useInstructores();

  // ── Inline new client form
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [newClient, setNewClient] = useState({ firstName: "", lastName: "", email: "", phone: "" });

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 350);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // Reset reservation form when dialog changes
  useEffect(() => {
    setSearchTerm("");
    setDebouncedSearch("");
    setSelectedCliente(null);
    setSelectedMembresiaId("");
    setReservaOk(false);
    setShowNewClientForm(false);
    setNewClient({ firstName: "", lastName: "", email: "", phone: "" });
    setEditandoInstructor(false);
    setNuevoInstructorId("");
  }, [selectedClaseId]);

  // ── Queries
  const { data: clases = [], isLoading } = useQuery({
    queryKey: ["clases", dateRange?.start.toISOString().split("T")[0], dateRange?.end.toISOString().split("T")[0]],
    queryFn: () => dateRange ? fetchClasesByRange(
      dateRange.start.toISOString().split("T")[0],
      dateRange.end.toISOString().split("T")[0]
    ) : Promise.resolve([]),
    enabled: !!dateRange,
  });

  const { data: claseDetalle, isLoading: loadingDetalle } = useQuery({
    queryKey: ["clase-detalle", selectedClaseId],
    queryFn: () => fetchClaseDetalle(selectedClaseId!),
    enabled: !!selectedClaseId,
  });

  const { data: clienteResults = [] } = useQuery({
    queryKey: ["cliente-search", debouncedSearch],
    queryFn: () => fetchClienteSearch(debouncedSearch),
    enabled: debouncedSearch.length >= 2,
  });

  const { data: membresias = [] } = useQuery({
    queryKey: ["membresias-cliente", selectedCliente?.id],
    queryFn: () => fetchClienteMembresias(selectedCliente!.id),
    enabled: !!selectedCliente,
  });

  const crearClienteMutation = useMutation({
    mutationFn: async (data: typeof newClient) => {
      const r = await apiClient.post<{ success: boolean; data: { client: ClienteOption } }>("/clientes", {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone || undefined,
      });
      return r.data.data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["cliente-search"] });
      const client = (data as any).client ?? data;
      const newCli: ClienteOption = {
        id: client.id ?? (client as any).client?.id,
        firstName: newClient.firstName,
        lastName: newClient.lastName,
        phone: newClient.phone || null,
      };
      setSelectedCliente(newCli);
      setSearchTerm(`${newClient.firstName} ${newClient.lastName}`);
      setShowNewClientForm(false);
      setNewClient({ firstName: "", lastName: "", email: "", phone: "" });
    },
  });

  const reservarMutation = useMutation({
    mutationFn: async ({ clientId, classId, membershipId }: { clientId: string; classId: string; membershipId?: string }) => {
      await apiClient.post("/reservaciones", {
        clientId,
        classId,
        membershipId: membershipId || undefined,
        origin: membershipId ? "MEMBERSHIP" : "WALK_IN",
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clase-detalle", selectedClaseId] });
      qc.invalidateQueries({ queryKey: ["clases"] });
      setReservaOk(true);
      setSelectedCliente(null);
      setSearchTerm("");
      setSelectedMembresiaId("");
    },
  });

  const cambiarInstructorMutation = useMutation({
    mutationFn: async ({ claseId, instructorId }: { claseId: string; instructorId: string }) => {
      await apiClient.patch(`/clases/${claseId}`, { instructorId });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clase-detalle", selectedClaseId] });
      qc.invalidateQueries({ queryKey: ["clases"] });
      setEditandoInstructor(false);
      setNuevoInstructorId("");
    },
  });

  const handleEventClick = useCallback((arg: EventClickArg) => {
    setSelectedClaseId(arg.event.id);
  }, []);

  const handleDatesSet = useCallback((arg: DatesSetArg) => {
    setDateRange({ start: arg.start, end: arg.end });
  }, []);

  const handleSelect = useCallback((arg: DateSelectArg) => {
    setNuevaClaseSlot({ start: arg.start, end: arg.end });
    setNuevaClaseDialogOpen(true);
  }, []);

  const handleReservar = () => {
    if (!selectedCliente || !selectedClaseId) return;
    reservarMutation.mutate({
      clientId: selectedCliente.id,
      classId: selectedClaseId,
      membershipId: selectedMembresiaId || undefined,
    });
  };

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
          businessHours={BUSINESS_HOURS}
          events={fcEvents}
          eventClick={handleEventClick}
          select={handleSelect}
          datesSet={handleDatesSet}
          height="auto"
          firstDay={1}
          eventTimeFormat={{ hour: "2-digit", minute: "2-digit", meridiem: false, hour12: false }}
          slotLabelFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
          dayHeaderFormat={{ weekday: "short", day: "numeric", omitCommas: true }}
        />
      </div>

      {/* ── Diálogo de detalle de clase + reservación ── */}
      <Dialog open={!!selectedClaseId} onOpenChange={(o) => !o && setSelectedClaseId(null)}>
        <DialogContent className="max-w-3xl p-0 gap-0 overflow-hidden">
          {/* Título siempre presente para accesibilidad (sr-only cuando hay contenido visible) */}
          <DialogTitle className="sr-only">
            {claseDetalle?.title ?? "Detalle de clase"}
          </DialogTitle>
          {loadingDetalle || !claseDetalle ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-6 h-6 border-2 border-[#254F40] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="flex flex-col md:flex-row h-full max-h-[85vh]">

              {/* ── Columna izquierda: info de la clase ── */}
              <div className="md:w-[55%] p-6 border-b md:border-b-0 md:border-r border-border overflow-y-auto">
                <DialogHeader className="mb-4">
                  <div className="flex items-center gap-2 mb-1">
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
                  <h2 className="text-lg font-semibold leading-none tracking-tight">
                    {claseDetalle.title ?? tipoKey(claseDetalle)}
                  </h2>
                  <DialogDescription className="space-y-1 text-sm">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {formatDateTime(claseDetalle.startAt)} –{" "}
                      {new Date(claseDetalle.endAt).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5" />
                      {editandoInstructor ? (
                        <span className="flex items-center gap-1.5">
                          <select
                            className="text-sm border border-input rounded-md px-2 py-0.5 bg-background"
                            value={nuevoInstructorId || claseDetalle.instructor?.id || ""}
                            onChange={(e) => setNuevoInstructorId(e.target.value)}
                          >
                            {instructores.map((i) => (
                              <option key={i.id} value={i.id}>
                                {i.firstName} {i.lastName}
                              </option>
                            ))}
                          </select>
                          <button
                            className="text-xs px-2 py-0.5 bg-[#254F40] text-white rounded-md"
                            onClick={() => cambiarInstructorMutation.mutate({ claseId: claseDetalle.id, instructorId: nuevoInstructorId || claseDetalle.instructor?.id || "" })}
                          >
                            Guardar
                          </button>
                          <button onClick={() => setEditandoInstructor(false)} className="text-muted-foreground hover:text-foreground">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5">
                          {claseDetalle.instructor ? `${claseDetalle.instructor.firstName} ${claseDetalle.instructor.lastName}` : "Sin instructor"}
                          <button onClick={() => { setEditandoInstructor(true); setNuevoInstructorId(claseDetalle.instructor?.id || ""); }} className="text-muted-foreground hover:text-[#254F40] transition-colors">
                            <Pencil className="w-3 h-3" />
                          </button>
                        </span>
                      )}
                    </span>
                  </DialogDescription>
                </DialogHeader>

                {/* Barra de capacidad */}
                <div className="mb-5">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> Lugares</span>
                    <span className={disponibles <= 0 ? "text-destructive font-medium" : "text-emerald-600 font-medium"}>
                      {disponibles <= 0 ? "Llena" : `${disponibles} disponibles`}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, ((claseDetalle.spotsBooked ?? 0) / claseDetalle.capacity) * 100)}%`,
                        backgroundColor: disponibles <= 0 ? "#ef4444" : "#254F40",
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {claseDetalle.spotsBooked ?? 0} de {claseDetalle.capacity} lugares ocupados
                  </p>
                </div>

                {/* Lista de reservaciones actuales */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                    Reservaciones ({claseDetalle.reservations?.length ?? 0})
                  </p>
                  {claseDetalle.reservations?.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sin reservaciones aún</p>
                  ) : (
                    <ul className="space-y-1.5">
                      {claseDetalle.reservations?.map((r) => (
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
                    </ul>
                  )}
                </div>
              </div>

              {/* ── Columna derecha: agregar reservación ── */}
              <div className="md:w-[45%] p-6 bg-muted/20 overflow-y-auto">
                <p className="text-sm font-semibold text-[#254F40] mb-4">Reservar lugar</p>

                {reservaOk ? (
                  <motion.div
                    className="flex flex-col items-center gap-3 py-8 text-center"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <CheckCircle className="w-10 h-10 text-emerald-500" />
                    <p className="font-medium text-emerald-700">¡Reservación creada!</p>
                    <p className="text-xs text-muted-foreground">La sesión fue descontada de la membresía</p>
                    <Button variant="outline" size="sm" onClick={() => setReservaOk(false)} className="mt-2">
                      Agregar otra
                    </Button>
                  </motion.div>
                ) : (
                  <div className="space-y-4">
                    {/* Buscar cliente */}
                    <div>
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1.5">
                        Buscar cliente
                      </label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                        <Input
                          placeholder="Nombre o apellido..."
                          className="pl-8 text-sm"
                          value={searchTerm}
                          onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setSelectedCliente(null);
                            setSelectedMembresiaId("");
                          }}
                        />
                      </div>

                      {/* Resultados de búsqueda */}
                      {debouncedSearch.length >= 2 && !selectedCliente && clienteResults.length > 0 && (
                        <ul className="mt-1 border border-border rounded-lg overflow-hidden shadow-sm">
                          {clienteResults.map((c) => (
                            <li key={c.id}>
                              <button
                                type="button"
                                className="w-full text-left px-3 py-2 text-sm hover:bg-[#254F40]/5 transition-colors"
                                onClick={() => {
                                  setSelectedCliente(c);
                                  setSearchTerm(`${c.firstName} ${c.lastName}`);
                                }}
                              >
                                <span className="font-medium">{c.firstName} {c.lastName}</span>
                                {c.phone && <span className="text-muted-foreground text-xs ml-2">{c.phone}</span>}
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}

                      {debouncedSearch.length >= 2 && !selectedCliente && clienteResults.length === 0 && (
                        <div className="mt-2">
                          {!showNewClientForm ? (
                            <motion.div
                              initial={{ opacity: 0, y: 4 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="flex flex-col items-center gap-2 py-3 bg-muted/30 rounded-lg border border-dashed border-border"
                            >
                              <p className="text-xs text-muted-foreground">Sin coincidencias para &quot;{debouncedSearch}&quot;</p>
                              <button
                                type="button"
                                onClick={() => setShowNewClientForm(true)}
                                className="flex items-center gap-1.5 text-xs font-medium text-[#254F40] hover:text-[#1d3d32] transition-colors"
                              >
                                <UserPlus className="w-3.5 h-3.5" />
                                Crear cliente nuevo
                              </button>
                            </motion.div>
                          ) : (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              transition={{ duration: 0.25 }}
                              className="mt-1 border border-[#254F40]/20 rounded-lg p-3 bg-[#254F40]/3 space-y-2"
                            >
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-xs font-semibold text-[#254F40] flex items-center gap-1">
                                  <UserPlus className="w-3.5 h-3.5" /> Nuevo cliente
                                </p>
                                <button onClick={() => setShowNewClientForm(false)} className="text-muted-foreground hover:text-foreground">
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <Input
                                  placeholder="Nombre *"
                                  className="text-xs h-8"
                                  value={newClient.firstName}
                                  onChange={(e) => setNewClient((p) => ({ ...p, firstName: e.target.value }))}
                                />
                                <Input
                                  placeholder="Apellido *"
                                  className="text-xs h-8"
                                  value={newClient.lastName}
                                  onChange={(e) => setNewClient((p) => ({ ...p, lastName: e.target.value }))}
                                />
                              </div>
                              <Input
                                placeholder="Correo electrónico *"
                                type="email"
                                className="text-xs h-8"
                                value={newClient.email}
                                onChange={(e) => setNewClient((p) => ({ ...p, email: e.target.value }))}
                              />
                              <Input
                                placeholder="Teléfono (opcional)"
                                className="text-xs h-8"
                                value={newClient.phone}
                                onChange={(e) => setNewClient((p) => ({ ...p, phone: e.target.value }))}
                              />
                              {crearClienteMutation.isError && (
                                <p className="text-xs text-destructive">
                                  {(crearClienteMutation.error as Error)?.message ?? "Error al crear el cliente"}
                                </p>
                              )}
                              <Button
                                size="sm"
                                className="w-full h-8 text-xs bg-[#254F40] hover:bg-[#1d3d32] text-[#F6FFB5]"
                                disabled={
                                  !newClient.firstName || !newClient.lastName || !newClient.email ||
                                  crearClienteMutation.isPending
                                }
                                onClick={() => crearClienteMutation.mutate(newClient)}
                              >
                                {crearClienteMutation.isPending ? "Creando..." : "Crear y seleccionar"}
                              </Button>
                            </motion.div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Membresías del cliente seleccionado */}
                    {selectedCliente && (
                      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                        <div className="rounded-lg border border-[#254F40]/20 bg-[#254F40]/5 px-3 py-2 mb-3">
                          <p className="text-sm font-medium text-[#254F40]">{selectedCliente.firstName} {selectedCliente.lastName}</p>
                        </div>

                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1.5">
                          Membresía / paquete
                        </label>
                        {membresias.length === 0 ? (
                          <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                            Este cliente no tiene membresías activas. Se creará como entrada directa.
                          </p>
                        ) : (
                          <select
                            className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm"
                            value={selectedMembresiaId}
                            onChange={(e) => setSelectedMembresiaId(e.target.value)}
                          >
                            <option value="">Sin membresía (entrada directa)</option>
                            {membresias.map((m: any) => (
                              <option key={m.id} value={m.id}>
                                {m.package?.name} — {m.sessionsRemaining} sesiones restantes
                              </option>
                            ))}
                          </select>
                        )}
                      </motion.div>
                    )}

                    {/* Error de reservación */}
                    {reservarMutation.isError && (
                      <p className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
                        {(reservarMutation.error as Error)?.message ?? "Error al crear la reservación"}
                      </p>
                    )}

                    {/* Botón reservar */}
                    <Button
                      className="w-full bg-[#254F40] hover:bg-[#1d3d32] text-[#F6FFB5]"
                      disabled={!selectedCliente || reservarMutation.isPending || disponibles <= 0}
                      onClick={handleReservar}
                    >
                      {reservarMutation.isPending ? "Reservando..." :
                       disponibles <= 0 ? "Clase llena" : "Confirmar reservación"}
                    </Button>

                    <p className="text-xs text-center text-muted-foreground">
                      Si no encuentras al cliente, puedes crearlo directamente desde aquí.
                    </p>
                  </div>
                )}
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
