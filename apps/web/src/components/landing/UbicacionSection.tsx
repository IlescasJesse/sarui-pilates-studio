"use client";

import { motion } from "framer-motion";
import { staggerContainer, staggerItem, fadeInUp } from "@/lib/animations";
import { MapPin, Phone, Instagram, Facebook, Clock } from "lucide-react";

const HORARIOS_ATENCION = [
  { dia: "Lunes – Viernes", horario: "7:00 – 9:00 · 17:00 – 19:00" },
  { dia: "Sábado", horario: "9:00 – 10:00" },
  { dia: "Domingo", horario: "Cerrado" },
];

export function UbicacionSection() {
  return (
    <section id="ubicacion" className="py-28 md:py-36 bg-[#f7f9ec] relative overflow-hidden">
      <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full bg-[#F6FFB5]/60 blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto px-6 md:px-8">
        {/* Header */}
        <motion.div
          className="mb-14"
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, amount: 0.3 }}
        >
          <motion.p variants={staggerItem} className="text-[#749390] text-xs tracking-[0.3em] uppercase font-medium mb-4">
            Encuéntranos
          </motion.p>
          <motion.h2 variants={staggerItem} className="font-display font-light text-5xl md:text-6xl text-[#254F40] leading-tight">
            Visítanos en
            <em className="block italic text-[#749390]">Xoxocotlán</em>
          </motion.h2>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Map */}
          <motion.div
            variants={fadeInUp}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, amount: 0.2 }}
            className="rounded-2xl overflow-hidden border border-[#254F40]/12 shadow-xl shadow-[#254F40]/6 aspect-[4/3]"
          >
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3815.0!2d-96.7256!3d17.0278!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTfCsDAxJzQwLjEiTiA5NsKwNDMnMzIuMiJX!5e0!3m2!1ses!2smx!4v1714240000000!5m2!1ses!2smx&q=Cam.+Antiguo+Sn.+Bartolo+Coyotepec+9,+Xoxocotlán,+Oaxaca"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Ubicación Sarui Pilates Studio"
            />
          </motion.div>

          {/* Contact info */}
          <motion.div
            className="space-y-6"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, amount: 0.2 }}
          >
            {/* Address */}
            <motion.div variants={staggerItem} className="flex gap-4 p-5 rounded-2xl bg-white/70 border border-[#254F40]/10">
              <div className="w-10 h-10 rounded-xl bg-[#254F40]/8 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-[#254F40]" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-xs font-semibold text-[#749390] uppercase tracking-wider mb-1">Dirección</p>
                <p className="text-[#254F40] font-medium text-sm leading-relaxed">
                  Cam. Antiguo Sn. Bartolo Coyotepec 9
                </p>
                <p className="text-[#254F40]/60 text-sm">Cabecera Municipal, Sta. Cruz Xoxocotlán</p>
                <p className="text-[#254F40]/60 text-sm">Oaxaca, México</p>
                <a
                  href="https://maps.google.com/?q=Cam.+Antiguo+Sn.+Bartolo+Coyotepec+9+Xoxocotlán+Oaxaca"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-[#749390] hover:text-[#254F40] transition-colors mt-2"
                >
                  Abrir en Google Maps →
                </a>
              </div>
            </motion.div>

            {/* Phone */}
            <motion.div variants={staggerItem} className="flex gap-4 p-5 rounded-2xl bg-white/70 border border-[#254F40]/10">
              <div className="w-10 h-10 rounded-xl bg-[#254F40]/8 flex items-center justify-center flex-shrink-0">
                <Phone className="w-5 h-5 text-[#254F40]" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-xs font-semibold text-[#749390] uppercase tracking-wider mb-1">Teléfono</p>
                <a
                  href="tel:9515619759"
                  className="text-[#254F40] font-medium text-lg hover:text-[#749390] transition-colors"
                >
                  951 561 9759
                </a>
                <p className="text-[#254F40]/50 text-xs mt-1">WhatsApp y llamadas</p>
              </div>
            </motion.div>

            {/* Social */}
            <motion.div variants={staggerItem} className="flex gap-4 p-5 rounded-2xl bg-white/70 border border-[#254F40]/10">
              <div className="w-10 h-10 rounded-xl bg-[#254F40]/8 flex items-center justify-center flex-shrink-0">
                <Instagram className="w-5 h-5 text-[#254F40]" strokeWidth={1.5} />
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold text-[#749390] uppercase tracking-wider">Redes sociales</p>
                <a
                  href="https://instagram.com/sarui.pilates.studio"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-[#254F40] hover:text-[#749390] transition-colors"
                >
                  <Instagram className="w-4 h-4" strokeWidth={1.5} />
                  @sarui.pilates.studio
                </a>
                <a
                  href="https://facebook.com/SaruiPilatesStudio"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-[#254F40] hover:text-[#749390] transition-colors"
                >
                  <Facebook className="w-4 h-4" strokeWidth={1.5} />
                  Sarui Pilates Studio
                </a>
              </div>
            </motion.div>

            {/* Hours */}
            <motion.div variants={staggerItem} className="p-5 rounded-2xl bg-[#254F40] text-[#FDFFEC]">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-4 h-4 text-[#F6FFB5]" strokeWidth={1.5} />
                <p className="text-xs font-semibold text-[#F6FFB5] uppercase tracking-wider">Horarios de clases</p>
              </div>
              <div className="space-y-2">
                {HORARIOS_ATENCION.map((h) => (
                  <div key={h.dia} className="flex justify-between items-baseline gap-4">
                    <span className="text-sm text-[#FDFFEC]/70">{h.dia}</span>
                    <span className={`text-sm font-medium ${h.horario === "Cerrado" ? "text-[#FDFFEC]/30" : "text-[#F6FFB5]"}`}>
                      {h.horario}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
