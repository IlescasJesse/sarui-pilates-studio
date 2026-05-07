# Phase 3: Página de Ayuda en Dashboard - Context

**Gathered:** 2026-05-06
**Status:** Ready for planning

<domain>
## Phase Boundary

Crear sección de ayuda/soporte integrada en el dashboard con manuales para staff (admin/staff) y clientes. La página vive dentro del dashboard como página de ayuda, no PDFs externos. Contenido real, no scaffolds.

**In scope:**
- Link "Ayuda" en sidebar del dashboard
- Página con tabs para navegar entre manual admin y manual cliente
- Manual admin: gestión clientes, clases, membresías, reservaciones
- Manual cliente: reservar clases, pagar, cancelar
- Input de filtro para búsqueda en tiempo real
- Contenido con colores de marca `#254F40`, `#F6FFB5`, `#FDFFEC`

**Out of scope:**
- PDFs externos — la documentación vive dentro de la app
- Email notifications de ayuda
- Videos o multimedia embebidos
- Sección de ayuda en portal público (solo dashboard admin)

</domain>

<decisions>
## Implementation Decisions

### Navigation
- **D-01:** Navegación mediante **Tabs** en la misma página: "Manual Admin" | "Manual Cliente"
- **D-02:** El link "Ayuda" va en el sidebar del dashboard (`Sidebar.tsx`), visible para admin y staff

### Content Format
- **D-03:** Contenido como **componentes React** (`.tsx`) usando shadcn/ui (Card, Accordion) — no MDX
- **D-04:** Cada sección del manual usa `Accordion` de shadcn/ui para colapsar/expandir
- **D-05:** Iconos de `lucide-react` para decorar secciones (ej. usuarios, calendario, dinero)

### Search
- **D-06:** **Input filtro** en la parte superior — filtra secciones visibles en tiempo real por texto
- **D-07:** El filtro busca en títulos de secciones y contenido visible (texto plano dentro de los Accordions)

### Content Scope
- **D-08:** **Contenido real** completo, no scaffolds ni placeholders
- **D-09:** Manual Admin cubre: gestión de clientes, clases, instructores, membresías, paquetes, reservaciones
- **D-10:** Manual Cliente cubre: cómo reservar clases, pagar con MercadoPago, cancelar reservación, ver membresía

### Styling
- **D-11:** Colores de marca usados directamente como hex literals en Tailwind: `#254F40` (primary), `#F6FFB5` (accent), `#FDFFEC` (background)
- **D-12:** Animaciones de entrada con `framer-motion` (`motion.div`) para los tabs y secciones

### the agent's Discretion
- Estructura exacta de los componentes React para cada sección del manual
- Si usar un solo archivo `page.tsx` con ambos manuales o separar en componentes por sección
- Lógica del filtro de búsqueda (useMemo, useState, o hook custom)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Navigation & Layout
- `apps/web/src/components/layout/Sidebar.tsx` — Donde agregar el link "Ayuda"
- `apps/web/src/app/(dashboard)/layout.tsx` — Auth guard y estructura del dashboard

### Page Structure
- `apps/web/src/app/(dashboard)/` — Donde crear `ayuda/` directory con `page.tsx`
- `apps/web/src/components/` — Componentes de dominio que pueden reusarse o servir de patrón

### UI Components (shadcn/ui)
- `apps/web/src/components/ui/card.tsx` — Para secciones de contenido
- `apps/web/src/components/ui/accordion.tsx` — Para colapsar/expandir secciones
- `apps/web/src/components/ui/input.tsx` — Para el campo de búsqueda/filtro
- `apps/web/src/components/ui/tabs.tsx` — Para navegación Admin/Cliente
- `apps/web/src/components/ui/badge.tsx` — Para etiquetas de sección

### Styling & Patterns
- `.planning/codebase/CONVENTIONS.md` — Brand colors, Tailwind patterns, "use client" directive
- `.planning/codebase/STACK.md` — Next.js App Router, React, framer-motion, lucide-react

### Roadmap
- `ROADMAP.md` — Phase 3 entry (líneas 41-57) con success criteria y notas

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **shadcn/ui components**: Card, Accordion, Input, Tabs, Badge — todos en `apps/web/src/components/ui/`, listos para usar
- **lucide-react**: Iconos ya en uso en el proyecto (`User`, `Calendar`, `CreditCard`, etc.)
- **framer-motion**: `motion` y `AnimatePresence` ya usados para transiciones de tabs/panels

### Established Patterns
- **"use client"** directive en todas las páginas interactivas
- **Tailwind inline classes** con colores de marca como hex literals (`bg-[#254F40]`, `text-[#F6FFB5]`)
- **TanStack Query** para server state; React `useState` para UI local (el filtro de búsqueda usa useState)
- **Componentes de dominio** en `apps/web/src/components/{domain}/` — el manual puede seguir este patrón

### Integration Points
- **Sidebar.tsx**: Agregar link "Ayuda" con icono de `HelpCircle` de lucide-react
- **`(dashboard)/ayuda/page.tsx`**: Nueva página con Tabs, Input filtro, y Accordions
- **Navegación**: Los tabs cambian entre `<ManualAdmin />` y `<ManualCliente />` components

</code_context>

<specifics>
## Specific Ideas

- El filtro de búsqueda podría tener un icono de `Search` de lucide-react a la izquierda del input
- Cada sección del manual puede tener un icono representativo (ej. `Users` para gestión de clientes, `Calendar` para clases)
- Los manuales deben estar escritos en **español** (como el resto del dominio)
- Considerar usar `Badge` para etiquetas como "Admin", "Staff", "Cliente" en las secciones según a quién aplica

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-ayuda-dashboard*
*Context gathered: 2026-05-06*
