"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useClasePortal, useCrearReservaPortal, useMisMembresias } from "@/hooks/usePortal";
import { portalAuthClient } from "@/lib/portal-client";
import { downloadQRCard } from "@/lib/qr-card";
import { initMercadoPago, Wallet } from "@mercadopago/sdk-react";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  CreditCard,
  MessageCircle,
  ArrowLeft,
  Loader2,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  Download,
  Package,
  Percent,
} from "lucide-react";

const MP_PUBLIC_KEY = process.env.NEXT_PUBLIC_MP_PUBLIC_KEY ?? "";

function formatFecha(iso: string) {
  return new Date(iso).toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
function formatHora(iso: string) {
  return new Date(iso).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
}

type Modo = "elegir" | "resumen_pago" | "pago" | "solicitud" | "exito_solicitud";

export default function AgendarPage() {
  const { claseId } = useParams<{ claseId: string }>();
  const router = useRouter();

  const { data: clase, isLoading } = useClasePortal(claseId);
  const crearReserva = useCrearReservaPortal();
  const { data: membresias, isLoading: loadingMembresias } = useMisMembresias();

  const [modo, setModo] = useState<Modo>("elegir");
  const [waConfirmed, setWaConfirmed] = useState(false);
  const [preferenceId, setPreferenceId] = useState<string | null>(null);
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null);
  const [clienteNombre, setClienteNombre] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [qrData, setQrData] = useState<{ qrImage: string; name: string } | null>(null);
  const [descargandoQR, setDescargandoQR] = useState(false);
  const [pagoParcial, setPagoParcial] = useState(false);
  const [montoPagadoStr, setMontoPagadoStr] = useState("");

  useEffect(() => {
    if (MP_PUBLIC_KEY) initMercadoPago(MP_PUBLIC_KEY, { locale: "es-MX" });
    const token = localStorage.getItem("sarui_token");
    setIsAuthed(!!token);
    try {
      const user = JSON.parse(localStorage.getItem("sarui_user") ?? "{}");
      if (user?.nombre || user?.name || user?.email) {
        setClienteNombre(user.nombre ?? user.name ?? user.email ?? "");
      }
    } catch {
      // ignore
    }
  }, []);

  function handleErrorApi(err: unknown) {
    const code = (err as { response?: { data?: { error?: { code?: string } } } })?.response?.data?.error?.code;
    const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;

    if (code === "ALREADY_RESERVED") {
      setErrorMsg("Ya tienes una reservación activa para esta clase.");
    } else if (code === "CLASS_FULL") {
      setErrorMsg("Esta clase ya no tiene lugares disponibles.");
    } else if (code === "CLIENT_NOT_FOUND") {
      setErrorMsg("No se encontró tu perfil de cliente. Contacta al estudio.");
    } else {
      setErrorMsg(msg ?? "Ocurrió un error. Intenta de nuevo.");
    }
  }

  async function handleConfirmarPago() {
    setErrorMsg(null);
    try {
      const monto = montoPagadoStr ? Number(montoPagadoStr) : undefined;
      const result = await crearReserva.mutateAsync({
        claseId,
        pagarAhora: true,
        pagoParcial,
        montoPagado: pagoParcial && monto ? monto : undefined,
      });
      if (result.preferenceId) {
        setPreferenceId(result.preferenceId);
        setModo("pago");
      }
    } catch (err) {
      handleErrorApi(err);
      setModo("elegir");
    }
  }

  async function handleSolicitar() {
    setErrorMsg(null);
    try {
      await crearReserva.mutateAsync({
        claseId,
        pagarAhora: false,
        portalWaConfirmed: waConfirmed,
      });
      // Cargamos el QR en segundo plano para tenerlo listo si el usuario lo quiere
      try {
        const res = await portalAuthClient.get<{ success: boolean; data: { qrImage: string; name: string } }>("/portal/mi-qr");
        setQrData(res.data.data);
      } catch {
        // Si falla, el botón de descarga no aparece — no bloqueamos el flujo
      }
      setModo("exito_solicitud");
    } catch (err) {
      handleErrorApi(err);
      setModo("elegir");
    }
  }

  async function handleDescargarCredencial() {
    if (!qrData) return;
    setDescargandoQR(true);
    try {
      await downloadQRCard(qrData.qrImage, qrData.name);
    } finally {
      setDescargandoQR(false);
    }
  }

  if (isLoading || loadingMembresias || isAuthed === null) {
    return (
      <div className="flex items-center justify-center py-20 gap-2 text-[#254F40]/50">
        <Loader2 className="w-5 h-5 animate-spin" />
        Cargando…
      </div>
    );
  }

  if (!clase) {
    return (
      <div className="text-center py-20 text-[#254F40]/50">
        Clase no encontrada.{" "}
        <button onClick={() => router.back()} className="underline">
          Volver
        </button>
      </div>
    );
  }

  const color = clase.tipoActividad?.color ?? "#254F40";
  const monto = Number(clase.costo ?? 0);
  const tieneMembresias = (membresias?.length ?? 0) > 0;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back */}
      <button
        onClick={() => router.push("/portal/clases")}
        className="flex items-center gap-1.5 text-sm text-[#254F40]/60 hover:text-[#254F40] mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Volver a clases
      </button>

      {/* Info de la clase */}
      <div className="bg-white rounded-2xl border border-[#254F40]/10 overflow-hidden mb-6">
        <div className="h-2 w-full" style={{ backgroundColor: color }} />
        <div className="p-6">
          <h1 className="text-xl font-bold text-[#254F40] mb-1">{clase.title}</h1>
          <p className="text-sm text-[#254F40]/50 mb-4">
            Con {clase.instructor.firstName} {clase.instructor.lastName}
          </p>

          <div className="space-y-2 text-sm text-[#254F40]/70">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span className="capitalize">{formatFecha(clase.startAt)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>
                {formatHora(clase.startAt)} – {formatHora(clase.endAt)}
              </span>
            </div>
            {clase.location && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>{clase.location}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>
                {clase.spotsLeft} lugar{clase.spotsLeft !== 1 ? "es" : ""} disponible
                {clase.spotsLeft !== 1 ? "s" : ""}
              </span>
            </div>
          </div>

          {monto > 0 && (
            <div className="mt-4 pt-4 border-t border-[#254F40]/10 flex items-center justify-between">
              <span className="text-sm text-[#254F40]/60">Costo de la sesión</span>
              <span className="font-bold text-[#254F40]">
                ${monto.toLocaleString("es-MX")} MXN
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Error global */}
      {errorMsg && (
        <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
          <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
          <p className="text-sm text-red-700">{errorMsg}</p>
        </div>
      )}

      {/* ── Elegir modo ──────────────────────────────────────────────────────── */}
      {modo === "elegir" && (
        <div className="space-y-3">
          {/* Con pago */}
          <button
            onClick={() => {
              if (!isAuthed) {
                router.push(`/portal/login?redirect=/portal/agendar/${claseId}`);
                return;
              }
              setErrorMsg(null);
              setModo("resumen_pago");
            }}
            className="w-full flex items-start gap-4 p-4 bg-[#254F40] text-[#F6FFB5] rounded-2xl hover:bg-[#254F40]/90 transition-colors text-left"
          >
            <div className="bg-[#F6FFB5]/20 rounded-xl p-2.5 mt-0.5">
              <CreditCard className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="font-semibold">Agendar y pagar ahora</p>
              <p className="text-xs opacity-70 mt-0.5">
                Paga con tarjeta o MercadoPago. Tu lugar queda confirmado de inmediato.
              </p>
              {monto > 0 && (
                <p className="text-sm font-bold mt-2 text-[#F6FFB5]">
                  ${monto.toLocaleString("es-MX")} MXN
                </p>
              )}
            </div>
            <ChevronRight className="w-4 h-4 mt-1 opacity-60" />
          </button>

          {/* Sin pago — solo visible si tiene membresías activas */}
          {tieneMembresias && (
            <button
              onClick={() => {
                if (!isAuthed) {
                  router.push(`/portal/login?redirect=/portal/agendar/${claseId}`);
                  return;
                }
                setErrorMsg(null);
                setModo("solicitud");
              }}
              className="w-full flex items-start gap-4 p-4 bg-white border-2 border-[#254F40]/20 text-[#254F40] rounded-2xl hover:border-[#254F40]/40 transition-colors text-left"
            >
              <div className="bg-[#254F40]/10 rounded-xl p-2.5 mt-0.5">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">Enviar solicitud (sin pago)</p>
                <p className="text-xs text-[#254F40]/60 mt-0.5">
                  Necesitas haber contactado previamente al estudio por WhatsApp.
                </p>
              </div>
              <ChevronRight className="w-4 h-4 mt-1 opacity-40" />
            </button>
          )}
        </div>
      )}

      {/* ── Resumen de pago ───────────────────────────────────────────────────── */}
      {modo === "resumen_pago" && (
        <div className="bg-white rounded-2xl border border-[#254F40]/10 overflow-hidden">
          <div className="px-6 pt-6 pb-4 border-b border-[#254F40]/10">
            <h2 className="font-semibold text-[#254F40]">Resumen del pago</h2>
            <p className="text-xs text-[#254F40]/50 mt-0.5">Revisa los detalles antes de continuar</p>
          </div>

          <div className="p-6 space-y-4">
            {/* Detalle */}
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-[#254F40]/60">Clase</span>
                <span className="font-medium text-[#254F40]">{clase.title}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#254F40]/60">Fecha</span>
                <span className="text-[#254F40] capitalize">
                  {new Date(clase.startAt).toLocaleDateString("es-MX", { weekday: "short", day: "numeric", month: "short" })}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#254F40]/60">Horario</span>
                <span className="text-[#254F40]">
                  {formatHora(clase.startAt)} – {formatHora(clase.endAt)}
                </span>
              </div>
              {clienteNombre && (
                <div className="flex justify-between text-sm">
                  <span className="text-[#254F40]/60">A nombre de</span>
                  <span className="text-[#254F40]">{clienteNombre}</span>
                </div>
              )}
            </div>

            {/* Total */}
            <div className="flex justify-between items-center pt-4 border-t border-[#254F40]/10">
              <span className="font-semibold text-[#254F40]">Total</span>
              <span className="text-2xl font-bold text-[#254F40]">
                ${monto.toLocaleString("es-MX")}{" "}
                <span className="text-sm font-normal text-[#254F40]/50">MXN</span>
              </span>
            </div>

            {/* Pago parcial */}
            <div className="border-t border-[#254F40]/10 pt-4">
              <label className="flex items-center gap-2.5 cursor-pointer group mb-3">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={pagoParcial}
                    onChange={(e) => setPagoParcial(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-5 h-5 rounded border-2 border-[#254F40]/30 peer-checked:bg-[#254F40] peer-checked:border-[#254F40] transition-colors flex items-center justify-center">
                    {pagoParcial && (
                      <Percent className="w-3 h-3 text-[#F6FFB5]" />
                    )}
                  </div>
                </div>
                <span className="text-sm text-[#254F40]/80">Pagar parcialmente</span>
              </label>

              {pagoParcial && (
                <div className="bg-[#254F40]/5 rounded-xl p-4 space-y-3">
                  <p className="text-xs text-[#254F40]/60">
                    Ingresa el monto que deseas pagar hoy. El resto se registrará como saldo pendiente.
                  </p>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#254F40]/60 font-medium">$</span>
                    <input
                      type="number"
                      value={montoPagadoStr}
                      onChange={(e) => setMontoPagadoStr(e.target.value)}
                      placeholder={monto.toLocaleString("es-MX")}
                      min={1}
                      max={monto}
                      className="w-full pl-7 pr-3 py-2.5 rounded-xl border border-[#254F40]/20 text-sm text-[#254F40] bg-white focus:outline-none focus:ring-2 focus:ring-[#254F40]/30"
                    />
                  </div>
                  <p className="text-xs text-[#254F40]/50">
                    Monto completo: <span className="font-medium">${monto.toLocaleString("es-MX")} MXN</span>
                  </p>
                </div>
              )}
            </div>

            {/* Info método de pago */}
            <div className="bg-[#254F40]/5 rounded-xl p-3 text-xs text-[#254F40]/70 flex items-start gap-2">
              <CreditCard className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                Pagarás de forma segura con tarjeta de crédito/débito o billetera digital a través de MercadoPago.
              </span>
            </div>
          </div>

          <div className="px-6 pb-6 flex gap-3">
            <button
              onClick={() => setModo("elegir")}
              className="flex-1 py-2.5 rounded-xl border border-[#254F40]/20 text-sm text-[#254F40]/60 hover:bg-[#254F40]/5 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmarPago}
              disabled={crearReserva.isPending || (pagoParcial && !montoPagadoStr)}
              className="flex-1 py-2.5 rounded-xl bg-[#254F40] text-[#F6FFB5] text-sm font-semibold hover:bg-[#254F40]/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {crearReserva.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {crearReserva.isPending ? "Procesando…" : "Continuar al pago"}
            </button>
          </div>
        </div>
      )}

      {/* ── Solicitud sin pago ───────────────────────────────────────────────── */}
      {modo === "solicitud" && (
        <div className="bg-white rounded-2xl border border-[#254F40]/10 p-6 space-y-5">
          <div>
            <h2 className="font-semibold text-[#254F40]">Solicitar lugar</h2>
            <p className="text-sm text-[#254F40]/60 mt-1">
              Tu solicitud se enviará al equipo de Sarui Studio para revisión.
            </p>
          </div>

          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="relative mt-0.5">
              <input
                type="checkbox"
                checked={waConfirmed}
                onChange={(e) => setWaConfirmed(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-5 h-5 rounded border-2 border-[#254F40]/30 peer-checked:bg-[#254F40] peer-checked:border-[#254F40] transition-colors flex items-center justify-center">
                {waConfirmed && (
                  <svg className="w-3 h-3 text-[#F6FFB5]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </div>
            <span className="text-sm text-[#254F40]/80 leading-relaxed">
              Confirmo que ya me puse en contacto con el estudio por{" "}
              <span className="font-semibold">WhatsApp</span> y estoy esperando respuesta.
            </span>
          </label>

          <div className="flex gap-3">
            <button
              onClick={() => setModo("elegir")}
              className="flex-1 py-2.5 rounded-xl border border-[#254F40]/20 text-sm text-[#254F40]/60 hover:bg-[#254F40]/5 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSolicitar}
              disabled={!waConfirmed || crearReserva.isPending}
              className="flex-1 py-2.5 rounded-xl bg-[#254F40] text-[#F6FFB5] text-sm font-semibold hover:bg-[#254F40]/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {crearReserva.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Enviar solicitud
            </button>
          </div>
        </div>
      )}

      {/* ── Wallet de MercadoPago ─────────────────────────────────────────────── */}
      {modo === "pago" && preferenceId && (
        <div className="bg-white rounded-2xl border border-[#254F40]/10 p-6">
          <h2 className="font-semibold text-[#254F40] mb-1">Completa tu pago</h2>
          <p className="text-sm text-[#254F40]/60 mb-2">
            Total: <span className="font-bold text-[#254F40]">${monto.toLocaleString("es-MX")} MXN</span>
          </p>
          <p className="text-xs text-[#254F40]/50 mb-5">
            Selecciona tu método de pago preferido.
          </p>
          <Wallet initialization={{ preferenceId }} locale="es-MX" />
        </div>
      )}

      {/* ── Éxito solicitud ───────────────────────────────────────────────────── */}
      {modo === "exito_solicitud" && (
        <div className="space-y-4">
          {/* Confirmación */}
          <div className="bg-white rounded-2xl border border-[#254F40]/10 p-8 text-center">
            <div className="w-14 h-14 bg-[#254F40]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-7 h-7 text-[#254F40]" />
            </div>
            <h2 className="font-bold text-[#254F40] text-lg mb-2">¡Solicitud enviada!</h2>
            <p className="text-sm text-[#254F40]/60 mb-6">
              El equipo de Sarui Studio revisará tu solicitud y te confirmará por WhatsApp.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => router.push("/portal/mis-agendas")}
                className="px-5 py-2.5 rounded-xl bg-[#254F40] text-[#F6FFB5] text-sm font-semibold hover:bg-[#254F40]/90 transition-colors"
              >
                Ver mis agendas
              </button>
              <button
                onClick={() => router.push("/portal/clases")}
                className="px-5 py-2.5 rounded-xl border border-[#254F40]/20 text-sm text-[#254F40]/70 hover:bg-[#254F40]/5 transition-colors"
              >
                Ver más clases
              </button>
            </div>
          </div>

          {/* Prompt de credencial */}
          {qrData && (
            <div className="bg-white rounded-2xl border border-[#254F40]/10 p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-[#254F40]/10 rounded-xl flex items-center justify-center shrink-0">
                  <Download className="w-5 h-5 text-[#254F40]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#254F40] text-sm mb-1">
                    ¿Deseas descargar tu credencial de acceso?
                  </p>
                  <p className="text-xs text-[#254F40]/50 mb-4">
                    Preséntala en el kiosk cada vez que llegues al estudio.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleDescargarCredencial}
                      disabled={descargandoQR}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#254F40] text-[#F6FFB5] text-sm font-medium hover:bg-[#254F40]/90 transition-colors disabled:opacity-60"
                    >
                      {descargandoQR ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Download className="w-3.5 h-3.5" />
                      )}
                      {descargandoQR ? "Descargando..." : "Sí, descargar"}
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
      )}
    </div>
  );
}
