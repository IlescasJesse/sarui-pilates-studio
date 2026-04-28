---
name: Convenciones del proyecto Sarui Studio
description: Stack, patrones de API, hooks, componentes UI y decisiones de diseño del proyecto
type: project
---

## Stack web
- Next.js 16 App Router en `/apps/web`
- Tailwind CSS + Radix UI + Framer Motion + React Query
- **No MUI** — el sistema de diseño usa variables CSS propias en `globals.css`

## Paleta de colores
- Verde oscuro: `#254F40` (sidebar, botones primarios)
- Amarillo acento: `#F6FFB5` (texto sobre verde)
- Fondo: `#FDFFEC`
- Variables CSS: `--primary`, `--accent`, `--background`, `--muted`, `--border` en `globals.css`

## Cliente API
- `@/lib/api-client` exporta `apiClient` (axios instance) y helpers `get`, `post`, `put`, `patch`, `del`
- Las respuestas tienen forma `{ success: boolean, data: T }` — los datos están en `res.data.data` cuando se usa `apiClient` directo, o en `res.data` cuando se usan los helpers tipados

## Patrón de hooks
- Todos los hooks de datos en `/src/hooks/` usan `@tanstack/react-query`
- `useInstructores` usa los helpers `get`/`post`/`put`/`del` del api-client (no el `apiClient` directo)
- Los hooks de TipoActividades usan `apiClient` directo (`.post`, `.put`, `.delete`)

## Componentes UI
- `Badge` tiene variantes: `default`, `secondary`, `destructive`, `outline`, `success`, `warning`, `info`
- `Button` variantes actualizadas con colores brand explícitos `#254F40` / `#F6FFB5`
- `PaqueteForm` acepta `isOpen` (no `open`) como prop

## Clase CSS de tabla
- `.sarui-table` definida en `globals.css` — cabecera verde `#254F40` con texto `#F6FFB5`, hover amarillo tenue
- Aplicar a `<table className="w-full sarui-table">`

## Animaciones (Framer Motion)
- Todas las variantes usan springs (Emil Kowalski), no `duration` + `ease`
- Constantes: `spring`, `springFast`, `springGentle` en `animations.ts`
- Exporta: `fadeIn`, `fadeInUp`, `slideInLeft`, `slideInRight`, `scaleIn`, `scaleUp`, `staggerContainer`, `staggerContainerFast`, `staggerItem`, `staggerItemScale`, `dialogOverlay`, `dialogContent`, `tabTransition`, `tooltipVariants`, `pulse`, `skeleton`, `bounce`, `wiggle`

## Rutas del dashboard
- `(dashboard)/` layout con Sidebar + Topbar
- Sidebar apunta a: `/dashboard`, `/clientes`, `/catalogos` (Layers icon), `/membresias`, `/clases`, `/reservaciones`, `/instructores`
- `/catalogos` agrupa tipos de actividad y paquetes en tabs con animación `layoutId="tab-pill"`

## FullCalendar
- Plugins usados: `timeGridPlugin`, `dayGridPlugin`, `interactionPlugin`
- `interactionPlugin` cargado dinámicamente junto a los otros (evita SSR)
- `dateClick` handler crea slot de 1 hora y abre `NuevaClaseDialog`

**Why:** Centralizar estas convenciones evita inconsistencias entre sesiones y reduce el tiempo de onboarding en cada conversación.

**How to apply:** Antes de crear hooks, verificar si el patrón ya existe. Antes de crear formularios modales, confirmar nombres de props (e.g. `isOpen` vs `open`).
