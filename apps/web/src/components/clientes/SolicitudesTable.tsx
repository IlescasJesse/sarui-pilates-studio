"use client";

import { useEffect, useState } from "react";
import { Check, X, Clock, Copy, CheckCircle, AlertTriangle, Trash2, Loader2 } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";

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
  const [setupLink, setSetupLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [forceSolicitud, setForceSolicitud] = useState<{ id: string; email: string; name: string } | null>(null);
  const [forceLoading, setForceLoading] = useState(false);

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
    try {
      const res = await apiClient.patch<{ data: { setupLink?: string } }>(`/portal/solicitudes/${id}`, { status });
      if (status === "APROBADA" && res.data?.data?.setupLink) {
        setSetupLink(res.data.data.setupLink);
      }
      fetchSolicitudes();
    } catch (err: unknown) {
      const code = (err as { response?: { data?: { error?: { code?: string; message?: string } } } })?.response?.data?.error;
      if (code?.code === "EMAIL_TAKEN") {
        const solicitud = solicitudes.find((s) => s.id === id);
        setForceSolicitud({
          id,
          email: solicitud?.email ?? "",
          name: `${solicitud?.nombre ?? ""} ${solicitud?.apellido ?? ""}`.trim(),
        });
      } else {
        toast.error(code?.message ?? "Error al cambiar estado");
      }
    }
  };

  const copyLink = () => {
    if (setupLink) {
      navigator.clipboard.writeText(setupLink);
      setCopied(true);
      toast.success("Enlace copiado");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const badgeColor = (status: string) => {
    if (status === "APROBADA") return "bg-green-100 text-green-700";
    if (status === "RECHAZADA") return "bg-red-100 text-red-700";
    return "bg-yellow-100 text-yellow-700";
  };

  return (
    <div className="space-y-4">
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

      <Dialog open={!!forceSolicitud} onOpenChange={(open) => { if (!open) setForceSolicitud(null); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              El cliente ya existe
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground pt-1">
              El correo <strong>{forceSolicitud?.email}</strong> ya está registrado como usuario activo.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800 space-y-2">
              <p className="font-semibold flex items-center gap-2">
                <Trash2 className="w-4 h-4" />
                Se eliminarán todos los datos del usuario existente:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-red-700">
                <li>Reservaciones (historial de clases agendadas)</li>
                <li>Membresías y paquetes activos</li>
                <li>Asistencias registradas</li>
                <li>Tokens de sesión</li>
                <li>Cuenta de usuario y perfil de cliente</li>
              </ul>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
              <p className="font-medium">Después de la aprobación:</p>
              <ul className="list-disc pl-5 mt-1 space-y-0.5 text-amber-700">
                <li>Se creará una cuenta nueva con los datos de la solicitud</li>
                <li>Se enviará un correo a <strong>{forceSolicitud?.email}</strong> para que establezca su contraseña</li>
                <li>El enlace expira en 24 horas</li>
              </ul>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={() => setForceSolicitud(null)}
                className="px-4 py-2 rounded-lg border text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  if (!forceSolicitud) return;
                  setForceLoading(true);
                  try {
                    const res = await apiClient.patch<{ data: { setupLink?: string } }>(
                      `/portal/solicitudes/${forceSolicitud.id}`,
                      { status: "APROBADA", force: true }
                    );
                    setForceSolicitud(null);
                    if (res.data?.data?.setupLink) {
                      setSetupLink(res.data.data.setupLink);
                    }
                    fetchSolicitudes();
                  } catch (err: unknown) {
                    const msg = (err as { response?: { data?: { error?: { message?: string } } } })
                      ?.response?.data?.error?.message ?? "Error al forzar aprobación";
                    toast.error(msg);
                  } finally {
                    setForceLoading(false);
                  }
                }}
                disabled={forceLoading}
                className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-60 flex items-center gap-2"
              >
                {forceLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Forzar aprobación
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!setupLink} onOpenChange={(open) => { if (!open) setSetupLink(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Solicitud aprobada
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              El cliente fue creado. Comparte este enlace para que establezca su contraseña:
            </p>
            <div className="flex items-center gap-2 bg-[#254F40]/5 rounded-lg p-3 border">
              <code className="text-xs flex-1 break-all text-[#254F40]">{setupLink}</code>
              <button
                onClick={copyLink}
                className="shrink-0 p-2 rounded-md bg-[#254F40] text-[#F6FFB5] hover:bg-[#254F40]/90 transition-colors"
                title="Copiar"
              >
                {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              El enlace expira en 24 horas. También puedes copiarlo y enviarlo por WhatsApp.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
