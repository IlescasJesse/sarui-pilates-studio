"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle, Download, Loader2, CalendarDays, Clock } from "lucide-react";
import { portalAuthClient } from "@/lib/portal-client";
import { downloadQRCard } from "@/lib/qr-card";
import { useMisMembresias } from "@/hooks/usePortal";

function MembresiaExitosaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [confirming, setConfirming] = useState(true);
  const [qrData, setQrData] = useState<{ qrImage: string; name: string } | null>(null);
  const [descargandoQR, setDescargandoQR] = useState(false);
  const { data: membresias, refetch } = useMisMembresias();

  useEffect(() => {
    const paymentId = searchParams.get("payment_id") ?? searchParams.get("collection_id");
    const status = searchParams.get("status") ?? searchParams.get("collection_status");

    async function confirmar() {
      try {
        if (paymentId && status === "approved") {
          await portalAuthClient.post("/portal/verificar-pago-paquete", { paymentId });
        }
        await refetch();
        const res = await portalAuthClient.get<{ success: boolean; data: { qrImage: string; name: string } }>(
          "/portal/mi-qr"
        );
        setQrData(res.data.data);
      } catch {
        // no bloqueamos
      } finally {
        setConfirming(false);
      }
    }

    confirmar();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleDescargar() {
    if (!qrData) return;
    setDescargandoQR(true);
    try {
      await downloadQRCard(qrData.qrImage, qrData.name);
    } finally {
      setDescargandoQR(false);
    }
  }

  const membresiaActiva = membresias?.find(
    (m) => m.status === "ACTIVE" && m.sessionsRemaining > 0
  );

  const vigencia = membresiaActiva
    ? new Date(membresiaActiva.expiresAt).toLocaleDateString("es-MX", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div className="flex min-h-[60vh] items-center justify-center py-8">
      <div className="max-w-sm w-full space-y-4">

        {/* Card principal */}
        <div className="bg-white rounded-2xl border border-[#254F40]/10 p-10 text-center shadow-sm">
          {confirming ? (
            <div className="flex flex-col items-center gap-3 py-4">
              <Loader2 className="w-8 h-8 text-[#254F40] animate-spin" />
              <p className="text-sm text-[#254F40]/60">Activando tu membresía…</p>
            </div>
          ) : (
            <>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h1 className="text-xl font-bold text-[#254F40] mb-1">¡Membresía activada!</h1>
              <p className="text-sm text-[#254F40]/60 mb-4">
                Ya puedes reservar tus clases en Sarui Studio.
              </p>

              {/* Vigencia y sesiones */}
              {membresiaActiva && (
                <div className="bg-[#254F40]/5 rounded-xl p-4 mb-6 space-y-2 text-left">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-[#254F40]/60 shrink-0" />
                    <p className="text-xs text-[#254F40]/70">
                      <span className="font-semibold text-[#254F40]">Vigencia:</span> {vigencia}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#254F40]/60 shrink-0" />
                    <p className="text-xs text-[#254F40]/70">
                      <span className="font-semibold text-[#254F40]">Sesiones disponibles:</span>{" "}
                      {membresiaActiva.sessionsRemaining} de {membresiaActiva.totalSessions}
                    </p>
                  </div>
                </div>
              )}

              {/* CTAs */}
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => router.push("/tienda/clases")}
                  className="w-full bg-[#254F40] text-[#F6FFB5] font-semibold py-2.5 rounded-xl hover:bg-[#254F40]/90 transition-colors flex items-center justify-center gap-2"
                >
                  <CalendarDays className="w-4 h-4" />
                  Agendar clase ahora
                </button>
                <button
                  onClick={() => router.push("/tienda/membresia")}
                  className="w-full border border-[#254F40]/20 text-[#254F40]/70 font-medium py-2.5 rounded-xl hover:bg-[#254F40]/5 transition-colors text-sm"
                >
                  Ver mis membresías
                </button>
              </div>
            </>
          )}
        </div>

        {/* Descarga QR */}
        {!confirming && qrData && (
          <div className="bg-white rounded-2xl border border-[#254F40]/10 p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-[#254F40]/10 rounded-xl flex items-center justify-center shrink-0">
                <Download className="w-5 h-5 text-[#254F40]" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-[#254F40] text-sm mb-1">
                  ¿Deseas descargar tu credencial de acceso?
                </p>
                <p className="text-xs text-[#254F40]/50 mb-4">
                  Preséntala en el kiosk cada vez que llegues al estudio.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleDescargar}
                    disabled={descargandoQR}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#254F40] text-[#F6FFB5] text-sm font-medium hover:bg-[#254F40]/90 transition-colors disabled:opacity-60"
                  >
                    {descargandoQR ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Download className="w-3.5 h-3.5" />
                    )}
                    {descargandoQR ? "Descargando…" : "Sí, descargar"}
                  </button>
                  <button
                    onClick={() => setQrData(null)}
                    className="px-4 py-2 rounded-lg border border-[#254F40]/20 text-sm text-[#254F40]/60 hover:bg-[#254F40]/5 transition-colors"
                  >
                    Ahora no
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MembresiaExitosaPage() {
  return (
    <Suspense fallback={null}>
      <MembresiaExitosaContent />
    </Suspense>
  );
}
