import { Variants } from "framer-motion";

const spring = { type: "spring", stiffness: 400, damping: 30 } as const;
const springFast = { type: "spring", stiffness: 500, damping: 35 } as const;
const springGentle = { type: "spring", stiffness: 280, damping: 28 } as const;

export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: springFast },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: springGentle },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15 } },
};

export const slideInLeft: Variants = {
  initial: { opacity: 0, x: -24 },
  animate: { opacity: 1, x: 0, transition: spring },
  exit: { opacity: 0, x: -24, transition: { duration: 0.15 } },
};

export const slideInRight: Variants = {
  initial: { opacity: 0, x: 24 },
  animate: { opacity: 1, x: 0, transition: spring },
  exit: { opacity: 0, x: 24, transition: { duration: 0.15 } },
};

export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.96 },
  animate: { opacity: 1, scale: 1, transition: spring },
  exit: { opacity: 0, scale: 0.96, transition: { duration: 0.12 } },
};

export const scaleUp: Variants = {
  initial: { opacity: 0, scale: 0.88 },
  animate: { opacity: 1, scale: 1, transition: springGentle },
  exit: { opacity: 0, scale: 0.88, transition: { duration: 0.15 } },
};

export const staggerContainer: Variants = {
  initial: {},
  animate: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
  exit: {},
};

export const staggerContainerFast: Variants = {
  initial: {},
  animate: { transition: { staggerChildren: 0.04, delayChildren: 0.05 } },
  exit: {},
};

export const staggerItem: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: spring },
  exit: { opacity: 0, y: -4, transition: { duration: 0.1 } },
};

export const staggerItemScale: Variants = {
  initial: { opacity: 0, scale: 0.93 },
  animate: { opacity: 1, scale: 1, transition: spring },
  exit: { opacity: 0, scale: 0.93 },
};

export const dialogOverlay: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

export const dialogContent: Variants = {
  initial: { opacity: 0, scale: 0.95, y: 12 },
  animate: { opacity: 1, scale: 1, y: 0, transition: spring },
  exit: { opacity: 0, scale: 0.95, y: 8, transition: { duration: 0.15 } },
};

export const tabTransition: Variants = {
  initial: { opacity: 0, x: 8 },
  animate: { opacity: 1, x: 0, transition: spring },
  exit: { opacity: 0, x: -8, transition: { duration: 0.12 } },
};

export const tooltipVariants: Variants = {
  initial: { opacity: 0, scale: 0.92, y: -4 },
  animate: { opacity: 1, scale: 1, y: 0, transition: springFast },
  exit: { opacity: 0, scale: 0.92, y: -4, transition: { duration: 0.1 } },
};

export const pulse: Variants = {
  initial: { opacity: 0.5 },
  animate: { opacity: 1, transition: { duration: 1.2, repeat: Infinity, repeatType: "reverse" as const } },
};

export const skeleton: Variants = {
  initial: { opacity: 0.5 },
  animate: { opacity: [0.5, 0.9, 0.5], transition: { duration: 1.8, repeat: Infinity } },
};

export const bounce: Variants = {
  initial: { y: 0 },
  animate: { y: [-3, 3, 0], transition: { duration: 0.5, repeat: Infinity, repeatType: "reverse" as const } },
};

export const wiggle: Variants = {
  initial: { x: 0 },
  animate: { x: [-3, 3, -3, 3, 0], transition: { duration: 0.45 } },
};
