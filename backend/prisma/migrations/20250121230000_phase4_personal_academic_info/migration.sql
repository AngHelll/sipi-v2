-- Migration: Phase 4 - Personal and Academic Information
-- Description: Add personal information to Students and academic/work information to Teachers
-- Date: 2025-01-21

-- ============================================
-- STUDENTS TABLE - Personal and Academic Information
-- ============================================

-- Add personal information (if not exists)
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = 'sipi_db' AND TABLE_NAME = 'students' AND COLUMN_NAME = 'fechaNacimiento');
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `students` ADD COLUMN `fechaNacimiento` DATETIME(3) NULL',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add genero enum (if not exists)
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = 'sipi_db' AND TABLE_NAME = 'students' AND COLUMN_NAME = 'genero');
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `students` ADD COLUMN `genero` ENUM(\'MASCULINO\', \'FEMENINO\', \'OTRO\', \'PREFIERO_NO_DECIR\') NULL',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add nationality and birth place (if not exists)
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = 'sipi_db' AND TABLE_NAME = 'students' AND COLUMN_NAME = 'nacionalidad');
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `students` ADD COLUMN `nacionalidad` VARCHAR(50) NULL, ADD COLUMN `lugarNacimiento` VARCHAR(200) NULL',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add address information (if not exists)
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = 'sipi_db' AND TABLE_NAME = 'students' AND COLUMN_NAME = 'direccion');
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `students` ADD COLUMN `direccion` VARCHAR(500) NULL, ADD COLUMN `ciudad` VARCHAR(100) NULL, ADD COLUMN `estado` VARCHAR(100) NULL, ADD COLUMN `codigoPostal` VARCHAR(10) NULL, ADD COLUMN `pais` VARCHAR(50) NULL DEFAULT \'México\'',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add academic information (if not exists)
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = 'sipi_db' AND TABLE_NAME = 'students' AND COLUMN_NAME = 'tipoIngreso');
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `students` ADD COLUMN `tipoIngreso` ENUM(\'NUEVO_INGRESO\', \'REINGRESO\', \'TRANSFERENCIA\', \'EQUIVALENCIA\') NULL DEFAULT \'NUEVO_INGRESO\', ADD COLUMN `fechaIngreso` DATETIME(3) NULL, ADD COLUMN `fechaEgreso` DATETIME(3) NULL',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add academic metrics (if not exists)
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = 'sipi_db' AND TABLE_NAME = 'students' AND COLUMN_NAME = 'promedioGeneral');
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `students` ADD COLUMN `promedioGeneral` DECIMAL(5,2) NULL, ADD COLUMN `creditosCursados` INT NOT NULL DEFAULT 0, ADD COLUMN `creditosAprobados` INT NOT NULL DEFAULT 0, ADD COLUMN `creditosTotales` INT NULL',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add administrative information (if not exists)
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = 'sipi_db' AND TABLE_NAME = 'students' AND COLUMN_NAME = 'beca');
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `students` ADD COLUMN `beca` BOOLEAN NOT NULL DEFAULT FALSE, ADD COLUMN `tipoBeca` VARCHAR(50) NULL, ADD COLUMN `observaciones` TEXT NULL',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Set fechaIngreso to createdAt for existing students (if null)
UPDATE `students`
SET `fechaIngreso` = `createdAt`
WHERE `fechaIngreso` IS NULL;

-- Create indexes
SET @index_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
  WHERE TABLE_SCHEMA = 'sipi_db' AND TABLE_NAME = 'students' AND INDEX_NAME = 'students_genero_idx');
SET @sql = IF(@index_exists = 0, 'CREATE INDEX `students_genero_idx` ON `students`(`genero`)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @index_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
  WHERE TABLE_SCHEMA = 'sipi_db' AND TABLE_NAME = 'students' AND INDEX_NAME = 'students_tipoIngreso_idx');
SET @sql = IF(@index_exists = 0, 'CREATE INDEX `students_tipoIngreso_idx` ON `students`(`tipoIngreso`)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @index_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
  WHERE TABLE_SCHEMA = 'sipi_db' AND TABLE_NAME = 'students' AND INDEX_NAME = 'students_fechaIngreso_idx');
SET @sql = IF(@index_exists = 0, 'CREATE INDEX `students_fechaIngreso_idx` ON `students`(`fechaIngreso`)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- TEACHERS TABLE - Academic and Work Information
-- ============================================

-- Add academic information (if not exists)
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = 'sipi_db' AND TABLE_NAME = 'teachers' AND COLUMN_NAME = 'gradoAcademico');
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `teachers` ADD COLUMN `gradoAcademico` VARCHAR(100) NULL, ADD COLUMN `especialidad` VARCHAR(200) NULL, ADD COLUMN `cedulaProfesional` VARCHAR(50) NULL, ADD COLUMN `universidad` VARCHAR(200) NULL',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add unique constraint for cedulaProfesional if it doesn't exist
SET @index_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
  WHERE TABLE_SCHEMA = 'sipi_db' AND TABLE_NAME = 'teachers' AND INDEX_NAME = 'teachers_cedulaProfesional_key');
SET @sql = IF(@index_exists = 0,
  'ALTER TABLE `teachers` ADD UNIQUE KEY `teachers_cedulaProfesional_key` (`cedulaProfesional`)',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add work information (if not exists)
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = 'sipi_db' AND TABLE_NAME = 'teachers' AND COLUMN_NAME = 'tipoContrato');
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `teachers` ADD COLUMN `tipoContrato` ENUM(\'TIEMPO_COMPLETO\', \'MEDIO_TIEMPO\', \'POR_HONORARIOS\', \'INTERINO\') NULL DEFAULT \'TIEMPO_COMPLETO\', ADD COLUMN `fechaContratacion` DATETIME(3) NULL',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add estatus enum (if not exists)
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = 'sipi_db' AND TABLE_NAME = 'teachers' AND COLUMN_NAME = 'estatus');
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `teachers` ADD COLUMN `estatus` ENUM(\'ACTIVO\', \'INACTIVO\', \'JUBILADO\', \'LICENCIA\') NOT NULL DEFAULT \'ACTIVO\'',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add salary (if not exists)
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = 'sipi_db' AND TABLE_NAME = 'teachers' AND COLUMN_NAME = 'salario');
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `teachers` ADD COLUMN `salario` DECIMAL(10,2) NULL',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add address (if not exists)
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = 'sipi_db' AND TABLE_NAME = 'teachers' AND COLUMN_NAME = 'direccion');
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `teachers` ADD COLUMN `direccion` VARCHAR(500) NULL',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add metrics (if not exists)
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = 'sipi_db' AND TABLE_NAME = 'teachers' AND COLUMN_NAME = 'gruposAsignados');
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `teachers` ADD COLUMN `gruposAsignados` INT NOT NULL DEFAULT 0, ADD COLUMN `estudiantesTotal` INT NOT NULL DEFAULT 0',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add administrative (if not exists)
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = 'sipi_db' AND TABLE_NAME = 'teachers' AND COLUMN_NAME = 'observaciones');
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `teachers` ADD COLUMN `observaciones` TEXT NULL',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Set fechaContratacion to createdAt for existing teachers (if null)
UPDATE `teachers`
SET `fechaContratacion` = `createdAt`
WHERE `fechaContratacion` IS NULL;

-- Calculate initial gruposAsignados
UPDATE `teachers` t
INNER JOIN (
  SELECT teacherId, COUNT(*) as total
  FROM `groups`
  WHERE deletedAt IS NULL AND estatus IN ('ABIERTO', 'EN_CURSO')
  GROUP BY teacherId
) g ON t.id = g.teacherId
SET t.gruposAsignados = g.total;

-- Calculate initial estudiantesTotal
UPDATE `teachers` t
INNER JOIN (
  SELECT g.teacherId, COUNT(DISTINCT e.studentId) as total
  FROM `enrollments` e
  JOIN `groups` g ON e.groupId = g.id
  WHERE e.deletedAt IS NULL AND e.estatus IN ('INSCRITO', 'EN_CURSO')
  GROUP BY g.teacherId
) e ON t.id = e.teacherId
SET t.estudiantesTotal = e.total;

-- Create indexes
SET @index_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
  WHERE TABLE_SCHEMA = 'sipi_db' AND TABLE_NAME = 'teachers' AND INDEX_NAME = 'teachers_gradoAcademico_idx');
SET @sql = IF(@index_exists = 0, 'CREATE INDEX `teachers_gradoAcademico_idx` ON `teachers`(`gradoAcademico`)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @index_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
  WHERE TABLE_SCHEMA = 'sipi_db' AND TABLE_NAME = 'teachers' AND INDEX_NAME = 'teachers_tipoContrato_idx');
SET @sql = IF(@index_exists = 0, 'CREATE INDEX `teachers_tipoContrato_idx` ON `teachers`(`tipoContrato`)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @index_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
  WHERE TABLE_SCHEMA = 'sipi_db' AND TABLE_NAME = 'teachers' AND INDEX_NAME = 'teachers_estatus_idx');
SET @sql = IF(@index_exists = 0, 'CREATE INDEX `teachers_estatus_idx` ON `teachers`(`estatus`)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @index_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
  WHERE TABLE_SCHEMA = 'sipi_db' AND TABLE_NAME = 'teachers' AND INDEX_NAME = 'teachers_cedulaProfesional_idx');
SET @sql = IF(@index_exists = 0, 'CREATE INDEX `teachers_cedulaProfesional_idx` ON `teachers`(`cedulaProfesional`)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

