-- CreateTable
CREATE TABLE `job_logs` (
    `id` VARCHAR(191) NOT NULL,
    `jobName` VARCHAR(191) NOT NULL,
    `status` ENUM('RUNNING', 'SUCCESS', 'ERROR') NOT NULL,
    `ranAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `durationMs` INTEGER NULL,
    `error` TEXT NULL,

    INDEX `job_logs_jobName_idx`(`jobName`),
    INDEX `job_logs_ranAt_idx`(`ranAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
