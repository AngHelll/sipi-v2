-- V2: Academic Activities (inglés, exámenes, cursos especiales)
-- Canon: /api/academic-activities/*
--
-- Si estas tablas ya existen (p. ej. aplicadas con db push), marcar como aplicada sin ejecutar:
--   npx prisma migrate resolve --applied 20260524100000_add_academic_activities_v2

-- diagnostic_exam_periods (sin dependencias V2)
CREATE TABLE `diagnostic_exam_periods` (
    `id` VARCHAR(191) NOT NULL,
    `nombre` VARCHAR(200) NOT NULL,
    `descripcion` TEXT NULL,
    `fechaInicio` DATETIME(3) NOT NULL,
    `fechaFin` DATETIME(3) NOT NULL,
    `fechaInscripcionInicio` DATETIME(3) NOT NULL,
    `fechaInscripcionFin` DATETIME(3) NOT NULL,
    `cupoMaximo` INTEGER NOT NULL DEFAULT 100,
    `cupoActual` INTEGER NOT NULL DEFAULT 0,
    `estatus` ENUM('PLANEADO', 'ABIERTO', 'CERRADO', 'EN_PROCESO', 'FINALIZADO') NOT NULL DEFAULT 'PLANEADO',
    `requierePago` BOOLEAN NOT NULL DEFAULT false,
    `montoPago` DECIMAL(10, 2) NULL,
    `observaciones` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,
    `createdBy` VARCHAR(191) NULL,
    `updatedBy` VARCHAR(191) NULL,

    INDEX `diagnostic_exam_periods_estatus_idx`(`estatus`),
    INDEX `diagnostic_exam_periods_fechaInscripcionInicio_fechaInscripcionFin_idx`(`fechaInscripcionInicio`, `fechaInscripcionFin`),
    INDEX `diagnostic_exam_periods_deletedAt_idx`(`deletedAt`),
    INDEX `diagnostic_exam_periods_fechaInicio_fechaFin_idx`(`fechaInicio`, `fechaFin`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- academic_activities (tabla base polimórfica)
CREATE TABLE `academic_activities` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `activityType` ENUM('ENROLLMENT', 'EXAM', 'SPECIAL_COURSE', 'SOCIAL_SERVICE', 'PROFESSIONAL_PRACTICE') NOT NULL,
    `codigo` VARCHAR(30) NOT NULL,
    `estatus` ENUM('INSCRITO', 'EN_CURSO', 'BAJA', 'APROBADO', 'REPROBADO', 'EVALUADO', 'CANCELADO', 'PENDIENTE_PAGO', 'PAGO_PENDIENTE_APROBACION', 'PAGO_APROBADO', 'COMPLETADO', 'EN_REVISION') NOT NULL DEFAULT 'INSCRITO',
    `fechaInscripcion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `fechaBaja` DATETIME(3) NULL,
    `observaciones` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,
    `createdBy` VARCHAR(191) NULL,
    `updatedBy` VARCHAR(191) NULL,

    UNIQUE INDEX `academic_activities_codigo_key`(`codigo`),
    INDEX `academic_activities_studentId_idx`(`studentId`),
    INDEX `academic_activities_activityType_idx`(`activityType`),
    INDEX `academic_activities_estatus_idx`(`estatus`),
    INDEX `academic_activities_fechaInscripcion_idx`(`fechaInscripcion`),
    INDEX `academic_activities_deletedAt_idx`(`deletedAt`),
    INDEX `academic_activities_studentId_activityType_idx`(`studentId`, `activityType`),
    INDEX `academic_activities_studentId_estatus_idx`(`studentId`, `estatus`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `enrollments_v2` (
    `id` VARCHAR(191) NOT NULL,
    `activityId` VARCHAR(191) NOT NULL,
    `groupId` VARCHAR(191) NOT NULL,
    `calificacion` DECIMAL(5, 2) NULL,
    `calificacionParcial1` DECIMAL(5, 2) NULL,
    `calificacionParcial2` DECIMAL(5, 2) NULL,
    `calificacionParcial3` DECIMAL(5, 2) NULL,
    `calificacionFinal` DECIMAL(5, 2) NULL,
    `calificacionExtra` DECIMAL(5, 2) NULL,
    `asistencias` INTEGER NOT NULL DEFAULT 0,
    `faltas` INTEGER NOT NULL DEFAULT 0,
    `retardos` INTEGER NOT NULL DEFAULT 0,
    `porcentajeAsistencia` DECIMAL(5, 2) NULL,
    `aprobado` BOOLEAN NULL,
    `fechaAprobacion` DATETIME(3) NULL,

    UNIQUE INDEX `enrollments_v2_activityId_key`(`activityId`),
    INDEX `enrollments_v2_activityId_idx`(`activityId`),
    INDEX `enrollments_v2_groupId_idx`(`groupId`),
    INDEX `enrollments_v2_aprobado_idx`(`aprobado`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `exams` (
    `id` VARCHAR(191) NOT NULL,
    `activityId` VARCHAR(191) NOT NULL,
    `examType` ENUM('DIAGNOSTICO', 'ADMISION', 'CERTIFICACION', 'EXTRAORDINARIO', 'REGULAR', 'RECUPERACION', 'TITULACION') NOT NULL,
    `subjectId` VARCHAR(191) NULL,
    `nivelIngles` INTEGER NULL,
    `periodId` VARCHAR(191) NULL,
    `resultado` DECIMAL(5, 2) NULL,
    `fechaExamen` DATETIME(3) NULL,
    `fechaResultado` DATETIME(3) NULL,
    `requierePago` BOOLEAN NOT NULL DEFAULT false,
    `pagoAprobado` BOOLEAN NULL,
    `fechaPagoAprobado` DATETIME(3) NULL,
    `montoPago` DECIMAL(10, 2) NULL,
    `comprobantePago` VARCHAR(255) NULL,

    UNIQUE INDEX `exams_activityId_key`(`activityId`),
    INDEX `exams_activityId_idx`(`activityId`),
    INDEX `exams_examType_idx`(`examType`),
    INDEX `exams_subjectId_idx`(`subjectId`),
    INDEX `exams_nivelIngles_idx`(`nivelIngles`),
    INDEX `exams_requierePago_idx`(`requierePago`),
    INDEX `exams_periodId_idx`(`periodId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `special_courses` (
    `id` VARCHAR(191) NOT NULL,
    `activityId` VARCHAR(191) NOT NULL,
    `courseType` ENUM('INGLES', 'VERANO', 'EXTRACURRICULAR', 'TALLER', 'SEMINARIO', 'DIPLOMADO', 'CERTIFICACION') NOT NULL,
    `nivelIngles` INTEGER NULL,
    `groupId` VARCHAR(191) NULL,
    `calificacion` DECIMAL(5, 2) NULL,
    `aprobado` BOOLEAN NULL,
    `fechaAprobacion` DATETIME(3) NULL,
    `requierePago` BOOLEAN NOT NULL DEFAULT true,
    `pagoAprobado` BOOLEAN NULL,
    `fechaPagoAprobado` DATETIME(3) NULL,
    `montoPago` DECIMAL(10, 2) NULL,
    `comprobantePago` VARCHAR(255) NULL,
    `fechaInicio` DATETIME(3) NULL,
    `completadoPorDiagnostico` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `special_courses_activityId_key`(`activityId`),
    INDEX `special_courses_activityId_idx`(`activityId`),
    INDEX `special_courses_courseType_idx`(`courseType`),
    INDEX `special_courses_nivelIngles_idx`(`nivelIngles`),
    INDEX `special_courses_groupId_idx`(`groupId`),
    INDEX `special_courses_requierePago_idx`(`requierePago`),
    INDEX `special_courses_fechaInicio_idx`(`fechaInicio`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `social_service` (
    `id` VARCHAR(191) NOT NULL,
    `activityId` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NULL,
    `organizationName` VARCHAR(200) NOT NULL,
    `organizationType` VARCHAR(50) NULL,
    `horasRequeridas` INTEGER NOT NULL,
    `horasCompletadas` INTEGER NOT NULL DEFAULT 0,
    `supervisor` VARCHAR(200) NULL,
    `supervisorEmail` VARCHAR(255) NULL,
    `supervisorPhone` VARCHAR(20) NULL,
    `fechaInicio` DATETIME(3) NULL,
    `fechaFin` DATETIME(3) NULL,
    `fechaAprobacion` DATETIME(3) NULL,
    `aprobado` BOOLEAN NULL,
    `calificacion` DECIMAL(5, 2) NULL,

    UNIQUE INDEX `social_service_activityId_key`(`activityId`),
    INDEX `social_service_activityId_idx`(`activityId`),
    INDEX `social_service_organizationId_idx`(`organizationId`),
    INDEX `social_service_aprobado_idx`(`aprobado`),
    INDEX `social_service_fechaInicio_fechaFin_idx`(`fechaInicio`, `fechaFin`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `professional_practices` (
    `id` VARCHAR(191) NOT NULL,
    `activityId` VARCHAR(191) NOT NULL,
    `companyId` VARCHAR(191) NULL,
    `companyName` VARCHAR(200) NOT NULL,
    `companyType` VARCHAR(50) NULL,
    `periodo` VARCHAR(50) NOT NULL,
    `periodoId` VARCHAR(191) NULL,
    `horasRequeridas` INTEGER NOT NULL,
    `horasCompletadas` INTEGER NOT NULL DEFAULT 0,
    `supervisor` VARCHAR(200) NULL,
    `supervisorEmail` VARCHAR(255) NULL,
    `supervisorPhone` VARCHAR(20) NULL,
    `fechaInicio` DATETIME(3) NULL,
    `fechaFin` DATETIME(3) NULL,
    `fechaAprobacion` DATETIME(3) NULL,
    `aprobado` BOOLEAN NULL,
    `calificacion` DECIMAL(5, 2) NULL,

    UNIQUE INDEX `professional_practices_activityId_key`(`activityId`),
    INDEX `professional_practices_activityId_idx`(`activityId`),
    INDEX `professional_practices_companyId_idx`(`companyId`),
    INDEX `professional_practices_periodoId_idx`(`periodoId`),
    INDEX `professional_practices_aprobado_idx`(`aprobado`),
    INDEX `professional_practices_fechaInicio_fechaFin_idx`(`fechaInicio`, `fechaFin`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `activity_history` (
    `id` VARCHAR(191) NOT NULL,
    `activityId` VARCHAR(191) NOT NULL,
    `accion` ENUM('CREATED', 'UPDATED', 'DELETED', 'STATUS_CHANGED', 'GRADE_UPDATED', 'ATTENDANCE_UPDATED', 'PAYMENT_SUBMITTED', 'PAYMENT_APPROVED', 'PAYMENT_REJECTED') NOT NULL,
    `campoAnterior` VARCHAR(100) NULL,
    `valorAnterior` TEXT NULL,
    `valorNuevo` TEXT NULL,
    `descripcion` TEXT NULL,
    `realizadoPor` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `activity_history_activityId_idx`(`activityId`),
    INDEX `activity_history_accion_idx`(`accion`),
    INDEX `activity_history_createdAt_idx`(`createdAt`),
    INDEX `activity_history_activityId_createdAt_idx`(`activityId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Foreign keys
ALTER TABLE `academic_activities` ADD CONSTRAINT `academic_activities_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `enrollments_v2` ADD CONSTRAINT `enrollments_v2_activityId_fkey` FOREIGN KEY (`activityId`) REFERENCES `academic_activities`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `enrollments_v2` ADD CONSTRAINT `enrollments_v2_groupId_fkey` FOREIGN KEY (`groupId`) REFERENCES `groups`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `exams` ADD CONSTRAINT `exams_activityId_fkey` FOREIGN KEY (`activityId`) REFERENCES `academic_activities`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `exams` ADD CONSTRAINT `exams_subjectId_fkey` FOREIGN KEY (`subjectId`) REFERENCES `subjects`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `exams` ADD CONSTRAINT `exams_periodId_fkey` FOREIGN KEY (`periodId`) REFERENCES `diagnostic_exam_periods`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `special_courses` ADD CONSTRAINT `special_courses_activityId_fkey` FOREIGN KEY (`activityId`) REFERENCES `academic_activities`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `special_courses` ADD CONSTRAINT `special_courses_groupId_fkey` FOREIGN KEY (`groupId`) REFERENCES `groups`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `social_service` ADD CONSTRAINT `social_service_activityId_fkey` FOREIGN KEY (`activityId`) REFERENCES `academic_activities`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `professional_practices` ADD CONSTRAINT `professional_practices_activityId_fkey` FOREIGN KEY (`activityId`) REFERENCES `academic_activities`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `activity_history` ADD CONSTRAINT `activity_history_activityId_fkey` FOREIGN KEY (`activityId`) REFERENCES `academic_activities`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
