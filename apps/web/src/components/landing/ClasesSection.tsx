"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem, fadeInUp } from "@/lib/animations";
import { Sun, Sunset, Loader2 } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

interface ClaseData {
  id: string;
  title: string;
  startAt: string;
  endAt: string;
  capacity: number;
  spotsBooked: number;
  instructor: { firstName: string; lastName: string };
  tipoActividad?: { nombre: string; color: string } | null;
}

function getWeekRange(): { start: Date; end: Date } {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const start = new Date(now);
  start.setDate(now.getDate() + diff);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function formatHora(iso: string) {
  return new Date(iso).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
}

function dayOfWeek(iso: string): number {
  return new Date(iso).getDay();
}

const TURN_LABELS = ["mat", "vesp"] as const;

export function ClasesSection() {
  const [clases, setClases] = useState<ClaseData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { start, end } = getWeekRange();
    fetch(`${API_URL}/portal/clases`)
      .then((r) => r.json())
      .then((j) => {
        const all: ClaseData[] = j?.data ?? [];
        const weekClases = all.filter((c) => {
          const d = new Date(c.startAt);
          return d >= start && d <= end;
        });
        setClases(weekClases);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const slots = buildTimeSlots(clases);

  return (
    <section id="clases" className="py-28 md:py-36 bg-[#254F40] relative overflow-hidden">
      <div className="absolute top-0 left-0 w-72 h-72 rounded-full bg-[#1d3d32]/60 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-[#1d3d32]/40 blur-3xl pointer-events-none" />

      <div className="max-w-5xl mx-auto px-6 md:px-8 relative z-10">
        <motion.div
          className="mb-14 md:mb-18"
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, amount: 0.3 }}
        >
          <motion.p
            variants={staggerItem}
            className="text-[#F6FFB5]/60 text-xs tracking-[0.3em] uppercase font-medium mb-4"
          >
            Agenda semanal
          </motion.p>
          <motion.h2
            variants={staggerItem}
            className="font-display font-light text-5xl md:text-6xl text-[#FDFFEC] leading-tight"
          >
            Horarios de
            <em className="block italic text-[#F6FFB5]">clases</em>
          </motion.h2>
          <motion.p
            variants={staggerItem}
            className="mt-4 text-[#FDFFEC]/55 text-base max-w-md"
          >
            Clases en vivo con instructores certificados. Horarios flexibles toda la semana.
          </motion.p>
        </motion.div>

        <motion.div
          variants={fadeInUp}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, amount: 0.2 }}
          className="rounded-2xl overflow-hidden border border-white/10"
        >
          {/* Day headers */}
          <div className="grid grid-cols-7 bg-[#1d3d32]">
            <div className="col-span-1 px-4 py-3 text-[#F6FFB5]/50 text-xs font-medium uppercase tracking-wide">
              Hora
            </div>
            {DIAS.map((d, i) => (
              <div
                key={d}
                className={`text-center py-3 text-xs font-semibold uppercase tracking-wider ${i === 5 ? "text-[#F6FFB5]" : "text-[#FDFFEC]/70"}`}
              >
                {d.slice(0, 3)}
              </div>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-5 h-5 animate-spin text-[#F6FFB5]/50" />
            </div>
          ) : slots.length === 0 ? (
            <div className="text-center py-16 text-[#FDFFEC]/40 text-sm">
              No hay clases programadas para esta semana.
            </div>
          ) : (
            slots.map((slot, ri) => {
              const prevTurn = ri > 0 ? slots[ri - 1].turn : null;
              const showTurnHeader = ri === 0 || prevTurn !== slot.turn;

              return (
                <div key={`${slot.turn}-${slot.time}`}>
                  {showTurnHeader && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-[#254F40]/50 border-y border-white/5">
                      {slot.turn === "mat" ? (
                        <Sun className="w-3.5 h-3.5 text-[#F6FFB5]/70" />
                      ) : (
                        <Sunset className="w-3.5 h-3.5 text-[#F6FFB5]/70" />
                      )}
                      <span className="text-[10px] tracking-[0.25em] uppercase text-[#F6FFB5]/50 font-medium">
                        {slot.turn === "mat" ? "Matutino" : "Vespertino"}
                      </span>
                    </div>
                  )}
                  <div className={`grid grid-cols-7 border-b border-white/5 last:border-0 ${ri % 2 === 0 ? "bg-[#1d3d32]/30" : ""}`}>
                    <div className="flex items-center px-4 py-4">
                      <span className="font-display text-lg font-light text-[#FDFFEC]/80">{slot.time}</span>
                    </div>
                    {DIAS.map((_, di) => {
                      const clase = slot.days[di];
                      return (
                        <div key={di} className="flex items-center justify-center py-4 px-1">
                          {clase ? (
                            <div className="flex flex-col items-center gap-0.5 text-center">
                              <div
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: clase.tipoActividad?.color ?? "#F6FFB5" }}
                              />
                              <span className="text-[8px] text-[#F6FFB5]/70 font-medium leading-tight truncate max-w-full">
                                {clase.tipoActividad?.nombre ?? clase.title}
                              </span>
                              {clase.spotsBooked < clase.capacity ? (
                                <span className="text-[7px] text-[#F6FFB5]/40">disponible</span>
                              ) : (
                                <span className="text-[7px] text-red-400/60">lleno</span>
                              )}
                            </div>
                          ) : (
                            <div className="w-2 h-2 rounded-full bg-white/8" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </motion.div>

        <motion.p
          className="mt-6 text-center text-[#FDFFEC]/40 text-sm"
          variants={fadeInUp}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
        >
          Horarios sujetos a disponibilidad. Reserva con anticipación para asegurar tu lugar.
        </motion.p>
      </div>
    </section>
  );
}

interface TimeSlot {
  time: string;
  turn: "mat" | "vesp";
  days: (ClaseData | null)[];
}

function buildTimeSlots(clases: ClaseData[]): TimeSlot[] {
  const dayMap: Record<number, ClaseData[]> = {};
  for (let i = 1; i <= 6; i++) dayMap[i] = [];
  clases.forEach((c) => {
    const d = dayOfWeek(c.startAt);
    if (d >= 1 && d <= 6) dayMap[d].push(c);
  });

  const allTimes = new Set<string>();
  Object.values(dayMap).forEach((arr) => arr.forEach((c) => allTimes.add(formatHora(c.startAt))));

  const sorted = [...allTimes].sort((a, b) => {
    const [h1, m1] = a.split(":").map(Number);
    const [h2, m2] = b.split(":").map(Number);
    return h1 * 60 + m1 - (h2 * 60 + m2);
  });

  return sorted.map((time) => {
    const h = parseInt(time.split(":")[0]);
    const turn = h < 14 ? "mat" as const : "vesp" as const;
    const days: (ClaseData | null)[] = [];
    for (let d = 1; d <= 6; d++) {
      const match = (dayMap[d] ?? []).find((c) => formatHora(c.startAt) === time);
      days.push(match ?? null);
    }
    return { time, turn, days };
  });
}
