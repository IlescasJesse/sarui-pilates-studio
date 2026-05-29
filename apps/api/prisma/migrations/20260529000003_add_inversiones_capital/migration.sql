-- CreateTable
CREATE TABLE `inversiones_capital` (
    `id` VARCHAR(191) NOT NULL,
    `concepto` VARCHAR(191) NOT NULL,
    `montoTotal` DECIMAL(10, 2) NOT NULL,
    `fecha` DATETIME(3) NOT NULL,
    `categoria` ENUM('EQUIPO', 'LOCAL', 'REMODELACION', 'TECNOLOGIA', 'OTRO') NOT NULL,
    `notas` VARCHAR(191) NULL,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `inversiones_capital_fecha_idx`(`fecha`),
    INDEX `inversiones_capital_categoria_idx`(`categoria`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pagos_inversion` (
    `id` VARCHAR(191) NOT NULL,
    `inversionId` VARCHAR(191) NOT NULL,
    `monto` DECIMAL(10, 2) NOT NULL,
    `fecha` DATETIME(3) NOT NULL,
    `nota` VARCHAR(191) NULL,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `pagos_inversion_inversionId_idx`(`inversionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `pagos_inversion` ADD CONSTRAINT `pagos_inversion_inversionId_fkey` FOREIGN KEY (`inversionId`) REFERENCES `inversiones_capital`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
