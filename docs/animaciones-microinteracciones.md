# Animaciones y microinteracciones — SARUI

> Estado: **documentación e instalación únicamente — NADA implementado aún** (2026-06-11).
> Flujo acordado: spec por `sarui-animation-designer` → aprobación de Jesse → implementación por `sarui-ui-animation`.

## Stack instalado

| Pieza | Versión | Uso |
|---|---|---|
| `framer-motion` | ^12.38 | Microinteracciones React: variants, AnimatePresence, gestures, springs. Ya usado en `(dashboard)/` |
| `tailwindcss-animate` | 1.0.7 | Utilidades CSS baratas (fade/zoom/slide) para feedback sin JS. Plugin registrado en `tailwind.config.ts` |

## Por qué microinteracciones (UX, no adorno)

Una microinteracción responde una pregunta del usuario: ¿se registró mi acción?, ¿qué cambió?, ¿a dónde fue? Tooltips, validación inline, estados de carga y confirmaciones son microinteracciones — guían y confirman, no decoran. Estructura: **trigger → reglas → feedback → loops**.

Riesgo documentado: sobreanimar daña usabilidad y accesibilidad. Más animación ≠ mejor UX. Regla SARUI: máximo 1 protagonista en movimiento por vista.

## Principios adoptados

1. **Propósito primero** — si la animación no responde una pregunta del usuario, no se hace.
2. **Identidad pilates** — movimiento fluido y controlado: springs suaves (stiffness ~120, damping ~20), easeOut. Sin bounce agresivo.
3. **Solo `transform` + `opacity`** — propiedades de compositor; nunca width/height/top/left.
4. **`prefers-reduced-motion` obligatorio** — fallback calmo con estado final visible; cambios de estado legibles sin movimiento (`useReducedMotion()` o `motion-reduce:`).
5. **"use client" mínimo** — animación vive en el componente hoja más pequeño; páginas siguen siendo server components.
6. **Tree-shaking** — en portal público usar `LazyMotion` + `domAnimation` para bundle chico.

## Tokens de movimiento

| Token | Valor | Cuándo |
|---|---|---|
| `instant` | 100ms | Tap, toggle — feedback táctil |
| `quick` | 200ms easeOut | Hover, tooltip, validación inline |
| `smooth` | 350ms easeOut | Modal, drawer, card |
| `calm` | spring(120, 20) | Entradas de página, confirmación de reserva |
| stagger | 40-60ms, máx 8 items | Listas (clases, paquetes) |

## Patrones framer-motion v12 (referencia rápida)

- **Variants** — estados nombrados compartidos padre→hijos (stagger via `staggerChildren`)
- **AnimatePresence** — mount/unmount: modales, toasts, items que salen de lista
- **whileHover / whileTap / whileInView** — feedback puntual sin estado propio
- **useMotionValue + useTransform** — valores derivados sin re-render (progress, parallax discreto)
- **layout** — transiciones de posición/tamaño automáticas (usar con moderación, costo alto)

## Prioridades cuando se implemente (orden propuesto)

1. Portal cliente: confirmación de reserva (momento de celebración), estados de pago MP (pending→approved), selección de plan
2. Validación inline de formularios (login, registro)
3. Calendario de clases: hover/selección de slots
4. Dashboard staff: transiciones discretas de tablas/filtros — mínimo movimiento

## Fuentes

- [Building Microinteractions with Framer Motion — Frontier Code](https://www.frontiercode.co.uk/blog/building-microinteractions-to-enhance-user-experience-with-framer-motion)
- [Advanced animation patterns with Framer Motion — Maxime Heckel](https://blog.maximeheckel.com/posts/advanced-animation-patterns-with-framer-motion/)
- [11 strategic animation techniques to enhance UX — Framer Blog](https://www.framer.com/blog/website-animation-examples/)
- [How to Use Microinteractions in UX — DM Letter Studio](https://dmletterstudio.com/how-to-use-microinteractions-in-ux/)
- [Micro-interaction ideas with Framer Motion — Sia Design](https://siadesign.ee/en/blog/micro-interactions-framer-motion/)
