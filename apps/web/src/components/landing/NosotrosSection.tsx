"use client";

import { motion } from "framer-motion";
import { staggerContainer, staggerItem, fadeInUp } from "@/lib/animations";
import { Shield, Star, Leaf, Clock } from "lucide-react";

const NORMAS = [
  "Calcetas antiderrapantes obligatorias en todas las clases",
  "Sin mochilas grandes o pesadas en el área de entrenamiento",
  "Ropa adecuada, limpia y cómoda durante toda la sesión",
  "Seguir las indicaciones del instructor en todo momento",
  "Sarui no se responsabiliza por objetos olvidados en las instalaciones",
  "Traer toallita facial y botella de agua personal",
  "Celular en modo avión o silencio durante la clase",
];

const POLITICAS = [
  {
    icon: Clock,
    title: "Puntualidad",
    desc: "Tolerancia máxima de 10 minutos para ingresar. Pasado este tiempo, se niega el acceso y la clase se descuenta del paquete.",
  },
  {
    icon: Shield,
    title: "Cancelaciones",
    desc: "Cancela con mínimo 5 horas de anticipación. Sin cancelación en plazo, la clase se descuenta automáticamente de tu paquete.",
  },
  {
    icon: Star,
    title: "Reposición",
    desc: "Cada cliente tiene derecho a 1 clase de reposición por periodo de paquete, siempre que haya cumplido con la anticipación requerida.",
  },
];

const VALORES = [
  {
    label: "Bienestar integral",
    desc: "Creemos en el movimiento consciente como pilar de una vida plena.",
  },
  {
    label: "Comunidad",
    desc: "Un espacio seguro donde cada persona es bienvenida en su proceso.",
  },
  {
    label: "Excelencia",
    desc: "Instructores certificados comprometidos con tu progreso real.",
  },
  {
    label: "Honestidad",
    desc: "Claridad en cada clase, cada política y cada interacción.",
  },
];

export function NosotrosSection() {
  return (
    <section id="nosotros" className="py-28 md:py-36 bg-[#FDFFEC] relative overflow-hidden">
      {/* Decorative leaf */}
      <div className="absolute top-20 right-10 w-48 h-48 rounded-full bg-[#F6FFB5]/70 blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto px-6 md:px-8">
        {/* Header */}
        <motion.div
          className="mb-16 grid grid-cols-1 md:grid-cols-2 gap-12 items-end"
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, amount: 0.3 }}
        >
          <div>
            <motion.p variants={staggerItem} className="text-[#749390] text-xs tracking-[0.3em] uppercase font-medium mb-4">
              Quiénes somos
            </motion.p>
            <motion.h2 variants={staggerItem} className="font-display font-light text-5xl md:text-6xl text-[#254F40] leading-tight">
              El estudio
              <em className="block italic text-[#749390]">que te espera</em>
            </motion.h2>
          </div>
          <motion.div variants={staggerItem}>
            <p className="text-[#254F40]/65 text-base leading-relaxed">
              Sarui Pilates Studio nació con una misión simple: hacer accesible el método Pilates en Oaxaca con la más alta calidad.
              Somos un espacio íntimo, diseñado para que cada sesión sea una experiencia de transformación real.
            </p>
            <p className="text-[#254F40]/65 text-base leading-relaxed mt-4">
              Ubicados en Xoxocotlán, combinamos Pilates Reformer y Mat con atención personalizada,
              grupos pequeños y un ambiente que invita a la calma y al progreso consciente.
            </p>
          </motion.div>
        </motion.div>

        {/* Misión / Visión */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-16"
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, amount: 0.2 }}
        >
          <motion.div
            variants={staggerItem}
            className="p-8 rounded-2xl bg-[#254F40] text-[#FDFFEC] relative overflow-hidden"
          >
            <div className="absolute -bottom-8 -right-8 w-32 h-32 rounded-full bg-white/5" />
            <Leaf className="w-7 h-7 text-[#F6FFB5] mb-5" strokeWidth={1.5} />
            <h3 className="font-display text-3xl font-light mb-3 text-[#F6FFB5]">Misión</h3>
            <p className="text-[#FDFFEC]/70 text-sm leading-relaxed">
              Ofrecer un espacio de bienestar que transforme la vida de nuestros clientes a través del método Pilates,
              con atención personalizada, ambientes seguros y práctica de alto nivel.
            </p>
          </motion.div>
          <motion.div
            variants={staggerItem}
            className="p-8 rounded-2xl border border-[#254F40]/15 bg-[#F6FFB5]/30"
          >
            <Star className="w-7 h-7 text-[#254F40] mb-5" strokeWidth={1.5} />
            <h3 className="font-display text-3xl font-light mb-3 text-[#254F40]">Visión</h3>
            <p className="text-[#254F40]/65 text-sm leading-relaxed">
              Ser el estudio de referencia en Oaxaca para quienes buscan movimiento consciente,
              salud integral y una comunidad que los acompañe en cada etapa de su bienestar.
            </p>
          </motion.div>
        </motion.div>

        {/* Valores */}
        <motion.div
          className="mb-16"
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, amount: 0.2 }}
        >
          <motion.h3 variants={staggerItem} className="font-display text-3xl font-light text-[#254F40] mb-8">
            Nuestros valores
          </motion.h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {VALORES.map((v) => (
              <motion.div
                key={v.label}
                variants={staggerItem}
                className="p-5 rounded-xl bg-white/60 border border-[#254F40]/10 hover:border-[#254F40]/25 transition-colors"
              >
                <h4 className="font-semibold text-[#254F40] text-sm mb-2">{v.label}</h4>
                <p className="text-[#254F40]/55 text-xs leading-relaxed">{v.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Normas y Políticas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Normas */}
          <motion.div
            variants={fadeInUp}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, amount: 0.2 }}
          >
            <h3 className="font-display text-3xl font-light text-[#254F40] mb-6">
              Normas generales
            </h3>
            <ul className="space-y-3">
              {NORMAS.map((n, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-[#254F40]/70 leading-relaxed">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#254F40]/8 flex items-center justify-center mt-0.5">
                    <span className="text-[10px] font-bold text-[#254F40]">{i + 1}</span>
                  </span>
                  {n}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Políticas */}
          <motion.div
            variants={fadeInUp}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, amount: 0.2 }}
          >
            <h3 className="font-display text-3xl font-light text-[#254F40] mb-6">
              Políticas de reservación
            </h3>
            <div className="space-y-4">
              {POLITICAS.map((p) => {
                const Icon = p.icon;
                return (
                  <div key={p.title} className="flex gap-4 p-5 rounded-xl bg-[#254F40]/4 border border-[#254F40]/10">
                    <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-[#254F40]/10 flex items-center justify-center">
                      <Icon className="w-4 h-4 text-[#254F40]" strokeWidth={1.5} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-[#254F40] text-sm mb-1">{p.title}</h4>
                      <p className="text-[#254F40]/60 text-xs leading-relaxed">{p.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
