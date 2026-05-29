-- CreateTable
CREATE TABLE `inventario` (
    `id` VARCHAR(191) NOT NULL,
    `nombre` VARCHAR(191) NOT NULL,
    `categoria` ENUM('EQUIPAMIENTO', 'CONSUMIBLE', 'LIMPIEZA', 'ADMINISTRATIVO') NOT NULL,
    `cantidad` INTEGER NOT NULL,
    `stockMinimo` INTEGER NOT NULL DEFAULT 0,
    `unidad` VARCHAR(191) NOT NULL,
    `alerta` BOOLEAN NOT NULL DEFAULT false,
    `ultimaActualizacion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `inventario_categoria_idx`(`categoria`),
    INDEX `inventario_alerta_idx`(`alerta`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `movimientos_inventario` (
    `id` VARCHAR(191) NOT NULL,
    `inventarioId` VARCHAR(191) NOT NULL,
    `tipo` ENUM('ENTRADA', 'SALIDA', 'AJUSTE') NOT NULL,
    `cantidad` INTEGER NOT NULL,
    `nota` VARCHAR(191) NULL,
    `usuarioId` VARCHAR(191) NOT NULL,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `movimientos_inventario_inventarioId_idx`(`inventarioId`),
    INDEX `movimientos_inventario_creadoEn_idx`(`creadoEn`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `movimientos_inventario` ADD CONSTRAINT `movimientos_inventario_inventarioId_fkey` FOREIGN KEY (`inventarioId`) REFERENCES `inventario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `movimientos_inventario` ADD CONSTRAINT `movimientos_inventario_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
