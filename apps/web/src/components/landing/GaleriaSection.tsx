"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

const IMAGES = [
  { id: "g1", src: "/images/hero/hero-1.jpg", alt: "Estudio Sarui" },
  { id: "g2", src: "/images/hero/hero-2.jpg", alt: "Clase de Pilates" },
  { id: "g3", src: "/images/hero/hero-3.jpg", alt: "Sesión en estudio" },
  { id: "g4", src: "/images/hero/hero-4.jpg", alt: "Entrenamiento" },
  { id: "g5", src: "/images/hero/hero-5.jpg", alt: "Espacio Sarui" },
];

export function GaleriaSection() {
  const [selected, setSelected] = useState<number | null>(null);
  const thumbListRef = useRef<HTMLDivElement>(null);

  const open = useCallback((i: number) => setSelected(i), []);
  const close = useCallback(() => setSelected(null), []);

  const prev = useCallback(() => {
    setSelected((s) => (s !== null ? (s - 1 + IMAGES.length) % IMAGES.length : null));
  }, []);

  const next = useCallback(() => {
    setSelected((s) => (s !== null ? (s + 1) % IMAGES.length : null));
  }, []);

  useEffect(() => {
    if (selected === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [selected, close, prev, next]);

  useEffect(() => {
    if (selected === null || !thumbListRef.current) return;
    const el = thumbListRef.current.children[selected] as HTMLElement;
    el?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [selected]);

  return (
    <section id="galeria" className="py-24 md:py-32 bg-[#FDFFEC] overflow-hidden">
      <div className="max-w-7xl mx-auto px-5 md:px-8">
        <motion.div
          className="text-center mb-14 md:mb-18"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-[10px] md:text-[11px] tracking-[0.3em] uppercase text-[#254F40]/40 mb-3">
            Nuestro espacio
          </p>
          <h2 className="font-display text-3xl md:text-5xl font-light text-[#254F40]">
            Galería
          </h2>
        </motion.div>

        {/* Staggered grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {IMAGES.map((img, i) => {
            const isTall = i % 3 === 0;
            const isWide = i === 2;
            return (
              <motion.button
                key={img.id}
                onClick={() => open(i)}
                className={`relative overflow-hidden rounded-2xl group cursor-pointer ${
                  isTall ? "row-span-2" : ""
                } ${isWide ? "col-span-2" : ""}`}
                style={{ aspectRatio: isTall ? "3/4" : isWide ? "2/1" : "4/3" }}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors duration-300" />
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {selected !== null && (
          <motion.div
            className="fixed inset-0 z-[100] flex flex-col bg-black/90"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Close */}
            <button
              onClick={close}
              className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Main image area */}
            <div className="flex-1 relative flex items-center justify-center p-4 md:p-8">
              {/* Prev */}
              <button
                onClick={prev}
                className="absolute left-2 md:left-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="relative w-full h-full max-w-5xl max-h-[70vh]">
                <Image
                  src={IMAGES[selected].src}
                  alt={IMAGES[selected].alt}
                  fill
                  sizes="90vw"
                  className="object-contain"
                  priority
                />
              </div>

              {/* Next */}
              <button
                onClick={next}
                className="absolute right-2 md:right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Counter */}
            <div className="text-center text-white/50 text-xs tracking-wide mb-3">
              {selected + 1} / {IMAGES.length}
            </div>

            {/* Horizontal thumbnails */}
            <div
              ref={thumbListRef}
              className="flex gap-2 px-4 pb-6 overflow-x-auto scrollbar-thin"
            >
              {IMAGES.map((img, i) => (
                <button
                  key={img.id}
                  onClick={() => setSelected(i)}
                  className={`relative flex-shrink-0 w-20 h-14 rounded-lg overflow-hidden transition-all duration-200 ${
                    i === selected
                      ? "ring-2 ring-[#F6FFB5] ring-offset-2 ring-offset-black/90 opacity-100"
                      : "opacity-50 hover:opacity-80"
                  }`}
                >
                  <Image
                    src={img.src}
                    alt=""
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
