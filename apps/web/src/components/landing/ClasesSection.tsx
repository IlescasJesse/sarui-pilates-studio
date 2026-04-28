"use client";

import { motion } from "framer-motion";
import { staggerContainer, staggerItem, fadeInUp } from "@/lib/animations";
import { Sun, Sunset } from "lucide-react";

const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

const SCHEDULE: Array<{ time: string; turn: "mat" | "vesp"; lv: boolean; sab: boolean }> = [
  { time: "7:00", turn: "mat", lv: true, sab: false },
  { time: "8:00", turn: "mat", lv: true, sab: false },
  { time: "9:00", turn: "mat", lv: true, sab: true },
  { time: "10:00", turn: "mat", lv: false, sab: true },
  { time: "17:00", turn: "vesp", lv: true, sab: false },
  { time: "18:00", turn: "vesp", lv: true, sab: false },
  { time: "19:00", turn: "vesp", lv: true, sab: false },
];

type DayAvailability = "available" | "none";

interface DayCell {
  day: string;
  idx: number;
  status: DayAvailability;
}

function buildRow(slot: (typeof SCHEDULE)[0]): DayCell[] {
  return DIAS.map((day, idx) => {
    const isSab = idx === 5;
    const isLV = idx < 5;
    let status: DayAvailability = "none";
    if (isLV && slot.lv) status = "available";
    if (isSab && slot.sab) status = "available";
    return { day, idx, status };
  });
}

export function ClasesSection() {
  return (
    <section id="clases" className="py-28 md:py-36 bg-[#254F40] relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-0 left-0 w-72 h-72 rounded-full bg-[#1d3d32]/60 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-[#1d3d32]/40 blur-3xl pointer-events-none" />

      <div className="max-w-5xl mx-auto px-6 md:px-8 relative z-10">
        {/* Header */}
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
            Lunes a viernes en horario matutino y vespertino. Sábados por la mañana.
          </motion.p>
        </motion.div>

        {/* Schedule grid */}
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
            {DIAS.map((d) => (
              <div
                key={d}
                className={`text-center py-3 text-xs font-semibold uppercase tracking-wider ${d === "Sáb" ? "text-[#F6FFB5]" : "text-[#FDFFEC]/70"}`}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Slots */}
          {SCHEDULE.map((slot, ri) => {
            const cells = buildRow(slot);
            const isMorning = slot.turn === "mat";
            const isFirst = ri === 0;
            const prevTurn = ri > 0 ? SCHEDULE[ri - 1].turn : null;
            const showTurnHeader = ri === 0 || (prevTurn && prevTurn !== slot.turn);

            return (
              <div key={slot.time}>
                {showTurnHeader && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-[#254F40]/50 border-y border-white/5">
                    {isMorning ? (
                      <Sun className="w-3.5 h-3.5 text-[#F6FFB5]/70" />
                    ) : (
                      <Sunset className="w-3.5 h-3.5 text-[#F6FFB5]/70" />
                    )}
                    <span className="text-[10px] tracking-[0.25em] uppercase text-[#F6FFB5]/50 font-medium">
                      {isMorning ? "Matutino" : "Vespertino"}
                    </span>
                  </div>
                )}
                <div
                  className={`grid grid-cols-7 border-b border-white/5 last:border-0 ${ri % 2 === 0 ? "bg-[#1d3d32]/30" : ""}`}
                >
                  {/* Time label */}
                  <div className="flex items-center px-4 py-4">
                    <span className="font-display text-lg font-light text-[#FDFFEC]/80">
                      {slot.time}
                    </span>
                  </div>

                  {/* Day cells */}
                  {cells.map((cell) => (
                    <div
                      key={cell.day}
                      className="flex items-center justify-center py-4"
                    >
                      {cell.status === "available" ? (
                        <motion.div
                          className="flex flex-col items-center gap-1"
                          initial={{ scale: 0.8, opacity: 0 }}
                          whileInView={{ scale: 1, opacity: 1 }}
                          viewport={{ once: true }}
                          transition={{ delay: cell.idx * 0.04 }}
                        >
                          <div className="w-2.5 h-2.5 rounded-full bg-[#F6FFB5]" />
                          <span className="text-[9px] text-[#F6FFB5]/50 hidden sm:block">disponible</span>
                        </motion.div>
                      ) : (
                        <div className="w-2.5 h-2.5 rounded-full bg-white/8" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </motion.div>

        {/* Note */}
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
