"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, ChevronDown } from "lucide-react";

const ORBS = [
  { size: 520, top: "8%", left: "-5%", color: "rgba(116,147,144,0.22)", dur: 9 },
  { size: 350, top: "55%", left: "72%", color: "rgba(246,255,181,0.07)", dur: 12 },
  { size: 600, top: "25%", left: "55%", color: "rgba(37,79,64,0.55)", dur: 14 },
  { size: 280, top: "68%", left: "15%", color: "rgba(116,147,144,0.15)", dur: 10 },
  { size: 200, top: "15%", left: "82%", color: "rgba(246,255,181,0.05)", dur: 8 },
];

export function HeroSection() {
  return (
    <section
      id="hero"
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
      style={{ backgroundColor: "#1d3d32" }}
    >
      {/* Animated background orbs */}
      {ORBS.map((orb, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: orb.size,
            height: orb.size,
            top: orb.top,
            left: orb.left,
            backgroundColor: orb.color,
            filter: "blur(80px)",
          }}
          animate={{
            y: [0, -24, 0],
            x: [0, i % 2 === 0 ? 16 : -16, 0],
            scale: [1, 1.06, 1],
          }}
          transition={{
            duration: orb.dur,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 1.3,
          }}
        />
      ))}

      {/* Grain texture overlay */}
      <div
        className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-[0.06]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: "200px 200px",
        }}
      />

      {/* Thin diagonal line decoration */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage: "repeating-linear-gradient(135deg, #F6FFB5 0px, #F6FFB5 1px, transparent 1px, transparent 80px)",
        }}
      />

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-5xl mx-auto w-full">
        {/* Location badge */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/15 bg-white/5 text-[#F6FFB5]/80 text-[11px] tracking-[0.25em] uppercase mb-10"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#F6FFB5]/60 animate-pulse" />
          Xoxocotlán, Oaxaca · México
        </motion.div>

        {/* Studio name */}
        <motion.h1
          className="font-display font-light leading-none tracking-tight text-[#FDFFEC] select-none"
          style={{ fontSize: "clamp(4.5rem, 16vw, 12rem)" }}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
        >
          sarui
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          className="text-[#F6FFB5]/70 tracking-[0.5em] uppercase text-sm md:text-base font-light mt-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          Pilates Studio
        </motion.p>

        {/* Divider */}
        <motion.div
          className="w-16 h-px bg-[#F6FFB5]/25 my-8"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.7, delay: 0.65 }}
        />

        {/* Tagline */}
        <motion.p
          className="font-display font-light text-[#FDFFEC]/75 text-2xl md:text-3xl max-w-md leading-relaxed"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
        >
          Mueve tu cuerpo.{" "}
          <em className="text-[#F6FFB5] italic">Transforma</em> tu mente.
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          className="flex flex-col sm:flex-row items-center gap-4 mt-12"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.9 }}
        >
          <Link
            href="/portal/clases"
            className="group flex items-center gap-2 px-8 py-4 rounded-full bg-[#F6FFB5] text-[#254F40] font-semibold text-sm hover:bg-[#FDFFEC] transition-all duration-200 hover:shadow-2xl hover:shadow-[#F6FFB5]/20 hover:-translate-y-0.5 active:translate-y-0"
          >
            Agendar clase
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            href="/login"
            className="flex items-center gap-2 px-8 py-4 rounded-full border border-white/25 text-[#FDFFEC]/80 font-medium text-sm hover:border-white/50 hover:text-[#FDFFEC] hover:bg-white/5 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
          >
            Ya tengo cuenta
          </Link>
        </motion.div>

        {/* Stats */}
        <motion.div
          className="flex items-center gap-10 mt-16 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.1 }}
        >
          {[
            { num: "3", label: "Modalidades" },
            { num: "12", label: "Sesiones/sem." },
            { num: "100%", label: "Atención personal" },
          ].map((s) => (
            <div key={s.label}>
              <p className="font-display text-3xl font-light text-[#F6FFB5]">{s.num}</p>
              <p className="text-[#FDFFEC]/45 text-xs tracking-wide mt-1">{s.label}</p>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Scroll cue */}
      <motion.button
        onClick={() =>
          document.getElementById("beneficios")?.scrollIntoView({ behavior: "smooth" })
        }
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-[#FDFFEC]/35 hover:text-[#FDFFEC]/70 transition-colors"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
      >
        <span className="text-[10px] tracking-[0.3em] uppercase">Descubrir</span>
        <motion.div
          animate={{ y: [0, 7, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        >
          <ChevronDown className="w-5 h-5" />
        </motion.div>
      </motion.button>
    </section>
  );
}
