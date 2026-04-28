/*
  Warnings:

  - You are about to alter the column `token` on the `refresh_tokens` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `VarChar(36)`.

*/
-- AlterTable
ALTER TABLE `refresh_tokens` MODIFY `token` VARCHAR(36) NOT NULL;
