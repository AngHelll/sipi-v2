-- AlterTable: Add promedioIngles field to students table
-- RB-037: La calificación de inglés es independiente de la calificación general
ALTER TABLE `students` ADD COLUMN `promedioIngles` DECIMAL(5,2) NULL;
