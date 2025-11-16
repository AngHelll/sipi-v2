-- Script para agregar la columna CURP a la tabla students
-- Ejecutar manualmente en MySQL si prisma db push falla

ALTER TABLE students 
ADD COLUMN curp VARCHAR(18) NULL UNIQUE AFTER estatus;

-- Crear índice para búsquedas rápidas por CURP
CREATE INDEX students_curp_idx ON students(curp);

