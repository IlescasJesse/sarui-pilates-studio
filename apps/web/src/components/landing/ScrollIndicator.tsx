"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

const DOTS = [
  { id: "hero", label: "Inicio" },
  { id: "beneficios", label: "Beneficios" },
  { id: "tipos-pilates", label: "Pilates" },
  { id: "clases", label: "Horarios" },
  { id: "reservaciones", label: "Reservar" },
  { id: "nosotros", label: "Nosotros" },
  { id: "precios", label: "Precios" },
  { id: "ubicacion", label: "Ubicación" },
];

export function ScrollIndicator() {
  const [active, setActive] = useState("hero");

  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    DOTS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActive(id); },
        { threshold: 0.35, rootMargin: "-80px 0px -45% 0px" }
      );
      obs.observe(el);
      observers.push(obs);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, []);

  const scrollTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  return (
    <div className="fixed right-5 top-1/2 -translate-y-1/2 z-40 hidden xl:flex flex-col items-end gap-2.5">
      {DOTS.map(({ id, label }) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            onClick={() => scrollTo(id)}
            title={label}
            className="group flex items-center gap-2 justify-end"
          >
            <span
              className="text-[11px] tracking-wide font-medium transition-all duration-200 whitespace-nowrap"
              style={{
                color: "#254F40",
                opacity: isActive ? 1 : 0,
              }}
            >
              {label}
            </span>
            <motion.div
              animate={{
                width: isActive ? 20 : 7,
                height: 7,
                backgroundColor: isActive ? "#254F40" : "#749390",
                borderRadius: isActive ? 3.5 : 99,
                opacity: isActive ? 1 : 0.5,
              }}
              whileHover={{ opacity: 1, backgroundColor: "#254F40", scale: 1.1 }}
              transition={{ type: "spring", stiffness: 420, damping: 28 }}
              className="flex-shrink-0 cursor-pointer"
            />
          </button>
        );
      })}
    </div>
  );
}
