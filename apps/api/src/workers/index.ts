import { registerJob } from './scheduler';
import { healthPingJob } from './jobs/health-ping.job';
import { generarHorarioJob } from './jobs/generar-horario.job';
import { corteDeCajaJob } from './jobs/corte-de-caja.job';
import { revisarStockJob } from './jobs/revisar-stock.job';

export function initScheduler(): void {
  console.log('[scheduler] Initializing jobs...');

  // Canary: runs daily at 00:01 Mexico City time
  registerJob({
    name: 'health-ping',
    schedule: '1 0 * * *',
    fn: healthPingJob,
  });

  // Phase 19: every Saturday at 23:59 Mexico City time
  registerJob({
    name: 'generar-horario',
    schedule: '59 23 * * 6',
    fn: generarHorarioJob,
  });

  // Phase 20: daily at 23:30 Mexico City time
  registerJob({
    name: 'corte-de-caja',
    schedule: '30 23 * * *',
    fn: corteDeCajaJob,
  });

  // Phase 22: daily at 08:00 Mexico City time
  registerJob({
    name: 'revisar-stock',
    schedule: '0 8 * * *',
    fn: revisarStockJob,
  });

  // Phase 21: comisiones-mensuales will be registered here

  console.log('[scheduler] All jobs registered.');
}
