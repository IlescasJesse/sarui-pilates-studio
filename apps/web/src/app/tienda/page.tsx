"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isClientLoggedIn } from "@/lib/auth-client";
import { useMisMembresias, useMisAgendas, useClasesPortal, useMiQR } from "@/hooks/usePortal";
import {
  ShieldCheck, CalendarDays, Clock, ChevronRight,
  User, Package, CheckCircle, Clock3, Loader2,
} from "lucide-react";

const fadeUp = `
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
`;

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("es-MX", { day: "numeric", month: "short" });
}
function fmtHora(iso: string) {
  return new Date(iso).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
}
function fmtFull(iso: string) {
  return new Date(iso).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" });
}

export default function TiendaHomePage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isClientLoggedIn()) {
      router.replace("/tienda/login");
    } else {
      setReady(true);
    }
  }, [router]);

  const { data: membresias } = useMisMembresias();
  const { data: agendas } = useMisAgendas();
  const { data: clases } = useClasesPortal();
  const { data: miQR } = useMiQR();

  if (!ready) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-[#254F40]/40" />
      </div>
    );
  }

  const membresiasActivas = membresias?.filter(
    (m) => m.status === "ACTIVE" && m.sessionsRemaining > 0
  ) ?? [];

  const proximasAgendas = agendas
    ?.filter((a) => a.status !== "CANCELLED" && a.status !== "ATTENDED")
    .slice(0, 3) ?? [];

  const proximasClases = clases
    ?.filter((c) => new Date(c.startAt) > new Date())
    .slice(0, 2) ?? [];

  const clientName = miQR?.name ?? "";

  // Row 1: Perfil (chico) | Membresía (ancho). Row 2: Agendas (chico) | Clases (ancho)
  const cards = [
    {
      id: "perfil",
      delay: 0,
      href: "/tienda/perfil",
      content: (
        <div className="h-full flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#254F40]/10 rounded-xl flex items-center justify-center">
                <User className="w-4 h-4 text-[#254F40]" />
              </div>
              <p className="font-semibold text-[#254F40] text-sm">Mi perfil</p>
            </div>
            <ChevronRight className="w-4 h-4 text-[#254F40]/30" />
          </div>
          <div className="flex-1 flex flex-col justify-center gap-3">
            {miQR ? (
              <div className="flex items-center gap-3 bg-[#254F40]/5 rounded-xl p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={miQR.qrImage} alt="QR" className="w-12 h-12 rounded-lg shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#254F40] truncate">{miQR.name}</p>
                  <p className="text-[10px] text-[#254F40]/40 mt-0.5">Socio activo · Ver credencial</p>
                </div>
              </div>
            ) : (
              <div className="bg-[#254F40]/5 rounded-xl h-[60px]" />
            )}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-[#254F40]/5 rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-[#254F40]">{membresiasActivas.length}</p>
                <p className="text-[10px] text-[#254F40]/40">membresía{membresiasActivas.length !== 1 ? "s" : ""}</p>
              </div>
              <div className="bg-[#254F40]/5 rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-[#254F40]">{proximasAgendas.length}</p>
                <p className="text-[10px] text-[#254F40]/40">agenda{proximasAgendas.length !== 1 ? "s" : ""}</p>
              </div>
            </div>
          </div>
        </div>
      ),
      className: "bg-white border border-[#254F40]/10",
    },
    {
      id: "membresia",
      delay: 60,
      href: "/tienda/membresia",
      content: (
        <div className="h-full flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#F6FFB5]/20 rounded-xl flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-[#F6FFB5]" />
              </div>
              <p className="font-semibold text-[#F6FFB5] text-sm">Membresía</p>
            </div>
            <ChevronRight className="w-4 h-4 text-[#F6FFB5]/50" />
          </div>
          {membresiasActivas.length > 0 ? (
            <div className="flex-1 space-y-2">
              {membresiasActivas.slice(0, 2).map((m) => (
                <div key={m.id} className="bg-white/10 rounded-xl p-3">
                  <p className="text-xs font-semibold text-[#F6FFB5] truncate">{m.package.name}</p>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-[11px] text-[#F6FFB5]/70">
                      {m.sessionsRemaining} sesión{m.sessionsRemaining !== 1 ? "es" : ""} restante{m.sessionsRemaining !== 1 ? "s" : ""}
                    </span>
                    <span className="text-[10px] text-[#F6FFB5]/50">Vence {fmt(m.expiresAt)}</span>
                  </div>
                  <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#F6FFB5] rounded-full transition-all"
                      style={{ width: `${Math.round((m.sessionsRemaining / m.totalSessions) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-4">
              <Package className="w-8 h-8 text-[#F6FFB5]/30 mb-2" />
              <p className="text-xs text-[#F6FFB5]/60">Sin membresía activa</p>
              <p className="text-[11px] text-[#F6FFB5]/40 mt-0.5">Toca para ver planes</p>
            </div>
          )}
        </div>
      ),
      className: "bg-gradient-to-br from-[#254F40] to-[#1a3a2f] text-[#F6FFB5] md:col-span-2",
    },
    {
      id: "clases",
      delay: 120,
      href: "/tienda/clases",
      content: (
        <div className="h-full flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#254F40]/10 rounded-xl flex items-center justify-center">
                <CalendarDays className="w-4 h-4 text-[#254F40]" />
              </div>
              <p className="font-semibold text-[#254F40] text-sm">Clases</p>
            </div>
            <ChevronRight className="w-4 h-4 text-[#254F40]/30" />
          </div>
          {proximasClases.length > 0 ? (
            <div className="flex-1 space-y-2">
              {proximasClases.map((c) => (
                <div key={c.id} className="bg-[#254F40]/5 rounded-xl p-3">
                  <p className="text-xs font-semibold text-[#254F40] truncate">
                    {c.title ?? c.tipoActividad?.nombre ?? "Clase"}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Clock className="w-3 h-3 text-[#254F40]/40" />
                    <span className="text-[11px] text-[#254F40]/60">
                      {fmt(c.startAt)} · {fmtHora(c.startAt)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-[10px] text-[#254F40]/40">
                      {c.instructor.firstName} {c.instructor.lastName}
                    </span>
                    <span className="text-[10px] text-[#254F40]/40">
                      {c.spotsLeft} lugar{c.spotsLeft !== 1 ? "es" : ""}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-xs text-[#254F40]/40">Sin clases próximas</p>
            </div>
          )}
        </div>
      ),
      className: "bg-white border border-[#254F40]/10 md:col-span-2",
    },
    {
      id: "agendas",
      delay: 120,
      href: "/tienda/mis-agendas",
      content: (
        <div className="h-full flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#254F40]/10 rounded-xl flex items-center justify-center">
                <Clock3 className="w-4 h-4 text-[#254F40]" />
              </div>
              <p className="font-semibold text-[#254F40] text-sm">Mis agendas</p>
            </div>
            <ChevronRight className="w-4 h-4 text-[#254F40]/30" />
          </div>
          {proximasAgendas.length > 0 ? (
            <div className="flex-1 space-y-2">
              {proximasAgendas.map((a) => (
                <div key={a.id} className="flex items-center gap-2.5 bg-[#254F40]/5 rounded-xl p-3">
                  <div
                    className="w-1 self-stretch rounded-full shrink-0"
                    style={{ backgroundColor: a.class.tipoActividad?.color ?? "#254F40" }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-[#254F40] truncate">
                      {a.class.title ?? a.class.tipoActividad?.nombre ?? "Clase"}
                    </p>
                    <p className="text-[10px] text-[#254F40]/50 mt-0.5">
                      {fmt(a.class.startAt)} · {fmtHora(a.class.startAt)}
                    </p>
                  </div>
                  {a.status === "CONFIRMED" && <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" />}
                  {a.status === "PENDING_APPROVAL" && <Clock3 className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-2">
              <p className="text-xs text-[#254F40]/40">Sin agendas próximas</p>
              <p className="text-[11px] text-[#254F40]/30 mt-0.5">Reserva una clase</p>
            </div>
          )}
        </div>
      ),
      className: "bg-white border border-[#254F40]/10",
    },
  ];

  return (
    <>
      <style>{fadeUp}</style>
      <div style={{ animation: "fadeIn 0.3s ease-out both" }}>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#254F40]">
            Hola{clientName ? `, ${clientName.split(" ")[0]}` : ""}
          </h1>
          <p className="text-sm text-[#254F40]/50 mt-0.5">Bienvenido a Sarui Studio</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {cards.map((card) => (
            <button
              key={card.id}
              onClick={() => router.push(card.href)}
              className={`text-left rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer min-h-[180px] ${card.className}`}
              style={{ animation: `fadeUp 0.4s ease-out ${card.delay}ms both` }}
            >
              {card.content}
            </button>
          ))}
        </div>

        {/* Próxima clase destacada */}
        {proximasClases[0] && (
          <button
            onClick={() => router.push("/tienda/clases")}
            className="mt-4 w-full bg-[#254F40]/5 border border-[#254F40]/10 rounded-2xl p-4 flex items-center gap-4 hover:bg-[#254F40]/8 transition-colors"
            style={{ animation: "fadeUp 0.4s ease-out 240ms both" }}
          >
            <div
              className="w-1 self-stretch rounded-full shrink-0"
              style={{ backgroundColor: proximasClases[0].tipoActividad?.color ?? "#254F40" }}
            />
            <div className="flex-1 min-w-0 text-left">
              <p className="text-xs text-[#254F40]/40 uppercase tracking-wide mb-0.5">Próxima clase disponible</p>
              <p className="font-semibold text-[#254F40] text-sm">
                {proximasClases[0].title ?? proximasClases[0].tipoActividad?.nombre ?? "Clase"}
              </p>
              <p className="text-xs text-[#254F40]/50 mt-0.5">
                {fmtFull(proximasClases[0].startAt)} · {fmtHora(proximasClases[0].startAt)} ·{" "}
                {proximasClases[0].instructor.firstName} {proximasClases[0].instructor.lastName}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-[#254F40]/40 shrink-0" />
          </button>
        )}
      </div>
    </>
  );
}
