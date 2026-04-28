"use client";

import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/animations";

const TIPOS = [
  {
    tag: "Reformer",
    name: "Flow",
    subtitle: "Conciencia en movimiento",
    desc: "La respiración guía cada ejercicio. El Flow trabaja coordinación, movilidad articular y la conexión profunda entre cuerpo y mente. Ideal para quienes buscan un ritmo fluido, meditativo y transformador.",
    highlights: ["Coordinación", "Respiración consciente", "Movilidad"],
    accent: "#254F40",
    bg: "#254F40",
    textColor: "#FDFFEC",
  },
  {
    tag: "Reformer",
    name: "Power",
    subtitle: "Fuerza y resistencia",
    desc: "Menos pausas, mayor intensidad. El Power desafía tus músculos con secuencias de resistencia progresiva que mejoran la estabilidad y el rendimiento físico general.",
    highlights: ["Fuerza muscular", "Alta intensidad", "Estabilidad"],
    accent: "#F6FFB5",
    bg: "#F6FFB5",
    textColor: "#254F40",
  },
  {
    tag: "Reformer",
    name: "Mobility",
    subtitle: "Movilidad y equilibrio",
    desc: "Movimientos lentos y controlados diseñados para restaurar el rango de movimiento articular, mejorar la postura y construir equilibrio estructural. Sin impacto, completamente progresivo.",
    highlights: ["Movilidad articular", "Sin impacto", "Postura"],
    accent: "#749390",
    bg: "#749390",
    textColor: "#FDFFEC",
  },
  {
    tag: "Mat",
    name: "Pilates Mat",
    subtitle: "En colchoneta · El original",
    desc: "La resistencia proviene de tu propio peso corporal y la gravedad. Enfocado en fortalecer el core, mejorar la postura y flexibilidad. Una práctica atemporal que conecta mente, alma y cuerpo.",
    highlights: ["Core profundo", "Flexibilidad", "Mente-cuerpo"],
    accent: "#1d3d32",
    bg: "#FDFFEC",
    textColor: "#254F40",
  },
];

export function TiposPilatesSection() {
  return (
    <section
      id="tipos-pilates"
      className="py-28 md:py-36 relative overflow-hidden"
      style={{ backgroundColor: "#f7f9ec" }}
    >
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
            Nuestras clases
          </motion.p>
          <motion.h2
            variants={staggerItem}
            className="font-display font-light text-5xl md:text-6xl text-[#254F40] leading-tight"
          >
            Elige tu
            <em className="block italic text-[#749390]">modalidad</em>
          </motion.h2>
        </motion.div>

        {/* Cards grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-5"
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, amount: 0.1 }}
        >
          {TIPOS.map((t) => (
            <motion.div
              key={`${t.tag}-${t.name}`}
              variants={staggerItem}
              className="group relative rounded-2xl overflow-hidden border border-transparent hover:border-[#254F40]/20 transition-all duration-400 hover:shadow-2xl hover:shadow-[#254F40]/8 hover:-translate-y-1 cursor-default"
              style={{ backgroundColor: t.bg }}
            >
              <div className="p-8 md:p-10 flex flex-col min-h-[280px]">
                {/* Tag */}
                <div className="flex items-center gap-2 mb-6">
                  <span
                    className="text-[10px] tracking-[0.3em] uppercase font-medium px-2.5 py-1 rounded-full"
                    style={{
                      backgroundColor:
                        t.textColor === "#FDFFEC"
                          ? "rgba(253,255,236,0.15)"
                          : "rgba(37,79,64,0.1)",
                      color: t.textColor === "#FDFFEC" ? "#F6FFB5" : "#254F40",
                    }}
                  >
                    {t.tag}
                  </span>
                </div>

                {/* Title */}
                <div className="mb-4">
                  <h3
                    className="font-display text-4xl md:text-5xl font-light leading-none mb-1"
                    style={{ color: t.textColor }}
                  >
                    {t.name}
                  </h3>
                  <p
                    className="text-sm font-light"
                    style={{ color: t.textColor, opacity: 0.55 }}
                  >
                    {t.subtitle}
                  </p>
                </div>

                {/* Description */}
                <p
                  className="text-sm leading-relaxed mb-6 flex-1"
                  style={{ color: t.textColor, opacity: 0.75 }}
                >
                  {t.desc}
                </p>

                {/* Highlights */}
                <div className="flex flex-wrap gap-2">
                  {t.highlights.map((h) => (
                    <span
                      key={h}
                      className="text-[11px] px-3 py-1 rounded-full"
                      style={{
                        backgroundColor:
                          t.textColor === "#FDFFEC"
                            ? "rgba(253,255,236,0.12)"
                            : "rgba(37,79,64,0.08)",
                        color: t.textColor,
                        opacity: 0.9,
                      }}
                    >
                      {h}
                    </span>
                  ))}
                </div>
              </div>

              {/* Decorative corner number */}
              <div
                className="absolute bottom-6 right-8 font-display text-7xl font-light leading-none select-none pointer-events-none transition-opacity duration-300 opacity-10 group-hover:opacity-15"
                style={{ color: t.textColor }}
              >
                {t.name.slice(0, 1)}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
