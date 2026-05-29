export async function healthPingJob(): Promise<void> {
  // Canary job: runs daily at 00:01 to confirm scheduler is alive.
  // Future phases will register real jobs alongside this one.
  console.log(`[health-ping] Scheduler alive at ${new Date().toISOString()}`);
}
