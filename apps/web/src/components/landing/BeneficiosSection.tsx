"use client";

import { motion } from "framer-motion";
import {
  Activity,
  Brain,
  Wind,
  Zap,
  Heart,
  Users,
} from "lucide-react";
import { staggerContainer, staggerItem } from "@/lib/animations";

const BENEFICIOS = [
  {
    icon: Activity,
    title: "Mejora tu postura",
    desc: "El Pilates activa músculos profundos que sostienen la columna, corrigiendo desequilibrios posturales con trabajo progresivo y consciente.",
    color: "#254F40",
    bg: "rgba(37,79,64,0.07)",
  },
  {
    icon: Zap,
    title: "Fortalece tu core",
    desc: "Abdomen, lumbares y suelo pélvico trabajan en unidad. Un core fuerte es la base de todo movimiento eficiente y libre de lesiones.",
    color: "#254F40",
    bg: "rgba(246,255,181,0.5)",
  },
  {
    icon: Wind,
    title: "Movilidad articular",
    desc: "Movimientos lentos y controlados restauran el rango de movimiento de cada articulación, manteniendo el cuerpo joven y funcional.",
    color: "#254F40",
    bg: "rgba(37,79,64,0.07)",
  },
  {
    icon: Brain,
    title: "Conexión mente-cuerpo",
    desc: "Cada ejercicio se ejecuta con atención plena. La respiración guía el movimiento, creando una meditación activa que reduce el estrés.",
    color: "#254F40",
    bg: "rgba(246,255,181,0.5)",
  },
  {
    icon: Heart,
    title: "Sin impacto articular",
    desc: "Ideal para recuperación, lesiones previas o simplemente quienes prefieren ejercitarse con cuidado. El Pilates respeta tu cuerpo.",
    color: "#254F40",
    bg: "rgba(37,79,64,0.07)",
  },
  {
    icon: Users,
    title: "Para todos los niveles",
    desc: "Principiantes, deportistas de alto rendimiento o adultos mayores: cada sesión se adapta a tu nivel y objetivos personales.",
    color: "#254F40",
    bg: "rgba(246,255,181,0.5)",
  },
];

export function BeneficiosSection() {
  return (
    <section id="beneficios" className="py-28 md:py-36 bg-[#FDFFEC] relative overflow-hidden">
      {/* Decorative circle */}
      <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-[#254F40]/4 pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-[#F6FFB5]/60 pointer-events-none" />

      <div className="max-w-6xl mx-auto px-6 md:px-8">
        {/* Header */}
        <motion.div
          className="mb-16 md:mb-20"
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, amount: 0.3 }}
        >
          <motion.p
            variants={staggerItem}
            className="text-[#749390] text-xs tracking-[0.3em] uppercase font-medium mb-4"
          >
            ¿Por qué Pilates?
          </motion.p>
          <motion.h2
            variants={staggerItem}
            className="font-display font-light text-5xl md:text-6xl text-[#254F40] leading-tight max-w-xl"
          >
            Un método que transforma
            <em className="block text-[#749390] italic">desde adentro</em>
          </motion.h2>
        </motion.div>

        {/* Grid */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, amount: 0.15 }}
        >
          {BENEFICIOS.map((b, i) => {
            const Icon = b.icon;
            return (
              <motion.div
                key={b.title}
                variants={staggerItem}
                className="group relative p-7 rounded-2xl border border-[#254F40]/10 hover:border-[#254F40]/25 transition-all duration-300 hover:shadow-xl hover:shadow-[#254F40]/5 hover:-translate-y-1 cursor-default"
                style={{ backgroundColor: b.bg }}
              >
                {/* Icon */}
                <div className="w-11 h-11 rounded-xl bg-[#254F40]/10 flex items-center justify-center mb-5 group-hover:bg-[#254F40]/15 transition-colors">
                  <Icon className="w-5 h-5 text-[#254F40]" strokeWidth={1.5} />
                </div>

                {/* Number */}
                <span className="absolute top-6 right-6 font-display text-5xl font-light text-[#254F40]/8 leading-none select-none">
                  {String(i + 1).padStart(2, "0")}
                </span>

                <h3 className="text-[#254F40] font-semibold text-base mb-2">{b.title}</h3>
                <p className="text-[#254F40]/65 text-sm leading-relaxed">{b.desc}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
