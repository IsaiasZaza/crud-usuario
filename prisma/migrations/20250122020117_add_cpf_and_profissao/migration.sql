/*
  Warnings:

  - Made the column `cpf` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `profissao` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `User` MODIFY `cpf` VARCHAR(191) NOT NULL,
    MODIFY `profissao` VARCHAR(191) NOT NULL;
