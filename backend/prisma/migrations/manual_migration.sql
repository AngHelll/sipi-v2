-- Manual migration script to improve database consistency
-- This script preserves existing data while applying schema improvements

-- Step 1: Add timestamps to existing tables with default values
ALTER TABLE `students` 
  ADD COLUMN `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

ALTER TABLE `teachers` 
  ADD COLUMN `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

ALTER TABLE `subjects` 
  ADD COLUMN `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

ALTER TABLE `groups` 
  ADD COLUMN `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

ALTER TABLE `enrollments` 
  ADD COLUMN `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- Step 2: Normalize estatus values (uppercase and trim)
UPDATE `students` SET `estatus` = UPPER(TRIM(`estatus`));

-- Step 3: Fix any invalid estatus values
UPDATE `students` 
SET `estatus` = 'ACTIVO' 
WHERE `estatus` NOT IN ('ACTIVO', 'INACTIVO', 'EGRESADO');

-- Step 4: Add length constraints to string fields
ALTER TABLE `users` MODIFY `username` VARCHAR(50) NOT NULL;

ALTER TABLE `students` 
  MODIFY `matricula` VARCHAR(20) NOT NULL,
  MODIFY `nombre` VARCHAR(100) NOT NULL,
  MODIFY `apellidoPaterno` VARCHAR(100) NOT NULL,
  MODIFY `apellidoMaterno` VARCHAR(100) NOT NULL,
  MODIFY `carrera` VARCHAR(100) NOT NULL;

ALTER TABLE `teachers` 
  MODIFY `nombre` VARCHAR(100) NOT NULL,
  MODIFY `apellidoPaterno` VARCHAR(100) NOT NULL,
  MODIFY `apellidoMaterno` VARCHAR(100) NOT NULL,
  MODIFY `departamento` VARCHAR(100) NOT NULL;

ALTER TABLE `subjects` 
  MODIFY `clave` VARCHAR(20) NOT NULL,
  MODIFY `nombre` VARCHAR(200) NOT NULL;

ALTER TABLE `groups` 
  MODIFY `nombre` VARCHAR(50) NOT NULL,
  MODIFY `periodo` VARCHAR(10) NOT NULL;

-- Step 5: Change calificacion from FLOAT to DECIMAL
ALTER TABLE `enrollments` 
  MODIFY `calificacion` DECIMAL(5,2) NULL;

-- Step 6: Change estatus from VARCHAR to ENUM
ALTER TABLE `students` 
  MODIFY `estatus` ENUM('ACTIVO', 'INACTIVO', 'EGRESADO') NOT NULL;

-- Step 7: Add indexes for performance
ALTER TABLE `users` ADD INDEX `users_username_idx` (`username`);

ALTER TABLE `students` 
  ADD INDEX `students_matricula_idx` (`matricula`),
  ADD INDEX `students_carrera_idx` (`carrera`),
  ADD INDEX `students_semestre_idx` (`semestre`),
  ADD INDEX `students_estatus_idx` (`estatus`),
  ADD INDEX `students_carrera_semestre_idx` (`carrera`, `semestre`);

ALTER TABLE `teachers` 
  ADD INDEX `teachers_departamento_idx` (`departamento`);

ALTER TABLE `subjects` 
  ADD INDEX `subjects_clave_idx` (`clave`);

ALTER TABLE `groups` 
  ADD INDEX `groups_subjectId_idx` (`subjectId`),
  ADD INDEX `groups_teacherId_idx` (`teacherId`),
  ADD INDEX `groups_periodo_idx` (`periodo`),
  ADD INDEX `groups_subjectId_periodo_idx` (`subjectId`, `periodo`),
  ADD INDEX `groups_teacherId_periodo_idx` (`teacherId`, `periodo`);

ALTER TABLE `enrollments` 
  ADD INDEX `enrollments_studentId_idx` (`studentId`),
  ADD INDEX `enrollments_groupId_idx` (`groupId`),
  ADD INDEX `enrollments_studentId_groupId_idx` (`studentId`, `groupId`);

-- Step 8: Change foreign key constraint for Subject -> Group from CASCADE to RESTRICT
-- First, drop the existing foreign key
ALTER TABLE `groups` DROP FOREIGN KEY `groups_subjectId_fkey`;

-- Then add it back with RESTRICT
ALTER TABLE `groups` 
  ADD CONSTRAINT `groups_subjectId_fkey` 
  FOREIGN KEY (`subjectId`) REFERENCES `subjects`(`id`) 
  ON DELETE RESTRICT ON UPDATE CASCADE;

