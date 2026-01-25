-- Migration: Add optimization indexes for better query performance
-- This migration adds composite indexes for frequently used query patterns
-- Part of Level 1 optimizations (see docs/OPTIMIZACIONES-IMPLEMENTADAS.md)

-- Optimize enrollments table queries
-- Index for filtering enrollments by student and deletedAt (soft delete queries)
-- This index optimizes queries like: WHERE studentId = ? AND deletedAt IS NULL
CREATE INDEX `enrollments_studentId_deletedAt_idx` ON `enrollments`(`studentId`, `deletedAt`);

-- Index for filtering enrollments by status and deletedAt (list queries with status filter)
-- This index optimizes queries like: WHERE estatus = ? AND deletedAt IS NULL
CREATE INDEX `enrollments_estatus_deletedAt_idx` ON `enrollments`(`estatus`, `deletedAt`);

-- Optimize students table queries
-- Index for filtering students by status and deletedAt (list queries with status filter)
-- This index optimizes queries like: WHERE estatus = ? AND deletedAt IS NULL
CREATE INDEX `students_estatus_deletedAt_idx` ON `students`(`estatus`, `deletedAt`);

-- Index for filtering students by carrera, estatus, and deletedAt (common admin queries)
-- This index optimizes queries like: WHERE carrera = ? AND estatus = ? AND deletedAt IS NULL
-- Used frequently in admin dashboard and student lists
CREATE INDEX `students_carrera_estatus_deletedAt_idx` ON `students`(`carrera`, `estatus`, `deletedAt`);
