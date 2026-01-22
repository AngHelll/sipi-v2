-- Migration: Phase 3 - Careers Normalization and Subjects Enhancement
-- Description: Add careers catalog, subject prerequisites, and enhanced subject information
-- Date: 2025-01-21

-- ============================================
-- CAREERS TABLE - New Entity
-- ============================================

CREATE TABLE IF NOT EXISTS `careers` (
  `id` VARCHAR(191) NOT NULL PRIMARY KEY,
  `codigo` VARCHAR(20) NOT NULL UNIQUE,
  `nombre` VARCHAR(200) NOT NULL,
  `nombreCorto` VARCHAR(50) NULL,
  `area` VARCHAR(100) NULL,
  `duracionSemestres` INT NOT NULL DEFAULT 8,
  `creditosTotales` INT NULL,
  `descripcion` TEXT NULL,
  `estatus` VARCHAR(20) NOT NULL DEFAULT 'ACTIVA',
  `deletedAt` DATETIME(3) NULL,
  `createdBy` VARCHAR(191) NULL,
  `updatedBy` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create indexes
SET @index_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
  WHERE TABLE_SCHEMA = 'sipi_db' AND TABLE_NAME = 'careers' AND INDEX_NAME = 'careers_codigo_idx');
SET @sql = IF(@index_exists = 0, 'CREATE INDEX `careers_codigo_idx` ON `careers`(`codigo`)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @index_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
  WHERE TABLE_SCHEMA = 'sipi_db' AND TABLE_NAME = 'careers' AND INDEX_NAME = 'careers_area_idx');
SET @sql = IF(@index_exists = 0, 'CREATE INDEX `careers_area_idx` ON `careers`(`area`)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @index_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
  WHERE TABLE_SCHEMA = 'sipi_db' AND TABLE_NAME = 'careers' AND INDEX_NAME = 'careers_estatus_idx');
SET @sql = IF(@index_exists = 0, 'CREATE INDEX `careers_estatus_idx` ON `careers`(`estatus`)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @index_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
  WHERE TABLE_SCHEMA = 'sipi_db' AND TABLE_NAME = 'careers' AND INDEX_NAME = 'careers_deletedAt_idx');
SET @sql = IF(@index_exists = 0, 'CREATE INDEX `careers_deletedAt_idx` ON `careers`(`deletedAt`)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Insert careers from existing students
INSERT IGNORE INTO `careers` (`id`, `codigo`, `nombre`, `nombreCorto`, `area`, `duracionSemestres`, `estatus`)
SELECT 
  UUID() as id,
  UPPER(REPLACE(REPLACE(REPLACE(carrera, ' ', ''), '-', ''), '_', '')) as codigo,
  carrera as nombre,
  LEFT(carrera, 10) as nombreCorto,
  CASE 
    WHEN carrera LIKE '%Ingenier%' THEN 'Ingeniería'
    WHEN carrera LIKE '%Ciencias%' THEN 'Ciencias'
    WHEN carrera LIKE '%Administraci%' THEN 'Administración'
    WHEN carrera LIKE '%Derecho%' THEN 'Derecho'
    WHEN carrera LIKE '%Medicina%' THEN 'Medicina'
    ELSE 'General'
  END as area,
  8 as duracionSemestres,
  'ACTIVA' as estatus
FROM (SELECT DISTINCT carrera FROM students WHERE carrera IS NOT NULL AND carrera != '') as distinct_careers;

-- ============================================
-- STUDENTS TABLE - Add Career Relation
-- ============================================

-- Add carreraId column (if not exists)
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = 'sipi_db' AND TABLE_NAME = 'students' AND COLUMN_NAME = 'carreraId');
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `students` ADD COLUMN `carreraId` VARCHAR(191) NULL',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add foreign key constraint
SET @fk_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
  WHERE TABLE_SCHEMA = 'sipi_db' AND TABLE_NAME = 'students' AND CONSTRAINT_NAME = 'students_carreraId_fkey');
SET @sql = IF(@fk_exists = 0,
  'ALTER TABLE `students` ADD CONSTRAINT `students_carreraId_fkey` FOREIGN KEY (`carreraId`) REFERENCES `careers`(`id`) ON DELETE SET NULL',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Update carreraId based on carrera string
UPDATE `students` s
JOIN `careers` c ON UPPER(REPLACE(REPLACE(REPLACE(s.carrera, ' ', ''), '-', ''), '_', '')) = c.codigo
SET s.carreraId = c.id
WHERE s.carreraId IS NULL;

-- Create index
SET @index_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
  WHERE TABLE_SCHEMA = 'sipi_db' AND TABLE_NAME = 'students' AND INDEX_NAME = 'students_carreraId_idx');
SET @sql = IF(@index_exists = 0, 'CREATE INDEX `students_carreraId_idx` ON `students`(`carreraId`)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @index_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
  WHERE TABLE_SCHEMA = 'sipi_db' AND TABLE_NAME = 'students' AND INDEX_NAME = 'students_carreraId_semestre_idx');
SET @sql = IF(@index_exists = 0, 'CREATE INDEX `students_carreraId_semestre_idx` ON `students`(`carreraId`, `semestre`)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- SUBJECTS TABLE - Enhanced Information
-- ============================================

-- Add tipo enum column (if not exists)
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = 'sipi_db' AND TABLE_NAME = 'subjects' AND COLUMN_NAME = 'tipo');
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `subjects` ADD COLUMN `tipo` ENUM(\'OBLIGATORIA\', \'OPTATIVA\', \'ELECTIVA\', \'SERVICIO_SOCIAL\') NOT NULL DEFAULT \'OBLIGATORIA\'',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add estatus enum column (if not exists)
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = 'sipi_db' AND TABLE_NAME = 'subjects' AND COLUMN_NAME = 'estatus');
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `subjects` ADD COLUMN `estatus` ENUM(\'ACTIVA\', \'INACTIVA\', \'DESCONTINUADA\', \'EN_REVISION\') NOT NULL DEFAULT \'ACTIVA\'',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add nivel (if not exists)
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = 'sipi_db' AND TABLE_NAME = 'subjects' AND COLUMN_NAME = 'nivel');
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `subjects` ADD COLUMN `nivel` INT NULL',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add hours breakdown (if not exists)
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = 'sipi_db' AND TABLE_NAME = 'subjects' AND COLUMN_NAME = 'horasTeoria');
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `subjects` ADD COLUMN `horasTeoria` INT NULL DEFAULT 0, ADD COLUMN `horasPractica` INT NULL DEFAULT 0, ADD COLUMN `horasLaboratorio` INT NULL DEFAULT 0',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add carreraId (if not exists)
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = 'sipi_db' AND TABLE_NAME = 'subjects' AND COLUMN_NAME = 'carreraId');
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `subjects` ADD COLUMN `carreraId` VARCHAR(191) NULL',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add foreign key constraint
SET @fk_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
  WHERE TABLE_SCHEMA = 'sipi_db' AND TABLE_NAME = 'subjects' AND CONSTRAINT_NAME = 'subjects_carreraId_fkey');
SET @sql = IF(@fk_exists = 0,
  'ALTER TABLE `subjects` ADD CONSTRAINT `subjects_carreraId_fkey` FOREIGN KEY (`carreraId`) REFERENCES `careers`(`id`) ON DELETE SET NULL',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add description (if not exists)
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = 'sipi_db' AND TABLE_NAME = 'subjects' AND COLUMN_NAME = 'descripcion');
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `subjects` ADD COLUMN `descripcion` TEXT NULL',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add metrics (if not exists)
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = 'sipi_db' AND TABLE_NAME = 'subjects' AND COLUMN_NAME = 'gruposActivos');
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `subjects` ADD COLUMN `gruposActivos` INT NOT NULL DEFAULT 0, ADD COLUMN `estudiantesInscritos` INT NOT NULL DEFAULT 0',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Calculate initial gruposActivos
UPDATE `subjects` s
INNER JOIN (
  SELECT subjectId, COUNT(*) as total
  FROM `groups`
  WHERE deletedAt IS NULL AND estatus IN ('ABIERTO', 'EN_CURSO')
  GROUP BY subjectId
) g ON s.id = g.subjectId
SET s.gruposActivos = g.total;

-- Calculate initial estudiantesInscritos
UPDATE `subjects` s
INNER JOIN (
  SELECT g.subjectId, COUNT(DISTINCT e.studentId) as total
  FROM `enrollments` e
  JOIN `groups` g ON e.groupId = g.id
  WHERE e.deletedAt IS NULL AND e.estatus IN ('INSCRITO', 'EN_CURSO')
  GROUP BY g.subjectId
) e ON s.id = e.subjectId
SET s.estudiantesInscritos = e.total;

-- Create indexes
SET @index_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
  WHERE TABLE_SCHEMA = 'sipi_db' AND TABLE_NAME = 'subjects' AND INDEX_NAME = 'subjects_tipo_idx');
SET @sql = IF(@index_exists = 0, 'CREATE INDEX `subjects_tipo_idx` ON `subjects`(`tipo`)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @index_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
  WHERE TABLE_SCHEMA = 'sipi_db' AND TABLE_NAME = 'subjects' AND INDEX_NAME = 'subjects_estatus_idx');
SET @sql = IF(@index_exists = 0, 'CREATE INDEX `subjects_estatus_idx` ON `subjects`(`estatus`)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @index_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
  WHERE TABLE_SCHEMA = 'sipi_db' AND TABLE_NAME = 'subjects' AND INDEX_NAME = 'subjects_nivel_idx');
SET @sql = IF(@index_exists = 0, 'CREATE INDEX `subjects_nivel_idx` ON `subjects`(`nivel`)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @index_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
  WHERE TABLE_SCHEMA = 'sipi_db' AND TABLE_NAME = 'subjects' AND INDEX_NAME = 'subjects_carreraId_idx');
SET @sql = IF(@index_exists = 0, 'CREATE INDEX `subjects_carreraId_idx` ON `subjects`(`carreraId`)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @index_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
  WHERE TABLE_SCHEMA = 'sipi_db' AND TABLE_NAME = 'subjects' AND INDEX_NAME = 'subjects_carreraId_tipo_idx');
SET @sql = IF(@index_exists = 0, 'CREATE INDEX `subjects_carreraId_tipo_idx` ON `subjects`(`carreraId`, `tipo`)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- PREREQUISITES TABLE - New Entity
-- ============================================

CREATE TABLE IF NOT EXISTS `prerequisites` (
  `id` VARCHAR(191) NOT NULL PRIMARY KEY,
  `subjectId` VARCHAR(191) NOT NULL,
  `requiredSubjectId` VARCHAR(191) NOT NULL,
  `tipo` ENUM('OBLIGATORIO', 'OPCIONAL', 'CORREQUISITO') NOT NULL DEFAULT 'OBLIGATORIO',
  `semestreMinimo` INT NULL,
  `notaMinima` DECIMAL(5,2) NULL,
  `descripcion` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY `prerequisites_subjectId_requiredSubjectId_key` (`subjectId`, `requiredSubjectId`),
  CONSTRAINT `prerequisites_subjectId_fkey` FOREIGN KEY (`subjectId`) REFERENCES `subjects`(`id`) ON DELETE CASCADE,
  CONSTRAINT `prerequisites_requiredSubjectId_fkey` FOREIGN KEY (`requiredSubjectId`) REFERENCES `subjects`(`id`) ON DELETE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create indexes
SET @index_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
  WHERE TABLE_SCHEMA = 'sipi_db' AND TABLE_NAME = 'prerequisites' AND INDEX_NAME = 'prerequisites_subjectId_idx');
SET @sql = IF(@index_exists = 0, 'CREATE INDEX `prerequisites_subjectId_idx` ON `prerequisites`(`subjectId`)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @index_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
  WHERE TABLE_SCHEMA = 'sipi_db' AND TABLE_NAME = 'prerequisites' AND INDEX_NAME = 'prerequisites_requiredSubjectId_idx');
SET @sql = IF(@index_exists = 0, 'CREATE INDEX `prerequisites_requiredSubjectId_idx` ON `prerequisites`(`requiredSubjectId`)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @index_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
  WHERE TABLE_SCHEMA = 'sipi_db' AND TABLE_NAME = 'prerequisites' AND INDEX_NAME = 'prerequisites_tipo_idx');
SET @sql = IF(@index_exists = 0, 'CREATE INDEX `prerequisites_tipo_idx` ON `prerequisites`(`tipo`)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

