-- Script para limpiar migraciones antiguas/duplicadas de la tabla _prisma_migrations
-- Estas migraciones ya están aplicadas en la BD pero fueron eliminadas del sistema de archivos
-- porque tenían versiones más recientes que las reemplazan

-- IMPORTANTE: Este script debe ejecutarse en producción para limpiar migraciones fallidas o duplicadas

-- Eliminar migraciones antiguas de fase (20250121*) - incluye las que están como "failed"
DELETE FROM `_prisma_migrations` 
WHERE migration_name IN (
  '20250121200000_phase1_contact_security_softdelete',
  '20250121210000_phase2_academic_periods_capacity_enrollments',
  '20250121220000_phase3_careers_subjects',
  '20250121230000_phase4_personal_academic_info',
  '20250121240000_phase5_history_documents'
);

-- Eliminar migración de prueba
DELETE FROM `_prisma_migrations` 
WHERE migration_name = '20251121235731_test';

-- Verificar que se eliminaron
SELECT migration_name, finished_at, applied_steps_count 
FROM `_prisma_migrations` 
ORDER BY finished_at;
