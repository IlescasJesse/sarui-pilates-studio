"use client";

import { useEffect, useState } from "react";
import { Check, X, Clock } from "lucide-react";
import { apiClient } from "@/lib/api-client";

interface Solicitud {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  mensaje?: string;
  status: string;
  createdAt: string;
}

export function SolicitudesTable() {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<"PENDIENTE" | "APROBADA" | "RECHAZADA" | "">("");

  const fetchSolicitudes = async () => {
    setLoading(true);
    try {
      const params = filtro ? { status: filtro } : {};
      const res = await apiClient.get<{ data: Solicitud[] }>("/portal/solicitudes", { params });
      setSolicitudes(res.data.data ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSolicitudes(); }, [filtro]);

  const cambiarStatus = async (id: string, status: "APROBADA" | "RECHAZADA") => {
    await apiClient.patch(`/portal/solicitudes/${id}`, { status });
    fetchSolicitudes();
  };

  const badgeColor = (status: string) => {
    if (status === "APROBADA") return "bg-green-100 text-green-700";
    if (status === "RECHAZADA") return "bg-red-100 text-red-700";
    return "bg-yellow-100 text-yellow-700";
  };

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        {(["", "PENDIENTE", "APROBADA", "RECHAZADA"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFiltro(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              filtro === s
                ? "bg-[#254F40] text-[#F6FFB5]"
                : "bg-[#254F40]/10 text-[#254F40] hover:bg-[#254F40]/20"
            }`}
          >
            {s === "" ? "Todas" : s.charAt(0) + s.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground py-8 text-center">Cargando...</p>
      ) : solicitudes.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Clock className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No hay solicitudes</p>
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[#254F40]/5 text-[#254F40]">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Nombre</th>
                <th className="text-left px-4 py-3 font-medium">Correo</th>
                <th className="text-left px-4 py-3 font-medium">Teléfono</th>
                <th className="text-left px-4 py-3 font-medium">Mensaje</th>
                <th className="text-left px-4 py-3 font-medium">Fecha</th>
                <th className="text-left px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {solicitudes.map((s) => (
                <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium">{s.nombre} {s.apellido}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.email}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.telefono}</td>
                  <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">{s.mensaje ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                    {new Date(s.createdAt).toLocaleDateString("es-MX")}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${badgeColor(s.status)}`}>
                      {s.status.charAt(0) + s.status.slice(1).toLowerCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {s.status === "PENDIENTE" && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => cambiarStatus(s.id, "APROBADA")}
                          className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
                          title="Aprobar"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => cambiarStatus(s.id, "RECHAZADA")}
                          className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                          title="Rechazar"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
