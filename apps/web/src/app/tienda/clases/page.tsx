"use client";

import { useState, useMemo } from "react";
import { useClasesPortal, type ClasePortal } from "@/hooks/usePortal";
import { useRouter } from "next/navigation";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs, { type Dayjs } from "dayjs";
import "dayjs/locale/es-mx";
import {
  Clock,
  MapPin,
  Users,
  ChevronRight,
  Loader2,
} from "lucide-react";

dayjs.locale("es-mx");

// ── Utilidades ────────────────────────────────────────────────────────────────

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

// ── Tarjeta de clase ──────────────────────────────────────────────────────────

function ClaseRow({ clase }: { clase: ClasePortal }) {
  const router = useRouter();
  const agotada = clase.spotsLeft <= 0;
  const color = clase.tipoActividad?.color ?? "#254F40";

  return (
    <button
      onClick={() => !agotada && router.push(`/portal/agendar/${clase.id}`)}
      disabled={agotada}
      className={`w-full text-left flex items-center gap-4 bg-white rounded-2xl border border-[#254F40]/10 p-4 transition-all duration-150 ${
        agotada ? "opacity-50 cursor-not-allowed" : "hover:shadow-md hover:-translate-y-0.5"
      }`}
    >
      {/* Barra de color + hora */}
      <div className="flex flex-col items-center gap-1 shrink-0 w-12">
        <div className="w-1 h-10 rounded-full" style={{ backgroundColor: color }} />
        <span className="text-[10px] text-[#254F40]/50 font-medium">{formatHora(clase.startAt)}</span>
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

// ── Página ────────────────────────────────────────────────────────────────────

export default function ClasesPortalPage() {
  const { data: clases, isLoading, error } = useClasesPortal();
  const router = useRouter();

  const todayDayjs = dayjs().startOf("day");
  const [selectedDate, setSelectedDate] = useState<Dayjs>(todayDayjs);

  const clasesFiltradas = useMemo(() => {
    if (!clases) return [];
    const target = selectedDate.toDate();
    return clases.filter((c) => {
      const f = new Date(c.startAt);
      f.setHours(0, 0, 0, 0);
      return isSameDay(f, target);
    });
  }, [clases, selectedDate]);

  // Fechas con clases disponibles (para el DatePicker)
  const diasConClases = useMemo(() => {
    if (!clases) return new Set<string>();
    return new Set(clases.map((c) => dayjs(c.startAt).format("YYYY-MM-DD")));
  }, [clases]);

  function shouldDisableDate(date: Dayjs): boolean {
    return date.isBefore(todayDayjs, "day");
  }

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

  const labelFecha = selectedDate.isSame(todayDayjs, "day")
    ? "Hoy"
    : selectedDate.isSame(todayDayjs.add(1, "day"), "day")
    ? "Mañana"
    : selectedDate.format("dddd D [de] MMMM");

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es-mx">
      <div>
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#254F40]">Clases</h1>
          <p className="text-sm text-[#254F40]/50 mt-0.5">
            Selecciona una fecha y agéndala en segundos
          </p>
        </div>

        {/* DatePicker */}
        <div className="mb-6">
          <DatePicker
            label="Fecha"
            value={selectedDate}
            onChange={(val) => val && setSelectedDate(val)}
            shouldDisableDate={shouldDisableDate}
            slotProps={{
              textField: {
                size: "small",
                sx: {
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "12px",
                    fontSize: "0.875rem",
                    color: "#254F40",
                    "& fieldset": { borderColor: "rgba(37,79,64,0.25)" },
                    "&:hover fieldset": { borderColor: "rgba(37,79,64,0.5)" },
                    "&.Mui-focused fieldset": { borderColor: "#254F40" },
                  },
                  "& .MuiInputLabel-root": {
                    color: "rgba(37,79,64,0.6)",
                    fontSize: "0.875rem",
                    "&.Mui-focused": { color: "#254F40" },
                  },
                  "& .MuiSvgIcon-root": { color: "#254F40" },
                },
              },
              day: {
                sx: {
                  "&.MuiPickersDay-today": {
                    border: "2px solid #254F40",
                    color: "#254F40",
                  },
                  "&.Mui-selected": {
                    backgroundColor: "#254F40 !important",
                    color: "#F6FFB5 !important",
                  },
                },
              },
            }}
          />

          {/* Dot indicators — días con clases */}
          <p className="text-xs text-[#254F40]/40 mt-2">
            {diasConClases.has(selectedDate.format("YYYY-MM-DD")) ? (
              <span className="text-[#254F40]/60">
                {clasesFiltradas.length} clase{clasesFiltradas.length !== 1 ? "s" : ""} disponible{clasesFiltradas.length !== 1 ? "s" : ""}
              </span>
            ) : (
              "Sin clases este día"
            )}
          </p>
        </div>

        {/* Encabezado del día */}
        <p className="text-sm font-semibold text-[#254F40]/60 capitalize mb-3">{labelFecha}</p>

        {/* Lista */}
        {clasesFiltradas.length === 0 ? (
          <div className="text-center py-16 text-[#254F40]/40">
            <Clock className="w-8 h-8 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Sin clases para este día</p>
            <button
              onClick={() => setSelectedDate(todayDayjs.add(1, "day"))}
              className="mt-3 text-xs text-[#254F40]/60 underline"
            >
              Ver mañana
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {clasesFiltradas.map((clase) => (
              <ClaseRow key={clase.id} clase={clase} />
            ))}
          </div>
        )}

        {/* Tip */}
        <div className="mt-8 bg-[#254F40]/5 rounded-2xl p-4 text-center">
          <p className="text-xs text-[#254F40]/60">
            ¿Necesitas ayuda para reservar?{" "}
            <button
              onClick={() => router.push("/tienda/mis-agendas")}
              className="underline font-medium text-[#254F40]/80"
            >
              Ver mis agendas
            </button>
          </p>
        </div>
      </div>
    </LocalizationProvider>
  );
}
