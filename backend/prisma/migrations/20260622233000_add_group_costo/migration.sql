-- Add optional cost to groups so English course groups can carry a price.
-- The amount is copied to special_courses.montoPago when a student requests
-- the course (PENDIENTE_PAGO), so the student sees how much to pay up front.
ALTER TABLE `groups` ADD COLUMN `costo` DECIMAL(10, 2) NULL;
