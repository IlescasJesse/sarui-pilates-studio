"use client";

export const dynamic = "force-dynamic";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { portalPublicClient } from "@/lib/portal-client";
import { Loader2, CheckCircle, ArrowLeft, Mail } from "lucide-react";
import { dispatchAuthChange } from "@/lib/auth-client";

// ── Schemas ───────────────────────────────────────────────────────────────────

const loginSchema = z.object({
  email: z.string().email("Correo inválido"),
  password: z.string().min(1, "Ingresa tu contraseña"),
});

const solicitudSchema = z.object({
  nombre:   z.string().min(1, "Requerido").max(80),
  apellido: z.string().min(1, "Requerido").max(80),
  email:    z.string().email("Correo inválido"),
  telefono: z.string().min(7, "Teléfono inválido").max(20),
  mensaje:  z.string().max(500).optional(),
});

type LoginData     = z.infer<typeof loginSchema>;
type SolicitudData = z.infer<typeof solicitudSchema>;

// ── Input compartido ──────────────────────────────────────────────────────────

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-[#254F40] mb-1">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

const inputCls =
  "w-full border border-[#254F40]/20 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#254F40]/30";

// ── Tab Login ─────────────────────────────────────────────────────────────────

// ── Olvidé mi contraseña ──────────────────────────────────────────────────────

function OlvideContrasenaForm({ onBack }: { onBack: () => void }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await portalPublicClient.post("/portal/olvide-contrasena", { email });
      setSent(true);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message ?? "Error al enviar solicitud";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="text-center py-6 space-y-3">
        <div className="w-14 h-14 bg-[#254F40]/10 rounded-full flex items-center justify-center mx-auto">
          <Mail className="w-7 h-7 text-[#254F40]" />
        </div>
        <h3 className="font-bold text-[#254F40]">Revisa tu correo</h3>
        <p className="text-sm text-[#254F40]/60">
          Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.
        </p>
        <button
          onClick={onBack}
          className="text-sm text-[#254F40] underline hover:text-[#254F40]/80 mt-2"
        >
          Volver a iniciar sesión
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-[#254F40] mb-1">Correo electrónico</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="hola@ejemplo.com"
          className={inputCls}
          required
          autoFocus
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-600">{error}</div>
      )}

      <button
        type="submit"
        disabled={loading || !email}
        className="w-full bg-[#254F40] text-[#F6FFB5] font-semibold py-2.5 rounded-lg hover:bg-[#254F40]/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        Enviar enlace
      </button>

      <button
        type="button"
        onClick={onBack}
        className="w-full flex items-center justify-center gap-1.5 text-sm text-[#254F40]/60 hover:text-[#254F40] transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Volver
      </button>
    </form>
  );
}

// ── Tab Login ─────────────────────────────────────────────────────────────────

function LoginForm({ redirectTo, onForgot }: { redirectTo: string; onForgot: () => void }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginData>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(data: LoginData) {
    setError(null);
    try {
      const res = await portalPublicClient.post<{
        success: boolean;
        data: { accessToken: string; user: { role: string; email: string } };
      }>("/auth/login", data);

      const { accessToken, user } = res.data.data;
      if (user.role !== "CLIENT") {
        setError("Esta área es exclusiva para clientes.");
        return;
      }
      localStorage.setItem("sarui_token", accessToken);
      localStorage.setItem("sarui_user", JSON.stringify(user));
      window.dispatchEvent(new Event("auth-change"));
      router.push(redirectTo);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message ?? "Credenciales incorrectas";
      setError(msg);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Field label="Correo electrónico" error={errors.email?.message}>
        <input type="email" {...register("email")} placeholder="hola@ejemplo.com" className={inputCls} />
      </Field>
      <Field label="Contraseña" error={errors.password?.message}>
        <input type="password" {...register("password")} placeholder="••••••••" className={inputCls} />
      </Field>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-600">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-[#254F40] text-[#F6FFB5] font-semibold py-2.5 rounded-lg hover:bg-[#254F40]/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
        Entrar
      </button>

      <button
        type="button"
        onClick={onForgot}
        className="w-full text-center text-sm text-[#254F40]/50 hover:text-[#254F40] transition-colors"
      >
        ¿Olvidaste tu contraseña?
      </button>
    </form>
  );
}

// ── Tab Solicitar cuenta ──────────────────────────────────────────────────────

function SolicitudForm() {
  const [done, setDone] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SolicitudData>({ resolver: zodResolver(solicitudSchema) });

  async function onSubmit(data: SolicitudData) {
    setApiError(null);
    try {
      await portalPublicClient.post("/portal/solicitar-cuenta", data);
      setDone(true);
    } catch (err: unknown) {
      const code = (err as { response?: { data?: { error?: { code?: string; message?: string } } } })
        ?.response?.data?.error;
      if (code?.code === "ALREADY_REQUESTED") {
        setApiError("Ya tienes una solicitud pendiente con ese correo. Te contactaremos pronto.");
      } else if (code?.code === "EMAIL_EXISTS") {
        setApiError("Ya tenemos una cuenta con ese correo. Intenta iniciar sesión.");
      } else {
        setApiError(code?.message ?? "Ocurrió un error. Intenta de nuevo.");
      }
    }
  }

  if (done) {
    return (
      <div className="text-center py-6 space-y-3">
        <div className="w-14 h-14 bg-[#254F40]/10 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="w-7 h-7 text-[#254F40]" />
        </div>
        <h3 className="font-bold text-[#254F40]">¡Solicitud enviada!</h3>
        <p className="text-sm text-[#254F40]/60">
          El equipo de Sarui Studio revisará tu solicitud y te contactará por WhatsApp o correo en las próximas horas.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Nombre" error={errors.nombre?.message}>
          <input {...register("nombre")} placeholder="Ana" className={inputCls} />
        </Field>
        <Field label="Apellido" error={errors.apellido?.message}>
          <input {...register("apellido")} placeholder="García" className={inputCls} />
        </Field>
      </div>
      <Field label="Correo electrónico" error={errors.email?.message}>
        <input type="email" {...register("email")} placeholder="hola@ejemplo.com" className={inputCls} />
      </Field>
      <Field label="Teléfono / WhatsApp" error={errors.telefono?.message}>
        <input type="tel" {...register("telefono")} placeholder="+52 951 000 0000" className={inputCls} />
      </Field>
      <Field label="Mensaje (opcional)" error={errors.mensaje?.message}>
        <textarea
          {...register("mensaje")}
          placeholder="¿Qué tipo de clase te interesa? ¿Tienes alguna lesión o condición que debamos saber?"
          rows={3}
          className={`${inputCls} resize-none`}
        />
      </Field>

      {apiError && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-600">
          {apiError}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-[#254F40] text-[#F6FFB5] font-semibold py-2.5 rounded-lg hover:bg-[#254F40]/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
        Enviar solicitud
      </button>
    </form>
  );
}

// ── Página ────────────────────────────────────────────────────────────────────

function TiendaLoginContent() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? "/tienda/clases";
  const [tab, setTab] = useState<"login" | "solicitud" | "olvide">("login");

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-[#254F40]">
            {tab === "login" && "Inicia sesión"}
            {tab === "solicitud" && "Solicitar cuenta"}
            {tab === "olvide" && "Restablecer contraseña"}
          </h1>
          <p className="text-sm text-[#254F40]/60 mt-1">
            {tab === "login" && "Para agendar necesitas iniciar sesión"}
            {tab === "solicitud" && "El equipo te creará acceso y te avisará"}
            {tab === "olvide" && "Te enviaremos un enlace a tu correo"}
          </p>
        </div>

        {/* Tabs */}
        {tab !== "olvide" && (
          <div className="flex bg-[#254F40]/5 rounded-xl p-1 mb-6">
            {(["login", "solicitud"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                  tab === t
                    ? "bg-white text-[#254F40] shadow-sm"
                    : "text-[#254F40]/50 hover:text-[#254F40]/70"
                }`}
              >
                {t === "login" ? "Iniciar sesión" : "Soy nuevo/a"}
              </button>
            ))}
          </div>
        )}

        {/* Contenido */}
        {tab === "login" && <LoginForm redirectTo={redirectTo} onForgot={() => setTab("olvide")} />}
        {tab === "solicitud" && <SolicitudForm />}
        {tab === "olvide" && <OlvideContrasenaForm onBack={() => setTab("login")} />}

        {/* Acceso admin */}
        <div className="mt-8 text-center">
          <a
            href="/gestion-acceso"
            className="text-xs text-[#254F40]/30 hover:text-[#254F40]/60 transition-colors"
          >
            ADMINISTRADOR
          </a>
        </div>
      </div>
    </div>
  );
}

export default function TiendaLoginPage() {
  return (
    <Suspense fallback={null}>
      <TiendaLoginContent />
    </Suspense>
  );
}
