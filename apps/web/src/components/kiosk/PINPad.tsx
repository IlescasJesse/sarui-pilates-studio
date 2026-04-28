"use client";

import { useState } from "react";
import { X, Delete, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { apiClient } from "@/lib/api-client";

interface PINPadProps {
  onClose: () => void;
  onSuccess: (data: any) => void;
}

const PIN_LENGTH = 4;

type PadStatus = "idle" | "processing" | "success" | "error";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"];

export function PINPad({ onClose, onSuccess }: PINPadProps) {
  const [pin, setPin] = useState<string>("");
  const [status, setStatus] = useState<PadStatus>("idle");
  const [message, setMessage] = useState<string>("");

  async function handleSubmit(finalPin: string) {
    setStatus("processing");
    try {
      const res = await apiClient.post<any>("/kiosk/checkin", {
        pin: finalPin,
      });

      // Response structure: { success: true, data: { cliente: { nombre, clase, sesionesRestantes }, status, message } }
      const result = res.data.data;
      setMessage(`¡Bienvenida, ${result.cliente.nombre}!\n${result.cliente.clase}`);
      setStatus("success");
      setTimeout(() => {
        onSuccess(result);
        onClose();
      }, 500);
    } catch (error: any) {
      let errorMsg = "PIN incorrecto. Intenta de nuevo.";

      if (error.response?.status === 429) {
        errorMsg = "Demasiados intentos. Espera un momento.";
      } else if (error.response?.status === 404) {
        errorMsg = "PIN no reconocido o sin reservación.";
      }

      setMessage(errorMsg);
      setStatus("error");
      setTimeout(() => {
        setPin("");
        setStatus("idle");
        setMessage("");
      }, 2000);
    }
  }

  function handleKey(key: string) {
    if (status === "processing" || status === "success") return;

    if (key === "del") {
      setPin((p) => p.slice(0, -1));
      if (status === "error") {
        setStatus("idle");
        setMessage("");
      }
      return;
    }

    if (key === "") return;

    const next = pin + key;
    setPin(next);

    if (next.length === PIN_LENGTH) {
      handleSubmit(next);
    }
  }

  const statusIcon = {
    idle: null,
    processing: <Loader2 className="w-8 h-8 text-[#F6FFB5] animate-spin" />,
    success: <CheckCircle className="w-8 h-8 text-emerald-400" />,
    error: <XCircle className="w-8 h-8 text-red-400" />,
  }[status];

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6 relative">
      <button
        onClick={onClose}
        className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
        aria-label="Cerrar"
      >
        <X className="w-6 h-6 text-[#F6FFB5]" />
      </button>

      <h2 className="text-2xl font-bold text-[#F6FFB5]">Ingresar PIN</h2>
      <p className="text-[#749390] text-base">Introduce tu PIN de 4 dígitos</p>

      {/* PIN dots */}
      <div className="flex gap-4">
        {Array.from({ length: PIN_LENGTH }).map((_, i) => (
          <div
            key={i}
            className={`w-5 h-5 rounded-full border-2 transition-all ${
              i < pin.length
                ? "bg-[#F6FFB5] border-[#F6FFB5]"
                : "bg-transparent border-[#F6FFB5]/40"
            }`}
          />
        ))}
      </div>

      {/* Status */}
      <div className="flex items-center gap-2 h-8">
        {statusIcon}
        {message && (
          <p
            className={`text-sm font-medium ${
              status === "success" ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {message}
          </p>
        )}
      </div>

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-3 w-full max-w-xs">
        {KEYS.map((key, i) => {
          if (key === "") {
            return <div key={i} />;
          }

          if (key === "del") {
            return (
              <button
                key={i}
                onClick={() => handleKey("del")}
                disabled={status === "processing" || status === "success"}
                className="flex items-center justify-center h-16 rounded-xl bg-[#749390]/30 hover:bg-[#749390]/50 active:scale-95 transition-all disabled:opacity-40"
                aria-label="Borrar"
              >
                <Delete className="w-5 h-5 text-[#F6FFB5]" />
              </button>
            );
          }

          return (
            <button
              key={i}
              onClick={() => handleKey(key)}
              disabled={
                pin.length >= PIN_LENGTH ||
                status === "processing" ||
                status === "success"
              }
              className="flex items-center justify-center h-16 rounded-xl bg-[#F6FFB5]/10 hover:bg-[#F6FFB5]/20 active:scale-95 transition-all text-[#F6FFB5] text-2xl font-bold border border-[#F6FFB5]/20 disabled:opacity-40"
            >
              {key}
            </button>
          );
        })}
      </div>
    </div>
  );
}
