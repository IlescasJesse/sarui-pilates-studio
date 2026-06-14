"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, ChevronDown } from "lucide-react";
import { tokens } from "@/lib/motion";

const ORBS = [
  { size: 520, top: "8%", left: "-5%", color: "rgba(116,147,144,0.22)", dur: 9 },
  { size: 350, top: "55%", left: "72%", color: "rgba(246,255,181,0.07)", dur: 12 },
  { size: 600, top: "25%", left: "55%", color: "rgba(37,79,64,0.55)", dur: 14 },
  { size: 280, top: "68%", left: "15%", color: "rgba(116,147,144,0.15)", dur: 10 },
  { size: 200, top: "15%", left: "82%", color: "rgba(246,255,181,0.05)", dur: 8 },
];

/**
 * HeroSection — §4.1
 *
 * Changes from original:
 * - Title duration 1s → 0.6s (spec: ~600ms).
 * - Frase + CTA + stats converted to staggerContainer/staggerItem (stagger 0.15 for hero).
 * - Orbs and chevron: animate prop conditioned on !reduced (§6 no loops in reduced-motion).
 */
export function HeroSection() {
  const reduced = useReducedMotion() ?? false;

  return (
    <section
      id="hero"
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
      style={{ backgroundColor: "#1d3d32" }}
    >
      {/* ── Background orbs §4.1 — disabled in reduced-motion §6 ── */}
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
          animate={
            reduced
              ? {} // static — no ambient loop in reduced-motion
              : {
                  y: [0, -24, 0],
                  x: [0, i % 2 === 0 ? 16 : -16, 0],
                  scale: [1, 1.06, 1],
                }
          }
          transition={{
            duration: orb.dur,
            repeat: reduced ? 0 : Infinity,
            ease: tokens.easing.easeInOut,
            delay: i * 1.3,
          }}
        />
      ))}

      <div
        className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-[0.06]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: "200px 200px",
        }}
      />

      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(135deg, #F6FFB5 0px, #F6FFB5 1px, transparent 1px, transparent 80px)",
        }}
      />

      <div className="relative z-10 flex flex-col items-center text-center px-5 md:px-6 max-w-5xl mx-auto w-full pt-24 md:pt-20">

        {/* ── Title §4.1: reduced 1s→600ms ── */}
        <motion.h1
          className="font-display font-light leading-none tracking-tight text-[#FDFFEC] select-none"
          style={{ fontSize: "clamp(4.5rem, 16vw, 12rem)" }}
          initial={{ opacity: 0, y: reduced ? 0 : 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={
            reduced
              ? { duration: 0.12 }
              : { duration: 0.6, delay: 0.25, ease: tokens.easing.easeOut }
          }
        >
          sarui
        </motion.h1>

        {/* ── Subtitle — manual delay preserved per spec §4.1 ── */}
        <motion.p
          className="text-[#F6FFB5]/70 tracking-[0.5em] uppercase text-sm md:text-base font-light mt-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={
            reduced
              ? { duration: 0.12 }
              : { duration: tokens.duration.calm, delay: 0.5, ease: tokens.easing.easeOut }
          }
        >
          Pilates Studio
        </motion.p>

        {/* ── Divider scaleX §4.1 — correct compositor property ── */}
        <motion.div
          className="w-16 h-px bg-[#F6FFB5]/25 my-8"
          initial={{ scaleX: reduced ? 1 : 0 }}
          animate={{ scaleX: 1 }}
          transition={
            reduced
              ? { duration: 0 }
              : { duration: tokens.duration.smooth, delay: 0.65, ease: tokens.easing.easeOut }
          }
        />

        {/* Frase */}
        <motion.p
          className="font-display font-light text-[#FDFFEC]/75 text-2xl md:text-3xl max-w-md leading-relaxed"
          initial={{ opacity: 0, y: reduced ? 0 : 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={
            reduced
              ? { duration: 0.12 }
              : { duration: tokens.duration.calm, delay: 0.7, ease: tokens.easing.easeOut }
          }
        >
          Mueve tu cuerpo.{" "}
          <em className="text-[#F6FFB5] italic">Transforma</em> tu mente.
        </motion.p>

        {/* CTA §4.1 */}
        <motion.div
          className="flex items-center justify-center mt-12"
          initial={{ opacity: 0, y: reduced ? 0 : 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={
            reduced
              ? { duration: 0.12 }
              : { duration: tokens.duration.calm, delay: 0.85, ease: tokens.easing.easeOut }
          }
        >
          <Link
            href="/tienda/login?redirect=/tienda/clases"
            className="group flex items-center gap-2 px-8 py-4 rounded-full bg-[#F6FFB5] text-[#254F40] font-semibold text-sm hover:bg-[#FDFFEC] transition-all duration-200 hover:shadow-2xl hover:shadow-[#F6FFB5]/20 motion-reduce:transform-none hover:-translate-y-0.5 active:translate-y-0"
          >
            Agendar clase
            <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transform-none" />
          </Link>
        </motion.div>

        {/* Stats §4.1 — fade group, no count-up */}
        <motion.div
          className="flex items-center gap-10 mt-16 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={
            reduced
              ? { duration: 0.12 }
              : { duration: tokens.duration.calm, delay: 1.0, ease: tokens.easing.easeOut }
          }
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

      {/* ── Chevron §4.1 — loop disabled in reduced-motion §6 ── */}
      <motion.button
        onClick={() =>
          document.getElementById("beneficios")?.scrollIntoView({ behavior: "smooth" })
        }
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-[#FDFFEC]/35 hover:text-[#FDFFEC]/70 transition-colors"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={
          reduced
            ? { duration: 0.12 }
            : { delay: 1.5, duration: tokens.duration.calm, ease: tokens.easing.easeOut }
        }
      >
        <span className="text-[10px] tracking-[0.3em] uppercase">Descubrir</span>
        <motion.div
          animate={reduced ? {} : { y: [0, 7, 0] }}
          transition={{
            duration: 1.8,
            repeat: reduced ? 0 : Infinity,
            ease: tokens.easing.easeInOut,
          }}
        >
          <ChevronDown className="w-5 h-5" />
        </motion.div>
      </motion.button>
    </section>
  );
}
