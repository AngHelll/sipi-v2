-- Migration: Phase 5 - History and Documents
-- Description: Add enrollment history, academic history, and student documents management
-- Date: 2025-01-21

-- ============================================
-- ENROLLMENT_HISTORY TABLE - New Entity
-- ============================================

CREATE TABLE IF NOT EXISTS `enrollment_history` (
  `id` VARCHAR(191) NOT NULL PRIMARY KEY,
  `enrollmentId` VARCHAR(191) NOT NULL,
  `accion` ENUM('CREATED', 'UPDATED', 'DELETED', 'STATUS_CHANGED', 'GRADE_UPDATED', 'ATTENDANCE_UPDATED') NOT NULL,
  `campoAnterior` VARCHAR(100) NULL,
  `valorAnterior` TEXT NULL,
  `valorNuevo` TEXT NULL,
  `descripcion` TEXT NULL,
  `realizadoPor` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT `enrollment_history_enrollmentId_fkey` FOREIGN KEY (`enrollmentId`) REFERENCES `enrollments`(`id`) ON DELETE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create indexes
SET @index_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
  WHERE TABLE_SCHEMA = 'sipi_db' AND TABLE_NAME = 'enrollment_history' AND INDEX_NAME = 'enrollment_history_enrollmentId_idx');
SET @sql = IF(@index_exists = 0, 'CREATE INDEX `enrollment_history_enrollmentId_idx` ON `enrollment_history`(`enrollmentId`)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @index_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
  WHERE TABLE_SCHEMA = 'sipi_db' AND TABLE_NAME = 'enrollment_history' AND INDEX_NAME = 'enrollment_history_accion_idx');
SET @sql = IF(@index_exists = 0, 'CREATE INDEX `enrollment_history_accion_idx` ON `enrollment_history`(`accion`)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @index_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
  WHERE TABLE_SCHEMA = 'sipi_db' AND TABLE_NAME = 'enrollment_history' AND INDEX_NAME = 'enrollment_history_realizadoPor_idx');
SET @sql = IF(@index_exists = 0, 'CREATE INDEX `enrollment_history_realizadoPor_idx` ON `enrollment_history`(`realizadoPor`)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @index_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
  WHERE TABLE_SCHEMA = 'sipi_db' AND TABLE_NAME = 'enrollment_history' AND INDEX_NAME = 'enrollment_history_createdAt_idx');
SET @sql = IF(@index_exists = 0, 'CREATE INDEX `enrollment_history_createdAt_idx` ON `enrollment_history`(`createdAt`)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @index_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
  WHERE TABLE_SCHEMA = 'sipi_db' AND TABLE_NAME = 'enrollment_history' AND INDEX_NAME = 'enrollment_history_enrollmentId_createdAt_idx');
SET @sql = IF(@index_exists = 0, 'CREATE INDEX `enrollment_history_enrollmentId_createdAt_idx` ON `enrollment_history`(`enrollmentId`, `createdAt`)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- ACADEMIC_HISTORY TABLE - New Entity
-- ============================================

CREATE TABLE IF NOT EXISTS `academic_history` (
  `id` VARCHAR(191) NOT NULL PRIMARY KEY,
  `studentId` VARCHAR(191) NOT NULL,
  `periodoId` VARCHAR(191) NULL,
  `periodo` VARCHAR(20) NOT NULL,
  `promedioPeriodo` DECIMAL(5,2) NULL,
  `creditosCursados` INT NOT NULL DEFAULT 0,
  `creditosAprobados` INT NOT NULL DEFAULT 0,
  `materiasCursadas` INT NOT NULL DEFAULT 0,
  `materiasAprobadas` INT NOT NULL DEFAULT 0,
  `materiasReprobadas` INT NOT NULL DEFAULT 0,
  `promedioAcumulado` DECIMAL(5,2) NULL,
  `creditosAcumulados` INT NOT NULL DEFAULT 0,
  `creditosAprobadosAcumulados` INT NOT NULL DEFAULT 0,
  `estatus` VARCHAR(50) NULL,
  `fechaInicio` DATETIME(3) NULL,
  `fechaFin` DATETIME(3) NULL,
  `observaciones` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY `academic_history_studentId_periodo_key` (`studentId`, `periodo`),
  CONSTRAINT `academic_history_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE,
  CONSTRAINT `academic_history_periodoId_fkey` FOREIGN KEY (`periodoId`) REFERENCES `academic_periods`(`id`) ON DELETE SET NULL
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create indexes
SET @index_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
  WHERE TABLE_SCHEMA = 'sipi_db' AND TABLE_NAME = 'academic_history' AND INDEX_NAME = 'academic_history_studentId_idx');
SET @sql = IF(@index_exists = 0, 'CREATE INDEX `academic_history_studentId_idx` ON `academic_history`(`studentId`)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @index_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
  WHERE TABLE_SCHEMA = 'sipi_db' AND TABLE_NAME = 'academic_history' AND INDEX_NAME = 'academic_history_periodoId_idx');
SET @sql = IF(@index_exists = 0, 'CREATE INDEX `academic_history_periodoId_idx` ON `academic_history`(`periodoId`)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @index_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
  WHERE TABLE_SCHEMA = 'sipi_db' AND TABLE_NAME = 'academic_history' AND INDEX_NAME = 'academic_history_periodo_idx');
SET @sql = IF(@index_exists = 0, 'CREATE INDEX `academic_history_periodo_idx` ON `academic_history`(`periodo`)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @index_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
  WHERE TABLE_SCHEMA = 'sipi_db' AND TABLE_NAME = 'academic_history' AND INDEX_NAME = 'academic_history_studentId_periodo_idx');
SET @sql = IF(@index_exists = 0, 'CREATE INDEX `academic_history_studentId_periodo_idx` ON `academic_history`(`studentId`, `periodo`)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @index_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
  WHERE TABLE_SCHEMA = 'sipi_db' AND TABLE_NAME = 'academic_history' AND INDEX_NAME = 'academic_history_fechaInicio_fechaFin_idx');
SET @sql = IF(@index_exists = 0, 'CREATE INDEX `academic_history_fechaInicio_fechaFin_idx` ON `academic_history`(`fechaInicio`, `fechaFin`)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- STUDENT_DOCUMENTS TABLE - New Entity
-- ============================================

CREATE TABLE IF NOT EXISTS `student_documents` (
  `id` VARCHAR(191) NOT NULL PRIMARY KEY,
  `studentId` VARCHAR(191) NOT NULL,
  `tipo` ENUM('ACTA_NACIMIENTO', 'CURP', 'CERTIFICADO_PREPARATORIA', 'FOTOGRAFIA', 'COMPROBANTE_DOMICILIO', 'CARTA_NO_ADECUDO', 'CERTIFICADO_MEDICO', 'OTRO') NOT NULL,
  `nombre` VARCHAR(200) NOT NULL,
  `descripcion` TEXT NULL,
  `archivoUrl` VARCHAR(500) NULL,
  `archivoNombre` VARCHAR(255) NULL,
  `tamanoArchivo` INT NULL,
  `tipoArchivo` VARCHAR(50) NULL,
  `estatus` ENUM('PENDIENTE', 'EN_REVISION', 'APROBADO', 'RECHAZADO', 'VENCIDO') NOT NULL DEFAULT 'PENDIENTE',
  `fechaSubida` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `fechaVencimiento` DATETIME(3) NULL,
  `fechaAprobacion` DATETIME(3) NULL,
  `fechaRechazo` DATETIME(3) NULL,
  `revisadoPor` VARCHAR(191) NULL,
  `motivoRechazo` TEXT NULL,
  `observaciones` TEXT NULL,
  `deletedAt` DATETIME(3) NULL,
  `createdBy` VARCHAR(191) NULL,
  `updatedBy` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT `student_documents_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create indexes
SET @index_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
  WHERE TABLE_SCHEMA = 'sipi_db' AND TABLE_NAME = 'student_documents' AND INDEX_NAME = 'student_documents_studentId_idx');
SET @sql = IF(@index_exists = 0, 'CREATE INDEX `student_documents_studentId_idx` ON `student_documents`(`studentId`)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @index_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
  WHERE TABLE_SCHEMA = 'sipi_db' AND TABLE_NAME = 'student_documents' AND INDEX_NAME = 'student_documents_tipo_idx');
SET @sql = IF(@index_exists = 0, 'CREATE INDEX `student_documents_tipo_idx` ON `student_documents`(`tipo`)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @index_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
  WHERE TABLE_SCHEMA = 'sipi_db' AND TABLE_NAME = 'student_documents' AND INDEX_NAME = 'student_documents_estatus_idx');
SET @sql = IF(@index_exists = 0, 'CREATE INDEX `student_documents_estatus_idx` ON `student_documents`(`estatus`)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @index_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
  WHERE TABLE_SCHEMA = 'sipi_db' AND TABLE_NAME = 'student_documents' AND INDEX_NAME = 'student_documents_fechaVencimiento_idx');
SET @sql = IF(@index_exists = 0, 'CREATE INDEX `student_documents_fechaVencimiento_idx` ON `student_documents`(`fechaVencimiento`)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @index_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
  WHERE TABLE_SCHEMA = 'sipi_db' AND TABLE_NAME = 'student_documents' AND INDEX_NAME = 'student_documents_deletedAt_idx');
SET @sql = IF(@index_exists = 0, 'CREATE INDEX `student_documents_deletedAt_idx` ON `student_documents`(`deletedAt`)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @index_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
  WHERE TABLE_SCHEMA = 'sipi_db' AND TABLE_NAME = 'student_documents' AND INDEX_NAME = 'student_documents_studentId_tipo_estatus_idx');
SET @sql = IF(@index_exists = 0, 'CREATE INDEX `student_documents_studentId_tipo_estatus_idx` ON `student_documents`(`studentId`, `tipo`, `estatus`)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

