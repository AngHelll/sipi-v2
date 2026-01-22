-- Migration: Phase 1 - Contact Information, Security, and Soft Delete
-- Description: Add contact fields, security tracking, and soft delete to all entities
-- Date: 2025-01-21

-- ============================================
-- USERS TABLE - Contact and Security
-- ============================================

-- Add contact information
ALTER TABLE `users` 
  ADD COLUMN `email` VARCHAR(255) NULL,
  ADD COLUMN `emailVerified` BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN `telefono` VARCHAR(20) NULL;

-- Add security tracking
ALTER TABLE `users`
  ADD COLUMN `lastLoginAt` DATETIME(3) NULL,
  ADD COLUMN `loginAttempts` INT NOT NULL DEFAULT 0,
  ADD COLUMN `lockedUntil` DATETIME(3) NULL,
  ADD COLUMN `passwordChangedAt` DATETIME(3) NULL;

-- Add soft delete
ALTER TABLE `users`
  ADD COLUMN `deletedAt` DATETIME(3) NULL;

-- Add audit fields
ALTER TABLE `users`
  ADD COLUMN `createdBy` VARCHAR(191) NULL,
  ADD COLUMN `updatedBy` VARCHAR(191) NULL;

-- Create indexes
CREATE UNIQUE INDEX `users_email_key` ON `users`(`email`);
CREATE INDEX `users_email_idx` ON `users`(`email`);
CREATE INDEX `users_deletedAt_idx` ON `users`(`deletedAt`);

-- ============================================
-- STUDENTS TABLE - Contact Information
-- ============================================

-- Add contact information
ALTER TABLE `students`
  ADD COLUMN `email` VARCHAR(255) NULL,
  ADD COLUMN `telefono` VARCHAR(20) NULL,
  ADD COLUMN `telefonoEmergencia` VARCHAR(20) NULL;

-- Add soft delete
ALTER TABLE `students`
  ADD COLUMN `deletedAt` DATETIME(3) NULL;

-- Add audit fields
ALTER TABLE `students`
  ADD COLUMN `createdBy` VARCHAR(191) NULL,
  ADD COLUMN `updatedBy` VARCHAR(191) NULL;

-- Create indexes
CREATE UNIQUE INDEX `students_email_key` ON `students`(`email`);
CREATE INDEX `students_email_idx` ON `students`(`email`);
CREATE INDEX `students_deletedAt_idx` ON `students`(`deletedAt`);

-- ============================================
-- TEACHERS TABLE - Contact Information
-- ============================================

-- Add contact information
ALTER TABLE `teachers`
  ADD COLUMN `email` VARCHAR(255) NULL,
  ADD COLUMN `telefono` VARCHAR(20) NULL;

-- Add soft delete
ALTER TABLE `teachers`
  ADD COLUMN `deletedAt` DATETIME(3) NULL;

-- Add audit fields
ALTER TABLE `teachers`
  ADD COLUMN `createdBy` VARCHAR(191) NULL,
  ADD COLUMN `updatedBy` VARCHAR(191) NULL;

-- Create indexes
CREATE UNIQUE INDEX `teachers_email_key` ON `teachers`(`email`);
CREATE INDEX `teachers_email_idx` ON `teachers`(`email`);
CREATE INDEX `teachers_deletedAt_idx` ON `teachers`(`deletedAt`);

-- ============================================
-- SUBJECTS TABLE - Soft Delete
-- ============================================

-- Add soft delete
ALTER TABLE `subjects`
  ADD COLUMN `deletedAt` DATETIME(3) NULL;

-- Add audit fields
ALTER TABLE `subjects`
  ADD COLUMN `createdBy` VARCHAR(191) NULL,
  ADD COLUMN `updatedBy` VARCHAR(191) NULL;

-- Create indexes
CREATE INDEX `subjects_deletedAt_idx` ON `subjects`(`deletedAt`);

-- ============================================
-- GROUPS TABLE - Soft Delete
-- ============================================

-- Add soft delete
ALTER TABLE `groups`
  ADD COLUMN `deletedAt` DATETIME(3) NULL;

-- Add audit fields
ALTER TABLE `groups`
  ADD COLUMN `createdBy` VARCHAR(191) NULL,
  ADD COLUMN `updatedBy` VARCHAR(191) NULL;

-- Create indexes
CREATE INDEX `groups_deletedAt_idx` ON `groups`(`deletedAt`);

-- ============================================
-- ENROLLMENTS TABLE - Soft Delete
-- ============================================

-- Add soft delete
ALTER TABLE `enrollments`
  ADD COLUMN `deletedAt` DATETIME(3) NULL;

-- Add audit fields
ALTER TABLE `enrollments`
  ADD COLUMN `createdBy` VARCHAR(191) NULL,
  ADD COLUMN `updatedBy` VARCHAR(191) NULL;

-- Create indexes
CREATE INDEX `enrollments_deletedAt_idx` ON `enrollments`(`deletedAt`);

