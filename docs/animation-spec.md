# Spec de microinteracciones — SARUI (B1)

> Estado: **spec de diseño — NADA implementado**. Ejecuta `sarui-ui-animation` tras aprobación de Jesse.
> Complementa `docs/animaciones-microinteracciones.md` (base conceptual). Este documento es el **catálogo operativo por interacción**.
> Paleta fija: verde `#254F40` / `#1d3d32` (hover), crema `#F6FFB5`, fondo crema `#FDFFEC`. No se cambia; solo se proponen ajustes de jerarquía/contraste con esos tonos.

Principio rector: **sutil y profesional**. Escala `0.98`–`1.02`, fades, slides `≤8px`. Cero bounce exagerado. Movimiento tipo pilates: fluido, controlado, `easeOut`.

---

## 1. Tokens de movimiento (sistema, no zoo)

Un solo sistema reutilizable. **2 easings, 4 duraciones, 1 spring.** No inventar valores sueltos.

### Duraciones

| Token | Valor | Uso |
|---|---|---|
| `instant` | `100ms` | Tap/toggle, feedback táctil (whileTap) |
| `quick` | `200ms` | Hover, tooltip, validación inline, lightbox overlay, badges |
| `smooth` | `350ms` | Modal/dialog, drawer, card reveal, transición de estado |
| `calm` | `500ms` | Hero, scroll reveals de sección, confirmación (celebración) |

### Easings (solo dos)

| Token | Curva (cubic-bezier) | Uso |
|---|---|---|
| `ease-out` | `[0.22, 1, 0.36, 1]` (ease-out expo suave) | Default para todo: entradas, hovers, reveals |
| `ease-in-out` | `[0.4, 0, 0.2, 1]` | Loops continuos (orbs hero, chevron), salidas |

### Spring (un único preset)

| Token | Params | Uso |
|---|---|---|
| `spring-calm` | `{ type: "spring", stiffness: 120, damping: 20, mass: 0.9 }` | Confirmación de reserva, entrada de cliente seleccionado. Único spring permitido. |

### Stagger

| Token | Valor |
|---|---|
| `stagger` | `staggerChildren: 0.05` (50ms), `máx 8 items` animados |

> **Regla de frecuencia:** interacciones frecuentes (hover de botón, tap, filtros de tabla) usan `instant`/`quick` (≤200ms). Nada >400ms en algo que el usuario dispara muchas veces por sesión.

---

## 2. Dialog de clase en calendario (gestión)

Ref: `apps/web/src/components/clases/CalendarioClases.tsx`. Estados reales: `selectedClaseId` (apertura), `loadingDetalle`, `selectedCliente`, `showNewClientForm`, `editandoInstructor`, `reservaOk`, mutaciones `reservarMutation`/`crearClienteMutation`/`cambiarInstructorMutation`.

### 2.1 Apertura / cierre del Dialog

| Elemento | Trigger | Animación | Duración | Easing | Notas |
|---|---|---|---|---|---|
| Overlay | open/close (`selectedClaseId`) | `opacity` 0→1 | `quick` 200ms | ease-out | Backdrop. Sin blur animado (costo). |
| Panel DialogContent | open | `opacity` 0→1 + `scale` 0.98→1 + `y` 8→0 | `smooth` 350ms | ease-out | Protagonista único de la vista. Sin slide largo. |
| Panel | close (exit) | `opacity` 1→0 + `scale` 1→0.98 | `quick` 200ms | ease-in-out | Salida más rápida que entrada (regla UX). Requiere `AnimatePresence` o data-state de Radix. |

### 2.2 Carga del detalle (skeleton → contenido)

| Elemento | Trigger | Animación | Duración | Easing | Notas |
|---|---|---|---|---|---|
| Spinner detalle | `loadingDetalle` | `opacity` fade-out al resolver | `quick` 200ms | ease-out | Ya existe spinner CSS; solo cross-fade al contenido. |
| Cuerpo del dialog | datos listos | `opacity` 0→1 + `y` 6→0 | `smooth` 350ms | ease-out | Un solo fade del bloque, **no** stagger de cada campo (sobreanimación). |

### 2.3 Autocomplete de clientes

| Elemento | Trigger | Animación | Duración | Easing | Notas |
|---|---|---|---|---|---|
| Lista de resultados (`clienteResults`) | `debouncedSearch≥2` con resultados | contenedor `opacity` 0→1 + `y` 4→0; items con `stagger` 50ms | `quick` 200ms | ease-out | Máx 8 items animados (el query ya limita a 10 → animar primeros 8, resto sin delay). Variant `listReveal`. |
| Item de resultado | hover | `backgroundColor` a `#254F40/5` (ya en clase) | `quick` 200ms | ease-out | Ya implementado vía Tailwind `transition-colors`. Mantener. |
| Item de resultado | tap/select | `instant` scale 0.99 en click | `instant` 100ms | ease-out | Confirma selección antes del cambio de estado. |
| Bloque "sin coincidencias" | `clienteResults=0` | `opacity` 0→1 + `y` 4→0 | `quick` 200ms | ease-out | Ya tiene initial/animate en código (líneas 558-561) — alinear a token. |
| Form nuevo cliente | `showNewClientForm` true | `opacity` 0→1 + `height` auto (layout) | `smooth` 350ms | ease-out | **Excepción autorizada a "solo transform"**: expand de altura usa `height:auto` de framer (layout). Único caso; está acotado y poco frecuente. Alternativa barata: `grid-template-rows 0fr→1fr` CSS. |

### 2.4 Cliente seleccionado (transición de estado búsqueda → seleccionado)

| Elemento | Trigger | Animación | Duración | Easing | Notas |
|---|---|---|---|---|---|
| Card de cliente + selector membresía | `selectedCliente` set | `opacity` 0→1 + `y` 6→0 | `spring-calm` | spring | Entrada con presencia (transición clave del flujo). Ya tiene initial/animate (línea 639) → cambiar a spring-calm. |
| Lista de resultados | al seleccionar | colapsa (unmount inmediato vía condición) | `quick` 200ms exit | ease-in-out | Envolver en `AnimatePresence` para que salga con fade, no corte seco. |

### 2.5 Barra de capacidad

| Elemento | Trigger | Animación | Duración | Easing | Notas |
|---|---|---|---|---|---|
| Fill de barra | mount / cambio de `spotsBooked` | `transform: scaleX` 0→ratio (origin-left) | `calm` 500ms | ease-out | **Cambiar `width%` (línea 452, transition-all) por `scaleX`** — width no es propiedad de compositor. `scaleX = spotsBooked/capacity`, `transformOrigin: left`. |
| Fill (color lleno) | `disponibles<=0` | `backgroundColor` →`#ef4444` | `quick` 200ms | ease-out | Cross-fade de color, no salto. |
| Texto "Llena/disponibles" | cambio de valor | `opacity` quick fade en re-render | `quick` 200ms | ease-out | Opcional; comunica cambio sin depender solo del color. |

### 2.6 Edición inline (instructor / horario)

| Elemento | Trigger | Animación | Duración | Easing | Notas |
|---|---|---|---|---|---|
| Switch lectura→edición (`editandoInstructor`) | tap lápiz | cross-fade `opacity` entre vista y `<select>` | `quick` 200ms | ease-out | `AnimatePresence mode="wait"`. No animar layout shift agresivo. |
| Botón "Guardar" | `cambiarInstructorMutation.isPending` | spinner inline + label "Guardando…"; al success cross-fade a estado lectura | `quick` 200ms | ease-out | Feedback de mutación (ver §3). |
| Vista lectura tras guardar | onSuccess | `opacity` 0→1 + `y` 4→0 | `smooth` 350ms | ease-out | Confirma que el cambio se aplicó. |

### 2.7 Éxito de reserva (`reservaOk`) — celebración controlada

| Elemento | Trigger | Animación | Duración | Easing | Notas |
|---|---|---|---|---|---|
| Bloque éxito | `reservaOk` true | `opacity` 0→1 + `scale` 0.96→1 | `spring-calm` | spring | Ya existe (líneas 501-505) con scale 0.9 → **subir a 0.96** (regla 0.98-1.02 admite 0.96 para momento celebración). |
| Ícono CheckCircle | dentro del bloque | `scale` 0.8→1 con delay 80ms respecto al bloque | `spring-calm` | spring | Protagonista del momento. Un único elemento con énfasis. |
| Texto confirmación | — | `opacity` 0→1 delay 120ms | `quick` 200ms | ease-out | Stagger ligero descendente. |

---

## 3. Microinteracciones globales de gestión

### 3.1 Botones

| Elemento | Trigger | Animación | Duración | Easing | Notas |
|---|---|---|---|---|---|
| Botón primario (verde) | hover | `scale` 1→1.02 + sombra sutil | `quick` 200ms | ease-out | `whileHover`. Sutil. |
| Botón primario | tap | `scale` 1→0.98 | `instant` 100ms | ease-out | `whileTap`. Feedback táctil. |
| Botón link/icono | hover | `opacity`/`color` shift (ya en código) | `quick` 200ms | ease-out | Mantener `transition-colors` Tailwind. |

### 3.2 Cards

| Elemento | Trigger | Animación | Duración | Easing | Notas |
|---|---|---|---|---|---|
| Card interactiva | hover | `y` 0→-2 + sombra | `quick` 200ms | ease-out | Solo cards clicables. Tablas de staff: **sin** hover-lift (menos es más). |
| Fila de tabla (dashboard) | hover | `backgroundColor` muted | `quick` 200ms | ease-out | CSS puro (`hover:bg-muted/40`). Nada de JS aquí. |

### 3.3 Feedback de mutaciones (loading → success / error)

Patrón único reutilizable para toda mutación de React Query (`isPending`/`isSuccess`/`isError`).

| Estado | Animación | Duración | Easing | Notas |
|---|---|---|---|---|
| `isPending` | botón: label→"…"+spinner inline; `opacity` 0.7; disabled | `quick` 200ms | ease-out | No spinner de pantalla completa para mutaciones puntuales. |
| `isSuccess` (en sitio) | cross-fade a check verde `#254F40`/emerald breve, luego reset | `smooth` 350ms | ease-out | Confirma "se registró". Para reserva usar el bloque §2.7. |
| `isError` | mensaje de error: `opacity` 0→1 + `y` 4→0 (sin shake) | `quick` 200ms | ease-out | **Sin shake/vibración** (rompe identidad calma). Color destructive comunica el error, no el movimiento. |

> Ya hay `alert()` en errores de reserva (líneas 271-275) — fuera de alcance de animación; recomendación: migrar a toast con esta entrada `opacity+y`.

### 3.4 Badges de estado

| Elemento | Trigger | Animación | Duración | Easing | Notas |
|---|---|---|---|---|---|
| Badge de estado (Confirmada/Pendiente/Cancelada) | mount / cambio de status | `opacity` 0→1 + `scale` 0.95→1 | `quick` 200ms | ease-out | Solo al cambiar; no animar en cada render de lista. |
| Badge nueva reservación en lista | item agregado tras reserva | entrada `opacity` 0→1 + `y` -4→0 | `smooth` 350ms | ease-out | `AnimatePresence` en `claseDetalle.reservations`, máx 8 con stagger. |

---

## 4. Landing

Ref: `apps/web/src/components/landing/*.tsx`. Hero y Galería ya usan framer-motion; el spec **normaliza a tokens** y completa secciones.

### 4.1 Hero (`HeroSection.tsx`)

| Elemento | Trigger | Animación | Duración | Easing | Notas |
|---|---|---|---|---|---|
| Título "sarui" | mount | `opacity` 0→1 + `y` 40→0 | `calm` 500ms (act. 1s) | ease-out `[0.22,1,0.36,1]` | Ya existe (línea 67). Reducir 1s→~600ms para no retrasar. Primer item del stagger. |
| Subtítulo "Pilates Studio" | mount, delay 0.5 | `opacity` 0→1 | `calm` | ease-out | Mantener cadena de delays como stagger manual. |
| Divisor (línea) | mount, delay 0.65 | `scaleX` 0→1 (origin-left) | `smooth` 350ms | ease-out | Ya usa scaleX (línea 88) — correcto, propiedad de compositor. |
| Frase + CTA + stats | mount, delays escalonados | `opacity`+`y` 12→0 | `calm` | ease-out | Convertir cadena de delays manuales a **variant `staggerContainer`** con `staggerChildren:0.15` para mantenibilidad. |
| Stats (3 números) | mount | fade del grupo (no contador animado) | `calm` | ease-out | No animar count-up (innecesario, distrae). |
| CTA "Agendar clase" | hover | `y` -2 + sombra crema (ya en clases Tailwind) | `quick` 200ms | ease-out | Mantener `hover:-translate-y-0.5`; alinear a -2px. Flecha `translate-x-1` ya OK. |
| Orbs de fondo | loop | `y/x/scale` lentos | 8-14s | ease-in-out | Ya existe. **Desactivar en reduced-motion** (5 elementos animando = costo). |
| Chevron "Descubrir" | loop | `y` [0,7,0] | 1.8s | ease-in-out | Ya existe. Desactivar en reduced-motion. |

### 4.2 Scroll reveals por sección

| Elemento | Trigger | Animación | Duración | Easing | Notas |
|---|---|---|---|---|---|
| Header de sección (eyebrow+título) | `whileInView` (`once:true`, amount 0.2) | `opacity` 0→1 + `y` 16→0 | `calm` 500ms | ease-out | Patrón único `sectionReveal` para Beneficios, Tipos, Precios, Nosotros, Ubicación, Galería. Galería ya lo hace (línea 51) — extraer a variant compartida. |
| Grid de items (clases/precios/beneficios) | `whileInView` | `opacity` 0→1 + `y` 24→0, `stagger` 50-80ms | `smooth` 350ms | ease-out | Máx 8 con delay; resto entra junto. Galería usa `delay:i*0.08` (línea 82) — convertir a `staggerChildren` para no animar >8 con delays crecientes. |
| Imagen de galería | hover | `scale` 1→1.05 + overlay oscuro | `calm` 500ms / `quick` overlay | ease-out | Ya existe (CSS, líneas 89-91). Correcto y barato. Mantener. |

### 4.3 Galería lightbox (`GaleriaSection.tsx`)

| Elemento | Trigger | Animación | Duración | Easing | Notas |
|---|---|---|---|---|---|
| Overlay lightbox | abrir (`selected!=null`) | `opacity` 0→1 | `quick` 200ms | ease-out | Ya existe (línea 101-106). Correcto. |
| Imagen principal | abrir / navegar | `opacity` 0→1 + `scale` 0.98→1 | `smooth` 350ms | ease-out | Falta: actualmente la imagen cambia sin transición. Envolver en `AnimatePresence mode="wait"` con `key={selected}` → cross-fade al navegar. |
| Navegación prev/next | tap flecha | imagen sale `opacity`→0 `x` ∓8, entra opuesta | `smooth` 350ms | ease-out | Slide direccional ≤8px indica dirección. Custom `direction` en variant. |
| Thumbnail activa | cambio de `selected` | ring crema (ya CSS `ring-[#F6FFB5]`) + `opacity` | `quick` 200ms | ease-out | Ya existe (líneas 160-164). Mantener. `scrollIntoView` ya implementado. |
| Botones close/prev/next | hover | `backgroundColor` white/10→/20 (ya CSS) | `quick` 200ms | ease-out | Mantener. |

### 4.4 CTA hovers (global landing)

| Elemento | Trigger | Animación | Duración | Easing | Notas |
|---|---|---|---|---|---|
| Botón crema (CTA principal) | hover | `y` -2 + sombra `#F6FFB5/20` + flecha `x`+4 | `quick` 200ms | ease-out | Ya en Hero; replicar patrón en CTAs de Precios/Reservaciones. |
| Nav links (`LandingNav`) | hover | `color`/underline | `quick` 200ms | ease-out | CSS puro. |

---

## 5. Variants framer-motion reutilizables (nombres sugeridos)

Definir una vez en `apps/web/src/lib/motion.ts` (módulo de tokens + variants) y reutilizar. Mantiene el sistema consistente y minimiza `"use client"`.

| Variant | Propósito | Estados |
|---|---|---|
| `tokens` | export de duraciones/easings/spring | objeto constante (no variant) |
| `dialogPanel` | apertura/cierre de Dialog | `hidden` / `visible` / `exit` (scale+opacity+y) |
| `overlayFade` | backdrops y lightbox overlay | `hidden`/`visible`/`exit` opacity |
| `fadeInUp` | reveal genérico (slide ≤8px) | `hidden`(y:6,opacity:0)/`visible` |
| `sectionReveal` | header de sección scroll | `hidden`(y:16)/`visible`, calm |
| `staggerContainer` | padre de listas/hero | `visible:{transition:{staggerChildren:0.05}}` |
| `staggerItem` | hijo de stagger | `hidden`(y:8,opacity:0)/`visible` |
| `listReveal` | resultados autocomplete | container + item (reusa stagger) |
| `successPop` | confirmación de reserva | `hidden`(scale:0.96)/`visible` spring-calm |
| `capacityBar` | fill barra de capacidad | `scaleX` custom por ratio, origin-left |
| `crossFade` | switch lectura↔edición, imagen lightbox | `mode="wait"` opacity |
| `lightboxImage` | navegación direccional | custom `direction` → x ∓8 + opacity |

Helper recomendado: hook `useMotionTokens()` que devuelve variants ya neutralizados si `useReducedMotion()` es true (ver §6).

---

## 6. Accesibilidad — `prefers-reduced-motion` (obligatorio en TODO)

Regla dura: **toda** interacción de este spec respeta `useReducedMotion()` (framer) o `motion-reduce:` (Tailwind/CSS). Nada esencial se comunica solo por movimiento.

### Reglas

1. **Estado final siempre visible sin movimiento.** Con reduced-motion, los elementos aparecen en su estado `visible` (opacity 1, sin transform) — fade `opacity` ≤150ms permitido, sin `y`/`scale`/`x`.
2. **Sin loops ambientales.** Orbs del hero y chevron "Descubrir": detener (`animate` estático) en reduced-motion.
3. **Cambios de estado legibles sin animación:**
   - Barra de capacidad: el `scaleX` salta al valor final; el texto "Llena / N disponibles" y el color comunican el estado (no depende del movimiento).
   - Éxito de reserva: el bloque + ícono + texto aparecen estáticos; el copy "¡Reservación creada!" comunica el éxito.
   - Badges de estado: color + texto, no la animación de entrada.
   - Errores: color destructive + mensaje textual; nunca shake.
4. **Lightbox:** navegación instantánea (corte/fade ≤150ms), sin slide direccional. La dirección la da el contador `N / total` y las flechas.
5. **Scroll reveals:** con reduced-motion, contenido visible de inmediato (sin `whileInView` transform) para no ocultar información tras animaciones que no correrán.

### Implementación esperada (para `sarui-ui-animation`)

- Hook `useMotionTokens()`: si `useReducedMotion()` → variants con solo `opacity`, duración `≤0.15s`, sin `transform`; springs degradados a tween corto.
- En `motion.ts`, factoría que recibe `reduced:boolean` y devuelve el set neutralizado.
- Tailwind: usar `motion-reduce:transition-none motion-reduce:transform-none` en utilidades CSS (hover-lift, scale de galería).
- Loops (orbs/chevron): condicionar `animate` a `!reduced`.

### Presupuesto de performance

- Solo `transform` + `opacity` (compositor). **Corrección pendiente confirmada:** barra de capacidad debe pasar de `width%` a `scaleX` (§2.5).
- Única excepción de layout: expand de form "nuevo cliente" (§2.3) — acotada, baja frecuencia.
- Máx 1 protagonista en movimiento por vista. Máx 8 items con stagger.
- Interacciones frecuentes ≤200ms (regla §1).
- Objetivo 60fps en gama baja.
