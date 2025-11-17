-- AlterTable: Add timestamps and improve students table
ALTER TABLE `students` 
  ADD COLUMN `curp` VARCHAR(18) NULL,
  ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3);

-- CreateIndex: Add indexes for students table
CREATE INDEX `students_carrera_idx` ON `students`(`carrera`);
CREATE INDEX `students_semestre_idx` ON `students`(`semestre`);
CREATE INDEX `students_estatus_idx` ON `students`(`estatus`);
CREATE INDEX `students_curp_idx` ON `students`(`curp`);
CREATE INDEX `students_carrera_semestre_idx` ON `students`(`carrera`, `semestre`);

-- AlterTable: Change estatus from VARCHAR to ENUM
-- First, update existing values to match enum values
UPDATE `students` SET `estatus` = 'ACTIVO' WHERE `estatus` NOT IN ('ACTIVO', 'INACTIVO', 'EGRESADO');

-- AlterTable: Modify estatus column to ENUM
ALTER TABLE `students` 
  MODIFY COLUMN `estatus` ENUM('ACTIVO', 'INACTIVO', 'EGRESADO') NOT NULL;

-- AlterTable: Add unique constraint for curp
ALTER TABLE `students` ADD UNIQUE INDEX `students_curp_key`(`curp`);

-- AlterTable: Add timestamps to teachers table
ALTER TABLE `teachers` 
  ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3);

-- CreateIndex: Add index for teachers.departamento
CREATE INDEX `teachers_departamento_idx` ON `teachers`(`departamento`);

-- AlterTable: Add timestamps to subjects table
ALTER TABLE `subjects` 
  ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3);

-- AlterTable: Modify groups table - add timestamps and indexes
ALTER TABLE `groups` 
  ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3);

-- CreateIndex: Add indexes for groups table
CREATE INDEX `groups_periodo_idx` ON `groups`(`periodo`);
CREATE INDEX `groups_subjectId_periodo_idx` ON `groups`(`subjectId`, `periodo`);
CREATE INDEX `groups_teacherId_periodo_idx` ON `groups`(`teacherId`, `periodo`);

-- AlterTable: Change groups foreign key constraint from CASCADE to RESTRICT for subjectId
-- First, drop the existing foreign key
ALTER TABLE `groups` DROP FOREIGN KEY `groups_subjectId_fkey`;

-- Recreate with RESTRICT
ALTER TABLE `groups` 
  ADD CONSTRAINT `groups_subjectId_fkey` 
  FOREIGN KEY (`subjectId`) REFERENCES `subjects`(`id`) 
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterTable: Add timestamps to enrollments table
ALTER TABLE `enrollments` 
  ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3);

-- AlterTable: Change calificacion from DOUBLE to DECIMAL(5,2)
ALTER TABLE `enrollments` 
  MODIFY COLUMN `calificacion` DECIMAL(5, 2) NULL;

-- CreateIndex: Add indexes for enrollments table
CREATE INDEX `enrollments_studentId_idx` ON `enrollments`(`studentId`);
CREATE INDEX `enrollments_groupId_idx` ON `enrollments`(`groupId`);
CREATE INDEX `enrollments_studentId_groupId_idx` ON `enrollments`(`studentId`, `groupId`);

-- AlterTable: Add explicit index for users.username (already has UNIQUE, but adding explicit index)
CREATE INDEX `users_username_idx` ON `users`(`username`);

