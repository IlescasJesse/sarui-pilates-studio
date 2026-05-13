"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { fadeInUp } from "@/lib/animations";
import { Instagram, Facebook, Phone, MapPin } from "lucide-react";

const SITEMAP = [
  {
    title: "El Studio",
    links: [
      { label: "Inicio", id: "hero" },
      { label: "Quiénes somos", id: "nosotros" },
      { label: "Tipos de Pilates", id: "tipos-pilates" },
      { label: "Beneficios", id: "beneficios" },
    ],
  },
  {
    title: "Clases",
    links: [
      { label: "Horarios", id: "clases" },
      { label: "Reservaciones", id: "reservaciones" },
      { label: "Paquetes y precios", id: "precios" },
      { label: "Políticas", id: "nosotros" },
    ],
  },
  {
    title: "Contacto",
    links: [
      { label: "Ubicación", id: "ubicacion" },
    ],
  },
];

const scrollTo = (id: string) =>
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

export function FooterSection() {
  return (
    <footer
      id="sitemap"
      className="bg-[#1d3d32] text-[#FDFFEC] pt-20 pb-10 relative overflow-hidden"
    >
      {/* Decorative */}
      <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-[#254F40]/40 blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto px-6 md:px-8 relative z-10">
        {/* Top: logo + tagline */}
        <motion.div
          className="flex flex-col md:flex-row md:items-end justify-between gap-10 mb-16 pb-16 border-b border-white/8"
          variants={fadeInUp}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, amount: 0.2 }}
        >
          <div>
            <div className="mb-4">
              <span className="text-[#FDFFEC] font-bold text-xl tracking-[0.15em]">SARUI</span>
            </div>
            <p className="text-[#FDFFEC]/50 text-sm max-w-xs leading-relaxed font-display font-light text-lg">
              Mueve tu cuerpo.{" "}
              <em className="text-[#F6FFB5] italic">Transforma</em> tu mente.
            </p>
          </div>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => scrollTo("reservaciones")}
              className="px-6 py-3 rounded-full bg-[#F6FFB5] text-[#254F40] font-semibold text-sm hover:bg-[#FDFFEC] transition-colors"
            >
              Reservar clase
            </button>
            <Link
              href="/gestion-acceso"
              className="px-6 py-3 rounded-full border border-white/20 text-[#FDFFEC]/70 font-medium text-sm hover:border-white/40 hover:text-[#FDFFEC] transition-colors text-center"
            >
              Administradores →
            </Link>
          </div>
        </motion.div>

        {/* Site map */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-16">
          {SITEMAP.map((col) => (
            <div key={col.title}>
              <p className="text-[10px] tracking-[0.3em] uppercase font-semibold text-[#F6FFB5]/50 mb-5">
                {col.title}
              </p>
              <ul className="space-y-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <button
                      onClick={() => scrollTo(link.id)}
                      className="text-sm text-[#FDFFEC]/55 hover:text-[#FDFFEC] transition-colors text-left"
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Contact column */}
          <div>
            <p className="text-[10px] tracking-[0.3em] uppercase font-semibold text-[#F6FFB5]/50 mb-5">
              Síguenos
            </p>
            <div className="space-y-3">
              <a
                href="https://instagram.com/sarui.pilates.studio"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 text-sm text-[#FDFFEC]/55 hover:text-[#FDFFEC] transition-colors"
              >
                <Instagram className="w-4 h-4 flex-shrink-0" />
                Instagram
              </a>
              <a
                href="https://facebook.com/SaruiPilatesStudio"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 text-sm text-[#FDFFEC]/55 hover:text-[#FDFFEC] transition-colors"
              >
                <Facebook className="w-4 h-4 flex-shrink-0" />
                Facebook
              </a>
              <a
                href="tel:9515619759"
                className="flex items-center gap-2.5 text-sm text-[#FDFFEC]/55 hover:text-[#FDFFEC] transition-colors"
              >
                <Phone className="w-4 h-4 flex-shrink-0" />
                951 561 9759
              </a>
              <button
                onClick={() => scrollTo("ubicacion")}
                className="flex items-start gap-2.5 text-sm text-[#FDFFEC]/55 hover:text-[#FDFFEC] transition-colors text-left"
              >
                <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                Xoxocotlán, Oaxaca
              </button>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-white/8">
          <p className="text-[#FDFFEC]/30 text-xs">
            © {new Date().getFullYear()} Sarui Pilates Studio. Todos los derechos reservados.
          </p>
          <p className="text-[#FDFFEC]/20 text-xs">
            Xoxocotlán, Oaxaca, México
          </p>
        </div>
      </div>
    </footer>
  );
}
