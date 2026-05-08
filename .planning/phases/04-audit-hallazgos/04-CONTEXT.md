# Phase 4: Audit & Reporte de Hallazgos — Context

**Gathered:** 2026-05-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Investigar y documentar bugs, áreas grises, y deuda técnica encontrados durante la ejecución de las fases 1-3. Producir un reporte estructurado con hallazgos clasificados por severidad y recomendaciones de trabajo futuro.

No incluye implementación de fixes — solo documentación. Los fixes se priorizarán en fases posteriores.
</domain>

<decisions>
## Implementation Decisions

### Formato del Reporte
- **D-01:** El reporte se escribirá como `HALLASGOS.md` en la raíz del proyecto, vivo con el código.
- **D-02:** Cada hallazgo incluye: archivo + línea, descripción, impacto, severidad, y sugerencia de fix.

### Clasificación de Severidad
- **D-03:** **Critical** — error en producción / pérdida de datos / crash runtime
- **D-04:** **High** — bloquea funcionalidad / vulnerabilidad de seguridad
- **D-05:** **Medium** — problema real con workaround posible
- **D-06:** **Low** — deuda técnica / mejora / code smell

### Investigación
- **D-07:** Verificar hallazgos existentes de CONCERNS.md contra código actual
- **D-08:** Revisar código nuevo/modificado en fases 1-3 por si surgieron nuevos hallazgos
- **D-09:** Sin auditoría masiva — enfocado en lo ya identificado

### Entrega
- **D-10:** `HALLASGOS.md` con tabla resumen + detalle por hallazgo
- **D-11:** Cada hallazgo con severidad, ubicación, y recomendación
- **D-12:** Ofrecer crear GitHub issues para hallazgos High+ al final

### Claude's Discretion
- Agrupación de hallazgos por categoría (bugs, security, performance, etc.)
- Formato de tabla resumen y estructura de detalle
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Codebase Intelligence
- `.planning/codebase/CONCERNS.md` — Inventario completo de hallazgos conocidos (tech debt, bugs, security, performance, test gaps)
- `.planning/codebase/ARCHITECTURE.md` — Arquitectura del sistema para contexto
- `.planning/codebase/STACK.md` — Stack tecnológico

### Documentación de Fases Previas
- `.planning/phases/01-debug-asignacion-clases/01-SUMMARY.md` — Fix MERCADO_PAGO enum y null checks
- `.planning/phases/02-fix-calendario/02-SUMMARY.md` — Fix selección de horas en calendario
- `.planning/phases/03-ayuda-dashboard/03-01-SUMMARY.md` — Sidebar + componentes UI
- `.planning/phases/03-ayuda-dashboard/03-02-SUMMARY.md` — Página de ayuda
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `.planning/codebase/CONCERNS.md` — Análisis detallado de 20+ hallazgos ya documentados
- `HALLASGOS.md` (por crear) — Seguir estructura de CONCERNS.md como referencia

### Established Patterns
- Documentación en Markdown en el repo (misma filosofía que los planes GSD)
- Severidad clasificada con emojis/etiquetas para escaneo rápido

### Integration Points
- N/A — fase de documentación pura, sin cambios de código
</code_context>

<specifics>
## Specific Ideas

- Usar tabla resumen al inicio del documento con severidad, archivo, y hallazgo
- Secciones detalladas por categoría (similar a CONCERNS.md)
- Vincular cada hallazgo a su archivo con line number cuando sea preciso
</specifics>

<deferred>
## Deferred Ideas

- Implementación de fixes — pertenece a fases futuras post-auditoría
- Auditoría masiva de todo el codebase — fuera de alcance, fase 4 es enfocada
- GitHub issues — se ofrecerán al entregar el reporte, no antes
</deferred>

---

*Phase: 04-audit-hallazgos*
*Context gathered: 2026-05-08*
