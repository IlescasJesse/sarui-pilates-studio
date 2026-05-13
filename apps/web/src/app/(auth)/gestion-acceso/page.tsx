"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const loginSchema = z.object({
  email: z.string().min(1, "El correo es requerido").email("Ingresa un correo válido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const orbs = [
  { size: 320, x: "-20%", y: "-15%", delay: 0,   duration: 7  },
  { size: 200, x: "65%",  y: "60%",  delay: 1.5, duration: 9  },
  { size: 120, x: "75%",  y: "10%",  delay: 0.8, duration: 6  },
  { size: 80,  x: "15%",  y: "75%",  delay: 2.2, duration: 8  },
];

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginFormValues) {
    setServerError(null);
    try {
      await login(values.email, values.password);
      router.push("/dashboard");
    } catch {
      setServerError("Correo o contraseña incorrectos. Intenta de nuevo.");
    }
  }

  return (
    <main className="min-h-screen flex bg-[#FDFFEC]">

      {/* ── Panel de marca (solo escritorio) ── */}
      <div className="hidden md:flex md:w-1/2 relative overflow-hidden flex-col items-center justify-center bg-[#254F40] px-12 gap-8">
        {orbs.map((orb, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-[#F6FFB5] pointer-events-none"
            style={{ width: orb.size, height: orb.size, left: orb.x, top: orb.y, opacity: 0.05 }}
            animate={{ y: [0, -22, 0, 14, 0], x: [0, 10, -8, 6, 0], scale: [1, 1.04, 0.97, 1.02, 1] }}
            transition={{ duration: orb.duration, delay: orb.delay, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}

        <motion.div
          className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-[#F6FFB5]/20 to-transparent"
          animate={{ scaleY: [0.6, 1, 0.6], opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="relative z-10 flex flex-col items-center gap-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
          >
            <span className="text-[#FDFFEC] font-bold text-2xl tracking-[0.15em]">SARUI</span>
          </motion.div>

          <motion.div
            className="h-px bg-[#F6FFB5]/30 rounded-full"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 64, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6, ease: "easeOut" }}
          />

          <motion.div
            className="text-center space-y-3 max-w-xs"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.5, ease: "easeOut" }}
          >
            <p className="text-[#F6FFB5] text-xl font-semibold tracking-wide leading-snug">
              Movimiento consciente,<br />resultados reales.
            </p>
            <p className="text-white/50 text-sm">Pilates Studio · Oaxaca, México</p>
          </motion.div>

          <div className="flex gap-2">
            {[0, 0.3, 0.6].map((delay, i) => (
              <motion.span
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-[#F6FFB5]/40"
                animate={{ opacity: [0.3, 1, 0.3], scale: [0.9, 1.2, 0.9] }}
                transition={{ duration: 2, delay, repeat: Infinity, ease: "easeInOut" }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── Panel del formulario ── */}
      <div className="w-full md:w-1/2 flex flex-col items-center justify-center px-6 py-12">

        {/* Logo solo en móvil */}
          <div className="flex flex-col items-center gap-2 mb-8 md:hidden">
            <span className="text-[#254F40] font-bold text-xl tracking-[0.15em]">SARUI</span>
            <p className="text-xs text-[#254F40]/60">Pilates Studio · Oaxaca, México</p>
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[#254F40] tracking-tight leading-none">
              Bienvenida
            </h1>
            <p className="mt-2 text-sm text-[#254F40]/60">Inicia sesión para continuar</p>
          </div>

          <Card className="border border-[#254F40]/10 shadow-sm bg-white">
            <CardHeader className="pb-0 pt-6 px-6" />
            <form onSubmit={handleSubmit(onSubmit)} noValidate suppressHydrationWarning>
              <CardContent className="space-y-5 px-6 pt-4">
                <div className="space-y-1.5">
                  <label htmlFor="email" className="text-sm font-medium text-[#254F40]">
                    Correo electrónico
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@saruistudio.com"
                    autoComplete="email"
                    className="border-[#254F40]/20 focus-visible:ring-[#254F40]/30 bg-white"
                    {...register("email")}
                    aria-invalid={!!errors.email}
                    suppressHydrationWarning
                  />
                  {errors.email && (
                    <p className="text-xs text-destructive">{errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="password" className="text-sm font-medium text-[#254F40]">
                    Contraseña
                  </label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      className="pr-10 border-[#254F40]/20 focus-visible:ring-[#254F40]/30 bg-white"
                      {...register("password")}
                      aria-invalid={!!errors.password}
                      suppressHydrationWarning
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#254F40]/40 hover:text-[#254F40] transition-colors"
                      aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-xs text-destructive">{errors.password.message}</p>
                  )}
                </div>

                {serverError && (
                  <div className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
                    {serverError}
                  </div>
                )}
              </CardContent>

              <CardFooter className="px-6 pb-6 pt-2">
                <Button
                  type="submit"
                  className="w-full bg-[#254F40] hover:bg-[#1d3d32] text-[#F6FFB5] font-semibold transition-colors duration-150"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Ingresando..." : "Ingresar"}
                </Button>
              </CardFooter>
            </form>
          </Card>

          <p className="mt-6 text-center text-xs text-[#254F40]/50">
            ¿Problemas para acceder?{" "}
            <a
              href="mailto:admin@saruistudio.com"
              className="text-[#254F40] underline underline-offset-2 hover:text-[#1d3d32] transition-colors"
            >
              Contacta al administrador
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
