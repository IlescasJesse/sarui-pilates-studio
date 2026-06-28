---
phase: 23
slug: nomina-personal
status: draft
shadcn_initialized: true
preset: default / slate base / CSS variables
created: 2026-06-28
---

# Phase 23 — UI Design Contract: Módulo de Nómina y Personal

> Contrato visual e interactivo para las tres vistas admin del módulo.
> Generado por gsd-ui-researcher. Verificado contra código fuente del proyecto.

---

## Design System

| Property | Value | Source |
|----------|-------|--------|
| Tool | shadcn/ui | components.json VERIFIED |
| Style | default | components.json |
| Base color | slate | components.json |
| CSS variables | true | components.json |
| Component library | Radix UI (vía shadcn) | existing /ui components |
| Icon library | lucide-react 0.436.x | STACK.md VERIFIED |
| Font sans | Inter (var(--font-inter)) | tailwind.config.ts VERIFIED |
| Font display | Cormorant (var(--font-cormorant)) | tailwind.config.ts — solo headings decorativos |
| Border radius | --radius = 0.5rem | globals.css VERIFIED |

### Componentes shadcn ya instalados (reutilizar directamente)

`Tabs`, `Card` + `CardContent` + `CardHeader` + `CardTitle`, `Dialog`, `Badge`, `Button`, `Input`, `DropdownMenu`, `Accordion`

**No instalar nuevos componentes shadcn para esta fase.** Todo el inventario cubre los tres layouts.

---

## Layout de la Página

La fase implementa **una sola página** `(dashboard)/personal/page.tsx` con tres pestañas horizontales. Sigue el patrón de `contabilidad/page.tsx` (Tab type local + `useState`).

```
┌─ Sidebar (existente) ──────────────────────────────────────────┐
│  Nueva entrada: "Personal" → /personal  (icon: Users2)         │
└────────────────────────────────────────────────────────────────┘

┌─ main (p-6) ───────────────────────────────────────────────────┐
│  <h1> Personal y Nómina                                        │
│  <p className="text-muted-foreground text-sm"> subtítulo       │
│                                                                 │
│  <Tabs defaultValue="personal">                                 │
│    <TabsList>  Personal | Asistencia | Nómina  </TabsList>      │
│    <TabsContent value="personal">  …  </TabsContent>           │
│    <TabsContent value="asistencia">  …  </TabsContent>         │
│    <TabsContent value="nomina">  …  </TabsContent>             │
│  </Tabs>                                                        │
└────────────────────────────────────────────────────────────────┘
```

---

## Spacing Scale

Escala de 4px base. Valores declarados (consistente con el resto del proyecto):

| Token | Value | Uso en esta fase |
|-------|-------|-----------------|
| xs | 4px | Gaps entre icono y texto en celdas |
| sm | 8px | Padding interno de Badge, gap entre badges |
| md | 16px | Padding de Card, gap entre columnas de tabla |
| lg | 24px | Padding lateral del contenido (p-6 = 24px) |
| xl | 32px | Separación entre secciones dentro de un tab |
| 2xl | 48px | Separación entre header de página y tabs |

Excepciones:
- Celdas del checklist de asistencia: 44px mínimo de área táctil (height de celda), aunque el checkbox ocupa 20px — cumplir WCAG 2.5.5 touch target.
- Columnas numéricas (días, monto) en tabla de nómina: `text-right pr-4` para alineación.

---

## Typography

Fuente sans: Inter. Fuente display: Cormorant (solo h1 de página, no en tablas ni formularios).

| Role | Size | Weight | Line Height | Uso concreto |
|------|------|--------|-------------|-------------|
| Display / Page title | 24px (text-2xl) | 600 (font-semibold) | 1.2 | `<h1>` de la página |
| Heading / Card title | 16px (text-base) | 600 (font-semibold) | 1.2 | `CardTitle`, encabezados de sección |
| Body / Table cell | 14px (text-sm) | 400 (font-normal) | 1.5 | Contenido de celdas, labels de form |
| Label / Muted | 12px (text-xs) | 400 (font-normal) | 1.4 | Subtítulos, helper text, muted-foreground |

Monospace para montos en nómina: usar clase `tabular-nums` en celdas numéricas para alineación consistente en columnas de pesos.

---

## Color

Tokens del sistema ya definidos en globals.css. Se mapean directamente.

| Role | Token / Valor | Uso |
|------|--------------|-----|
| Dominant 60% | `bg-background` (#FDFFEC Ivory) | Fondo de página, fondo de celdas de tabla |
| Secondary 30% | `bg-card` / `bg-muted` | Cards de sección, header de tabla (`bg-muted/50`), sidebar nav |
| Accent 10% | `bg-accent` / `text-accent-foreground` (#F6FFB5 Chiffon) | Reservado para: celda de asistencia marcada como presente (checkbox checked), estado badge BORRADOR, fila del empleado logueado en la grilla |
| Destructive | `bg-destructive` / `text-destructive` (red-600) | Botones "Eliminar empleado" y "Eliminar puesto" únicamente |
| Success / Aprobado | `text-emerald-600` / `bg-emerald-50` | Badge estado APROBADO |
| Neutral / Pagado | `text-muted-foreground` / `bg-muted` | Badge estado PAGADO |

Accent reservado EXCLUSIVAMENTE para:
1. Celda del checklist donde `presente = true` — fondo `bg-accent/60`
2. Badge de estado `BORRADOR` (período nómina editable)
3. Fila en tabla de asistencia correspondiente al usuario autenticado

NO usar accent en botones primarios, headers de card, ni navegación.

### Badges de estado para `EstadoNomina`

| Estado | Clases |
|--------|--------|
| BORRADOR | `bg-accent text-accent-foreground border border-accent-foreground/20` |
| APROBADO | `bg-emerald-50 text-emerald-700 border border-emerald-200` |
| PAGADO | `bg-muted text-muted-foreground border border-border` |

### Badges de estado para empleado activo/inactivo

| Estado | Clases |
|--------|--------|
| Activo | `bg-emerald-50 text-emerald-700 border border-emerald-200` |
| Inactivo | `bg-muted text-muted-foreground border border-border` |

---

## Copywriting Contract

### Tab 1 — Personal (gestión de empleados)

| Elemento | Copy |
|----------|------|
| Tab label | Personal |
| Page heading | Personal y Nómina |
| Page subtitle | Gestión de empleados, asistencia semanal y cálculo de nómina |
| Primary CTA | + Agregar empleado |
| Secondary CTA (puestos) | + Nuevo puesto |
| Empty state heading (sin empleados) | Sin empleados registrados |
| Empty state body | Agrega el primer perfil de empleado para empezar a registrar asistencia y calcular nómina. |
| Empty state CTA | Agregar empleado |
| Error state (carga falla) | No se pudo cargar el personal. Verifica tu conexión e intenta de nuevo. |
| Confirmar eliminar empleado | Eliminar empleado: ¿Eliminar a {nombre}? Esta acción no se puede deshacer. |
| Confirmar eliminar puesto | Eliminar puesto: ¿Eliminar "{nombre}"? Solo se puede eliminar si no hay empleados asignados. |
| Campo puesto vacío | Sin puesto asignado |
| Toggle crear puesto inline | + Crear puesto nuevo |

### Tab 2 — Asistencia (checklist semanal)

| Elemento | Copy |
|----------|------|
| Tab label | Asistencia |
| Section heading | Registro semanal de asistencia |
| Selector de semana label | Semana del {fecha inicio} al {fecha fin} |
| Botón semana anterior | < (chevron, sin texto) |
| Botón semana siguiente | > (chevron, sin texto) |
| Encabezado de días | Lun, Mar, Mié, Jue, Vie, Sáb, Dom (abreviados 3 letras) |
| Empty state (sin personal activo) | No hay empleados activos para mostrar. |
| Tooltip celda bloqueada (empleado no puede editar días pasados) | Solo puedes marcar el día de hoy |
| Guardado exitoso | toast.success("Asistencia guardada") |
| Error al guardar | toast.error("No se pudo guardar la asistencia") |

### Tab 3 — Nómina (panel de períodos)

| Elemento | Copy |
|----------|------|
| Tab label | Nómina |
| Primary CTA | + Crear período |
| Dialog title (crear período) | Nuevo período de nómina |
| Campo fecha inicio label | Fecha de inicio |
| Campo fecha fin label | Fecha de fin |
| Botón confirmar crear | Crear período |
| Columnas de tabla | Empleado · Puesto · Días trabajados · Salario bruto · Deducciones · Neto a pagar |
| Botón aprobar nómina | Aprobar nómina |
| Confirmar aprobar | Aprobar nómina: ¿Aprobar el período del {fechaInicio} al {fechaFin}? Se registrarán {N} gastos en contabilidad. Esta acción no se puede deshacer. |
| Botón marcar pagado | Marcar como pagado |
| Confirmar marcar pagado | Marcar como pagado: ¿Confirmar que este período ya fue pagado a los empleados? |
| Empty state (sin períodos) | No hay períodos de nómina registrados. Crea el primer período para calcular los pagos del equipo. |
| Error cálculo neto | Ajuste inválido: el neto a pagar no puede ser negativo. |
| Aprobación exitosa | toast.success("Nómina aprobada — {N} gastos registrados en contabilidad") |
| Error aprobación | toast.error("No se pudo aprobar la nómina. Intenta de nuevo.") |
| Sección historial | Períodos anteriores |
| Etiqueta deducciones | Deducciones (ajuste manual) |

---

## Interaction Contracts

### Vista 1 — Gestión de Personal

**Tabla de empleados:**
- Columnas: Avatar + Nombre completo | Puesto | Salario semanal | Estado | Acciones
- Columna salario: solo visible para ADMIN (ocultar con `user.role === 'ADMIN'`)
- Fila clickable: abre `Dialog` de edición del empleado
- Acción eliminar: `DropdownMenu` con opción "Eliminar" — abre `AlertDialog` de confirmación
- Estado activo/inactivo: `Badge` — no hay toggle directo en la tabla, se edita desde el Dialog

**Dialog agregar/editar empleado:**
- Campos: Nombre, Apellido, Teléfono (opcional), Puesto (Select), Fecha de ingreso (Input type date), Activo (Checkbox)
- Puesto Select: al final de las opciones incluir "+ Crear puesto nuevo" que expande un inline form con `nombre` + `salarioSemanal` — al guardar crea el puesto y lo selecciona automáticamente
- Submit: `Button variant="default"` (bg-primary)
- Cancel: `Button variant="outline"`

**Dialog crear/editar puesto:**
- Accesible también desde botón "+ Nuevo puesto" arriba de la tabla
- Campos: Nombre del puesto, Salario semanal (MXN)
- Formato de salario: `Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" })`

### Vista 2 — Checklist de Asistencia

**Grilla:**
- Estructura: tabla `<table>` con `sticky` primera columna (nombre del empleado)
- Ancho fijo por columna de día: 56px mínimo
- Celda: `<Checkbox>` centrado — tamaño 20px — área táctil del `<td>` completa (44px)
- Celda marcada: fondo `bg-accent/60` en toda la celda (no solo el checkbox)
- Celda del día actual en la columna header: texto en `text-primary font-semibold`
- Días futuros: checkbox deshabilitado (`disabled`) — `opacity-40 cursor-not-allowed`
- Empleado no-admin mirando su propia fila: solo el día actual habilitado; los demás `disabled`
- Admin: todos los checkboxes de todas las filas habilitados
- Persistencia: `onChange` del checkbox llama a mutation TanStack Query inmediatamente (no hay botón "Guardar" en la grilla — autoguardado optimista)
- Loading state durante guardado: checkbox muestra `Loader2` 14px mientras la mutation está `isPending`

**Selector de semana:**
- Alineado a la derecha del heading de sección
- Formato: "28 jun – 4 jul 2026" (date-fns `format`)
- Flechas: `Button variant="ghost" size="icon"` con `ChevronLeft` / `ChevronRight`

### Vista 3 — Panel de Nómina

**Lista de períodos:**
- Períodos en BORRADOR arriba (ordenados por `creadoEn DESC`)
- Períodos APROBADO y PAGADO en sección colapsable "Períodos anteriores" (usa `Accordion`)
- Cada período es un `Card` con:
  - Header: rango de fechas + `Badge` de estado + botón de acción principal
  - Body: tabla de detalles `NominaDetalle`

**Tabla de detalles (dentro del Card):**
- Columnas fijas: Empleado | Puesto | Días | Bruto | Deducciones | Neto
- En estado BORRADOR: columnas Deducciones y Neto son `<Input type="number">` editables inline
- En estado APROBADO/PAGADO: todas las celdas son solo lectura (`text-right tabular-nums`)
- Fila de totales: `font-semibold bg-muted/50` al final de la tabla

**Botones de acción por período:**

| Estado | Botones visibles |
|--------|-----------------|
| BORRADOR | `Aprobar nómina` (variant="default") + `Eliminar` (variant="ghost", icon trash) |
| APROBADO | `Marcar como pagado` (variant="outline") |
| PAGADO | ninguno |

**Dialog "Crear período":**
- Dos campos de fecha: `fechaInicio` + `fechaFin` tipo `<Input type="date">`
- Validación: `fechaFin >= fechaInicio`
- Al crear, el servidor calcula automáticamente `diasTrabajados` y `netoAPagar` — el cliente no precalcula
- Mensaje informativo bajo los campos: "Se calcularán los días trabajados automáticamente según los registros de asistencia del período."

---

## Componentes shadcn a usar por vista

| Componente | Vista 1 Personal | Vista 2 Asistencia | Vista 3 Nómina |
|-----------|:-:|:-:|:-:|
| Tabs | — | — | — (tabs de página) |
| Card + CardHeader + CardContent | tabla de empleados | selector semana + grilla | cada período |
| Dialog | agregar/editar empleado, nuevo puesto | — | crear período |
| Badge | estado activo, puesto | — | estado EstadoNomina |
| Button | + Agregar empleado, save dialog | nav semana | crear período, aprobar, pagar |
| Input | campos en Dialog | — | deducciones/neto inline, fechas |
| DropdownMenu | acciones por fila (editar, eliminar) | — | — |
| Accordion | — | — | sección historial |
| AlertDialog (nativo HTML / propio) | confirmar eliminar | — | confirmar aprobar, confirmar pagado |

Nota: `AlertDialog` de shadcn no está instalado aún. Usar `Dialog` con botones de confirmación para destructive actions, o instalar `AlertDialog` (`npx shadcn add alert-dialog`).

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | button, input, card, badge, dialog, tabs, dropdown-menu, accordion | not required |
| shadcn add alert-dialog | alert-dialog (opcional, si se elige instalar) | not required — official registry |

No se usan registros de terceros. Sin vetting gate requerido.

---

## Navegación — Sidebar

Agregar entrada nueva al array `navItems` en `Sidebar.tsx`:

```
{ label: "Personal", href: "/personal", icon: Users2 }
```

Icono: `Users2` de lucide-react (distingue de `Users` ya usado para "Clientes"). Posición: después de "Instructores" en la lista.

---

## Formato de Moneda

Consistente con `contabilidad/finanzas/page.tsx`:

```typescript
function fmt(n: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);
}
```

Usar en: columna salario semanal, bruto, deducciones, neto a pagar, total de período.

---

## Estados de Carga

| Vista | Loading pattern |
|-------|----------------|
| Tab Personal | Skeleton rows (3 filas de 40px con `animate-pulse bg-muted rounded`) |
| Tab Asistencia | Spinner `Loader2` centrado en el área de la grilla |
| Tab Nómina | Skeleton cards (2 cards con altura fija y `animate-pulse`) |
| Mutation pendiente (inline) | `Loader2 className="animate-spin"` 14px dentro del botón; botón `disabled` |

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS
- [ ] Dimension 2 Visuals: PASS
- [ ] Dimension 3 Color: PASS
- [ ] Dimension 4 Typography: PASS
- [ ] Dimension 5 Spacing: PASS
- [ ] Dimension 6 Registry Safety: PASS

**Approval:** pending
