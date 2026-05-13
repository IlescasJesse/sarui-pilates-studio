"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { usePortalPaquetes, useMisMembresias, useComprarPaquete } from "@/hooks/usePortal";
import type { PaquetePortal } from "@/hooks/usePortal";
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
  Star,
  Hash,
  ShoppingCart,
} from "lucide-react";

const MP_PUBLIC_KEY = process.env.NEXT_PUBLIC_MP_PUBLIC_KEY ?? "";

function formatFecha(iso: string) {
  return new Date(iso).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

type Grupo = {
  nombre: string;
  color: string;
  paquetes: PaquetePortal[];
};

function agruparPorActividad(paquetes: PaquetePortal[]): Grupo[] {
  const map = new Map<string, Grupo>();
  for (const p of paquetes) {
    const key = p.tipoActividad?.nombre ?? "General";
    if (!map.has(key)) {
      map.set(key, { nombre: key, color: p.tipoActividad?.color ?? "#254F40", paquetes: [] });
    }
    map.get(key)!.paquetes.push(p);
  }
  return Array.from(map.values());
}

function SesionBadge({ sessions }: { sessions: number }) {
  if (sessions === 1) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 rounded-full px-2.5 py-0.5 border border-amber-200/50">
        <Star className="w-3 h-3" />
        Sesión única
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#254F40]/70 bg-[#254F40]/5 rounded-full px-2.5 py-0.5">
      <Hash className="w-3 h-3" />
      {sessions} sesiones
    </span>
  );
}

function ValidityBadge({ days }: { days: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-[11px] text-[#254F40]/50">
      <Clock className="w-3 h-3" />
      {days} días
    </span>
  );
}

const staggerKeyframes = `
@keyframes cardIn {
  from { opacity: 0; transform: translateY(12px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
`;

export default function MembresiaPortalPage() {
  const router = useRouter();
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [preferenceId, setPreferenceId] = useState<string | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);

  const { data: paquetes, isLoading: loadingPaquetes } = usePortalPaquetes();
  const { data: membresias, isLoading: loadingMembresias } = useMisMembresias();
  const comprar = useComprarPaquete();

  const grupos = useMemo(() => paquetes ? agruparPorActividad(paquetes) : [], [paquetes]);

  useEffect(() => {
    if (MP_PUBLIC_KEY) initMercadoPago(MP_PUBLIC_KEY, { locale: "es-MX" });
    const token = localStorage.getItem("sarui_token");
    if (!token) {
      router.push("/tienda/login?redirect=/tienda/membresia");
    } else {
      setIsAuthed(true);
    }
  }, [router]);

  async function handleComprar(packageId: string) {
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
    <div className="max-w-5xl mx-auto">
      <button
        onClick={() => router.push("/tienda/clases")}
        className="flex items-center gap-1.5 text-sm text-[#254F40]/60 hover:text-[#254F40] mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Volver a clases
      </button>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#254F40]">Tienda</h1>
        <p className="text-sm text-[#254F40]/50 mt-0.5">Elige tu plan y empieza a entrenar</p>
      </div>

          <style>{staggerKeyframes}</style>

          {membresiaActiva && (
        <div className="bg-gradient-to-br from-[#254F40] to-[#1a3a2f] text-[#F6FFB5] rounded-2xl p-5 mb-8 shadow-md">
          <div className="flex items-start gap-3">
            <div className="bg-[#F6FFB5]/15 rounded-xl p-2 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-sm">Membresía activa</p>
                <span className="text-[10px] font-medium bg-[#F6FFB5]/15 text-[#F6FFB5]/80 rounded-full px-2 py-0.5">
                  {membresiaActiva.package.name}
                </span>
              </div>
              <div className="flex items-center gap-4 mt-3 text-xs">
                <span className="bg-[#F6FFB5]/15 rounded-lg px-2.5 py-1">
                  {membresiaActiva.sessionsRemaining} sesión{membresiaActiva.sessionsRemaining !== 1 ? "es" : ""} restante{membresiaActiva.sessionsRemaining !== 1 ? "s" : ""}
                </span>
                <span className="text-[#F6FFB5]/50">
                  Vence {formatFecha(membresiaActiva.expiresAt)}
                </span>
              </div>
            </div>
            <button
              onClick={() => router.push("/tienda/clases")}
              className="text-[#F6FFB5]/60 hover:text-[#F6FFB5] transition-colors shrink-0"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {!preferenceId ? (
        <>
          {grupos.length === 0 && (
            <div className="text-center py-16 text-[#254F40]/40">
              <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No hay planes disponibles por ahora.</p>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {grupos.map((grupo) => (
              <div
                key={grupo.nombre}
                className="rounded-2xl border border-[#254F40]/8 p-5"
                style={{ backgroundColor: `${grupo.color}08` }}
              >
                <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-[#254F40]/6">
                  <span
                    className="w-3 h-3 rounded-full shadow-sm ring-2 ring-white"
                    style={{ backgroundColor: grupo.color }}
                  />
                  <h2 className="font-bold text-[#254F40] text-sm">{grupo.nombre}</h2>
                  <span className="text-[11px] text-[#254F40]/30 font-medium ml-auto">
                    {grupo.paquetes.length} plan{grupo.paquetes.length !== 1 ? "es" : ""}
                  </span>
                </div>
                <div className="space-y-2.5">
                  {grupo.paquetes.map((pkg, idx) => {
                    const isPending = comprar.isPending && selectedPackageId === pkg.id;
                    return (
                      <div
                        key={pkg.id}
                        className="bg-white rounded-xl border border-[#254F40]/8 overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
                        style={{ animation: `cardIn 0.35s ease-out ${idx * 60}ms both` }}
                      >
                        <div className="p-4">
                          <p className="font-semibold text-[#254F40] text-sm leading-tight">{pkg.name}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <SesionBadge sessions={pkg.sessions} />
                            <ValidityBadge days={pkg.validityDays} />
                          </div>
                          {pkg.description && (
                            <p className="text-xs text-[#254F40]/50 mt-2 leading-relaxed line-clamp-2">
                              {pkg.description}
                            </p>
                          )}
                          <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#254F40]/6">
                            <span className="text-lg font-bold text-[#254F40]">
                              ${Number(pkg.price).toLocaleString("es-MX")}
                              <span className="text-[11px] font-normal text-[#254F40]/40 ml-1">MXN</span>
                            </span>
                            <button
                              onClick={() => handleComprar(pkg.id)}
                              disabled={comprar.isPending}
                              className="px-4 py-1.5 rounded-lg border border-[#254F40]/20 text-[#254F40] text-xs font-medium hover:bg-[#254F40] hover:text-white transition-all duration-200 disabled:opacity-50 flex items-center gap-1.5 group/btn"
                            >
                              {isPending ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <>
                                  <span className="w-0 overflow-hidden transition-all duration-200 group-hover/btn:w-3 group-hover/btn:mr-0">
                                    <ShoppingCart className="w-3 h-3" />
                                  </span>
                                  Comprar
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="max-w-md mx-auto bg-white rounded-2xl border border-[#254F40]/10 p-6 shadow-md">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="w-5 h-5 text-[#254F40]" />
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
            className="mt-2 w-full text-sm text-[#254F40]/50 hover:text-[#254F40] transition-colors py-2"
          >
            ← Elegir otro plan
          </button>
        </div>
      )}
    </div>
  );
}
