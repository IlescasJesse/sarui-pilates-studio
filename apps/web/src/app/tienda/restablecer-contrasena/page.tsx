"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { portalPublicClient } from "@/lib/portal-client";
import { Loader2, CheckCircle, AlertCircle, ArrowRight, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

const schema = z.object({
  password: z.string().min(6, "Mínimo 6 caracteres"),
  confirm: z.string().min(1, "Confirma tu contraseña"),
}).refine((d) => d.password === d.confirm, {
  message: "Las contraseñas no coinciden",
  path: ["confirm"],
});

type FormData = z.infer<typeof schema>;

const inputCls = "w-full border border-[#254F40]/20 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#254F40]/30 pr-10";

function RestablecerContrasenaContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [done, setDone] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormData) {
    setApiError(null);
    try {
      await portalPublicClient.post("/portal/restablecer-contrasena", { token, password: data.password });
      setDone(true);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ?? "Error al restablecer contraseña";
      setApiError(msg);
    }
  }

  if (!token) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center space-y-4 max-w-sm">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
          <h1 className="text-xl font-bold text-[#254F40]">Enlace inválido</h1>
          <p className="text-sm text-[#254F40]/60">Este enlace no es válido. Solicita uno nuevo.</p>
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
            <h1 className="text-xl font-bold text-[#254F40]">¡Contraseña restablecida!</h1>
            <p className="text-sm text-[#254F40]/60 mt-2">Ya puedes iniciar sesión con tu nueva contraseña.</p>
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
          <h1 className="text-2xl font-bold text-[#254F40]">Restablecer contraseña</h1>
          <p className="text-sm text-[#254F40]/60 mt-1">Elige una contraseña nueva para tu cuenta</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#254F40] mb-1">Nueva contraseña</label>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                {...register("password")}
                placeholder="••••••••"
                className={inputCls}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#254F40]/40 hover:text-[#254F40] transition-colors"
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-[#254F40] mb-1">Confirmar contraseña</label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                {...register("confirm")}
                placeholder="••••••••"
                className={inputCls}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#254F40]/40 hover:text-[#254F40] transition-colors"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.confirm && <p className="text-xs text-red-500 mt-1">{errors.confirm.message}</p>}
          </div>

          {apiError && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-600 flex gap-2 items-start">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />{apiError}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#254F40] text-[#F6FFB5] font-semibold py-2.5 rounded-lg hover:bg-[#254F40]/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Restablecer contraseña
          </button>
        </form>
      </div>
    </div>
  );
}

export default function RestablecerContrasenaPage() {
  return (
    <div className="min-h-screen bg-[#FDFFEC] flex items-center justify-center">
      <Suspense fallback={null}>
        <RestablecerContrasenaContent />
      </Suspense>
    </div>
  );
}
