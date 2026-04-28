"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle, Loader2 } from "lucide-react";
import { portalAuthClient } from "@/lib/portal-client";

export default function PagoExitosoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [confirming, setConfirming] = useState(true);

  useEffect(() => {
    // MercadoPago envía payment_id en los query params al redirigir
    const paymentId = searchParams.get("payment_id") ?? searchParams.get("collection_id");
    const status = searchParams.get("status") ?? searchParams.get("collection_status");

    if (paymentId && status === "approved") {
      portalAuthClient
        .post("/portal/verificar-pago", { paymentId })
        .catch(() => {
          // Si falla la verificación, no bloqueamos al usuario — el webhook lo manejará
        })
        .finally(() => setConfirming(false));
    } else {
      setConfirming(false);
    }
  }, [searchParams]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="bg-white rounded-2xl border border-[#254F40]/10 p-10 text-center max-w-sm w-full">
        {confirming ? (
          <div className="flex flex-col items-center gap-3 py-4">
            <Loader2 className="w-8 h-8 text-[#254F40] animate-spin" />
            <p className="text-sm text-[#254F40]/60">Confirmando tu reservación…</p>
          </div>
        ) : (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-xl font-bold text-[#254F40] mb-2">¡Pago completado!</h1>
            <p className="text-sm text-[#254F40]/60 mb-6">
              Tu reservación quedó confirmada. Te esperamos en el estudio.
            </p>
            <button
              onClick={() => router.push("/portal/mis-agendas")}
              className="w-full bg-[#254F40] text-[#F6FFB5] font-semibold py-2.5 rounded-xl hover:bg-[#254F40]/90 transition-colors"
            >
              Ver mis agendas
            </button>
          </>
        )}
      </div>
    </div>
  );
}
