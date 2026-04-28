-- AlterTable
ALTER TABLE `classes` ADD COLUMN `tipoActividadId` VARCHAR(191) NULL,
    MODIFY `type` ENUM('FLOW', 'POWER', 'MOBILITY', 'MAT') NULL,
    MODIFY `subtype` ENUM('REFORMER', 'MAT') NULL;

-- AlterTable
ALTER TABLE `packages` ADD COLUMN `tipoActividadId` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `tipos_actividad` (
    `id` VARCHAR(191) NOT NULL,
    `nombre` VARCHAR(191) NOT NULL,
    `descripcion` VARCHAR(191) NULL,
    `modalidad` ENUM('SESION_UNICA', 'POR_PAQUETE') NOT NULL,
    `sesiones` INTEGER NULL,
    `costo` DECIMAL(10, 2) NOT NULL,
    `color` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `tipos_actividad_isActive_idx`(`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `packages` ADD CONSTRAINT `packages_tipoActividadId_fkey` FOREIGN KEY (`tipoActividadId`) REFERENCES `tipos_actividad`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `classes` ADD CONSTRAINT `classes_tipoActividadId_fkey` FOREIGN KEY (`tipoActividadId`) REFERENCES `tipos_actividad`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
