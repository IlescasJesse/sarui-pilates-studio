# Phase 3: Página de Ayuda en Dashboard - Discussion Log

> **Audit trail only.** Do not use as input to planning, research or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-06
**Phase:** 03-ayuda-dashboard
**Areas discussed:** Navegación, Formato contenido, Búsqueda, Alcance contenido

---

## Navegación

| Option | Description | Selected |
|--------|-------------|----------|
| Tabs | Dos tabs en la misma página: Admin \| Cliente | ✓ |
| Sidebar | Sidebar dedicada en ayuda/ con secciones expandibles | |
| Páginas separadas | ayuda/admin/ y ayuda/cliente/ como rutas distintas | |

**User's choice:** Tabs
**Notes:** El usuario prefiere tabs en la misma página para cambiar rápido entre manuales.

---

## Formato contenido

| Option | Description | Selected |
|--------|-------------|----------|
| MDX editable | Archivos .mdx en /content/ que se renderizan con next-mdx-remote | |
| Componentes React | Páginas .tsx con shadcn/ui (Card, Accordion) y contenido hardcodeado | ✓ |
| Híbrido | MDX para texto largo + componentes React para secciones interactivas | |

**User's choice:** Componentes React
**Notes:** Mantiene consistencia con el resto del codebase que usa shadcn/ui.

---

## Búsqueda

| Option | Description | Selected |
|--------|-------------|----------|
| Input filtro | Campo de texto que filtra secciones visibles en tiempo real | ✓ |
| Secciones colapsables | Solo Accordion/Collapse por sección, sin búsqueda de texto | |
| Full-text search | Búsqueda sobre todo el contenido renderizado (más complejo) | |

**User's choice:** Input filtro
**Notes:** Búsqueda simple y efectiva para encontrar secciones rápido.

---

## Alcance contenido

| Option | Description | Selected |
|--------|-------------|----------|
| Contenido real | Escribir manuales completos ahora (gestión clientes, clases, membresías, reservas, portal) | ✓ |
| Scaffold | Estructura + placeholders 'TODO: escribir sección' para llenar después | |
| Híbrido | Secciones críticas completas, otras como scaffold | |

**User's choice:** Contenido real
**Notes:** El usuario quiere la ayuda completamente funcional con contenido real desde el inicio.

---

## the agent's Discretion

- Estructura exacta de los componentes React para cada sección del manual
- Si usar un solo archivo `page.tsx` con ambos manuales o separar en componentes por sección
- Lógica del filtro de búsqueda (useMemo, useState, o hook custom)

## Deferred Ideas

None — discussion stayed within phase scope
