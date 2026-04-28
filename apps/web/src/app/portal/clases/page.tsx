"use client";

import { useClasesPortal, type ClasePortal } from "@/hooks/usePortal";
import { useRouter } from "next/navigation";
import { Calendar, Clock, MapPin, Users, ChevronRight, Loader2 } from "lucide-react";

function formatFecha(iso: string) {
  return new Date(iso).toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function formatHora(iso: string) {
  return new Date(iso).toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ClaseCard({ clase }: { clase: ClasePortal }) {
  const router = useRouter();
  const agotada = clase.spotsLeft <= 0;
  const color = clase.tipoActividad?.color ?? "#254F40";

  return (
    <div
      className={`bg-white rounded-2xl border border-[#254F40]/10 overflow-hidden transition-all duration-200 ${
        agotada ? "opacity-60" : "hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
      }`}
      onClick={() => !agotada && router.push(`/portal/agendar/${clase.id}`)}
    >
      {/* Barra de color */}
      <div className="h-1.5 w-full" style={{ backgroundColor: color }} />

      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h3 className="font-semibold text-[#254F40] text-base leading-tight">{clase.title}</h3>
            <p className="text-xs text-[#254F40]/50 mt-0.5">
              Con {clase.instructor.firstName} {clase.instructor.lastName}
            </p>
          </div>
          {clase.costo && (
            <span className="text-sm font-bold text-[#254F40] whitespace-nowrap">
              ${Number(clase.costo).toLocaleString("es-MX")} MXN
            </span>
          )}
        </div>

        <div className="space-y-1.5 text-xs text-[#254F40]/70">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            <span className="capitalize">{formatFecha(clase.startAt)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>
              {formatHora(clase.startAt)} – {formatHora(clase.endAt)}
            </span>
          </div>
          {clase.location && (
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              <span>{clase.location}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            <span>
              {agotada ? (
                <span className="text-red-500 font-medium">Sin lugares disponibles</span>
              ) : (
                `${clase.spotsLeft} lugar${clase.spotsLeft !== 1 ? "es" : ""} disponible${clase.spotsLeft !== 1 ? "s" : ""}`
              )}
            </span>
          </div>
        </div>

        {!agotada && (
          <div className="mt-4 flex items-center justify-end text-[#254F40] text-xs font-medium gap-1">
            Agendar <ChevronRight className="w-3.5 h-3.5" />
          </div>
        )}
      </div>
    </div>
  );
}

// Agrupa clases por fecha
function groupByDate(clases: ClasePortal[]) {
  const groups: Record<string, ClasePortal[]> = {};
  for (const c of clases) {
    const key = new Date(c.startAt).toDateString();
    if (!groups[key]) groups[key] = [];
    groups[key].push(c);
  }
  return groups;
}

export default function ClasesPortalPage() {
  const { data: clases, isLoading, error } = useClasesPortal();

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

  if (clases.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-[#254F40]/50">No hay clases disponibles en este momento.</p>
        <p className="text-sm text-[#254F40]/40 mt-1">
          Contáctanos por WhatsApp para más información.
        </p>
      </div>
    );
  }

  const groups = groupByDate(clases);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#254F40]">Clases disponibles</h1>
        <p className="text-sm text-[#254F40]/60 mt-1">Próximos 30 días</p>
      </div>

      <div className="space-y-8">
        {Object.entries(groups).map(([dateKey, items]) => (
          <section key={dateKey}>
            <h2 className="text-sm font-semibold text-[#254F40]/60 uppercase tracking-wider mb-3 capitalize">
              {new Date(dateKey).toLocaleDateString("es-MX", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((c) => (
                <ClaseCard key={c.id} clase={c} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
