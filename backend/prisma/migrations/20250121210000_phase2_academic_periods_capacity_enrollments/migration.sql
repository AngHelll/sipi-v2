-- Migration: Phase 2 - Academic Periods, Capacity Management, and Enhanced Enrollments
-- Description: Add academic periods, group capacity, schedules, and detailed enrollment tracking
-- Date: 2025-01-21

-- ============================================
-- ACADEMIC_PERIODS TABLE - New Entity
-- ============================================

CREATE TABLE IF NOT EXISTS `academic_periods` (
  `id` VARCHAR(191) NOT NULL PRIMARY KEY,
  `codigo` VARCHAR(20) NOT NULL UNIQUE,
  `nombre` VARCHAR(100) NOT NULL,
  `tipo` ENUM('SEMESTRAL', 'TRIMESTRAL', 'CUATRIMESTRAL', 'ANUAL') NOT NULL,
  `fechaInicio` DATETIME(3) NOT NULL,
  `fechaFin` DATETIME(3) NOT NULL,
  `fechaInscripcionInicio` DATETIME(3) NULL,
  `fechaInscripcionFin` DATETIME(3) NULL,
  `estatus` ENUM('PLANEADO', 'INSCRIPCIONES', 'EN_CURSO', 'FINALIZADO', 'CERRADO') NOT NULL DEFAULT 'PLANEADO',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS `academic_periods_codigo_idx` ON `academic_periods`(`codigo`);
CREATE INDEX IF NOT EXISTS `academic_periods_estatus_idx` ON `academic_periods`(`estatus`);
CREATE INDEX IF NOT EXISTS `academic_periods_fechaInicio_fechaFin_idx` ON `academic_periods`(`fechaInicio`, `fechaFin`);

-- Insert existing periods based on current groups (only if they don't exist)
INSERT IGNORE INTO `academic_periods` (`id`, `codigo`, `nombre`, `tipo`, `fechaInicio`, `fechaFin`, `estatus`)
SELECT 
  UUID() as id,
  periodo as codigo,
  CONCAT('Período ', periodo) as nombre,
  'SEMESTRAL' as tipo,
  CASE 
    WHEN periodo LIKE '2024-1' THEN '2024-01-15 00:00:00'
    WHEN periodo LIKE '2024-2' THEN '2024-08-01 00:00:00'
    WHEN periodo LIKE '2025-1' THEN '2025-01-15 00:00:00'
    WHEN periodo LIKE '2025-2' THEN '2025-08-01 00:00:00'
    ELSE '2024-01-15 00:00:00'
  END as fechaInicio,
  CASE 
    WHEN periodo LIKE '2024-1' THEN '2024-06-30 23:59:59'
    WHEN periodo LIKE '2024-2' THEN '2024-12-20 23:59:59'
    WHEN periodo LIKE '2025-1' THEN '2025-06-30 23:59:59'
    WHEN periodo LIKE '2025-2' THEN '2025-12-20 23:59:59'
    ELSE '2024-06-30 23:59:59'
  END as fechaFin,
  CASE 
    WHEN periodo LIKE '2024-%' THEN 'FINALIZADO'
    WHEN periodo LIKE '2025-1' THEN 'EN_CURSO'
    ELSE 'PLANEADO'
  END as estatus
FROM (SELECT DISTINCT periodo FROM `groups`) as distinct_periods;

-- ============================================
-- GROUPS TABLE - Capacity and Schedule Management
-- ============================================

-- Add group code and section (if not exists)
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = 'sipi_db' AND TABLE_NAME = 'groups' AND COLUMN_NAME = 'codigo');
SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE `groups` ADD COLUMN `codigo` VARCHAR(20) NULL, ADD COLUMN `seccion` VARCHAR(10) NULL',
  'SELECT "Column codigo already exists" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Generate unique codes for existing groups (if codigo is NULL)
SET @row_number = 0;
UPDATE `groups`
SET `codigo` = CONCAT('GRP-', LPAD(@row_number := @row_number + 1, 6, '0'))
WHERE `codigo` IS NULL
ORDER BY `createdAt`;

-- Make codigo NOT NULL and UNIQUE (if not already)
ALTER TABLE `groups`
  MODIFY COLUMN `codigo` VARCHAR(20) NOT NULL;

-- Add unique constraint if it doesn't exist
SET @index_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
  WHERE TABLE_SCHEMA = 'sipi_db' AND TABLE_NAME = 'groups' AND INDEX_NAME = 'groups_codigo_key');
SET @sql = IF(@index_exists = 0,
  'ALTER TABLE `groups` ADD UNIQUE KEY `groups_codigo_key` (`codigo`)',
  'SELECT "Index groups_codigo_key already exists" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add capacity management (if not exists)
ALTER TABLE `groups`
  ADD COLUMN IF NOT EXISTS `cupoMaximo` INT NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS `cupoMinimo` INT NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS `cupoActual` INT NOT NULL DEFAULT 0;

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
ALTER TABLE `groups`
  ADD COLUMN IF NOT EXISTS `horario` VARCHAR(200) NULL,
  ADD COLUMN IF NOT EXISTS `aula` VARCHAR(50) NULL,
  ADD COLUMN IF NOT EXISTS `edificio` VARCHAR(50) NULL;

-- Add modalidad enum column (if not exists)
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = 'sipi_db' AND TABLE_NAME = 'groups' AND COLUMN_NAME = 'modalidad');
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `groups` ADD COLUMN `modalidad` ENUM(\'PRESENCIAL\', \'VIRTUAL\', \'HIBRIDO\', \'SEMIPRESENCIAL\') NOT NULL DEFAULT \'PRESENCIAL\'',
  'SELECT "Column modalidad already exists" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add dates (if not exists)
ALTER TABLE `groups`
  ADD COLUMN IF NOT EXISTS `fechaInicio` DATETIME(3) NULL,
  ADD COLUMN IF NOT EXISTS `fechaFin` DATETIME(3) NULL;

-- Add status enum column (if not exists)
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = 'sipi_db' AND TABLE_NAME = 'groups' AND COLUMN_NAME = 'estatus');
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `groups` ADD COLUMN `estatus` ENUM(\'ABIERTO\', \'CERRADO\', \'CANCELADO\', \'EN_CURSO\', \'FINALIZADO\') NOT NULL DEFAULT \'ABIERTO\'',
  'SELECT "Column estatus already exists" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add metrics (if not exists)
ALTER TABLE `groups`
  ADD COLUMN IF NOT EXISTS `promedioGrupo` DECIMAL(5,2) NULL,
  ADD COLUMN IF NOT EXISTS `tasaAprobacion` DECIMAL(5,2) NULL;

-- Add relation to AcademicPeriod (if not exists)
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = 'sipi_db' AND TABLE_NAME = 'groups' AND COLUMN_NAME = 'periodoId');
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `groups` ADD COLUMN `periodoId` VARCHAR(191) NULL, ADD CONSTRAINT `groups_periodoId_fkey` FOREIGN KEY (`periodoId`) REFERENCES `academic_periods`(`id`) ON DELETE SET NULL',
  'SELECT "Column periodoId already exists" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Update periodoId based on periodo string (if periodoId is NULL)
UPDATE `groups` g
JOIN `academic_periods` ap ON g.periodo = ap.codigo
SET g.periodoId = ap.id
WHERE g.periodoId IS NULL;

-- Create indexes (if they don't exist)
CREATE INDEX IF NOT EXISTS `groups_codigo_idx` ON `groups`(`codigo`);
CREATE INDEX IF NOT EXISTS `groups_estatus_idx` ON `groups`(`estatus`);
CREATE INDEX IF NOT EXISTS `groups_modalidad_idx` ON `groups`(`modalidad`);
CREATE INDEX IF NOT EXISTS `groups_periodoId_idx` ON `groups`(`periodoId`);
CREATE INDEX IF NOT EXISTS `groups_subject_period_estatus_idx` ON `groups`(`subjectId`, `periodoId`, `estatus`);

-- ============================================
-- ENROLLMENTS TABLE - Enhanced Tracking
-- ============================================

-- Add enrollment code (if not exists)
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = 'sipi_db' AND TABLE_NAME = 'enrollments' AND COLUMN_NAME = 'codigo');
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `enrollments` ADD COLUMN `codigo` VARCHAR(30) NULL',
  'SELECT "Column codigo already exists" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Generate unique codes for existing enrollments (if any)
SET @enr_number = 0;
UPDATE `enrollments`
SET `codigo` = CONCAT('ENR-', LPAD(@enr_number := @enr_number + 1, 8, '0'))
WHERE `codigo` IS NULL
ORDER BY `createdAt`;

-- Make codigo NOT NULL and UNIQUE (if not already)
ALTER TABLE `enrollments`
  MODIFY COLUMN `codigo` VARCHAR(30) NOT NULL;

-- Add unique constraint if it doesn't exist
SET @index_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
  WHERE TABLE_SCHEMA = 'sipi_db' AND TABLE_NAME = 'enrollments' AND INDEX_NAME = 'enrollments_codigo_key');
SET @sql = IF(@index_exists = 0,
  'ALTER TABLE `enrollments` ADD UNIQUE KEY `enrollments_codigo_key` (`codigo`)',
  'SELECT "Index enrollments_codigo_key already exists" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add enrollment information (if not exists)
ALTER TABLE `enrollments`
  ADD COLUMN IF NOT EXISTS `fechaInscripcion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS `fechaBaja` DATETIME(3) NULL;

-- Add tipoInscripcion enum (if not exists)
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = 'sipi_db' AND TABLE_NAME = 'enrollments' AND COLUMN_NAME = 'tipoInscripcion');
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `enrollments` ADD COLUMN `tipoInscripcion` ENUM(\'NORMAL\', \'ESPECIAL\', \'REPETICION\', \'EQUIVALENCIA\') NOT NULL DEFAULT \'NORMAL\'',
  'SELECT "Column tipoInscripcion already exists" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add estatus enum (if not exists)
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = 'sipi_db' AND TABLE_NAME = 'enrollments' AND COLUMN_NAME = 'estatus');
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `enrollments` ADD COLUMN `estatus` ENUM(\'INSCRITO\', \'EN_CURSO\', \'BAJA\', \'APROBADO\', \'REPROBADO\', \'CANCELADO\') NOT NULL DEFAULT \'INSCRITO\'',
  'SELECT "Column estatus already exists" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add partial grades (if not exists)
ALTER TABLE `enrollments`
  ADD COLUMN IF NOT EXISTS `calificacionParcial1` DECIMAL(5,2) NULL,
  ADD COLUMN IF NOT EXISTS `calificacionParcial2` DECIMAL(5,2) NULL,
  ADD COLUMN IF NOT EXISTS `calificacionParcial3` DECIMAL(5,2) NULL,
  ADD COLUMN IF NOT EXISTS `calificacionFinal` DECIMAL(5,2) NULL,
  ADD COLUMN IF NOT EXISTS `calificacionExtra` DECIMAL(5,2) NULL;

-- Copy existing calificacion to calificacionFinal if exists and calificacionFinal is NULL
UPDATE `enrollments`
SET `calificacionFinal` = `calificacion`
WHERE `calificacion` IS NOT NULL AND `calificacionFinal` IS NULL;

-- Add attendance (if not exists)
ALTER TABLE `enrollments`
  ADD COLUMN IF NOT EXISTS `asistencias` INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS `faltas` INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS `retardos` INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS `porcentajeAsistencia` DECIMAL(5,2) NULL;

-- Add evaluation (if not exists)
ALTER TABLE `enrollments`
  ADD COLUMN IF NOT EXISTS `aprobado` BOOLEAN NULL,
  ADD COLUMN IF NOT EXISTS `fechaAprobacion` DATETIME(3) NULL,
  ADD COLUMN IF NOT EXISTS `observaciones` TEXT NULL;

-- Create indexes (if they don't exist)
CREATE INDEX IF NOT EXISTS `enrollments_codigo_idx` ON `enrollments`(`codigo`);
CREATE INDEX IF NOT EXISTS `enrollments_estatus_idx` ON `enrollments`(`estatus`);
CREATE INDEX IF NOT EXISTS `enrollments_fechaInscripcion_idx` ON `enrollments`(`fechaInscripcion`);
CREATE INDEX IF NOT EXISTS `enrollments_fechaBaja_idx` ON `enrollments`(`fechaBaja`);
CREATE INDEX IF NOT EXISTS `enrollments_aprobado_idx` ON `enrollments`(`aprobado`);
CREATE INDEX IF NOT EXISTS `enrollments_student_estatus_idx` ON `enrollments`(`studentId`, `estatus`);
CREATE INDEX IF NOT EXISTS `enrollments_group_estatus_idx` ON `enrollments`(`groupId`, `estatus`);
