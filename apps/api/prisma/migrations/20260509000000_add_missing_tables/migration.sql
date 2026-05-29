-- CreateTable: tipos_membresia
CREATE TABLE `tipos_membresia` (
    `id` VARCHAR(191) NOT NULL,
    `nombre` VARCHAR(191) NOT NULL,
    `descripcion` VARCHAR(191) NULL,
    `duracionDias` INTEGER NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `tipos_membresia_isActive_idx` ON `tipos_membresia`(`isActive`);

-- CreateTable: tipos_membresia_actividades
CREATE TABLE `tipos_membresia_actividades` (
    `id` VARCHAR(191) NOT NULL,
    `tipoMembresiaId` VARCHAR(191) NOT NULL,
    `tipoActividadId` VARCHAR(191) NOT NULL,
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `tipos_membresia_actividades_tipoMembresiaId_tipoActividadId_key` ON `tipos_membresia_actividades`(`tipoMembresiaId`, `tipoActividadId`);

-- AddForeignKey
ALTER TABLE `tipos_membresia_actividades` ADD CONSTRAINT `tipos_membresia_actividades_tipoMembresiaId_fkey` FOREIGN KEY (`tipoMembresiaId`) REFERENCES `tipos_membresia`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tipos_membresia_actividades` ADD CONSTRAINT `tipos_membresia_actividades_tipoActividadId_fkey` FOREIGN KEY (`tipoActividadId`) REFERENCES `tipos_actividad`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable: solicitudes_cuenta
CREATE TABLE `solicitudes_cuenta` (
    `id` VARCHAR(191) NOT NULL,
    `nombre` VARCHAR(191) NOT NULL,
    `apellido` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `telefono` VARCHAR(191) NOT NULL,
    `mensaje` TEXT NULL,
    `status` ENUM('PENDIENTE','APROBADA','RECHAZADA') NOT NULL DEFAULT 'PENDIENTE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `solicitudes_cuenta_status_idx` ON `solicitudes_cuenta`(`status`);
CREATE INDEX `solicitudes_cuenta_createdAt_idx` ON `solicitudes_cuenta`(`createdAt`);

-- CreateTable: staff_profiles
CREATE TABLE `staff_profiles` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `firstName` VARCHAR(191) NOT NULL,
    `lastName` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `avatarUrl` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `staff_profiles_userId_key` ON `staff_profiles`(`userId`);
CREATE INDEX `staff_profiles_userId_idx` ON `staff_profiles`(`userId`);

-- AddForeignKey
ALTER TABLE `staff_profiles` ADD CONSTRAINT `staff_profiles_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: cuentas_contables
CREATE TABLE `cuentas_contables` (
    `id` VARCHAR(191) NOT NULL,
    `codigo` VARCHAR(191) NOT NULL,
    `nombre` VARCHAR(191) NOT NULL,
    `tipo` ENUM('ACTIVO','PASIVO','CAPITAL','INGRESO','COSTO','GASTO') NOT NULL,
    `descripcion` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `cuentas_contables_codigo_key` ON `cuentas_contables`(`codigo`);
CREATE INDEX `cuentas_contables_tipo_idx` ON `cuentas_contables`(`tipo`);
CREATE INDEX `cuentas_contables_isActive_idx` ON `cuentas_contables`(`isActive`);

-- CreateTable: gastos
CREATE TABLE `gastos` (
    `id` VARCHAR(191) NOT NULL,
    `cuentaContableId` VARCHAR(191) NOT NULL,
    `concepto` VARCHAR(191) NOT NULL,
    `monto` DECIMAL(10, 2) NOT NULL,
    `fecha` DATETIME(3) NOT NULL,
    `comprobante` VARCHAR(191) NULL,
    `notas` VARCHAR(191) NULL,
    `creadoPorId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `gastos_cuentaContableId_idx` ON `gastos`(`cuentaContableId`);
CREATE INDEX `gastos_fecha_idx` ON `gastos`(`fecha`);
CREATE INDEX `gastos_creadoPorId_idx` ON `gastos`(`creadoPorId`);

-- AddForeignKey
ALTER TABLE `gastos` ADD CONSTRAINT `gastos_cuentaContableId_fkey` FOREIGN KEY (`cuentaContableId`) REFERENCES `cuentas_contables`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `gastos` ADD CONSTRAINT `gastos_creadoPorId_fkey` FOREIGN KEY (`creadoPorId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable: ingresos
CREATE TABLE `ingresos` (
    `id` VARCHAR(191) NOT NULL,
    `cuentaContableId` VARCHAR(191) NOT NULL,
    `concepto` VARCHAR(191) NOT NULL,
    `monto` DECIMAL(10, 2) NOT NULL,
    `fecha` DATETIME(3) NOT NULL,
    `origen` ENUM('MEMBRESIA_MANUAL','PAQUETE_MANUAL','PORTAL_MERCADOPAGO','WALK_IN','OTRO') NOT NULL,
    `referenciaId` VARCHAR(191) NULL,
    `comprobante` VARCHAR(191) NULL,
    `notas` VARCHAR(191) NULL,
    `creadoPorId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `ingresos_cuentaContableId_idx` ON `ingresos`(`cuentaContableId`);
CREATE INDEX `ingresos_fecha_idx` ON `ingresos`(`fecha`);
CREATE INDEX `ingresos_origen_idx` ON `ingresos`(`origen`);

-- AddForeignKey
ALTER TABLE `ingresos` ADD CONSTRAINT `ingresos_cuentaContableId_fkey` FOREIGN KEY (`cuentaContableId`) REFERENCES `cuentas_contables`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ingresos` ADD CONSTRAINT `ingresos_creadoPorId_fkey` FOREIGN KEY (`creadoPorId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
