"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePortalPaquetes, useMisMembresias, useComprarPaquete } from "@/hooks/usePortal";
import { initMercadoPago, Wallet } from "@mercadopago/sdk-react";
import {
  CheckCircle,
  Loader2,
  Package,
  Clock,
  Zap,
  ChevronRight,
  ArrowLeft,
  ShieldCheck,
} from "lucide-react";

const MP_PUBLIC_KEY = process.env.NEXT_PUBLIC_MP_PUBLIC_KEY ?? "";

function formatFecha(iso: string) {
  return new Date(iso).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function MembresiaPortalPage() {
  const router = useRouter();
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [preferenceId, setPreferenceId] = useState<string | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);

  const { data: paquetes, isLoading: loadingPaquetes } = usePortalPaquetes();
  const { data: membresias, isLoading: loadingMembresias } = useMisMembresias();
  const comprar = useComprarPaquete();

  useEffect(() => {
    if (MP_PUBLIC_KEY) initMercadoPago(MP_PUBLIC_KEY, { locale: "es-MX" });
    const token = localStorage.getItem("sarui_token");
    if (!token) {
      router.push("/portal/login?redirect=/portal/membresia");
    } else {
      setIsAuthed(true);
    }
  }, [router]);

  async function handleSeleccionar(packageId: string) {
    setSelectedPackageId(packageId);
    setPreferenceId(null);
    try {
      const result = await comprar.mutateAsync(packageId);
      setPreferenceId(result.preferenceId);
      setCheckoutUrl(result.checkoutUrl ?? null);
    } catch {
      setSelectedPackageId(null);
    }
  }

  if (isAuthed === null || loadingPaquetes || loadingMembresias) {
    return (
      <div className="flex items-center justify-center py-20 gap-2 text-[#254F40]/50">
        <Loader2 className="w-5 h-5 animate-spin" />
        Cargando…
      </div>
    );
  }

  const membresiaActiva = membresias && membresias.length > 0 ? membresias[0] : null;

  return (
    <div className="max-w-2xl mx-auto">
      <button
        onClick={() => router.push("/portal/clases")}
        className="flex items-center gap-1.5 text-sm text-[#254F40]/60 hover:text-[#254F40] mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Volver a clases
      </button>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#254F40]">Membresía</h1>
        <p className="text-sm text-[#254F40]/50 mt-0.5">Adquiere un paquete y empieza a reservar clases</p>
      </div>

      {/* Membresía activa */}
      {membresiaActiva && (
        <div className="bg-[#254F40] text-[#F6FFB5] rounded-2xl p-5 mb-6">
          <div className="flex items-start gap-3">
            <div className="bg-[#F6FFB5]/20 rounded-xl p-2 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">Membresía activa</p>
              <p className="text-[#F6FFB5]/70 text-xs mt-0.5">{membresiaActiva.package.name}</p>
              <div className="flex items-center gap-4 mt-3 text-xs">
                <span className="bg-[#F6FFB5]/20 rounded-lg px-2.5 py-1">
                  {membresiaActiva.sessionsRemaining} sesión{membresiaActiva.sessionsRemaining !== 1 ? "es" : ""} restante{membresiaActiva.sessionsRemaining !== 1 ? "s" : ""}
                </span>
                <span className="text-[#F6FFB5]/60">
                  Vence {formatFecha(membresiaActiva.expiresAt)}
                </span>
              </div>
            </div>
            <button
              onClick={() => router.push("/portal/clases")}
              className="text-[#F6FFB5]/80 hover:text-[#F6FFB5] transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Lista de paquetes */}
      {!preferenceId ? (
        <>
          <p className="text-xs font-semibold text-[#254F40]/40 uppercase tracking-wider mb-3">
            {membresiaActiva ? "Renovar o agregar paquete" : "Elige un paquete"}
          </p>
          <div className="space-y-3">
            {paquetes?.length === 0 && (
              <div className="text-center py-12 text-[#254F40]/40">
                <Package className="w-8 h-8 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No hay paquetes disponibles por ahora.</p>
              </div>
            )}
            {paquetes?.map((pkg) => {
              const isLoading = comprar.isPending && selectedPackageId === pkg.id;
              const color = pkg.tipoActividad?.color ?? "#254F40";

              return (
                <button
                  key={pkg.id}
                  onClick={() => handleSeleccionar(pkg.id)}
                  disabled={comprar.isPending}
                  className="w-full text-left bg-white rounded-2xl border border-[#254F40]/10 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 disabled:opacity-60"
                >
                  <div className="h-1 w-full" style={{ backgroundColor: color }} />
                  <div className="p-5 flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[#254F40]">{pkg.name}</p>
                      {pkg.tipoActividad && (
                        <p className="text-xs text-[#254F40]/50 mt-0.5">{pkg.tipoActividad.nombre}</p>
                      )}
                      {pkg.description && (
                        <p className="text-xs text-[#254F40]/60 mt-1">{pkg.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-3 text-xs text-[#254F40]/60">
                        <span className="flex items-center gap-1">
                          <Zap className="w-3 h-3" />
                          {pkg.sessions} sesión{pkg.sessions !== 1 ? "es" : ""}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {pkg.validityDays} días de vigencia
                        </span>
                      </div>
                    </div>
                    <div className="shrink-0 flex flex-col items-end gap-2">
                      <span className="text-lg font-bold text-[#254F40]">
                        ${Number(pkg.price).toLocaleString("es-MX")}
                        <span className="text-xs font-normal text-[#254F40]/50 ml-0.5">MXN</span>
                      </span>
                      <span className="flex items-center gap-1 text-xs text-[#254F40]/50">
                        {isLoading ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <>Comprar <ChevronRight className="w-3.5 h-3.5" /></>
                        )}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </>
      ) : (
        /* Wallet de MercadoPago */
        <div className="bg-white rounded-2xl border border-[#254F40]/10 p-6">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="w-4 h-4 text-[#254F40]" />
            <h2 className="font-semibold text-[#254F40]">Completa tu pago</h2>
          </div>
          <p className="text-sm text-[#254F40]/60 mb-5">
            Selecciona tu método de pago preferido.
          </p>
          <Wallet initialization={{ preferenceId, redirectMode: "self" }} locale="es-MX" />
          {checkoutUrl && (
            <a
              href={checkoutUrl}
              className="mt-4 flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl border border-[#254F40]/20 text-sm text-[#254F40]/70 hover:bg-[#254F40]/5 transition-colors"
            >
              Abrir página de pago <ChevronRight className="w-3.5 h-3.5" />
            </a>
          )}
          <button
            onClick={() => {
              setPreferenceId(null);
              setSelectedPackageId(null);
              setCheckoutUrl(null);
            }}
            className="mt-2 w-full text-sm text-[#254F40]/50 hover:text-[#254F40] transition-colors"
          >
            ← Elegir otro paquete
          </button>
        </div>
      )}
    </div>
  );
}
