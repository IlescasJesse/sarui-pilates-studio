"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import jsQR from "jsqr";
import { X, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { apiClient } from "@/lib/api-client";

type ScanStatus = "scanning" | "processing" | "success" | "error";

interface QRScannerProps {
  onClose: () => void;
  onSuccess: (data: any) => void;
}

export function QRScanner({ onClose, onSuccess }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);

  const [status, setStatus] = useState<ScanStatus>("scanning");
  const [message, setMessage] = useState<string>("Apunta la cámara al código QR");
  const [clientName, setClientName] = useState<string>("");

  const stopCamera = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  const handleClose = useCallback(() => {
    stopCamera();
    onClose();
  }, [stopCamera, onClose]);

  const processQR = useCallback(
    async (data: string) => {
      setStatus("processing");
      setMessage("Verificando...");

      try {
        const res = await apiClient.post<any>("/kiosk/checkin", {
          qrCode: data,
        });

        // Response structure: { success: true, data: { cliente: { nombre, clase, sesionesRestantes }, status, message } }
        const result = res.data.data;
        setClientName(result.cliente.nombre);
        setStatus("success");
        setMessage(
          `¡Bienvenida, ${result.cliente.nombre}!\n${result.cliente.clase}`
        );
        setTimeout(() => {
          onSuccess(result);
          handleClose();
        }, 500);
      } catch (error: any) {
        setStatus("error");

        if (error.response?.status === 429) {
          setMessage("Demasiados intentos. Espera un momento.");
        } else if (error.response?.status === 404) {
          setMessage("Código no reconocido o sin reservación.");
        } else {
          setMessage("Código no reconocido. Intenta de nuevo.");
        }

        setTimeout(() => {
          setStatus("scanning");
          setMessage("Apunta la cámara al código QR");
        }, 2500);
      }
    },
    [handleClose]
  );

  useEffect(() => {
    let active = true;

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        scan();
      } catch {
        setStatus("error");
        setMessage("No se pudo acceder a la cámara.");
      }
    }

    function scan() {
      if (!active) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
        rafRef.current = requestAnimationFrame(scan);
        return;
      }
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      });
      if (code) {
        processQR(code.data);
        return;
      }
      rafRef.current = requestAnimationFrame(scan);
    }

    startCamera();

    return () => {
      active = false;
      stopCamera();
    };
  }, [processQR, stopCamera]);

  const statusIcon = {
    scanning: null,
    processing: <Loader2 className="w-12 h-12 text-[#F6FFB5] animate-spin" />,
    success: <CheckCircle className="w-12 h-12 text-emerald-400" />,
    error: <XCircle className="w-12 h-12 text-red-400" />,
  }[status];

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6 relative">
      <button
        onClick={handleClose}
        className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
        aria-label="Cerrar"
      >
        <X className="w-6 h-6 text-[#F6FFB5]" />
      </button>

      <h2 className="text-2xl font-bold text-[#F6FFB5]">Escanear QR</h2>

      {/* Camera viewfinder */}
      <div className="relative w-64 h-64 rounded-2xl overflow-hidden border-2 border-[#F6FFB5]/40 bg-black">
        <video
          ref={videoRef}
          className={`w-full h-full object-cover ${status !== "scanning" ? "opacity-30" : ""}`}
          muted
          playsInline
        />
        <canvas ref={canvasRef} className="hidden" />

        {/* Scan corners */}
        {status === "scanning" && (
          <>
            <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-[#F6FFB5] rounded-tl" />
            <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-[#F6FFB5] rounded-tr" />
            <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-[#F6FFB5] rounded-bl" />
            <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-[#F6FFB5] rounded-br" />
            {/* Scan line */}
            <div className="absolute inset-x-4 h-0.5 bg-[#F6FFB5]/60 top-1/2 animate-pulse" />
          </>
        )}

        {/* Status overlay */}
        {status !== "scanning" && (
          <div className="absolute inset-0 flex items-center justify-center">
            {statusIcon}
          </div>
        )}
      </div>

      <p className="text-[#F6FFB5] text-center text-lg font-medium max-w-xs">
        {message}
      </p>

      {status === "success" && clientName && (
        <p className="text-[#749390] text-sm">Acceso registrado correctamente</p>
      )}
    </div>
  );
}
