-- CreateTable
CREATE TABLE `cortes_caja` (
    `id` VARCHAR(191) NOT NULL,
    `claseId` VARCHAR(191) NOT NULL,
    `instructorId` VARCHAR(191) NOT NULL,
    `fecha` DATETIME(3) NOT NULL,
    `totalReservaciones` INTEGER NOT NULL,
    `ingresoDirecto` DECIMAL(10, 2) NOT NULL,
    `ingresoMembresia` DECIMAL(10, 2) NOT NULL,
    `ingresoTotal` DECIMAL(10, 2) NOT NULL,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `cortes_caja_claseId_key`(`claseId`),
    INDEX `cortes_caja_fecha_idx`(`fecha`),
    INDEX `cortes_caja_instructorId_idx`(`instructorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `cortes_caja` ADD CONSTRAINT `cortes_caja_claseId_fkey` FOREIGN KEY (`claseId`) REFERENCES `classes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cortes_caja` ADD CONSTRAINT `cortes_caja_instructorId_fkey` FOREIGN KEY (`instructorId`) REFERENCES `instructors`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
