-- RB-038: Add English enrollment fields to enrollments table
ALTER TABLE `enrollments` ADD COLUMN `nivelIngles` INT NULL;
ALTER TABLE `enrollments` ADD COLUMN `esExamenDiagnostico` BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE `enrollments` ADD COLUMN `requierePago` BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE `enrollments` ADD COLUMN `pagoAprobado` BOOLEAN NULL;
ALTER TABLE `enrollments` ADD COLUMN `fechaPagoAprobado` DATETIME(3) NULL;
ALTER TABLE `enrollments` ADD COLUMN `montoPago` DECIMAL(10,2) NULL;
ALTER TABLE `enrollments` ADD COLUMN `comprobantePago` VARCHAR(255) NULL;

-- Add indexes
CREATE INDEX `enrollments_esExamenDiagnostico_idx` ON `enrollments`(`esExamenDiagnostico`);
CREATE INDEX `enrollments_pagoAprobado_idx` ON `enrollments`(`pagoAprobado`);
CREATE INDEX `enrollments_nivelIngles_idx` ON `enrollments`(`nivelIngles`);

-- RB-038: Add English student fields to students table
ALTER TABLE `students` ADD COLUMN `nivelInglesActual` INT NULL;
ALTER TABLE `students` ADD COLUMN `nivelInglesCertificado` INT NULL;
ALTER TABLE `students` ADD COLUMN `fechaExamenDiagnostico` DATETIME(3) NULL;
ALTER TABLE `students` ADD COLUMN `porcentajeIngles` DECIMAL(5,2) NULL;
ALTER TABLE `students` ADD COLUMN `cumpleRequisitoIngles` BOOLEAN NOT NULL DEFAULT false;

-- Add indexes
CREATE INDEX `students_nivelInglesActual_idx` ON `students`(`nivelInglesActual`);
CREATE INDEX `students_cumpleRequisitoIngles_idx` ON `students`(`cumpleRequisitoIngles`);

-- Update enum values (MySQL doesn't support ALTER ENUM, so we use MODIFY COLUMN)
-- Note: This may require manual update depending on MySQL version
-- For now, the enum values are added in the Prisma schema and will be applied on next migration sync
