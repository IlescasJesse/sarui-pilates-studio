-- Sync schema drift accumulated since 2026-05-29:
-- 1) UNIQUE index on payments.reference — strong idempotency guard for MercadoPago
--    webhook replays (membership.service.ts relies on P2002 from this constraint).
-- 2) tipos_actividad: drop legacy modalidad/sesiones columns (sessions are validated
--    per-class since the 2026-05-28 business decision) and align costo default.
-- 3) users.role: align enum value order with schema.prisma.

-- AlterTable
ALTER TABLE `tipos_actividad` DROP COLUMN `modalidad`,
    DROP COLUMN `sesiones`,
    MODIFY `costo` DECIMAL(10, 2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `users` MODIFY `role` ENUM('ADMIN', 'INSTRUCTOR', 'RECEPCIONISTA', 'CLIENT') NOT NULL DEFAULT 'CLIENT';

-- CreateIndex
CREATE UNIQUE INDEX `payments_reference_key` ON `payments`(`reference`);
