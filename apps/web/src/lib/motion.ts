"use client";

/**
 * motion.ts — SARUI animation token system + variants
 *
 * Single source of truth for all Framer Motion animations.
 * animations.ts (legacy) remains for any consumers not yet migrated;
 * this file is the canonical layer per spec §1 and §5.
 *
 * Rules:
 *  - Only transform + opacity (compositor).
 *  - useMotionTokens() neutralizes everything when prefers-reduced-motion.
 *  - No magic numbers — only tokens defined here.
 */

import { useReducedMotion } from "framer-motion";
import { useState, useEffect } from "react";
import type { Variants, Transition } from "framer-motion";

// ─── §1 Tokens ────────────────────────────────────────────────────────────────

export const tokens = {
  duration: {
    instant: 0.1,
    quick: 0.2,
    smooth: 0.35,
    calm: 0.5,
  },
  easing: {
    easeOut: [0.22, 1, 0.36, 1] as [number, number, number, number],
    easeInOut: [0.4, 0, 0.2, 1] as [number, number, number, number],
  },
  spring: {
    calm: {
      type: "spring" as const,
      stiffness: 120,
      damping: 20,
      mass: 0.9,
    },
  },
  stagger: 0.05,
} as const;

// ─── Reduced-motion neutral transition ───────────────────────────────────────

const reducedTransition: Transition = {
  type: "tween",
  duration: 0.12,
  ease: "linear",
};

// ─── §5 Variants ─────────────────────────────────────────────────────────────

/**
 * Dialog panel: enters with opacity+scale+y, exits faster.
 * §2.1
 */
export const dialogPanel: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.98,
    y: 8,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: tokens.duration.smooth,
      ease: tokens.easing.easeOut,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    transition: {
      duration: tokens.duration.quick,
      ease: tokens.easing.easeInOut,
    },
  },
};

/**
 * Overlay / backdrop fade.
 * §2.1, §4.3
 */
export const overlayFade: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: tokens.duration.quick,
      ease: tokens.easing.easeOut,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: tokens.duration.quick,
      ease: tokens.easing.easeInOut,
    },
  },
};

/**
 * Generic reveal with ≤8px y-slide.
 * §2.2, §3.3, §3.4
 */
export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 6 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: tokens.duration.smooth,
      ease: tokens.easing.easeOut,
    },
  },
  exit: {
    opacity: 0,
    y: 6,
    transition: {
      duration: tokens.duration.quick,
      ease: tokens.easing.easeInOut,
    },
  },
};

/**
 * Section header scroll reveal.
 * §4.2 — y:16, calm duration.
 */
export const sectionReveal: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: tokens.duration.calm,
      ease: tokens.easing.easeOut,
    },
  },
};

/**
 * Stagger parent container.
 * §1 stagger token: 50ms between children.
 */
export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: tokens.stagger,
    },
  },
};

/**
 * Child item for stagger lists.
 * §2.3, §4.2 — y:8.
 */
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: tokens.duration.smooth,
      ease: tokens.easing.easeOut,
    },
  },
  exit: {
    opacity: 0,
    y: 8,
    transition: {
      duration: tokens.duration.quick,
      ease: tokens.easing.easeInOut,
    },
  },
};

/**
 * List reveal — autocomplete results container.
 * Uses staggerContainer pattern with slight y for the wrapper.
 * §2.3
 */
export const listReveal: Variants = {
  hidden: { opacity: 0, y: 4 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: tokens.duration.quick,
      ease: tokens.easing.easeOut,
      staggerChildren: tokens.stagger,
    },
  },
  exit: {
    opacity: 0,
    y: 4,
    transition: {
      duration: tokens.duration.quick,
      ease: tokens.easing.easeInOut,
    },
  },
};

/**
 * Confirmation / success pop.
 * §2.4, §2.7 — scale 0.96→1 with spring-calm.
 */
export const successPop: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: tokens.spring.calm,
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    transition: reducedTransition,
  },
};

/**
 * Capacity bar fill factory.
 * Returns a variant that animates scaleX from 0 to the given ratio.
 * transform-origin must be set to "left" on the element.
 * §2.5
 */
export function capacityBar(ratio: number): Variants {
  const clamped = Math.min(1, Math.max(0, ratio));
  return {
    hidden: { scaleX: 0 },
    visible: {
      scaleX: clamped,
      transition: {
        duration: tokens.duration.calm,
        ease: tokens.easing.easeOut,
      },
    },
  };
}

/**
 * Cross-fade for inline edit switches (read ↔ edit).
 * Used with AnimatePresence mode="wait".
 * §2.6
 */
export const crossFade: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: tokens.duration.quick,
      ease: tokens.easing.easeOut,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: tokens.duration.quick,
      ease: tokens.easing.easeInOut,
    },
  },
};

/**
 * Lightbox image with directional slide ≤8px.
 * Pass direction: 1 (next) or -1 (prev).
 * §4.3
 */
export function lightboxImage(direction: 1 | -1): Variants {
  return {
    hidden: {
      opacity: 0,
      x: direction * 8,
      scale: 0.98,
    },
    visible: {
      opacity: 1,
      x: 0,
      scale: 1,
      transition: {
        duration: tokens.duration.smooth,
        ease: tokens.easing.easeOut,
      },
    },
    exit: {
      opacity: 0,
      x: direction * -8,
      transition: {
        duration: tokens.duration.smooth,
        ease: tokens.easing.easeInOut,
      },
    },
  };
}

// ─── Reduced-motion neutral variants ─────────────────────────────────────────

/** Returns a variant set where all transforms are stripped, only opacity remains ≤150ms. */
function neutralize(v: Variants): Variants {
  const neutralized: Variants = {};
  for (const key of Object.keys(v)) {
    const state = v[key];
    if (typeof state === "object" && state !== null) {
      // Keep only opacity; drop all transforms; override transition
      const s = state as { opacity?: number; scaleX?: number };
      const neutralOpacity: number = typeof s.opacity === "number" ? s.opacity : 1;
      const neutralScaleX: number = typeof s.scaleX === "number" ? s.scaleX : 1;
      neutralized[key] = {
        opacity: neutralOpacity,
        x: 0,
        y: 0,
        scale: 1,
        scaleX: neutralScaleX,
        transition: reducedTransition,
      };
    }
  }
  return neutralized;
}

/** Neutralized capacity bar — jumps immediately to final value */
export function capacityBarReduced(ratio: number): Variants {
  const clamped = Math.min(1, Math.max(0, ratio));
  return {
    hidden: { scaleX: clamped },
    visible: {
      scaleX: clamped,
      transition: reducedTransition,
    },
  };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface MotionTokens {
  reduced: boolean;
  dialogPanel: Variants;
  overlayFade: Variants;
  fadeInUp: Variants;
  sectionReveal: Variants;
  staggerContainer: Variants;
  staggerItem: Variants;
  listReveal: Variants;
  successPop: Variants;
  crossFade: Variants;
  capacityBar: (ratio: number) => Variants;
  lightboxImage: (direction: 1 | -1) => Variants;
}

/**
 * useMotionTokens()
 *
 * Returns the full variant set.
 * When prefers-reduced-motion is active, all variants are neutralized:
 *  - Only opacity transitions, ≤0.12s, no transforms.
 *  - Springs degraded to short tween.
 *  - capacityBar jumps to final value immediately.
 */
export function useMotionTokens(): MotionTokens {
  const systemReduced = useReducedMotion();
  // Start as false to match SSR output (no browser preference available on server).
  // After mount, switch to the real system value — avoids hydration mismatch when
  // the user has prefers-reduced-motion enabled (SSR renders animated initial values;
  // client with reduced=true immediately wants transform:none → mismatch).
  const [reduced, setReduced] = useState(false);
  useEffect(() => { setReduced(systemReduced ?? false); }, [systemReduced]);

  if (reduced) {
    return {
      reduced: true,
      dialogPanel: neutralize(dialogPanel),
      overlayFade: neutralize(overlayFade),
      fadeInUp: neutralize(fadeInUp),
      sectionReveal: neutralize(sectionReveal),
      staggerContainer: neutralize(staggerContainer),
      staggerItem: neutralize(staggerItem),
      listReveal: neutralize(listReveal),
      successPop: neutralize(successPop),
      crossFade: neutralize(crossFade),
      capacityBar: (ratio: number) => capacityBarReduced(ratio),
      lightboxImage: (_direction: 1 | -1) => neutralize(lightboxImage(1)),
    };
  }

  return {
    reduced: false,
    dialogPanel,
    overlayFade,
    fadeInUp,
    sectionReveal,
    staggerContainer,
    staggerItem,
    listReveal,
    successPop,
    crossFade,
    capacityBar,
    lightboxImage,
  };
}
