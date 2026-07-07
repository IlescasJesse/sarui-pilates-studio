export const meta = {
  name: 'analisis-alcance',
  description: 'Análisis paralelo de alcance de sesión SARUI: estado GSD, vault, monorepo, pendientes → mapa + plan',
  whenToUse: 'Al inicio de sesión o cuando Jesse pide situarse / analizar alcance',
  phases: [
    { title: 'Explorar', detail: '4 lectores paralelos' },
    { title: 'Sintetizar', detail: 'mapa de alcance + plan de delegación' },
  ],
}

const FOCUS = args && typeof args === 'string' ? args : 'estado general del proyecto'

phase('Explorar')
const lecturas = await parallel([
  () => agent(
    'Proyecto SARUI Studio en el directorio actual. Reporta: salida de `git log --oneline -15` y `git status`, ' +
    'y contenido de .planning/STATE.md (GSD activo, v0.5 Automatización Operativa). Datos crudos resumidos, sin opinar.',
    { label: 'estado-git-gsd', phase: 'Explorar', model: 'haiku' }
  ),
  () => agent(
    'Lee ~/DevVault/01-Projects/sarui/README.md completo y las últimas 15 líneas de ' +
    '~/DevVault/Decisions/DECISIONS.md. Extrae: estado según vault, decisiones que afecten a sarui ' +
    '(hay varias de 2026-05-28 sobre reservas/sesiones). Resumen denso.',
    { label: 'vault', phase: 'Explorar', model: 'haiku' }
  ),
  () => agent(
    `Explora el monorepo SARUI relevante a: "${FOCUS}". ` +
    'Dominios: clientes, clases, reservaciones, membresías, paquetes, instructores, contabilidad, kiosko, portal público. ' +
    'Stack: Express+Prisma/MySQL+Mongoose en apps backend, Next.js 15+Tailwind frontend, MercadoPago. ' +
    'Devuelve: archivos clave, estado de esa área, deuda visible.',
    { label: 'codebase', phase: 'Explorar', model: 'sonnet' }
  ),
  () => agent(
    'Busca en SARUI (directorio actual, excluye node_modules): TODOs, FIXMEs, archivos sin commitear. Lista priorizada corta.',
    { label: 'pendientes', phase: 'Explorar', model: 'haiku' }
  ),
])

phase('Sintetizar')
const mapa = await agent(
  'Eres el orquestador de SARUI Studio (gestión pilates: reservas, membresías, pagos MercadoPago). ' +
  `Foco de la sesión: "${FOCUS}". Con estos hallazgos:\n\n` +
  lecturas.filter(Boolean).join('\n\n---\n\n') +
  '\n\nProduce: ## Alcance detectado (2-3 líneas) · ## Riesgos/lógica de negocio (sesiones por tipoActividad, estados de reserva, pagos) · ' +
  '## Plan de delegación (tabla: tarea | subagente | modelo de [haiku, sonnet, opus, fable]) · ' +
  '## Siguiente paso recomendado (UNA acción). Español, denso.',
  { label: 'sintesis', phase: 'Sintetizar', model: 'opus' }
)

return mapa
