"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User, Lock, Download, Loader2, CheckCircle, AlertCircle, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { portalAuthClient } from "@/lib/portal-client";
import { downloadQRCard } from "@/lib/qr-card";

interface QRData { qrImage: string; name: string; }

export default function PerfilPortalPage() {
  const router = useRouter();
  const [qrData, setQrData] = useState<QRData | null>(null);
  const [loadingQR, setLoadingQR] = useState(true);
  const [descargando, setDescargando] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pwStatus, setPwStatus] = useState<{ ok: boolean; msg: string } | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("sarui_token");
    if (!token) { router.push("/tienda/login?redirect=/tienda/perfil"); return; }
    portalAuthClient
      .get<{ success: boolean; data: QRData }>("/portal/mi-qr")
      .then((r) => setQrData(r.data.data))
      .catch(() => {})
      .finally(() => setLoadingQR(false));
  }, [router]);

  async function handleDescargar() {
    if (!qrData) return;
    setDescargando(true);
    try { await downloadQRCard(qrData.qrImage, qrData.name); }
    finally { setDescargando(false); }
  }

  async function handleCambiarPassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPwStatus({ ok: false, msg: "Las contraseñas no coinciden" });
      return;
    }
    setSaving(true);
    setPwStatus(null);
    try {
      await portalAuthClient.post("/portal/cambiar-contrasena", { currentPassword, newPassword });
      setPwStatus({ ok: true, msg: "Contraseña actualizada correctamente" });
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    } catch (err: any) {
      const code = err?.response?.data?.error?.code;
      const msg = code === "INVALID_PASSWORD"
        ? "La contraseña actual es incorrecta"
        : "Error al actualizar. Intenta de nuevo.";
      setPwStatus({ ok: false, msg });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto space-y-6 py-2">
      <div>
        <button
          onClick={() => router.push("/tienda")}
          className="flex items-center gap-1.5 text-sm text-[#254F40]/60 hover:text-[#254F40] mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Inicio
        </button>
        <h1 className="text-2xl font-bold text-[#254F40]">Mi perfil</h1>
        <p className="text-sm text-[#254F40]/50 mt-0.5">Administra tu cuenta y credencial</p>
      </div>

      {/* Credencial */}
      <div className="bg-white rounded-2xl border border-[#254F40]/10 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 bg-[#254F40]/10 rounded-xl flex items-center justify-center">
            <User className="w-4.5 h-4.5 text-[#254F40]" />
          </div>
          <div>
            <p className="font-semibold text-[#254F40] text-sm">Credencial de acceso</p>
            <p className="text-xs text-[#254F40]/50">Preséntala al ingresar al estudio</p>
          </div>
        </div>

        {loadingQR ? (
          <div className="flex items-center gap-2 text-[#254F40]/50 py-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Cargando…</span>
          </div>
        ) : qrData ? (
          <div className="space-y-3">
            <div className="bg-[#254F40]/5 rounded-xl p-3 flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrData.qrImage} alt="QR" className="w-16 h-16 rounded-lg" />
              <div>
                <p className="font-semibold text-[#254F40] text-sm">{qrData.name}</p>
                <p className="text-xs text-[#254F40]/50 mt-0.5">Socio activo</p>
              </div>
            </div>
            <button
              onClick={handleDescargar}
              disabled={descargando}
              className="w-full flex items-center justify-center gap-2 bg-[#254F40] text-[#F6FFB5] font-semibold py-2.5 rounded-xl hover:bg-[#254F40]/90 transition-colors disabled:opacity-60 text-sm"
            >
              {descargando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {descargando ? "Descargando…" : "Descargar credencial"}
            </button>
          </div>
        ) : (
          <p className="text-sm text-[#254F40]/50">No se pudo cargar tu credencial.</p>
        )}
      </div>

      {/* Cambiar contraseña */}
      <div className="bg-white rounded-2xl border border-[#254F40]/10 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 bg-[#254F40]/10 rounded-xl flex items-center justify-center">
            <Lock className="w-4.5 h-4.5 text-[#254F40]" />
          </div>
          <div>
            <p className="font-semibold text-[#254F40] text-sm">Cambiar contraseña</p>
            <p className="text-xs text-[#254F40]/50">Mínimo 6 caracteres</p>
          </div>
        </div>

        <form onSubmit={handleCambiarPassword} className="space-y-3">
          <PasswordField
            label="Contraseña actual"
            value={currentPassword}
            onChange={setCurrentPassword}
            show={showCurrent}
            onToggle={() => setShowCurrent((v) => !v)}
          />
          <PasswordField
            label="Nueva contraseña"
            value={newPassword}
            onChange={setNewPassword}
            show={showNew}
            onToggle={() => setShowNew((v) => !v)}
          />
          <PasswordField
            label="Confirmar nueva contraseña"
            value={confirmPassword}
            onChange={setConfirmPassword}
            show={showNew}
            onToggle={() => setShowNew((v) => !v)}
          />

          {pwStatus && (
            <div className={`flex items-center gap-2 text-sm rounded-xl px-3 py-2.5 ${pwStatus.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
              {pwStatus.ok ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              {pwStatus.msg}
            </div>
          )}

          <button
            type="submit"
            disabled={saving || !currentPassword || !newPassword || !confirmPassword}
            className="w-full bg-[#254F40] text-[#F6FFB5] font-semibold py-2.5 rounded-xl hover:bg-[#254F40]/90 transition-colors disabled:opacity-50 text-sm flex items-center justify-center gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? "Guardando…" : "Actualizar contraseña"}
          </button>
        </form>
      </div>
    </div>
  );
}

function PasswordField({
  label, value, onChange, show, onToggle,
}: {
  label: string; value: string; onChange: (v: string) => void; show: boolean; onToggle: () => void;
}) {
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        placeholder={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-[#254F40]/20 rounded-xl px-4 py-2.5 text-sm text-[#254F40] placeholder-[#254F40]/40 focus:outline-none focus:border-[#254F40]/50 pr-10"
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#254F40]/40 hover:text-[#254F40]/70"
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}
