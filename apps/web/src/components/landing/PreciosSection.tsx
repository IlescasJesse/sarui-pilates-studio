"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/animations";
import { Check, Calendar, ArrowRight } from "lucide-react";

type Categoria = "reformer" | "mat" | "mix";

const PAQUETES = {
  reformer: [
    { nombre: "Sesión Única", precio: 200, vigencia: null, sesiones: 1, popular: false },
    { nombre: "6 Sesiones", precio: 850, vigencia: "20 días", sesiones: 6, popular: false },
    { nombre: "10 Sesiones", precio: 1500, vigencia: "30 días", sesiones: 10, popular: true },
    { nombre: "12 Sesiones", precio: 1800, vigencia: "30 días", sesiones: 12, popular: false },
    { nombre: "20 Sesiones", precio: 2500, vigencia: "40 días", sesiones: 20, popular: false },
  ],
  mat: [
    { nombre: "Sesión Única", precio: 180, vigencia: null, sesiones: 1, popular: false },
    { nombre: "6 Sesiones", precio: 750, vigencia: "20 días", sesiones: 6, popular: false },
    { nombre: "10 Sesiones", precio: 1300, vigencia: "30 días", sesiones: 10, popular: true },
    { nombre: "12 Sesiones", precio: 1500, vigencia: "30 días", sesiones: 12, popular: false },
    { nombre: "20 Sesiones", precio: 2200, vigencia: "40 días", sesiones: 20, popular: false },
  ],
  mix: [
    {
      nombre: "8 Sesiones Mix",
      precio: 1200,
      vigencia: "20 días",
      sesiones: 8,
      popular: false,
      composicion: "4 Reformer + 4 Mat",
    },
    {
      nombre: "10 Sesiones Mix",
      precio: 1400,
      vigencia: "20 días",
      sesiones: 10,
      popular: true,
      composicion: "5 Reformer + 5 Mat",
    },
    {
      nombre: "12 Sesiones Mix",
      precio: 1600,
      vigencia: "20 días",
      sesiones: 12,
      popular: false,
      composicion: "6 Reformer + 6 Mat",
    },
  ],
};

const TABS: { id: Categoria; label: string; sub: string }[] = [
  { id: "reformer", label: "Reformer", sub: "Con máquina" },
  { id: "mat", label: "Mat", sub: "En colchoneta" },
  { id: "mix", label: "Mix", sub: "Reformer + Mat" },
];

function formatPrice(n: number) {
  return `$${n.toLocaleString("es-MX")}.00`;
}

export function PreciosSection() {
  const [cat, setCat] = useState<Categoria>("reformer");
  const paquetes = PAQUETES[cat];

  return (
    <section id="precios" className="py-28 md:py-36 bg-[#254F40] relative overflow-hidden">
      {/* Decorative */}
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-[#1d3d32]/80 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-[#1d3d32]/60 blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto px-6 md:px-8 relative z-10">
        {/* Header */}
        <motion.div
          className="mb-14"
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, amount: 0.3 }}
        >
          <motion.p variants={staggerItem} className="text-[#F6FFB5]/60 text-xs tracking-[0.3em] uppercase font-medium mb-4">
            Inversión en ti
          </motion.p>
          <motion.h2 variants={staggerItem} className="font-display font-light text-5xl md:text-6xl text-[#FDFFEC] leading-tight">
            Paquetes y
            <em className="block italic text-[#F6FFB5]">precios</em>
          </motion.h2>
          <motion.p variants={staggerItem} className="mt-4 text-[#FDFFEC]/50 text-base max-w-md">
            Todos los precios en pesos mexicanos (MXN). Elige el paquete que mejor se adapte a tu ritmo de vida.
          </motion.p>
        </motion.div>

        {/* Category tabs */}
        <div className="flex gap-2 mb-10 flex-wrap">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setCat(t.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                cat === t.id
                  ? "bg-[#F6FFB5] text-[#254F40]"
                  : "border border-white/20 text-[#FDFFEC]/60 hover:border-white/40 hover:text-[#FDFFEC]"
              }`}
            >
              {t.label}
              <span className={`text-[10px] ${cat === t.id ? "text-[#254F40]/60" : "text-[#FDFFEC]/35"}`}>
                {t.sub}
              </span>
            </button>
          ))}
        </div>

        {/* Cards */}
        <AnimatePresence mode="wait">
          <motion.div
            key={cat}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
            className={`grid gap-4 ${
              paquetes.length === 3
                ? "grid-cols-1 sm:grid-cols-3"
                : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
            }`}
          >
            {paquetes.map((p) => {
              const isPopular = p.popular;
              return (
                <motion.div
                  key={p.nombre}
                  className={`relative flex flex-col rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 ${
                    isPopular
                      ? "bg-[#F6FFB5] border-2 border-[#F6FFB5] shadow-2xl shadow-[#F6FFB5]/15"
                      : "bg-white/8 border border-white/12 hover:border-white/25"
                  }`}
                >
                  {isPopular && (
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#254F40] via-[#749390] to-[#254F40]" />
                  )}

                  <div className="p-6 flex flex-col h-full">
                    {isPopular && (
                      <span className="inline-block text-[10px] tracking-[0.2em] uppercase font-bold text-[#254F40] bg-[#254F40]/12 px-2.5 py-1 rounded-full mb-4 self-start">
                        Más popular
                      </span>
                    )}

                    <h3 className={`font-semibold text-sm mb-1 ${isPopular ? "text-[#254F40]" : "text-[#FDFFEC]"}`}>
                      {p.nombre}
                    </h3>

                    {"composicion" in p && (
                      <p className={`text-xs mb-3 ${isPopular ? "text-[#254F40]/60" : "text-[#FDFFEC]/45"}`}>
                        {(p as { composicion: string }).composicion}
                      </p>
                    )}

                    <div className="my-4">
                      <span className={`font-display text-4xl font-light ${isPopular ? "text-[#254F40]" : "text-[#FDFFEC]"}`}>
                        {formatPrice(p.precio)}
                      </span>
                      <p className={`text-xs mt-1 ${isPopular ? "text-[#254F40]/50" : "text-[#FDFFEC]/40"}`}>
                        MXN
                      </p>
                    </div>

                    <div className={`flex flex-col gap-2 mb-6 flex-1`}>
                      <div className={`flex items-center gap-2 text-xs ${isPopular ? "text-[#254F40]/70" : "text-[#FDFFEC]/55"}`}>
                        <Check className="w-3.5 h-3.5 flex-shrink-0" />
                        {p.sesiones} sesión{p.sesiones !== 1 ? "es" : ""} incluida{p.sesiones !== 1 ? "s" : ""}
                      </div>
                      {p.vigencia && (
                        <div className={`flex items-center gap-2 text-xs ${isPopular ? "text-[#254F40]/70" : "text-[#FDFFEC]/55"}`}>
                          <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                          Vigencia {p.vigencia}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() =>
                        document.getElementById("reservaciones")?.scrollIntoView({ behavior: "smooth" })
                      }
                      className={`w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 transition-all ${
                        isPopular
                          ? "bg-[#254F40] text-[#F6FFB5] hover:bg-[#1d3d32]"
                          : "border border-white/20 text-[#FDFFEC]/70 hover:border-white/45 hover:text-[#FDFFEC]"
                      }`}
                    >
                      Reservar <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatePresence>

        {/* Note */}
        <motion.p
          className="mt-8 text-center text-[#FDFFEC]/35 text-sm"
          variants={staggerItem}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
        >
          Los paquetes son personales e intransferibles. La vigencia inicia el día de la primera clase.
        </motion.p>
      </div>
    </section>
  );
}
