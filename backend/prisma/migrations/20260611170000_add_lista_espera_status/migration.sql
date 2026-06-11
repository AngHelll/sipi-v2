-- Agrega el estado LISTA_ESPERA al enum de academic_activities.estatus
-- Producto: solicitudes de curso de inglés sin grupo publicado entran a lista de espera
-- en lugar de quedar como inscripciones evaluables sin grupo.
ALTER TABLE `academic_activities`
  MODIFY COLUMN `estatus` ENUM('INSCRITO', 'EN_CURSO', 'BAJA', 'APROBADO', 'REPROBADO', 'EVALUADO', 'CANCELADO', 'PENDIENTE_PAGO', 'PAGO_PENDIENTE_APROBACION', 'PAGO_APROBADO', 'COMPLETADO', 'EN_REVISION', 'LISTA_ESPERA') NOT NULL DEFAULT 'INSCRITO';
