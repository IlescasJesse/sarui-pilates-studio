"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Menu, X } from "lucide-react";

const NAV_SECTIONS = [
  { id: "beneficios", label: "Beneficios" },
  { id: "tipos-pilates", label: "Pilates" },
  { id: "clases", label: "Horarios" },
  { id: "nosotros", label: "Nosotros" },
  { id: "precios", label: "Precios" },
  { id: "ubicacion", label: "Ubicación" },
];

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("hero");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const ids = ["hero", ...NAV_SECTIONS.map((s) => s.id)];
    const observers: IntersectionObserver[] = [];

    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveSection(id); },
        { threshold: 0.25, rootMargin: "-80px 0px -55% 0px" }
      );
      obs.observe(el);
      observers.push(obs);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setMenuOpen(false);
  };

  return (
    <>
      <motion.header
        className="fixed top-0 left-0 right-0 z-50"
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        style={{
          backgroundColor: scrolled ? "rgba(37,79,64,0.94)" : "transparent",
          backdropFilter: scrolled ? "blur(14px)" : "none",
          borderBottom: scrolled ? "1px solid rgba(246,255,181,0.12)" : "none",
          transition: "background-color 0.35s ease, border-color 0.35s ease, backdrop-filter 0.35s ease",
        }}
      >
        <div className="max-w-7xl mx-auto px-5 md:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <button onClick={() => scrollTo("hero")} className="flex items-center gap-2.5 group flex-shrink-0">
            <span className="text-[#FDFFEC] font-bold text-lg tracking-[0.15em]">SARUI</span>
          </button>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center">
            {NAV_SECTIONS.map((s) => {
              const isActive = activeSection === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => scrollTo(s.id)}
                  className="relative px-3.5 py-2 text-[13px] transition-colors duration-150"
                  style={{ color: isActive ? "#F6FFB5" : "rgba(253,255,236,0.6)" }}
                >
                  {s.label}
                  {isActive && (
                    <motion.span
                      layoutId="nav-underline"
                      className="absolute bottom-0 left-2.5 right-2.5 h-px bg-[#F6FFB5] rounded-full"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <Link
              href="/tienda/login?redirect=/tienda/clases"
              className="hidden sm:inline-flex items-center gap-1.5 px-5 py-2 rounded-full text-[13px] font-semibold bg-[#F6FFB5] text-[#254F40] hover:bg-[#FDFFEC] transition-all duration-200 hover:shadow-lg hover:shadow-[#F6FFB5]/20"
            >
              Agendar
            </Link>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg text-[#FDFFEC] hover:bg-white/10 transition-colors"
              aria-label="Menú"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </motion.header>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="fixed inset-0 z-40 flex flex-col pt-16"
            style={{ backgroundColor: "#254F40" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <nav className="flex flex-col px-8 pt-6 gap-1">
              {NAV_SECTIONS.map((s, i) => (
                <motion.button
                  key={s.id}
                  onClick={() => scrollTo(s.id)}
                  className="text-left text-[#FDFFEC] py-4 border-b border-white/10 text-3xl font-light font-display hover:text-[#F6FFB5] transition-colors"
                  initial={{ opacity: 0, x: -24 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.055 }}
                >
                  {s.label}
                </motion.button>
              ))}
              <motion.div
                className="mt-8 flex flex-col gap-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.42 }}
              >
                <Link
                  href="/tienda/login?redirect=/tienda/clases"
                  onClick={() => setMenuOpen(false)}
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-[#F6FFB5] text-[#254F40] font-semibold text-lg"
                >
                  Agendar clase →
                </Link>
                <Link
                  href="/gestion-acceso"
                  onClick={() => setMenuOpen(false)}
                  className="text-center text-xs text-[#FDFFEC]/30 hover:text-[#FDFFEC]/60 transition-colors mt-4"
                >
                  Administradores
                </Link>
              </motion.div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
