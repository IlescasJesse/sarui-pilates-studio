"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { QrCode, Hash, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { QRScanner } from "@/components/kiosk/QRScanner";
import { PINPad } from "@/components/kiosk/PINPad";

type KioskMode = "idle" | "qr" | "pin";

interface CheckInSuccess {
  cliente: {
    nombre: string;
    clase: string;
    sesionesRestantes: number | null;
  };
  status: "ON_TIME" | "LATE";
  message: string;
}

const pageTransition = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" as const } },
  exit:    { opacity: 0, y: -12, transition: { duration: 0.3, ease: "easeIn" as const } },
};

export default function KioskPage() {
  const [mode, setMode] = useState<KioskMode>("idle");
  const [successData, setSuccessData] = useState<CheckInSuccess | null>(null);
  const [autoResetTimer, setAutoResetTimer] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (autoResetTimer) clearTimeout(autoResetTimer);
    };
  }, [autoResetTimer]);

  function handleClose() {
    setMode("idle");
    setSuccessData(null);
  }

  function handleCheckInSuccess(data: CheckInSuccess) {
    setSuccessData(data);
    const timer = setTimeout(() => {
      setSuccessData(null);
      setMode("idle");
    }, 4000);
    setAutoResetTimer(timer);
  }

  return (
    <AnimatePresence mode="wait">
      {/* ── Pantalla de éxito ── */}
      {successData && (
        <motion.main
          key="success"
          {...pageTransition}
          className="flex-1 flex flex-col items-center justify-center px-6 gap-6"
        >
          {(() => {
            const isOnTime = successData.status === "ON_TIME";
            return (
              <>
                <motion.div
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.15, duration: 0.5, type: "spring", stiffness: 200, damping: 18 }}
                  className={`p-5 rounded-full ${isOnTime ? "bg-emerald-500/20" : "bg-amber-500/20"}`}
                >
                  <CheckCircle
                    className={`w-16 h-16 ${isOnTime ? "text-emerald-400" : "text-amber-400"}`}
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                  className="text-center"
                >
                  <h1 className="text-3xl font-bold text-[#F6FFB5] mb-2">¡Bienvenida!</h1>
                  <p className="text-xl text-[#F6FFB5] font-medium">{successData.cliente.nombre}</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.42, duration: 0.4 }}
                  className="bg-[#F6FFB5]/10 rounded-2xl border border-[#F6FFB5]/30 p-6 max-w-sm w-full"
                >
                  <div className="space-y-3">
                    <div>
                      <p className="text-[#749390] text-sm uppercase tracking-wide">Clase</p>
                      <p className="text-[#F6FFB5] text-lg font-medium">{successData.cliente.clase}</p>
                    </div>
                    <div className="flex gap-6">
                      <div className="flex-1">
                        <p className="text-[#749390] text-sm uppercase tracking-wide">Estado</p>
                        <p className={`text-lg font-bold ${isOnTime ? "text-emerald-400" : "text-amber-400"}`}>
                          {isOnTime ? "A tiempo" : "Tarde"}
                        </p>
                      </div>
                      {successData.cliente.sesionesRestantes !== null && (
                        <div className="flex-1">
                          <p className="text-[#749390] text-sm uppercase tracking-wide">Sesiones</p>
                          <p className="text-[#F6FFB5] text-lg font-bold">
                            {successData.cliente.sesionesRestantes}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="text-[#749390] text-sm"
                >
                  Regresando al inicio en unos segundos...
                </motion.p>
              </>
            );
          })()}
        </motion.main>
      )}

      {/* ── Modo QR ── */}
      {!successData && mode === "qr" && (
        <motion.div key="qr" {...pageTransition} className="flex-1 flex flex-col">
          <QRScanner onClose={handleClose} onSuccess={handleCheckInSuccess} />
        </motion.div>
      )}

      {/* ── Modo PIN ── */}
      {!successData && mode === "pin" && (
        <motion.div key="pin" {...pageTransition} className="flex-1 flex flex-col">
          <PINPad onClose={handleClose} onSuccess={handleCheckInSuccess} />
        </motion.div>
      )}

      {/* ── Pantalla de inicio ── */}
      {!successData && mode === "idle" && (
        <motion.main
          key="idle"
          {...pageTransition}
          className="flex-1 flex flex-col items-center justify-center px-6 gap-10"
        >
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center gap-2"
          >
            <Image
              src="/logo.png"
              alt="Sarui Pilates Studio"
              width={200}
              height={74}
              style={{ height: "auto" }}
              priority
            />
          </motion.div>

          {/* Call to action */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25, duration: 0.5 }}
            className="text-[#F6FFB5]/70 text-2xl font-semibold"
          >
            Registra tu asistencia
          </motion.p>

          {/* Botones */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col sm:flex-row gap-6 w-full max-w-lg"
          >
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              onClick={() => setMode("qr")}
              className="flex-1 flex flex-col items-center gap-4 rounded-2xl border-2 border-[#F6FFB5]/30 bg-[#F6FFB5]/10 hover:bg-[#F6FFB5]/20 transition-colors duration-200 p-8 group"
              aria-label="Escanear código QR"
            >
              <div className="w-16 h-16 rounded-xl bg-[#F6FFB5] flex items-center justify-center">
                <QrCode className="w-9 h-9 text-[#254F40]" strokeWidth={1.8} />
              </div>
              <div className="text-center">
                <p className="text-[#F6FFB5] text-xl font-bold">Escanear QR</p>
                <p className="text-[#749390] text-sm mt-1">Usa tu código de membresía</p>
              </div>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              onClick={() => setMode("pin")}
              className="flex-1 flex flex-col items-center gap-4 rounded-2xl border-2 border-[#749390]/50 bg-[#749390]/10 hover:bg-[#749390]/20 transition-colors duration-200 p-8 group"
              aria-label="Ingresar PIN"
            >
              <div className="w-16 h-16 rounded-xl bg-[#749390] flex items-center justify-center">
                <Hash className="w-9 h-9 text-white" strokeWidth={1.8} />
              </div>
              <div className="text-center">
                <p className="text-[#F6FFB5] text-xl font-bold">Ingresar PIN</p>
                <p className="text-[#749390] text-sm mt-1">Usa tu número de 4 dígitos</p>
              </div>
            </motion.button>
          </motion.div>

          {/* Footer */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="text-[#749390]/70 text-sm mt-4"
          >
            ¿Necesitas ayuda? Habla con la recepcionista.
          </motion.p>
        </motion.main>
      )}
    </AnimatePresence>
  );
}
