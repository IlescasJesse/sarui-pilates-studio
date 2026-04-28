-- AlterTable
ALTER TABLE `classes` MODIFY `type` ENUM('FLOW', 'POWER', 'MOBILITY', 'MAT', 'GAP') NULL,
    MODIFY `subtype` ENUM('REFORMER', 'MAT', 'BARRE') NULL;

-- AlterTable
ALTER TABLE `packages` MODIFY `category` ENUM('REFORMER', 'MAT', 'BARRE', 'MIX') NOT NULL,
    MODIFY `classSubtype` ENUM('REFORMER', 'MAT', 'BARRE') NULL;
