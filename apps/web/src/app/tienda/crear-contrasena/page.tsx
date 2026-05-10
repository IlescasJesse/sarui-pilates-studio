"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { portalPublicClient } from "@/lib/portal-client";
import { Loader2, CheckCircle, AlertCircle, ArrowRight } from "lucide-react";
import Link from "next/link";

const inputCls = "w-full border border-[#254F40]/20 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#254F40]/30";

function CrearContrasenaContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) { setError("Mínimo 6 caracteres"); return; }
    if (password !== confirm) { setError("Las contraseñas no coinciden"); return; }

    setLoading(true);
    try {
      await portalPublicClient.post("/portal/establecer-contrasena", { token, password });
      setDone(true);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ?? "Error al establecer contraseña";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center space-y-4 max-w-sm">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
          <h1 className="text-xl font-bold text-[#254F40]">Enlace inválido</h1>
          <p className="text-sm text-[#254F40]/60">Este enlace no es válido. Solicita uno nuevo al administrador.</p>
          <Link href="/tienda/login" className="inline-block text-sm text-[#254F40] underline">Ir a iniciar sesión</Link>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center space-y-6 max-w-sm">
          <div className="w-16 h-16 rounded-full bg-[#254F40]/10 flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8 text-[#254F40]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#254F40]">¡Contraseña creada!</h1>
            <p className="text-sm text-[#254F40]/60 mt-2">Ya puedes iniciar sesión en la tienda y agendar tus clases.</p>
          </div>
          <Link
            href="/tienda/login"
            className="inline-flex items-center gap-2 bg-[#254F40] text-[#F6FFB5] font-semibold px-6 py-3 rounded-lg hover:bg-[#254F40]/90 transition-colors"
          >
            Iniciar sesión <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-[#254F40]">Crear contraseña</h1>
          <p className="text-sm text-[#254F40]/60 mt-1">Elige una contraseña para acceder a tu cuenta</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#254F40] mb-1">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={inputCls}
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#254F40] mb-1">Confirmar contraseña</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
              className={inputCls}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-600 flex gap-2 items-start">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />{error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#254F40] text-[#F6FFB5] font-semibold py-2.5 rounded-lg hover:bg-[#254F40]/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Crear contraseña
          </button>
        </form>
      </div>
    </div>
  );
}

export default function CrearContrasenaPage() {
  return (
    <div className="min-h-screen bg-[#FDFFEC] flex items-center justify-center">
      <Suspense fallback={null}>
        <CrearContrasenaContent />
      </Suspense>
    </div>
  );
}
