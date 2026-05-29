"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { usePortalPaquetes, useMisMembresias, useComprarPaquete } from "@/hooks/usePortal";
import type { PaquetePortal, MembresiaPortal } from "@/hooks/usePortal";
import { initMercadoPago, Wallet } from "@mercadopago/sdk-react";
import {
  CheckCircle, Loader2, Package, Clock, ChevronRight,
  ShieldCheck, Star, Hash, ShoppingCart, ArrowLeft, Zap,
} from "lucide-react";

const MP_PUBLIC_KEY = process.env.NEXT_PUBLIC_MP_PUBLIC_KEY ?? "";

function totalSessions(ms: MembresiaPortal[] | undefined): number {
  return (ms ?? []).reduce((s, m) => s + m.sessionsRemaining, 0);
}

const css = `
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(12px) scale(0.98); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes slideIn {
  from { opacity: 0; transform: translateX(24px); }
  to   { opacity: 1; transform: translateX(0); }
}
`;

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" });
}

type Grupo = { nombre: string; color: string; paquetes: PaquetePortal[] };

function agrupar(paquetes: PaquetePortal[]): Grupo[] {
  const map = new Map<string, Grupo>();
  for (const p of paquetes) {
    const key = p.tipoActividad?.nombre ?? "General";
    if (!map.has(key)) map.set(key, { nombre: key, color: p.tipoActividad?.color ?? "#254F40", paquetes: [] });
    map.get(key)!.paquetes.push(p);
  }
  return Array.from(map.values());
}

// ── Stepper indicator ────────────────────────────────────────────────────────

function Stepper({ step }: { step: 1 | 2 }) {
  const steps = ["Elige tu plan", "Completa el pago"];
  return (
    <div className="flex items-center gap-0 mb-8">
      {steps.map((label, i) => {
        const n = i + 1;
        const active = step === n;
        const done = step > n;
        return (
          <div key={n} className="flex items-center flex-1 last:flex-none">
            <div className="flex items-center gap-2 shrink-0">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                done ? "bg-[#254F40] text-[#F6FFB5]" : active ? "bg-[#254F40] text-[#F6FFB5] ring-4 ring-[#254F40]/20" : "bg-[#254F40]/10 text-[#254F40]/40"
              }`}>
                {done ? <CheckCircle className="w-3.5 h-3.5" /> : n}
              </div>
              <span className={`text-xs font-medium transition-colors duration-300 hidden sm:block ${active ? "text-[#254F40]" : done ? "text-[#254F40]/60" : "text-[#254F40]/30"}`}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-3 rounded-full transition-all duration-500 ${done ? "bg-[#254F40]" : "bg-[#254F40]/10"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Membresías activas banner ────────────────────────────────────────────────

function MembresiasBanner({ membresias }: { membresias: MembresiaPortal[] }) {
  const [open, setOpen] = useState(false);
  if (membresias.length === 0) return null;
  const total = membresias.reduce((s, m) => s + m.sessionsRemaining, 0);

  return (
    <div className="mb-6">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full bg-gradient-to-r from-[#254F40] to-[#1a3a2f] text-[#F6FFB5] rounded-2xl p-4 flex items-center gap-3 hover:opacity-95 transition-opacity"
      >
        <div className="w-9 h-9 bg-[#F6FFB5]/15 rounded-xl flex items-center justify-center shrink-0">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div className="flex-1 text-left">
          <p className="font-semibold text-sm">
            {membresias.length} membresía{membresias.length !== 1 ? "s" : ""} activa{membresias.length !== 1 ? "s" : ""}
          </p>
          <p className="text-xs text-[#F6FFB5]/60 mt-0.5">{total} sesión{total !== 1 ? "es" : ""} disponible{total !== 1 ? "s" : ""} en total</p>
        </div>
        <ChevronRight className={`w-4 h-4 text-[#F6FFB5]/50 transition-transform duration-200 ${open ? "rotate-90" : ""}`} />
      </button>

      {open && (
        <div className="mt-2 space-y-2" style={{ animation: "fadeUp 0.2s ease-out both" }}>
          {membresias.map((m) => (
            <div key={m.id} className="bg-white border border-[#254F40]/10 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-[#254F40]">{m.package.name}</p>
                {m.package.tipoActividad && (
                  <span className="text-[10px] bg-[#254F40]/8 text-[#254F40]/60 rounded-full px-2 py-0.5">
                    {m.package.tipoActividad.nombre}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-[#254F40]/60 mb-2">
                <span>{m.sessionsRemaining}/{m.totalSessions} sesiones</span>
                <span>·</span>
                <span>Vence {fmt(m.expiresAt)}</span>
              </div>
              <div className="h-1.5 bg-[#254F40]/8 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#254F40] rounded-full transition-all"
                  style={{ width: `${Math.round((m.sessionsRemaining / m.totalSessions) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
      {membresias.length > 0 && (
        <p className="text-[11px] text-[#254F40]/50 text-center mt-2 px-2">
          Comprar el mismo tipo de paquete sumará sesiones a tu membresía activa.
        </p>
      )}
    </div>
  );
}

// ── Paquete card ─────────────────────────────────────────────────────────────

function PaqueteCard({
  pkg, idx, isPending, onComprar, membresiasActivas,
}: {
  pkg: PaquetePortal; idx: number; isPending: boolean;
  onComprar: (id: string) => void; membresiasActivas: MembresiaPortal[];
}) {
  const stackeable = membresiasActivas.some(
    (m) => m.package.tipoActividad?.nombre === pkg.tipoActividad?.nombre
  );

  return (
    <div
      className="bg-white rounded-xl border border-[#254F40]/8 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
      style={{ animation: `fadeUp 0.35s ease-out ${idx * 60}ms both` }}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <p className="font-semibold text-[#254F40] text-sm leading-tight">{pkg.name}</p>
          {stackeable && (
            <span className="shrink-0 flex items-center gap-1 text-[10px] font-medium text-emerald-700 bg-emerald-50 rounded-full px-2 py-0.5 border border-emerald-200/50">
              <Zap className="w-2.5 h-2.5" /> Suma
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mb-2">
          {pkg.sessions === 1 ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 rounded-full px-2.5 py-0.5 border border-amber-200/50">
              <Star className="w-3 h-3" /> Sesión única
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#254F40]/70 bg-[#254F40]/5 rounded-full px-2.5 py-0.5">
              <Hash className="w-3 h-3" /> {pkg.sessions} sesiones
            </span>
          )}
          <span className="inline-flex items-center gap-1 text-[11px] text-[#254F40]/50">
            <Clock className="w-3 h-3" /> {pkg.validityDays}d
          </span>
        </div>
        {pkg.description && (
          <p className="text-xs text-[#254F40]/50 mb-3 leading-relaxed line-clamp-2">{pkg.description}</p>
        )}
        <div className="flex items-center justify-between pt-3 border-t border-[#254F40]/6">
          <span className="text-lg font-bold text-[#254F40]">
            ${Number(pkg.price).toLocaleString("es-MX")}
            <span className="text-[11px] font-normal text-[#254F40]/40 ml-1">MXN</span>
          </span>
          <button
            onClick={() => onComprar(pkg.id)}
            disabled={isPending}
            className="px-4 py-1.5 rounded-lg border border-[#254F40]/20 text-[#254F40] text-xs font-medium hover:bg-[#254F40] hover:text-white transition-all duration-200 disabled:opacity-50 flex items-center gap-1.5 group/btn"
          >
            {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : (
              <>
                <ShoppingCart className="w-3 h-3 opacity-0 w-0 overflow-hidden transition-all duration-200 group-hover/btn:opacity-100 group-hover/btn:w-3" />
                {stackeable ? "Agregar" : "Comprar"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Página ────────────────────────────────────────────────────────────────────

export default function MembresiaPortalPage() {
  const router = useRouter();
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [preferenceId, setPreferenceId] = useState<string | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const mpWindowRef = useRef<Window | null>(null);
  const membresiaCountRef = useRef<number>(0);

  const { data: paquetes, isLoading: loadingPaquetes } = usePortalPaquetes();
  const { data: membresias, isLoading: loadingMembresias, refetch: refetchMembresias } = useMisMembresias();
  const comprar = useComprarPaquete();
  const grupos = useMemo(() => paquetes ? agrupar(paquetes) : [], [paquetes]);

  useEffect(() => {
    if (MP_PUBLIC_KEY) initMercadoPago(MP_PUBLIC_KEY, { locale: "es-MX" });
    const token = localStorage.getItem("sarui_token");
    if (!token) router.push("/tienda/login?redirect=/tienda/membresia");
    else setIsAuthed(true);
  }, [router]);

  useEffect(() => {
    if (membresias && !preferenceId) membresiaCountRef.current = totalSessions(membresias);
  }, [membresias, preferenceId]);

  useEffect(() => {
    if (!preferenceId) return;
    const interval = setInterval(async () => {
      const result = await refetchMembresias();
      const newTotal = totalSessions(result.data);
      if (newTotal > membresiaCountRef.current) {
        clearInterval(interval);
        try { mpWindowRef.current?.close(); } catch {}
        router.push("/tienda/pago/membresia-exitosa");
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [preferenceId, refetchMembresias, router]);

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

  async function handleYaPague() {
    const result = await refetchMembresias();
    if (totalSessions(result.data) > membresiaCountRef.current) {
      router.push("/tienda/pago/membresia-exitosa");
    }
  }

  if (isAuthed === null || loadingPaquetes || loadingMembresias) {
    return (
      <div className="flex items-center justify-center py-20 gap-2 text-[#254F40]/50">
        <Loader2 className="w-5 h-5 animate-spin" /> Cargando…
      </div>
    );
  }

  const membresiasActivas = membresias?.filter((m) => m.status === "ACTIVE" && m.sessionsRemaining > 0) ?? [];
  const step: 1 | 2 = preferenceId ? 2 : 1;

  return (
    <div className="max-w-3xl mx-auto">
      <style>{css}</style>

      <button
        onClick={() => preferenceId ? (setPreferenceId(null), setSelectedPackageId(null), setCheckoutUrl(null)) : router.push("/tienda")}
        className="flex items-center gap-1.5 text-sm text-[#254F40]/60 hover:text-[#254F40] mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        {preferenceId ? "Elegir otro plan" : "Volver"}
      </button>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#254F40]">Membresía</h1>
        <p className="text-sm text-[#254F40]/50 mt-0.5">Elige tu plan y empieza a entrenar</p>
      </div>

      <Stepper step={step} />

      {/* ── Paso 1: Elegir plan ── */}
      {step === 1 && (
        <div style={{ animation: "slideIn 0.3s ease-out both" }}>
          <MembresiasBanner membresias={membresiasActivas} />

          {grupos.length === 0 ? (
            <div className="text-center py-16 text-[#254F40]/40">
              <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No hay planes disponibles por ahora.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {grupos.map((grupo) => (
                <div key={grupo.nombre}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-3 h-3 rounded-full ring-2 ring-white shadow-sm" style={{ backgroundColor: grupo.color }} />
                    <h2 className="font-bold text-[#254F40] text-sm">{grupo.nombre}</h2>
                    <span className="text-[11px] text-[#254F40]/30">{grupo.paquetes.length} plan{grupo.paquetes.length !== 1 ? "es" : ""}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {grupo.paquetes.map((pkg, idx) => (
                      <PaqueteCard
                        key={pkg.id}
                        pkg={pkg}
                        idx={idx}
                        isPending={comprar.isPending && selectedPackageId === pkg.id}
                        onComprar={handleComprar}
                        membresiasActivas={membresiasActivas}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Historial colapsado */}
          {(membresias?.filter((m) => m.status !== "ACTIVE" || m.sessionsRemaining === 0).length ?? 0) > 0 && (
            <details className="mt-8 group">
              <summary className="cursor-pointer text-xs text-[#254F40]/40 hover:text-[#254F40]/60 transition-colors list-none flex items-center gap-1.5">
                <ChevronRight className="w-3.5 h-3.5 transition-transform group-open:rotate-90" />
                Ver historial de membresías
              </summary>
              <div className="mt-3 space-y-2">
                {membresias?.filter((m) => m.status !== "ACTIVE" || m.sessionsRemaining === 0).map((m) => (
                  <div key={m.id} className="bg-white border border-[#254F40]/8 rounded-xl p-3 flex items-center gap-3 opacity-50">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[#254F40]">{m.package.name}</p>
                      <p className="text-xs text-[#254F40]/50">{m.sessionsUsed}/{m.totalSessions} sesiones · Venció {fmt(m.expiresAt)}</p>
                    </div>
                    <span className="text-[10px] text-[#254F40]/40 bg-[#254F40]/5 rounded-full px-2.5 py-1">
                      {m.sessionsRemaining === 0 ? "Agotado" : "Vencido"}
                    </span>
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      )}

      {/* ── Paso 2: Pagar ── */}
      {step === 2 && preferenceId && (
        <div className="max-w-md mx-auto" style={{ animation: "slideIn 0.3s ease-out both" }}>
          <div className="bg-white rounded-2xl border border-[#254F40]/10 p-6 shadow-sm mb-4">
            <p className="text-sm text-[#254F40]/60 mb-5 text-center">
              Selecciona tu método de pago para completar la compra.
            </p>
            <Wallet initialization={{ preferenceId, redirectMode: "self" }} locale="es-MX" />
          </div>

          {checkoutUrl && (
            <button
              onClick={() => { mpWindowRef.current = window.open(checkoutUrl, "_blank", "noopener,noreferrer"); }}
              className="w-full flex items-center justify-center gap-1.5 py-3 rounded-xl border border-[#254F40]/20 text-sm text-[#254F40]/70 hover:bg-[#254F40]/5 transition-colors mb-3"
            >
              Abrir en página de pago <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={handleYaPague}
            className="w-full bg-[#254F40] text-[#F6FFB5] font-semibold py-3 rounded-xl hover:bg-[#254F40]/90 transition-colors text-sm flex items-center justify-center gap-2 mb-2"
          >
            <CheckCircle className="w-4 h-4" /> Ya completé mi pago
          </button>

          <p className="text-center text-xs text-[#254F40]/40">
            Tu membresía se activará automáticamente al confirmar el pago.
          </p>
        </div>
      )}
    </div>
  );
}
