"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fadeInUp, staggerContainer, staggerItem, scaleIn } from "@/lib/animations";
import {
  CheckCircle,
  Clock,
  ChevronRight,
  CreditCard,
  Banknote,
  Smartphone,
  Send,
  UserPlus,
  LogIn,
  ArrowLeft,
} from "lucide-react";

type Tab = "nuevo" | "registrado";
type Step = "form" | "success" | "verify" | "schedule" | "payment" | "confirmed";

const HORARIOS_DISPONIBLES = [
  { id: "1", dia: "Lunes", fecha: "28 Apr", hora: "7:00", tipo: "Reformer Flow", spots: 2 },
  { id: "2", dia: "Lunes", fecha: "28 Apr", hora: "9:00", tipo: "Mat Pilates", spots: 4 },
  { id: "3", dia: "Martes", fecha: "29 Apr", hora: "18:00", tipo: "Reformer Power", spots: 1 },
  { id: "4", dia: "Miércoles", fecha: "30 Apr", hora: "8:00", tipo: "Reformer Mobility", spots: 3 },
  { id: "5", dia: "Jueves", fecha: "1 May", hora: "17:00", tipo: "Reformer Flow", spots: 2 },
  { id: "6", dia: "Sábado", fecha: "3 May", hora: "9:00", tipo: "Mat Pilates", spots: 5 },
];

const PAYMENT_METHODS = [
  { id: "card", label: "Tarjeta débito / crédito", icon: CreditCard, desc: "Visa, Mastercard, AMEX" },
  { id: "spei", label: "Transferencia SPEI", icon: Banknote, desc: "Depósito en 5-10 minutos" },
  { id: "tap", label: "Tap to Pay · Mercado Libre", icon: Smartphone, desc: "Pago con tu teléfono" },
];

function NuevoTab() {
  const [step, setStep] = useState<"form" | "success">("form");
  const [form, setForm] = useState({ nombre: "", email: "", telefono: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.nombre.trim()) e.nombre = "Nombre requerido";
    if (!form.email.includes("@")) e.email = "Correo inválido";
    if (!form.telefono.trim()) e.telefono = "Teléfono requerido";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    setLoading(false);
    setStep("success");
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
            Hemos recibido tu solicitud. Un administrador revisará tu registro y te contactará en breve para confirmar tu primera clase.
          </p>
        </div>
        <div className="mt-2 px-5 py-3 rounded-xl bg-[#F6FFB5]/60 border border-[#254F40]/10 text-left">
          <p className="text-xs text-[#254F40]/70">
            📱 Te avisaremos al <strong>{form.telefono}</strong> o al correo <strong>{form.email}</strong>
          </p>
        </div>
        <button
          onClick={() => { setStep("form"); setForm({ nombre: "", email: "", telefono: "" }); }}
          className="text-sm text-[#749390] hover:text-[#254F40] transition-colors underline"
        >
          Enviar otra solicitud
        </button>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-[#254F40]/60 uppercase tracking-wider mb-1.5">
          Nombre completo *
        </label>
        <input
          type="text"
          value={form.nombre}
          onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
          placeholder="Tu nombre"
          className={`w-full rounded-xl border px-4 py-3 text-sm text-[#254F40] bg-white/60 placeholder:text-[#254F40]/30 focus:outline-none focus:ring-2 focus:ring-[#254F40]/25 transition-all ${errors.nombre ? "border-red-400" : "border-[#254F40]/15"}`}
        />
        {errors.nombre && <p className="text-red-500 text-xs mt-1">{errors.nombre}</p>}
      </div>

      <div>
        <label className="block text-xs font-medium text-[#254F40]/60 uppercase tracking-wider mb-1.5">
          Correo electrónico *
        </label>
        <input
          type="email"
          value={form.email}
          onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
          placeholder="tu@correo.com"
          className={`w-full rounded-xl border px-4 py-3 text-sm text-[#254F40] bg-white/60 placeholder:text-[#254F40]/30 focus:outline-none focus:ring-2 focus:ring-[#254F40]/25 transition-all ${errors.email ? "border-red-400" : "border-[#254F40]/15"}`}
        />
        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
      </div>

      <div>
        <label className="block text-xs font-medium text-[#254F40]/60 uppercase tracking-wider mb-1.5">
          Teléfono *
        </label>
        <input
          type="tel"
          value={form.telefono}
          onChange={(e) => setForm((p) => ({ ...p, telefono: e.target.value }))}
          placeholder="951 000 0000"
          className={`w-full rounded-xl border px-4 py-3 text-sm text-[#254F40] bg-white/60 placeholder:text-[#254F40]/30 focus:outline-none focus:ring-2 focus:ring-[#254F40]/25 transition-all ${errors.telefono ? "border-red-400" : "border-[#254F40]/15"}`}
        />
        {errors.telefono && <p className="text-red-500 text-xs mt-1">{errors.telefono}</p>}
      </div>

      <p className="text-[#254F40]/50 text-xs leading-relaxed">
        Tu solicitud será revisada por un administrador antes de confirmar. Te contactaremos para completar el registro y tu primera clase.
      </p>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3.5 rounded-xl bg-[#254F40] text-[#F6FFB5] font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#1d3d32] transition-colors disabled:opacity-60"
      >
        {loading ? (
          <div className="w-4 h-4 border-2 border-[#F6FFB5] border-t-transparent rounded-full animate-spin" />
        ) : (
          <>
            <Send className="w-4 h-4" />
            Solicitar mi registro
          </>
        )}
      </button>
    </form>
  );
}

function RegistradoTab() {
  const [step, setStep] = useState<"verify" | "schedule" | "payment" | "confirmed">("verify");
  const [email, setEmail] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);

  const handleVerify = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!email.includes("@")) { setVerifyError("Ingresa un correo válido"); return; }
    setVerifyError("");
    setVerifying(true);
    await new Promise((r) => setTimeout(r, 1000));
    setVerifying(false);
    setStep("schedule");
  };

  const handlePay = async () => {
    if (!selectedPayment) return;
    setPaying(true);
    await new Promise((r) => setTimeout(r, 1400));
    setPaying(false);
    setStep("confirmed");
  };

  if (step === "verify") {
    return (
      <form onSubmit={handleVerify} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-[#254F40]/60 uppercase tracking-wider mb-1.5">
            Correo registrado
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@correo.com"
            className={`w-full rounded-xl border px-4 py-3 text-sm text-[#254F40] bg-white/60 placeholder:text-[#254F40]/30 focus:outline-none focus:ring-2 focus:ring-[#254F40]/25 transition-all ${verifyError ? "border-red-400" : "border-[#254F40]/15"}`}
          />
          {verifyError && <p className="text-red-500 text-xs mt-1">{verifyError}</p>}
        </div>
        <button
          type="submit"
          disabled={verifying}
          className="w-full py-3.5 rounded-xl bg-[#254F40] text-[#F6FFB5] font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#1d3d32] transition-colors disabled:opacity-60"
        >
          {verifying ? (
            <div className="w-4 h-4 border-2 border-[#F6FFB5] border-t-transparent rounded-full animate-spin" />
          ) : (
            <>Verificar cuenta <ChevronRight className="w-4 h-4" /></>
          )}
        </button>
      </form>
    );
  }

  if (step === "schedule") {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-[#254F40]">Elige un horario disponible</p>
          <button onClick={() => setStep("verify")} className="text-xs text-[#749390] hover:text-[#254F40] flex items-center gap-1 transition-colors">
            <ArrowLeft className="w-3 h-3" /> Cambiar
          </button>
        </div>
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {HORARIOS_DISPONIBLES.map((slot) => (
            <button
              key={slot.id}
              onClick={() => setSelectedSlot(slot.id)}
              className={`w-full flex items-center gap-4 p-3.5 rounded-xl border text-left transition-all ${selectedSlot === slot.id ? "border-[#254F40] bg-[#254F40]/5" : "border-[#254F40]/12 bg-white/40 hover:border-[#254F40]/30"}`}
            >
              <div className="flex-shrink-0 w-10 text-center">
                <p className="text-[10px] text-[#749390] uppercase tracking-wide">{slot.dia}</p>
                <p className="font-display text-xl font-light text-[#254F40]">{slot.hora}</p>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#254F40] truncate">{slot.tipo}</p>
                <p className="text-xs text-[#254F40]/50">{slot.fecha} · {slot.spots} lugar{slot.spots !== 1 ? "es" : ""} disponible{slot.spots !== 1 ? "s" : ""}</p>
              </div>
              <Clock className="w-4 h-4 text-[#254F40]/30 flex-shrink-0" />
            </button>
          ))}
        </div>
        <button
          disabled={!selectedSlot}
          onClick={() => setStep("payment")}
          className="w-full py-3.5 rounded-xl bg-[#254F40] text-[#F6FFB5] font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#1d3d32] transition-colors disabled:opacity-40"
        >
          Continuar al pago <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  if (step === "payment") {
    const slot = HORARIOS_DISPONIBLES.find((s) => s.id === selectedSlot);
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-[#254F40]">Método de pago</p>
          <button onClick={() => setStep("schedule")} className="text-xs text-[#749390] hover:text-[#254F40] flex items-center gap-1 transition-colors">
            <ArrowLeft className="w-3 h-3" /> Atrás
          </button>
        </div>

        {slot && (
          <div className="p-3 rounded-xl bg-[#254F40]/6 border border-[#254F40]/10 text-sm">
            <p className="font-medium text-[#254F40]">{slot.tipo}</p>
            <p className="text-[#254F40]/60 text-xs">{slot.dia} {slot.fecha} · {slot.hora}</p>
          </div>
        )}

        <div className="space-y-2">
          {PAYMENT_METHODS.map((pm) => {
            const Icon = pm.icon;
            return (
              <button
                key={pm.id}
                onClick={() => setSelectedPayment(pm.id)}
                className={`w-full flex items-center gap-3.5 p-3.5 rounded-xl border text-left transition-all ${selectedPayment === pm.id ? "border-[#254F40] bg-[#254F40]/5" : "border-[#254F40]/12 bg-white/40 hover:border-[#254F40]/30"}`}
              >
                <div className="w-9 h-9 rounded-lg bg-[#254F40]/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-[#254F40]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#254F40]">{pm.label}</p>
                  <p className="text-xs text-[#254F40]/50">{pm.desc}</p>
                </div>
                {selectedPayment === pm.id && (
                  <div className="ml-auto w-4 h-4 rounded-full bg-[#254F40] flex items-center justify-center flex-shrink-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#F6FFB5]" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <button
          disabled={!selectedPayment || paying}
          onClick={handlePay}
          className="w-full py-3.5 rounded-xl bg-[#254F40] text-[#F6FFB5] font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#1d3d32] transition-colors disabled:opacity-40"
        >
          {paying ? (
            <div className="w-4 h-4 border-2 border-[#F6FFB5] border-t-transparent rounded-full animate-spin" />
          ) : (
            "Confirmar y pagar"
          )}
        </button>
      </div>
    );
  }

  if (step === "confirmed") {
    const slot = HORARIOS_DISPONIBLES.find((s) => s.id === selectedSlot);
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
          <h3 className="text-[#254F40] font-semibold text-lg">¡Reservación confirmada!</h3>
          {slot && (
            <p className="text-[#254F40]/60 text-sm mt-2">
              {slot.tipo} · {slot.dia} {slot.fecha} a las {slot.hora}
            </p>
          )}
          <p className="text-[#254F40]/50 text-xs mt-3">Recibirás un recordatorio 24 horas antes. Recuerda traer calcetas antiderrapantes y tu botella de agua.</p>
        </div>
        <button
          onClick={() => { setStep("verify"); setSelectedSlot(null); setSelectedPayment(null); setEmail(""); }}
          className="text-sm text-[#749390] hover:text-[#254F40] transition-colors underline"
        >
          Hacer otra reservación
        </button>
      </motion.div>
    );
  }

  return null;
}

export function ReservacionesSection() {
  const [tab, setTab] = useState<Tab>("nuevo");

  return (
    <section id="reservaciones" className="py-28 md:py-36 bg-[#FDFFEC] relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-[#F6FFB5]/50 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-[#254F40]/5 blur-3xl pointer-events-none" />

      <div className="max-w-5xl mx-auto px-6 md:px-8 relative z-10">
        {/* Header */}
        <motion.div
          className="mb-14"
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, amount: 0.3 }}
        >
          <motion.p variants={staggerItem} className="text-[#749390] text-xs tracking-[0.3em] uppercase font-medium mb-4">
            Reservaciones
          </motion.p>
          <motion.h2 variants={staggerItem} className="font-display font-light text-5xl md:text-6xl text-[#254F40] leading-tight">
            Reserva tu
            <em className="block italic text-[#749390]">próxima clase</em>
          </motion.h2>
          <motion.p variants={staggerItem} className="mt-4 text-[#254F40]/55 text-base max-w-md">
            Sin cuenta previa. Regístrate en minutos y un administrador confirmará tu primera sesión.
          </motion.p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start"
          variants={fadeInUp}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, amount: 0.15 }}
        >
          {/* Left: Info */}
          <div className="space-y-8">
            {[
              {
                step: "01",
                title: "Regístrate",
                desc: "Comparte tu nombre, correo y teléfono. Si ya eres cliente, verifica tu cuenta al instante.",
              },
              {
                step: "02",
                title: "Elige tu clase",
                desc: "Selecciona el horario y modalidad que mejor se adapte a tu agenda y objetivos.",
              },
              {
                step: "03",
                title: "Confirma y paga",
                desc: "Completa tu pago de forma segura. Aceptamos tarjeta, SPEI y Tap to Pay.",
              },
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

          {/* Right: Form */}
          <div className="bg-white/60 backdrop-blur-sm border border-[#254F40]/10 rounded-2xl p-6 md:p-8 shadow-xl shadow-[#254F40]/5">
            {/* Tab switcher */}
            <div className="flex gap-1 p-1 bg-[#254F40]/6 rounded-xl mb-6">
              {(
                [
                  { id: "nuevo", label: "Soy nuevo", icon: UserPlus },
                  { id: "registrado", label: "Ya tengo cuenta", icon: LogIn },
                ] as const
              ).map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${
                    tab === id
                      ? "bg-[#254F40] text-[#F6FFB5] shadow-md"
                      : "text-[#254F40]/55 hover:text-[#254F40]"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              ))}
            </div>

            {/* Tab content */}
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
