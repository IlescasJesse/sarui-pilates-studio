import { AuditLog } from '../models/AuditLog.model'

interface AuditEntry {
  userId: string
  action: string
  entity: string
  entityId: string
  changes?: Record<string, unknown>
  ip?: string
}

export async function logAudit(entry: AuditEntry): Promise<void> {
  try {
    await AuditLog.create({ ...entry, timestamp: new Date() })
  } catch {
    // Fire and forget — audit failures must not block business logic
  }
}
