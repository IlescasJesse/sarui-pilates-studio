"use client";

import { useState, useEffect } from "react";
import QRCode from "react-qr-code";
import { motion, AnimatePresence } from "framer-motion";
import { fadeInUp, staggerContainer, staggerItem, scaleIn } from "@/lib/animations";
import {
  CheckCircle,
  Clock,
  ChevronRight,
  Send,
  UserPlus,
  LogIn,
  ArrowLeft,
  AlertCircle,
  QrCode,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

type Tab = "nuevo" | "registrado";

// ── Tipos compartidos ─────────────────────────────────────────────────────────

interface MembresiaInfo {
  id: string;
  packageName: string;
  category: string;
  classSubtype: string | null;
  tipoActividadId: string | null;
  tipoActividadNombre: string | null;
  sessionsRemaining: number;
  expiresAt: string;
}

interface ClaseInfo {
  id: string;
  title: string;
  startAt: string;
  endAt: string;
  spotsLeft: number;
  costo?: number | null;
  tipoActividad?: { id: string; nombre: string; color: string } | null;
  instructor?: { firstName: string; lastName: string };
}

function formatFecha(iso: string) {
  return new Date(iso).toLocaleDateString("es-MX", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}
function formatHora(iso: string) {
  return new Date(iso).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
}

// ── NuevoTab ──────────────────────────────────────────────────────────────────

function NuevoTab() {
  const [step, setStep] = useState<"form" | "success">("form");
  const [form, setForm] = useState({ nombre: "", apellido: "", email: "", telefono: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.nombre.trim()) e.nombre = "Nombre requerido";
    if (!form.apellido.trim()) e.apellido = "Apellido requerido";
    if (!form.email.includes("@")) e.email = "Correo inválido";
    if (!form.telefono.trim()) e.telefono = "Teléfono requerido";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setApiError(null);
    try {
      const res = await fetch(`${API_URL}/portal/solicitar-cuenta`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: form.nombre,
          apellido: form.apellido,
          email: form.email,
          telefono: form.telefono,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        const code = json?.error?.code;
        if (code === "ALREADY_REQUESTED") {
          setApiError("Ya tienes una solicitud pendiente con ese correo. Te contactaremos pronto.");
        } else {
          setApiError(json?.error?.message ?? "Ocurrió un error. Intenta de nuevo.");
        }
        return;
      }
      setStep("success");
    } catch {
      setApiError("Error de conexión. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  if (step === "success") {
    return (
      <motion.div
        className="flex flex-col items-center text-center py-10 gap-5"
        variants={scaleIn}
        initial="initial"
        animate="animate"
      >
        <div className="w-16 h-16 rounded-full bg-[#254F40]/10 flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-[#254F40]" />
        </div>
        <div>
          <h3 className="text-[#254F40] font-semibold text-lg">¡Solicitud enviada!</h3>
          <p className="text-[#254F40]/60 text-sm mt-2 max-w-xs">
            Hemos recibido tu solicitud. El equipo la revisará y te contactará para confirmar tu primera clase.
          </p>
        </div>
        <div className="px-5 py-3 rounded-lg bg-[#F6FFB5]/60 border border-[#254F40]/10 text-left">
          <p className="text-xs text-[#254F40]/70">
            Te avisaremos al <strong>{form.telefono}</strong> o al correo <strong>{form.email}</strong>
          </p>
        </div>
        <button
          onClick={() => { setStep("form"); setForm({ nombre: "", apellido: "", email: "", telefono: "" }); }}
          className="text-sm text-[#749390] hover:text-[#254F40] transition-colors underline"
        >
          Enviar otra solicitud
        </button>
      </motion.div>
    );
  }

  const inputCls = (field: string) =>
    `w-full rounded-md border px-4 py-3 text-sm text-[#254F40] bg-white/60 placeholder:text-[#254F40]/30 focus:outline-none focus:ring-2 focus:ring-[#254F40]/25 transition-all ${errors[field] ? "border-red-400" : "border-[#254F40]/15"}`;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-[#254F40]/60 uppercase tracking-wider mb-1.5">Nombre *</label>
          <input type="text" value={form.nombre} onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))} placeholder="Ana" className={inputCls("nombre")} />
          {errors.nombre && <p className="text-red-500 text-xs mt-1">{errors.nombre}</p>}
        </div>
        <div>
          <label className="block text-xs font-medium text-[#254F40]/60 uppercase tracking-wider mb-1.5">Apellido *</label>
          <input type="text" value={form.apellido} onChange={(e) => setForm((p) => ({ ...p, apellido: e.target.value }))} placeholder="García" className={inputCls("apellido")} />
          {errors.apellido && <p className="text-red-500 text-xs mt-1">{errors.apellido}</p>}
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-[#254F40]/60 uppercase tracking-wider mb-1.5">Correo electrónico *</label>
        <input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} placeholder="tu@correo.com" className={inputCls("email")} />
        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
      </div>

      <div>
        <label className="block text-xs font-medium text-[#254F40]/60 uppercase tracking-wider mb-1.5">Teléfono / WhatsApp *</label>
        <input type="tel" value={form.telefono} onChange={(e) => setForm((p) => ({ ...p, telefono: e.target.value }))} placeholder="951 000 0000" className={inputCls("telefono")} />
        {errors.telefono && <p className="text-red-500 text-xs mt-1">{errors.telefono}</p>}
      </div>

      {apiError && (
        <div className="bg-red-50 border border-red-200 rounded-md px-3 py-2 text-sm text-red-600 flex gap-2 items-start">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          {apiError}
        </div>
      )}

      <p className="text-[#254F40]/50 text-xs leading-relaxed">
        Tu solicitud será revisada por un administrador antes de confirmar. Te contactaremos para completar el registro y tu primera clase.
      </p>

      <button type="submit" disabled={loading} className="w-full py-3.5 rounded-md bg-[#254F40] text-[#F6FFB5] font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#1d3d32] transition-colors disabled:opacity-60">
        {loading ? <div className="w-4 h-4 border-2 border-[#F6FFB5] border-t-transparent rounded-full animate-spin" /> : <><Send className="w-4 h-4" />Solicitar mi registro</>}
      </button>
    </form>
  );
}

// ── RegistradoTab ─────────────────────────────────────────────────────────────

type RegStep = "email" | "checking" | "pendiente" | "rechazada" | "not_found" | "found" | "select_class" | "reservando" | "confirmed";

function RegistradoTab() {
  const [step, setStep] = useState<RegStep>("email");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [apiError, setApiError] = useState<string | null>(null);

  const [clienteNombre, setClienteNombre] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [provisionalToken, setProvisionalToken] = useState("");
  const [memberships, setMemberships] = useState<MembresiaInfo[]>([]);

  const [clases, setClases] = useState<ClaseInfo[]>([]);
  const [selectedClaseId, setSelectedClaseId] = useState<string | null>(null);
  const [selectedMembresiaId, setSelectedMembresiaId] = useState<string | null>(null);
  const [confirmedClase, setConfirmedClase] = useState<ClaseInfo | null>(null);

  // Cargar clases disponibles al encontrar cliente
  useEffect(() => {
    if (step !== "found" && step !== "select_class") return;
    fetch(`${API_URL}/portal/clases`)
      .then((r) => r.json())
      .then((j) => setClases(j?.data ?? []))
      .catch(() => {});
  }, [step]);

  // Auto-seleccionar membresía si solo hay una
  useEffect(() => {
    if (memberships.length === 1) setSelectedMembresiaId(memberships[0].id);
  }, [memberships]);

  const handleVerificar = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!email.includes("@")) { setEmailError("Ingresa un correo válido"); return; }
    setEmailError("");
    setApiError(null);
    setStep("checking");

    try {
      const res = await fetch(`${API_URL}/portal/buscar-cliente`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      const data = json?.data;

      if (data?.status === "found") {
        setClienteNombre(data.nombre);
        setQrCode(data.qrCode);
        setProvisionalToken(data.provisionalToken);
        setMemberships(data.memberships ?? []);
        setStep("found");
      } else if (data?.status === "pendiente") {
        setStep("pendiente");
      } else if (data?.status === "rechazada") {
        setStep("rechazada");
      } else {
        setStep("not_found");
      }
    } catch {
      setApiError("Error de conexión. Intenta de nuevo.");
      setStep("email");
    }
  };

  const handleReservar = async () => {
    if (!selectedClaseId || !selectedMembresiaId) return;
    setApiError(null);
    setStep("reservando");
    try {
      const res = await fetch(`${API_URL}/portal/reservar-provisional`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claseId: selectedClaseId, membresiaId: selectedMembresiaId, token: provisionalToken }),
      });
      const json = await res.json();
      if (!res.ok) {
        setApiError(json?.error?.message ?? "No se pudo confirmar la reservación.");
        setStep("select_class");
        return;
      }
      setConfirmedClase(clases.find((c) => c.id === selectedClaseId) ?? null);
      setStep("confirmed");
    } catch {
      setApiError("Error de conexión. Intenta de nuevo.");
      setStep("select_class");
    }
  };

  // ── Filtrar clases por membresía seleccionada ─────────────────────────────
  const clasesDisponibles = (() => {
    const mem = memberships.find((m) => m.id === selectedMembresiaId);
    if (!mem) return clases;
    return clases.filter((c) => {
      if (mem.tipoActividadId && c.tipoActividad) return c.tipoActividad.id === mem.tipoActividadId;
      return true;
    });
  })();

  const inputCls = (hasError: boolean) =>
    `w-full rounded-md border px-4 py-3 text-sm text-[#254F40] bg-white/60 placeholder:text-[#254F40]/30 focus:outline-none focus:ring-2 focus:ring-[#254F40]/25 transition-all ${hasError ? "border-red-400" : "border-[#254F40]/15"}`;

  const btnBack = (label: string, to: RegStep) => (
    <button onClick={() => setStep(to)} className="text-xs text-[#749390] hover:text-[#254F40] flex items-center gap-1 transition-colors">
      <ArrowLeft className="w-3 h-3" /> {label}
    </button>
  );

  // ── Renders por step ──────────────────────────────────────────────────────

  if (step === "email" || step === "checking") {
    return (
      <form onSubmit={handleVerificar} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-[#254F40]/60 uppercase tracking-wider mb-1.5">Correo registrado</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@correo.com" className={inputCls(!!emailError)} />
          {emailError && <p className="text-red-500 text-xs mt-1">{emailError}</p>}
        </div>
        {apiError && (
          <div className="bg-red-50 border border-red-200 rounded-md px-3 py-2 text-sm text-red-600 flex gap-2 items-start">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />{apiError}
          </div>
        )}
        <button type="submit" disabled={step === "checking"} className="w-full py-3.5 rounded-md bg-[#254F40] text-[#F6FFB5] font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#1d3d32] transition-colors disabled:opacity-60">
          {step === "checking" ? <div className="w-4 h-4 border-2 border-[#F6FFB5] border-t-transparent rounded-full animate-spin" /> : <>Verificar cuenta <ChevronRight className="w-4 h-4" /></>}
        </button>
      </form>
    );
  }

  if (step === "pendiente") {
    return (
      <div className="text-center py-8 space-y-4">
        <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mx-auto">
          <Clock className="w-7 h-7 text-amber-600" />
        </div>
        <div>
          <h3 className="font-semibold text-[#254F40]">Solicitud en revisión</h3>
          <p className="text-sm text-[#254F40]/60 mt-2 max-w-xs mx-auto">
            Tu solicitud de cuenta está siendo procesada. El equipo te contactará pronto para activar tu acceso y agendar tu primera clase.
          </p>
        </div>
        <button onClick={() => setStep("email")} className="text-sm text-[#749390] hover:text-[#254F40] transition-colors underline">{`← Intentar con otro correo`}</button>
      </div>
    );
  }

  if (step === "not_found" || step === "rechazada") {
    return (
      <div className="text-center py-8 space-y-4">
        <div className="w-14 h-14 rounded-full bg-[#254F40]/10 flex items-center justify-center mx-auto">
          <AlertCircle className="w-7 h-7 text-[#254F40]/50" />
        </div>
        <div>
          <h3 className="font-semibold text-[#254F40]">Correo no encontrado</h3>
          <p className="text-sm text-[#254F40]/60 mt-2 max-w-xs mx-auto">
            No encontramos una cuenta con ese correo. ¿Es tu primera vez? Usa la pestaña <strong>Soy nuevo</strong> para registrarte.
          </p>
        </div>
        <button onClick={() => setStep("email")} className="text-sm text-[#749390] hover:text-[#254F40] transition-colors underline">{`← Intentar con otro correo`}</button>
      </div>
    );
  }

  if (step === "found") {
    return (
      <div className="space-y-5">
        {/* Bienvenida + QR */}
        <div className="flex items-center gap-4 p-4 bg-[#254F40]/5 rounded-lg border border-[#254F40]/10">
          <div className="bg-white p-2 rounded-md border border-[#254F40]/10 shrink-0">
            <QRCode value={qrCode} size={72} fgColor="#254F40" bgColor="#ffffff" />
          </div>
          <div>
            <p className="font-semibold text-[#254F40]">Hola, {clienteNombre.split(" ")[0]} 👋</p>
            <p className="text-xs text-[#254F40]/60 mt-0.5">Este es tu QR de acceso al estudio.</p>
            <div className="flex items-center gap-1 mt-1.5">
              <QrCode className="w-3 h-3 text-[#749390]" />
              <span className="text-[10px] text-[#749390] font-mono">{qrCode.slice(0, 8)}…</span>
            </div>
          </div>
        </div>

        {/* Membresías */}
        {memberships.length === 0 ? (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
            No tienes membresías activas con sesiones disponibles. Contáctanos para adquirir un paquete.
          </div>
        ) : (
          <div>
            <p className="text-xs font-medium text-[#254F40]/60 uppercase tracking-wider mb-2">Tus membresías activas</p>
            <div className="space-y-2">
              {memberships.map((m) => (
                <div key={m.id} className={`p-3 rounded-lg border text-sm cursor-pointer transition-all ${selectedMembresiaId === m.id ? "border-[#254F40] bg-[#254F40]/5" : "border-[#254F40]/15 bg-white/60 hover:border-[#254F40]/30"}`} onClick={() => setSelectedMembresiaId(m.id)}>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-[#254F40]">{m.packageName}</span>
                    <span className="text-xs font-semibold text-[#254F40] bg-[#F6FFB5] px-2 py-0.5 rounded">{m.sessionsRemaining} sesiones</span>
                  </div>
                  {m.tipoActividadNombre && <p className="text-xs text-[#254F40]/50 mt-0.5">{m.tipoActividadNombre}</p>}
                  <p className="text-xs text-[#254F40]/40 mt-0.5">Vence: {new Date(m.expiresAt).toLocaleDateString("es-MX")}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          {btnBack("Cambiar correo", "email")}
          <button
            disabled={!selectedMembresiaId || memberships.length === 0}
            onClick={() => setStep("select_class")}
            className="flex-1 py-2.5 rounded-md bg-[#254F40] text-[#F6FFB5] text-sm font-semibold hover:bg-[#1d3d32] transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
          >
            Elegir clase <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  if (step === "select_class" || step === "reservando") {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-[#254F40]">Clases disponibles</p>
          {btnBack("Atrás", "found")}
        </div>

        {apiError && (
          <div className="bg-red-50 border border-red-200 rounded-md px-3 py-2 text-sm text-red-600 flex gap-2 items-start">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />{apiError}
          </div>
        )}

        {clasesDisponibles.length === 0 ? (
          <p className="text-sm text-[#254F40]/50 text-center py-6">No hay clases disponibles para tu membresía en este momento.</p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {clasesDisponibles.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedClaseId(c.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-md border text-left transition-all ${selectedClaseId === c.id ? "border-[#254F40] bg-[#254F40]/5" : "border-[#254F40]/12 bg-white/40 hover:border-[#254F40]/30"}`}
              >
                {c.tipoActividad?.color && (
                  <div className="w-1 self-stretch rounded-full shrink-0" style={{ backgroundColor: c.tipoActividad.color }} />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#254F40] truncate">{c.title}</p>
                  <p className="text-xs text-[#254F40]/50 capitalize">
                    {formatFecha(c.startAt)} · {formatHora(c.startAt)}–{formatHora(c.endAt)}
                  </p>
                </div>
                <span className="text-xs text-[#254F40]/40 shrink-0">{c.spotsLeft} lugar{c.spotsLeft !== 1 ? "es" : ""}</span>
              </button>
            ))}
          </div>
        )}

        <button
          disabled={!selectedClaseId || step === "reservando"}
          onClick={handleReservar}
          className="w-full py-3 rounded-md bg-[#254F40] text-[#F6FFB5] text-sm font-semibold hover:bg-[#1d3d32] transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
        >
          {step === "reservando" ? <div className="w-4 h-4 border-2 border-[#F6FFB5] border-t-transparent rounded-full animate-spin" /> : "Confirmar reservación"}
        </button>
      </div>
    );
  }

  if (step === "confirmed") {
    return (
      <motion.div className="flex flex-col items-center text-center py-10 gap-5" variants={scaleIn} initial="initial" animate="animate">
        <div className="w-16 h-16 rounded-full bg-[#254F40]/10 flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-[#254F40]" />
        </div>
        <div>
          <h3 className="text-[#254F40] font-semibold text-lg">¡Reservación confirmada!</h3>
          {confirmedClase && (
            <p className="text-[#254F40]/60 text-sm mt-2 capitalize">
              {confirmedClase.title} · {formatFecha(confirmedClase.startAt)} a las {formatHora(confirmedClase.startAt)}
            </p>
          )}
          <p className="text-[#254F40]/50 text-xs mt-3">Recuerda traer calcetas antiderrapantes y tu botella de agua.</p>
        </div>
        <button
          onClick={() => { setStep("email"); setEmail(""); setSelectedClaseId(null); setSelectedMembresiaId(null); setConfirmedClase(null); }}
          className="text-sm text-[#749390] hover:text-[#254F40] transition-colors underline"
        >
          Hacer otra reservación
        </button>
      </motion.div>
    );
  }

  return null;
}

// ── Sección principal ─────────────────────────────────────────────────────────

export function ReservacionesSection() {
  const [tab, setTab] = useState<Tab>("nuevo");

  return (
    <section id="reservaciones" className="py-28 md:py-36 bg-[#FDFFEC] relative overflow-hidden">
      <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-[#F6FFB5]/50 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-[#254F40]/5 blur-3xl pointer-events-none" />

      <div className="max-w-5xl mx-auto px-6 md:px-8 relative z-10">
        <motion.div className="mb-14" variants={staggerContainer} initial="initial" whileInView="animate" viewport={{ once: true, amount: 0.3 }}>
          <motion.p variants={staggerItem} className="text-[#749390] text-xs tracking-[0.3em] uppercase font-medium mb-4">Reservaciones</motion.p>
          <motion.h2 variants={staggerItem} className="font-display font-light text-5xl md:text-6xl text-[#254F40] leading-tight">
            Reserva tu<em className="block italic text-[#749390]">próxima clase</em>
          </motion.h2>
          <motion.p variants={staggerItem} className="mt-4 text-[#254F40]/55 text-base max-w-md">
            Sin cuenta previa. Regístrate en minutos y un administrador confirmará tu primera sesión.
          </motion.p>
        </motion.div>

        <motion.div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start" variants={fadeInUp} initial="initial" whileInView="animate" viewport={{ once: true, amount: 0.15 }}>
          {/* Izquierda: pasos */}
          <div className="space-y-8">
            {[
              { step: "01", title: "Regístrate", desc: "Comparte tu nombre, correo y teléfono. Si ya eres cliente, verifica tu cuenta al instante." },
              { step: "02", title: "Elige tu clase", desc: "Selecciona el horario y modalidad que mejor se adapte a tu agenda y objetivos." },
              { step: "03", title: "Confirma tu lugar", desc: "Tu reservación se crea de inmediato usando tus sesiones disponibles." },
            ].map((item) => (
              <div key={item.step} className="flex gap-5">
                <div className="flex-shrink-0 w-10 h-10 rounded-full border-2 border-[#254F40]/20 flex items-center justify-center">
                  <span className="text-xs font-bold text-[#254F40]/50">{item.step}</span>
                </div>
                <div>
                  <h3 className="font-semibold text-[#254F40] mb-1">{item.title}</h3>
                  <p className="text-sm text-[#254F40]/55 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Derecha: formulario */}
          <div className="bg-white/60 backdrop-blur-sm border border-[#254F40]/10 rounded-2xl p-6 md:p-8 shadow-xl shadow-[#254F40]/5">
            <div className="flex gap-1 p-1 bg-[#254F40]/6 rounded-lg mb-6">
              {([
                { id: "nuevo", label: "Soy nuevo", icon: UserPlus },
                { id: "registrado", label: "Ya tengo cuenta", icon: LogIn },
              ] as const).map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-md text-sm font-medium transition-all ${tab === id ? "bg-[#254F40] text-[#F6FFB5] shadow-md" : "text-[#254F40]/55 hover:text-[#254F40]"}`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, x: tab === "nuevo" ? -10 : 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: tab === "nuevo" ? 10 : -10 }}
                transition={{ duration: 0.22 }}
              >
                {tab === "nuevo" ? <NuevoTab /> : <RegistradoTab />}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
