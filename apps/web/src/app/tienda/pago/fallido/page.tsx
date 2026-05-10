"use client";

import { useRouter } from "next/navigation";
import { XCircle } from "lucide-react";

export default function PagoFallidoPage() {
  const router = useRouter();
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="bg-white rounded-2xl border border-[#254F40]/10 p-10 text-center max-w-sm w-full">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <XCircle className="w-8 h-8 text-red-500" />
        </div>
        <h1 className="text-xl font-bold text-[#254F40] mb-2">El pago no se completó</h1>
        <p className="text-sm text-[#254F40]/60 mb-6">
          Hubo un problema con tu pago. No se realizó ningún cargo. Puedes intentarlo de nuevo.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => router.back()}
            className="flex-1 py-2.5 rounded-xl bg-[#254F40] text-[#F6FFB5] font-semibold text-sm hover:bg-[#254F40]/90 transition-colors"
          >
            Intentar de nuevo
          </button>
          <button
            onClick={() => router.push("/tienda/clases")}
            className="flex-1 py-2.5 rounded-xl border border-[#254F40]/20 text-[#254F40]/70 text-sm hover:bg-[#254F40]/5 transition-colors"
          >
            Ver clases
          </button>
        </div>
      </div>
    </div>
  );
}
