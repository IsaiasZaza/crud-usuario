-- AlterTable
ALTER TABLE `Course` ADD COLUMN `location` VARCHAR(191) NULL,
    ADD COLUMN `material` VARCHAR(191) NULL,
    ADD COLUMN `overview` VARCHAR(191) NULL,
    ADD COLUMN `type` ENUM('ONLINE', 'PRESENTIAL') NOT NULL DEFAULT 'ONLINE';
