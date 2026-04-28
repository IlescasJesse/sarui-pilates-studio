"use client";

import { useState } from "react";
import {
  useAgendasPortal,
  useAprobarAgenda,
  useDeclinarAgenda,
  type AgendaPortalAdmin,
} from "@/hooks/useAgendasPortal";
import { CheckCircle, XCircle, Clock3, CreditCard, MessageCircle, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

function formatFecha(iso: string) {
  return new Date(iso).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
function formatHora(iso: string) {
  return new Date(iso).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
}

const statusBadge: Record<string, { label: string; class: string }> = {
  CONFIRMED: { label: "Confirmada", class: "bg-green-100 text-green-700 border-green-200" },
  PENDING_APPROVAL: { label: "Pendiente", class: "bg-amber-100 text-amber-700 border-amber-200" },
  CANCELLED: { label: "Cancelada", class: "bg-red-100 text-red-600 border-red-200" },
  ATTENDED: { label: "Asistió", class: "bg-[#254F40]/10 text-[#254F40] border-[#254F40]/20" },
};

const originBadge: Record<string, { label: string; icon: React.ReactNode }> = {
  PORTAL: {
    label: "Con pago",
    icon: <CreditCard className="w-3 h-3" />,
  },
  PORTAL_REQUEST: {
    label: "Solicitud",
    icon: <MessageCircle className="w-3 h-3" />,
  },
};

interface DeclinarDialogProps {
  agenda: AgendaPortalAdmin;
  onClose: () => void;
}
function DeclinarDialog({ agenda, onClose }: DeclinarDialogProps) {
  const [razon, setRazon] = useState("");
  const declinar = useDeclinarAgenda();

  async function handleDeclinar() {
    await declinar.mutateAsync({ id: agenda.id, razon: razon.trim() || undefined });
    onClose();
  }

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle className="text-[#254F40]">Declinar solicitud</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <div className="bg-[#254F40]/5 rounded-xl p-4 text-sm text-[#254F40]/70">
          <p className="font-medium text-[#254F40]">
            {agenda.client.firstName} {agenda.client.lastName}
          </p>
          <p>{agenda.class.title ?? agenda.class.tipoActividad?.nombre ?? "Clase"}</p>
          <p className="capitalize">{formatFecha(agenda.class.startAt)} · {formatHora(agenda.class.startAt)}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#254F40] mb-1.5">
            Razón (opcional)
          </label>
          <textarea
            value={razon}
            onChange={(e) => setRazon(e.target.value)}
            placeholder="Ej. La clase ya está llena, horario no disponible…"
            rows={3}
            className="w-full border border-[#254F40]/20 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#254F40]/20"
          />
        </div>

        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose} className="border-[#254F40]/20">
            Cancelar
          </Button>
          <Button
            onClick={handleDeclinar}
            disabled={declinar.isPending}
            className="bg-red-500 hover:bg-red-600 text-white"
          >
            {declinar.isPending && <Loader2 className="w-4 h-4 animate-spin mr-1.5" />}
            Declinar solicitud
          </Button>
        </div>
      </div>
    </DialogContent>
  );
}

type Filtro = "todas" | "PENDING_APPROVAL" | "CONFIRMED" | "CANCELLED";

export function AgendasPortalTable() {
  const [filtro, setFiltro] = useState<Filtro>("todas");
  const [declinarAgenda, setDeclinarAgenda] = useState<AgendaPortalAdmin | null>(null);

  const { data: agendas, isLoading } = useAgendasPortal(
    filtro === "todas" ? undefined : filtro
  );
  const aprobar = useAprobarAgenda();

  const filtros: { key: Filtro; label: string }[] = [
    { key: "todas", label: "Todas" },
    { key: "PENDING_APPROVAL", label: "Pendientes" },
    { key: "CONFIRMED", label: "Confirmadas" },
    { key: "CANCELLED", label: "Canceladas" },
  ];

  async function handleAprobar(id: string) {
    await aprobar.mutateAsync(id);
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        {filtros.map((f) => (
          <button
            key={f.key}
            onClick={() => setFiltro(f.key)}
            className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors border ${
              filtro === f.key
                ? "bg-[#254F40] text-[#F6FFB5] border-[#254F40]"
                : "border-[#254F40]/20 text-[#254F40]/60 hover:border-[#254F40]/40"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Tabla */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12 gap-2 text-[#254F40]/50">
          <Loader2 className="w-5 h-5 animate-spin" />
          Cargando agendas…
        </div>
      ) : !agendas || agendas.length === 0 ? (
        <div className="text-center py-12 text-[#254F40]/40 text-sm">
          No hay agendas del portal{filtro !== "todas" ? ` con este estado` : ""}.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#254F40]/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#254F40] text-[#F6FFB5]">
                <th className="text-left px-4 py-3 font-medium">Cliente</th>
                <th className="text-left px-4 py-3 font-medium">Clase</th>
                <th className="text-left px-4 py-3 font-medium">Fecha</th>
                <th className="text-left px-4 py-3 font-medium">Tipo</th>
                <th className="text-left px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#254F40]/5">
              {agendas.map((a) => {
                const sb = statusBadge[a.status] ?? {
                  label: a.status,
                  class: "bg-gray-100 text-gray-600 border-gray-200",
                };
                const ob = originBadge[a.origin];
                const isPending = a.status === "PENDING_APPROVAL";

                return (
                  <tr key={a.id} className="bg-white hover:bg-[#254F40]/[0.02] transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-[#254F40]">
                        {a.client.firstName} {a.client.lastName}
                      </p>
                      {a.client.phone && (
                        <p className="text-xs text-[#254F40]/50">{a.client.phone}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-[#254F40]">
                        {a.class.title ?? a.class.tipoActividad?.nombre ?? "Clase"}
                      </p>
                      <p className="text-xs text-[#254F40]/50">
                        {a.class.instructor.firstName} {a.class.instructor.lastName}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-[#254F40]/70 whitespace-nowrap">
                      <p className="capitalize">{formatFecha(a.class.startAt)}</p>
                      <p className="text-xs">{formatHora(a.class.startAt)}</p>
                    </td>
                    <td className="px-4 py-3">
                      {ob && (
                        <span className="flex items-center gap-1.5 text-xs font-medium text-[#254F40]/60">
                          {ob.icon}
                          {ob.label}
                        </span>
                      )}
                      {a.origin === "PORTAL_REQUEST" && a.portalWaConfirmed && (
                        <span className="text-xs text-[#254F40]/40">WA confirmado</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium border rounded-full px-2.5 py-1 ${sb.class}`}>
                        {a.status === "CONFIRMED" && <CheckCircle className="w-3 h-3" />}
                        {a.status === "PENDING_APPROVAL" && <Clock3 className="w-3 h-3" />}
                        {a.status === "CANCELLED" && <XCircle className="w-3 h-3" />}
                        {sb.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {isPending && a.origin === "PORTAL_REQUEST" && (
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => handleAprobar(a.id)}
                            disabled={aprobar.isPending}
                            className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 bg-[#254F40] text-[#F6FFB5] rounded-lg hover:bg-[#254F40]/90 transition-colors disabled:opacity-60"
                          >
                            {aprobar.isPending ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <CheckCircle className="w-3 h-3" />
                            )}
                            Aprobar
                          </button>
                          <button
                            onClick={() => setDeclinarAgenda(a)}
                            className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 border border-red-200 text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                          >
                            <XCircle className="w-3 h-3" />
                            Declinar
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Dialog declinar */}
      <Dialog open={!!declinarAgenda} onOpenChange={(o) => !o && setDeclinarAgenda(null)}>
        {declinarAgenda && (
          <DeclinarDialog
            agenda={declinarAgenda}
            onClose={() => setDeclinarAgenda(null)}
          />
        )}
      </Dialog>
    </div>
  );
}
