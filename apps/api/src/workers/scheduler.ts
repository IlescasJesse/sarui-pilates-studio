import cron from 'node-cron';
import { prisma } from '../config/database';

export type JobFn = () => Promise<void>;

interface JobDefinition {
  name: string;
  schedule: string; // cron expression
  fn: JobFn;
  timezone?: string;
}

const TIMEZONE = 'America/Mexico_City';

export function registerJob(job: JobDefinition): void {
  if (!cron.validate(job.schedule)) {
    console.error(`[scheduler] Invalid cron expression for job "${job.name}": ${job.schedule}`);
    return;
  }

  cron.schedule(
    job.schedule,
    async () => {
      const startMs = Date.now();
      const logId = await prisma.jobLog.create({
        data: { jobName: job.name, status: 'RUNNING' },
        select: { id: true },
      });

      try {
        await job.fn();
        await prisma.jobLog.update({
          where: { id: logId.id },
          data: { status: 'SUCCESS', durationMs: Date.now() - startMs },
        });
        console.log(`[scheduler] ${job.name} completed in ${Date.now() - startMs}ms`);
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        await prisma.jobLog.update({
          where: { id: logId.id },
          data: { status: 'ERROR', durationMs: Date.now() - startMs, error: errMsg },
        });
        console.error(`[scheduler] ${job.name} FAILED:`, errMsg);
      }
    },
    { timezone: job.timezone ?? TIMEZONE }
  );

  console.log(`[scheduler] Registered "${job.name}" → ${job.schedule} (${job.timezone ?? TIMEZONE})`);
}

export async function runJobNow(jobName: string, fn: JobFn): Promise<{ success: boolean; durationMs: number; error?: string }> {
  const startMs = Date.now();
  const logId = await prisma.jobLog.create({
    data: { jobName, status: 'RUNNING' },
    select: { id: true },
  });

  try {
    await fn();
    const durationMs = Date.now() - startMs;
    await prisma.jobLog.update({
      where: { id: logId.id },
      data: { status: 'SUCCESS', durationMs },
    });
    return { success: true, durationMs };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    const durationMs = Date.now() - startMs;
    await prisma.jobLog.update({
      where: { id: logId.id },
      data: { status: 'ERROR', durationMs, error: errMsg },
    });
    return { success: false, durationMs, error: errMsg };
  }
}
