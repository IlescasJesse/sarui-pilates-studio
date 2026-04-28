"use client";

import { useState, useMemo } from "react";
import { useClasesPortal, type ClasePortal } from "@/hooks/usePortal";
import { useRouter } from "next/navigation";
import {
  Clock,
  MapPin,
  Users,
  ChevronRight,
  ChevronLeft,
  Loader2,
} from "lucide-react";

// ── Utilidades de fecha ──────────────────────────────────────────────────────

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0=dom, 1=lun...
  const diff = day === 0 ? -6 : 1 - day; // ajustar para que la semana empiece el lunes
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatHora(iso: string) {
  return new Date(iso).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
}

const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

// ── Tarjeta de clase compacta ────────────────────────────────────────────────

function ClaseRow({ clase }: { clase: ClasePortal }) {
  const router = useRouter();
  const agotada = clase.spotsLeft <= 0;
  const color = clase.tipoActividad?.color ?? "#254F40";

  return (
    <button
      onClick={() => !agotada && router.push(`/portal/agendar/${clase.id}`)}
      disabled={agotada}
      className={`w-full text-left flex items-center gap-4 bg-white rounded-2xl border border-[#254F40]/10 p-4 transition-all duration-150 ${
        agotada
          ? "opacity-50 cursor-not-allowed"
          : "hover:shadow-md hover:-translate-y-0.5"
      }`}
    >
      {/* Hora + barra de color */}
      <div className="flex flex-col items-center gap-1 shrink-0 w-12">
        <div className="w-1 h-10 rounded-full" style={{ backgroundColor: color }} />
        <span className="text-[10px] text-[#254F40]/50 font-medium">
          {formatHora(clase.startAt)}
        </span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-[#254F40] truncate">{clase.title}</p>
        <p className="text-xs text-[#254F40]/50 mt-0.5">
          {clase.instructor.firstName} {clase.instructor.lastName}
          {" · "}
          {formatHora(clase.startAt)}–{formatHora(clase.endAt)}
        </p>
        <div className="flex items-center gap-3 mt-1.5 text-xs text-[#254F40]/60">
          {clase.location && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {clase.location}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {agotada ? (
              <span className="text-red-500 font-medium">Llena</span>
            ) : (
              `${clase.spotsLeft} lugar${clase.spotsLeft !== 1 ? "es" : ""}`
            )}
          </span>
        </div>
      </div>

      {/* Precio + acción */}
      <div className="shrink-0 flex flex-col items-end gap-1.5">
        {clase.costo && (
          <span className="text-sm font-bold text-[#254F40]">
            ${Number(clase.costo).toLocaleString("es-MX")}
          </span>
        )}
        {!agotada && (
          <span className="flex items-center gap-0.5 text-xs font-medium text-[#254F40]/60">
            Agendar <ChevronRight className="w-3.5 h-3.5" />
          </span>
        )}
      </div>
    </button>
  );
}

// ── Página principal ─────────────────────────────────────────────────────────

export default function ClasesPortalPage() {
  const { data: clases, isLoading, error } = useClasesPortal();
  const router = useRouter();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [weekOffset, setWeekOffset] = useState(0); // 0 = semana actual, 1 = siguiente, etc.
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null); // null = todos

  const weekStart = useMemo(() => {
    const base = startOfWeek(today);
    return addDays(base, weekOffset * 7);
  }, [weekOffset]);

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  // Etiqueta de la semana
  const weekLabel = useMemo(() => {
    const end = addDays(weekStart, 6);
    const sameMonth = weekStart.getMonth() === end.getMonth();
    if (sameMonth) {
      return `${weekStart.getDate()} – ${end.getDate()} de ${end.toLocaleDateString("es-MX", { month: "long" })}`;
    }
    return `${weekStart.getDate()} ${weekStart.toLocaleDateString("es-MX", { month: "short" })} – ${end.getDate()} ${end.toLocaleDateString("es-MX", { month: "short" })}`;
  }, [weekStart]);

  // Filtrar clases de la semana seleccionada (y día si aplica)
  const clasesFiltradas = useMemo(() => {
    if (!clases) return [];
    return clases.filter((c) => {
      const fecha = new Date(c.startAt);
      fecha.setHours(0, 0, 0, 0);
      const targetDay =
        selectedDayIndex !== null ? weekDays[selectedDayIndex] : null;
      if (targetDay) return isSameDay(fecha, targetDay);
      // toda la semana
      return fecha >= weekStart && fecha <= addDays(weekStart, 6);
    });
  }, [clases, weekStart, weekDays, selectedDayIndex]);

  // Contar clases por día para los pills
  const countByDay = useMemo(() => {
    if (!clases) return Array(7).fill(0);
    return weekDays.map((day) =>
      clases.filter((c) => {
        const f = new Date(c.startAt);
        f.setHours(0, 0, 0, 0);
        return isSameDay(f, day);
      }).length
    );
  }, [clases, weekDays]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-[#254F40]/50 gap-2">
        <Loader2 className="w-5 h-5 animate-spin" />
        Cargando clases…
      </div>
    );
  }

  if (error || !clases) {
    return (
      <div className="text-center py-20 text-[#254F40]/50">
        No se pudieron cargar las clases. Intenta más tarde.
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#254F40]">Clases</h1>
        <p className="text-sm text-[#254F40]/50 mt-0.5">
          Selecciona una clase y agéndala en segundos
        </p>
      </div>

      {/* Navegación de semana */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => {
            setWeekOffset((o) => o - 1);
            setSelectedDayIndex(null);
          }}
          disabled={weekOffset <= 0}
          className="p-2 rounded-xl border border-[#254F40]/15 text-[#254F40]/50 hover:bg-[#254F40]/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex-1 text-center">
          <p className="text-sm font-semibold text-[#254F40] capitalize">{weekLabel}</p>
          {weekOffset === 0 && (
            <p className="text-[10px] text-[#254F40]/40 mt-0.5">Semana actual</p>
          )}
        </div>

        <button
          onClick={() => {
            setWeekOffset((o) => o + 1);
            setSelectedDayIndex(null);
          }}
          disabled={weekOffset >= 3}
          className="p-2 rounded-xl border border-[#254F40]/15 text-[#254F40]/50 hover:bg-[#254F40]/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Pills de días */}
      <div className="flex gap-1.5 mb-6 overflow-x-auto pb-1">
        {/* Pill "Todos" */}
        <button
          onClick={() => setSelectedDayIndex(null)}
          className={`shrink-0 flex flex-col items-center px-3 py-2 rounded-xl text-xs font-medium transition-all ${
            selectedDayIndex === null
              ? "bg-[#254F40] text-[#F6FFB5]"
              : "bg-[#254F40]/5 text-[#254F40]/60 hover:bg-[#254F40]/10"
          }`}
        >
          <span>Todos</span>
          <span className="text-[10px] mt-0.5 opacity-70">
            {clases.filter((c) => {
              const f = new Date(c.startAt);
              f.setHours(0, 0, 0, 0);
              return f >= weekStart && f <= addDays(weekStart, 6);
            }).length}
          </span>
        </button>

        {weekDays.map((day, i) => {
          const isToday = isSameDay(day, today);
          const isPast = day < today;
          const count = countByDay[i];
          return (
            <button
              key={i}
              onClick={() => setSelectedDayIndex(i === selectedDayIndex ? null : i)}
              disabled={isPast && !isToday}
              className={`shrink-0 flex flex-col items-center px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                selectedDayIndex === i
                  ? "bg-[#254F40] text-[#F6FFB5]"
                  : isToday
                  ? "bg-[#254F40]/15 text-[#254F40] ring-2 ring-[#254F40]/30"
                  : isPast
                  ? "opacity-30 cursor-not-allowed text-[#254F40]/40 bg-[#254F40]/5"
                  : count === 0
                  ? "bg-[#254F40]/5 text-[#254F40]/30"
                  : "bg-[#254F40]/5 text-[#254F40]/60 hover:bg-[#254F40]/10"
              }`}
            >
              <span>{DIAS[i]}</span>
              <span className={`text-[10px] mt-0.5 font-bold ${
                selectedDayIndex === i ? "text-[#F6FFB5]/80" : "text-[#254F40]/40"
              }`}>
                {day.getDate()}
              </span>
              {count > 0 && selectedDayIndex !== i && (
                <span className={`w-1 h-1 rounded-full mt-0.5 ${isToday ? "bg-[#254F40]" : "bg-[#254F40]/30"}`} />
              )}
            </button>
          );
        })}
      </div>

      {/* Lista de clases */}
      {clasesFiltradas.length === 0 ? (
        <div className="text-center py-16 text-[#254F40]/40">
          <Clock className="w-8 h-8 mx-auto mb-3 opacity-30" />
          <p className="text-sm">
            {selectedDayIndex !== null
              ? `Sin clases el ${DIAS[selectedDayIndex]} ${weekDays[selectedDayIndex].getDate()}`
              : "Sin clases esta semana"}
          </p>
          {weekOffset === 0 && (
            <button
              onClick={() => {
                setWeekOffset(1);
                setSelectedDayIndex(null);
              }}
              className="mt-3 text-xs text-[#254F40]/60 underline"
            >
              Ver semana siguiente
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          {clasesFiltradas.map((clase, i) => {
            const fecha = new Date(clase.startAt);
            const prevFecha =
              i > 0 ? new Date(clasesFiltradas[i - 1].startAt) : null;
            const showDateHeader =
              selectedDayIndex === null &&
              (!prevFecha || !isSameDay(fecha, prevFecha));

            return (
              <div key={clase.id}>
                {showDateHeader && (
                  <p className="text-xs font-semibold text-[#254F40]/50 uppercase tracking-wider mt-4 mb-2 capitalize">
                    {fecha.toLocaleDateString("es-MX", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}
                  </p>
                )}
                <ClaseRow clase={clase} />
              </div>
            );
          })}
        </div>
      )}

      {/* Tip de reservación */}
      <div className="mt-8 bg-[#254F40]/5 rounded-2xl p-4 text-center">
        <p className="text-xs text-[#254F40]/60">
          ¿Necesitas ayuda para reservar?{" "}
          <button
            onClick={() => router.push("/portal/mis-agendas")}
            className="underline font-medium text-[#254F40]/80"
          >
            Ver mis agendas
          </button>
        </p>
      </div>
    </div>
  );
}
