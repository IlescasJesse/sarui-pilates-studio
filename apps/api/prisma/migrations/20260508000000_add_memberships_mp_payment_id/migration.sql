-- AlterTable
ALTER TABLE `memberships` ADD COLUMN `mercadoPagoPaymentId` VARCHAR(191) NULL,
    ADD UNIQUE INDEX `memberships_mercadoPagoPaymentId_key`(`mercadoPagoPaymentId`);
