-- Catálogo de carreras (careers) + FK carreraId en students y subjects
-- API: GET /api/careers — seed: npm run seed:careers
--
-- Si estas tablas/columnas ya existen (p. ej. aplicadas con db push o por las
-- migraciones "phase3" antiguas), marcar como aplicada sin ejecutar:
--   npx prisma migrate resolve --applied 20260610120000_add_careers_catalog

-- careers (catálogo)
CREATE TABLE `careers` (
    `id` VARCHAR(191) NOT NULL,
    `codigo` VARCHAR(20) NOT NULL,
    `nombre` VARCHAR(200) NOT NULL,
    `nombreCorto` VARCHAR(50) NULL,
    `area` VARCHAR(100) NULL,
    `duracionSemestres` INTEGER NOT NULL DEFAULT 8,
    `creditosTotales` INTEGER NULL,
    `descripcion` TEXT NULL,
    `estatus` VARCHAR(20) NOT NULL DEFAULT 'ACTIVA',
    `deletedAt` DATETIME(3) NULL,
    `createdBy` VARCHAR(191) NULL,
    `updatedBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `codigo`(`codigo`),
    INDEX `careers_area_idx`(`area`),
    INDEX `careers_codigo_idx`(`codigo`),
    INDEX `careers_deletedAt_idx`(`deletedAt`),
    INDEX `careers_estatus_idx`(`estatus`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- students.carreraId
ALTER TABLE `students` ADD COLUMN `carreraId` VARCHAR(191) NULL;

CREATE INDEX `students_carreraId_idx` ON `students`(`carreraId`);
CREATE INDEX `students_carreraId_semestre_idx` ON `students`(`carreraId`, `semestre`);

ALTER TABLE `students` ADD CONSTRAINT `students_carreraId_fkey` FOREIGN KEY (`carreraId`) REFERENCES `careers`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- subjects.carreraId
ALTER TABLE `subjects` ADD COLUMN `carreraId` VARCHAR(191) NULL;

CREATE INDEX `subjects_carreraId_idx` ON `subjects`(`carreraId`);
CREATE INDEX `subjects_carreraId_tipo_idx` ON `subjects`(`carreraId`, `tipo`);

ALTER TABLE `subjects` ADD CONSTRAINT `subjects_carreraId_fkey` FOREIGN KEY (`carreraId`) REFERENCES `careers`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;
