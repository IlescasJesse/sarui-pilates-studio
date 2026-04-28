"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { portalPublicClient } from "@/lib/portal-client";
import { Loader2 } from "lucide-react";

const schema = z.object({
  email: z.string().email("Correo inválido"),
  password: z.string().min(1, "Ingresa tu contraseña"),
});
type FormData = z.infer<typeof schema>;

export default function PortalLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? "/portal/clases";

  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
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

      router.push(redirectTo);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message ?? "Credenciales incorrectas";
      setError(msg);
    }
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[#254F40]">Accede a tu cuenta</h1>
          <p className="text-sm text-[#254F40]/60 mt-1">
            Para agendar necesitas iniciar sesión
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#254F40] mb-1">
              Correo electrónico
            </label>
            <input
              type="email"
              {...register("email")}
              placeholder="hola@ejemplo.com"
              className="w-full border border-[#254F40]/20 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#254F40]/30"
            />
            {errors.email && (
              <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-[#254F40] mb-1">Contraseña</label>
            <input
              type="password"
              {...register("password")}
              placeholder="••••••••"
              className="w-full border border-[#254F40]/20 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#254F40]/30"
            />
            {errors.password && (
              <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>
            )}
          </div>

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
            Iniciar sesión
          </button>
        </form>

        <p className="text-center text-xs text-[#254F40]/50 mt-6">
          ¿No tienes cuenta? Contáctanos por WhatsApp para registrarte.
        </p>
      </div>
    </div>
  );
}
