-- Migration: Phase 2 - Academic Periods, Capacity Management, and Enhanced Enrollments (Fixed)
-- Description: Add academic periods, group capacity, schedules, and detailed enrollment tracking
-- Date: 2025-01-21

-- ============================================
-- GROUPS TABLE - Capacity and Schedule Management
-- ============================================

-- Generate unique codes for existing groups (if codigo is NULL)
SET @row_number = 0;
UPDATE `groups`
SET `codigo` = CONCAT('GRP-', LPAD(@row_number := @row_number + 1, 6, '0'))
WHERE `codigo` IS NULL
ORDER BY `createdAt`;

-- Make codigo NOT NULL and add unique constraint
ALTER TABLE `groups`
  MODIFY COLUMN `codigo` VARCHAR(20) NOT NULL;

-- Add unique constraint if it doesn't exist (check first)
SET @index_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
  WHERE TABLE_SCHEMA = 'sipi_db' AND TABLE_NAME = 'groups' AND INDEX_NAME = 'groups_codigo_key');
SET @sql = IF(@index_exists = 0,
  'ALTER TABLE `groups` ADD UNIQUE KEY `groups_codigo_key` (`codigo`)',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add seccion (if not exists)
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = 'sipi_db' AND TABLE_NAME = 'groups' AND COLUMN_NAME = 'seccion');
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `groups` ADD COLUMN `seccion` VARCHAR(10) NULL',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add capacity management (if not exists)
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = 'sipi_db' AND TABLE_NAME = 'groups' AND COLUMN_NAME = 'cupoMaximo');
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `groups` ADD COLUMN `cupoMaximo` INT NOT NULL DEFAULT 30, ADD COLUMN `cupoMinimo` INT NOT NULL DEFAULT 5, ADD COLUMN `cupoActual` INT NOT NULL DEFAULT 0',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Calculate initial cupoActual from enrollments
UPDATE `groups` g
INNER JOIN (
  SELECT groupId, COUNT(*) as total
  FROM `enrollments`
  WHERE deletedAt IS NULL
  GROUP BY groupId
) e ON g.id = e.groupId
SET g.cupoActual = e.total;

-- Add schedule and location (if not exists)
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = 'sipi_db' AND TABLE_NAME = 'groups' AND COLUMN_NAME = 'horario');
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `groups` ADD COLUMN `horario` VARCHAR(200) NULL, ADD COLUMN `aula` VARCHAR(50) NULL, ADD COLUMN `edificio` VARCHAR(50) NULL',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add modalidad enum column (if not exists)
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = 'sipi_db' AND TABLE_NAME = 'groups' AND COLUMN_NAME = 'modalidad');
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `groups` ADD COLUMN `modalidad` ENUM(\'PRESENCIAL\', \'VIRTUAL\', \'HIBRIDO\', \'SEMIPRESENCIAL\') NOT NULL DEFAULT \'PRESENCIAL\'',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add dates (if not exists)
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = 'sipi_db' AND TABLE_NAME = 'groups' AND COLUMN_NAME = 'fechaInicio');
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `groups` ADD COLUMN `fechaInicio` DATETIME(3) NULL, ADD COLUMN `fechaFin` DATETIME(3) NULL',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add status enum column (if not exists)
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = 'sipi_db' AND TABLE_NAME = 'groups' AND COLUMN_NAME = 'estatus');
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `groups` ADD COLUMN `estatus` ENUM(\'ABIERTO\', \'CERRADO\', \'CANCELADO\', \'EN_CURSO\', \'FINALIZADO\') NOT NULL DEFAULT \'ABIERTO\'',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add metrics (if not exists)
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = 'sipi_db' AND TABLE_NAME = 'groups' AND COLUMN_NAME = 'promedioGrupo');
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `groups` ADD COLUMN `promedioGrupo` DECIMAL(5,2) NULL, ADD COLUMN `tasaAprobacion` DECIMAL(5,2) NULL',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add relation to AcademicPeriod (if not exists)
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = 'sipi_db' AND TABLE_NAME = 'groups' AND COLUMN_NAME = 'periodoId');
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `groups` ADD COLUMN `periodoId` VARCHAR(191) NULL, ADD CONSTRAINT `groups_periodoId_fkey` FOREIGN KEY (`periodoId`) REFERENCES `academic_periods`(`id`) ON DELETE SET NULL',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Update periodoId based on periodo string (if periodoId is NULL)
UPDATE `groups` g
JOIN `academic_periods` ap ON g.periodo = ap.codigo
SET g.periodoId = ap.id
WHERE g.periodoId IS NULL;

-- Create indexes (handle errors if they exist)
SET @index_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
  WHERE TABLE_SCHEMA = 'sipi_db' AND TABLE_NAME = 'groups' AND INDEX_NAME = 'groups_codigo_idx');
SET @sql = IF(@index_exists = 0, 'CREATE INDEX `groups_codigo_idx` ON `groups`(`codigo`)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @index_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
  WHERE TABLE_SCHEMA = 'sipi_db' AND TABLE_NAME = 'groups' AND INDEX_NAME = 'groups_estatus_idx');
SET @sql = IF(@index_exists = 0, 'CREATE INDEX `groups_estatus_idx` ON `groups`(`estatus`)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @index_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
  WHERE TABLE_SCHEMA = 'sipi_db' AND TABLE_NAME = 'groups' AND INDEX_NAME = 'groups_modalidad_idx');
SET @sql = IF(@index_exists = 0, 'CREATE INDEX `groups_modalidad_idx` ON `groups`(`modalidad`)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @index_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
  WHERE TABLE_SCHEMA = 'sipi_db' AND TABLE_NAME = 'groups' AND INDEX_NAME = 'groups_periodoId_idx');
SET @sql = IF(@index_exists = 0, 'CREATE INDEX `groups_periodoId_idx` ON `groups`(`periodoId`)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @index_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
  WHERE TABLE_SCHEMA = 'sipi_db' AND TABLE_NAME = 'groups' AND INDEX_NAME = 'groups_subject_period_estatus_idx');
SET @sql = IF(@index_exists = 0, 'CREATE INDEX `groups_subject_period_estatus_idx` ON `groups`(`subjectId`, `periodoId`, `estatus`)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- ENROLLMENTS TABLE - Enhanced Tracking
-- ============================================

-- Add enrollment code (if not exists)
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = 'sipi_db' AND TABLE_NAME = 'enrollments' AND COLUMN_NAME = 'codigo');
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `enrollments` ADD COLUMN `codigo` VARCHAR(30) NULL',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Generate unique codes for existing enrollments (if any)
SET @enr_number = 0;
UPDATE `enrollments`
SET `codigo` = CONCAT('ENR-', LPAD(@enr_number := @enr_number + 1, 8, '0'))
WHERE `codigo` IS NULL
ORDER BY `createdAt`;

-- Make codigo NOT NULL and add unique constraint
ALTER TABLE `enrollments`
  MODIFY COLUMN `codigo` VARCHAR(30) NOT NULL;

SET @index_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
  WHERE TABLE_SCHEMA = 'sipi_db' AND TABLE_NAME = 'enrollments' AND INDEX_NAME = 'enrollments_codigo_key');
SET @sql = IF(@index_exists = 0,
  'ALTER TABLE `enrollments` ADD UNIQUE KEY `enrollments_codigo_key` (`codigo`)',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add enrollment information (if not exists)
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = 'sipi_db' AND TABLE_NAME = 'enrollments' AND COLUMN_NAME = 'fechaInscripcion');
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `enrollments` ADD COLUMN `fechaInscripcion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), ADD COLUMN `fechaBaja` DATETIME(3) NULL',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add tipoInscripcion enum (if not exists)
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = 'sipi_db' AND TABLE_NAME = 'enrollments' AND COLUMN_NAME = 'tipoInscripcion');
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `enrollments` ADD COLUMN `tipoInscripcion` ENUM(\'NORMAL\', \'ESPECIAL\', \'REPETICION\', \'EQUIVALENCIA\') NOT NULL DEFAULT \'NORMAL\'',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add estatus enum (if not exists)
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = 'sipi_db' AND TABLE_NAME = 'enrollments' AND COLUMN_NAME = 'estatus');
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `enrollments` ADD COLUMN `estatus` ENUM(\'INSCRITO\', \'EN_CURSO\', \'BAJA\', \'APROBADO\', \'REPROBADO\', \'CANCELADO\') NOT NULL DEFAULT \'INSCRITO\'',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add partial grades (if not exists)
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = 'sipi_db' AND TABLE_NAME = 'enrollments' AND COLUMN_NAME = 'calificacionParcial1');
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `enrollments` ADD COLUMN `calificacionParcial1` DECIMAL(5,2) NULL, ADD COLUMN `calificacionParcial2` DECIMAL(5,2) NULL, ADD COLUMN `calificacionParcial3` DECIMAL(5,2) NULL, ADD COLUMN `calificacionFinal` DECIMAL(5,2) NULL, ADD COLUMN `calificacionExtra` DECIMAL(5,2) NULL',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Copy existing calificacion to calificacionFinal if exists and calificacionFinal is NULL
UPDATE `enrollments`
SET `calificacionFinal` = `calificacion`
WHERE `calificacion` IS NOT NULL AND `calificacionFinal` IS NULL;

-- Add attendance (if not exists)
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = 'sipi_db' AND TABLE_NAME = 'enrollments' AND COLUMN_NAME = 'asistencias');
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `enrollments` ADD COLUMN `asistencias` INT NOT NULL DEFAULT 0, ADD COLUMN `faltas` INT NOT NULL DEFAULT 0, ADD COLUMN `retardos` INT NOT NULL DEFAULT 0, ADD COLUMN `porcentajeAsistencia` DECIMAL(5,2) NULL',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add evaluation (if not exists)
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = 'sipi_db' AND TABLE_NAME = 'enrollments' AND COLUMN_NAME = 'aprobado');
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `enrollments` ADD COLUMN `aprobado` BOOLEAN NULL, ADD COLUMN `fechaAprobacion` DATETIME(3) NULL, ADD COLUMN `observaciones` TEXT NULL',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Create indexes (handle errors if they exist)
SET @index_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
  WHERE TABLE_SCHEMA = 'sipi_db' AND TABLE_NAME = 'enrollments' AND INDEX_NAME = 'enrollments_codigo_idx');
SET @sql = IF(@index_exists = 0, 'CREATE INDEX `enrollments_codigo_idx` ON `enrollments`(`codigo`)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @index_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
  WHERE TABLE_SCHEMA = 'sipi_db' AND TABLE_NAME = 'enrollments' AND INDEX_NAME = 'enrollments_estatus_idx');
SET @sql = IF(@index_exists = 0, 'CREATE INDEX `enrollments_estatus_idx` ON `enrollments`(`estatus`)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @index_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
  WHERE TABLE_SCHEMA = 'sipi_db' AND TABLE_NAME = 'enrollments' AND INDEX_NAME = 'enrollments_fechaInscripcion_idx');
SET @sql = IF(@index_exists = 0, 'CREATE INDEX `enrollments_fechaInscripcion_idx` ON `enrollments`(`fechaInscripcion`)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @index_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
  WHERE TABLE_SCHEMA = 'sipi_db' AND TABLE_NAME = 'enrollments' AND INDEX_NAME = 'enrollments_fechaBaja_idx');
SET @sql = IF(@index_exists = 0, 'CREATE INDEX `enrollments_fechaBaja_idx` ON `enrollments`(`fechaBaja`)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @index_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
  WHERE TABLE_SCHEMA = 'sipi_db' AND TABLE_NAME = 'enrollments' AND INDEX_NAME = 'enrollments_aprobado_idx');
SET @sql = IF(@index_exists = 0, 'CREATE INDEX `enrollments_aprobado_idx` ON `enrollments`(`aprobado`)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @index_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
  WHERE TABLE_SCHEMA = 'sipi_db' AND TABLE_NAME = 'enrollments' AND INDEX_NAME = 'enrollments_student_estatus_idx');
SET @sql = IF(@index_exists = 0, 'CREATE INDEX `enrollments_student_estatus_idx` ON `enrollments`(`studentId`, `estatus`)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @index_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
  WHERE TABLE_SCHEMA = 'sipi_db' AND TABLE_NAME = 'enrollments' AND INDEX_NAME = 'enrollments_group_estatus_idx');
SET @sql = IF(@index_exists = 0, 'CREATE INDEX `enrollments_group_estatus_idx` ON `enrollments`(`groupId`, `estatus`)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

