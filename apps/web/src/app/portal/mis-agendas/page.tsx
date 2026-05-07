"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMisAgendas, useMisMembresias, type AgendaPortal } from "@/hooks/usePortal";
import { Calendar, Clock, CheckCircle, Clock3, XCircle, Loader2, Package } from "lucide-react";

function formatFecha(iso: string) {
  return new Date(iso).toLocaleDateString("es-MX", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
function formatHora(iso: string) {
  return new Date(iso).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
}

const statusConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  CONFIRMED: {
    label: "Confirmada",
    icon: <CheckCircle className="w-4 h-4" />,
    color: "text-green-600 bg-green-50 border-green-200",
  },
  PENDING_APPROVAL: {
    label: "Pendiente de aprobación",
    icon: <Clock3 className="w-4 h-4" />,
    color: "text-amber-600 bg-amber-50 border-amber-200",
  },
  CANCELLED: {
    label: "Cancelada",
    icon: <XCircle className="w-4 h-4" />,
    color: "text-red-500 bg-red-50 border-red-200",
  },
  ATTENDED: {
    label: "Asistida",
    icon: <CheckCircle className="w-4 h-4" />,
    color: "text-[#254F40] bg-[#254F40]/10 border-[#254F40]/20",
  },
};

function AgendaCard({ agenda }: { agenda: AgendaPortal }) {
  const sc = statusConfig[agenda.status] ?? {
    label: agenda.status,
    icon: null,
    color: "text-gray-500 bg-gray-50 border-gray-200",
  };
  const color = agenda.class.tipoActividad?.color ?? "#254F40";
  const esSolicitud = agenda.origin === "PORTAL_REQUEST";

  return (
    <div className="bg-white rounded-2xl border border-[#254F40]/10 overflow-hidden">
      <div className="h-1" style={{ backgroundColor: color }} />
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h3 className="font-semibold text-[#254F40]">
              {agenda.class.title ?? agenda.class.tipoActividad?.nombre ?? "Clase"}
            </h3>
            <p className="text-xs text-[#254F40]/50 mt-0.5">
              Con {agenda.class.instructor.firstName} {agenda.class.instructor.lastName}
            </p>
          </div>
          <div className={`flex items-center gap-1.5 text-xs font-medium border rounded-full px-2.5 py-1 ${sc.color}`}>
            {sc.icon}
            {sc.label}
          </div>
        </div>

        <div className="space-y-1.5 text-xs text-[#254F40]/70">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            <span className="capitalize">{formatFecha(agenda.class.startAt)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>
              {formatHora(agenda.class.startAt)} – {formatHora(agenda.class.endAt)}
            </span>
          </div>
        </div>

        {esSolicitud && agenda.status === "PENDING_APPROVAL" && (
          <p className="mt-3 text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
            Solicitud enviada. El equipo la revisará y te confirmará por WhatsApp.
          </p>
        )}
      </div>
    </div>
  );
}

export default function MisAgendasPage() {
  const router = useRouter();
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("sarui_token");
    if (!token) router.push("/portal/login?redirect=/portal/mis-agendas");
    else setIsAuthed(true);
  }, [router]);

  const { data: agendas, isLoading } = useMisAgendas();
  const { data: membresias } = useMisMembresias();

  if (isAuthed === null || isLoading) {
    return (
      <div className="flex items-center justify-center py-20 gap-2 text-[#254F40]/50">
        <Loader2 className="w-5 h-5 animate-spin" />
        Cargando…
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#254F40]">Mis agendas</h1>
        <p className="text-sm text-[#254F40]/60 mt-1">Tus reservaciones en Sarui Studio</p>
      </div>

      {/* Banner si no tiene membresía activa */}
      {membresias !== undefined && membresias.length === 0 && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
            <Package className="w-4 h-4 text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-amber-800">Sin membresía activa</p>
            <p className="text-xs text-amber-600 mt-0.5">Adquiere un paquete para reservar clases.</p>
          </div>
          <button
            onClick={() => router.push("/portal/membresia")}
            className="shrink-0 text-xs font-semibold text-amber-800 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-colors"
          >
            Ver paquetes
          </button>
        </div>
      )}

      {!agendas || agendas.length === 0 ? (
        <div className="text-center py-16 text-[#254F40]/50">
          <p>Aún no tienes agendas.</p>
          <button
            onClick={() => router.push("/portal/clases")}
            className="mt-3 text-sm underline text-[#254F40]"
          >
            Ver clases disponibles
          </button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {agendas.map((a) => (
            <AgendaCard key={a.id} agenda={a} />
          ))}
        </div>
      )}
    </div>
  );
}
