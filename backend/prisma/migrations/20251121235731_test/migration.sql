/*
  Warnings:

  - You are about to alter the column `nombre` on the `groups` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `VarChar(50)`.
  - You are about to alter the column `periodo` on the `groups` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `VarChar(10)`.
  - You are about to alter the column `matricula` on the `students` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `VarChar(20)`.
  - You are about to alter the column `nombre` on the `students` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `VarChar(100)`.
  - You are about to alter the column `apellidoPaterno` on the `students` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `VarChar(100)`.
  - You are about to alter the column `apellidoMaterno` on the `students` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `VarChar(100)`.
  - You are about to alter the column `carrera` on the `students` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `VarChar(100)`.
  - You are about to alter the column `clave` on the `subjects` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `VarChar(20)`.
  - You are about to alter the column `nombre` on the `teachers` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `VarChar(100)`.
  - You are about to alter the column `apellidoPaterno` on the `teachers` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `VarChar(100)`.
  - You are about to alter the column `apellidoMaterno` on the `teachers` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `VarChar(100)`.
  - You are about to alter the column `departamento` on the `teachers` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `VarChar(100)`.
  - You are about to alter the column `username` on the `users` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `VarChar(50)`.

*/
-- AlterTable
ALTER TABLE `enrollments` ALTER COLUMN `updatedAt` DROP DEFAULT;

-- AlterTable
ALTER TABLE `groups` MODIFY `nombre` VARCHAR(50) NOT NULL,
    MODIFY `periodo` VARCHAR(10) NOT NULL,
    ALTER COLUMN `updatedAt` DROP DEFAULT;

-- AlterTable
ALTER TABLE `students` MODIFY `matricula` VARCHAR(20) NOT NULL,
    MODIFY `nombre` VARCHAR(100) NOT NULL,
    MODIFY `apellidoPaterno` VARCHAR(100) NOT NULL,
    MODIFY `apellidoMaterno` VARCHAR(100) NOT NULL,
    MODIFY `carrera` VARCHAR(100) NOT NULL,
    ALTER COLUMN `updatedAt` DROP DEFAULT;

-- AlterTable
ALTER TABLE `subjects` MODIFY `clave` VARCHAR(20) NOT NULL,
    MODIFY `nombre` VARCHAR(200) NOT NULL,
    ALTER COLUMN `updatedAt` DROP DEFAULT;

-- AlterTable
ALTER TABLE `teachers` MODIFY `nombre` VARCHAR(100) NOT NULL,
    MODIFY `apellidoPaterno` VARCHAR(100) NOT NULL,
    MODIFY `apellidoMaterno` VARCHAR(100) NOT NULL,
    MODIFY `departamento` VARCHAR(100) NOT NULL,
    ALTER COLUMN `updatedAt` DROP DEFAULT;

-- AlterTable
ALTER TABLE `users` MODIFY `username` VARCHAR(50) NOT NULL;

-- CreateIndex
CREATE INDEX `groups_subjectId_idx` ON `groups`(`subjectId`);

-- CreateIndex
CREATE INDEX `groups_teacherId_idx` ON `groups`(`teacherId`);

-- CreateIndex
CREATE INDEX `students_matricula_idx` ON `students`(`matricula`);

-- CreateIndex
CREATE INDEX `subjects_clave_idx` ON `subjects`(`clave`);
