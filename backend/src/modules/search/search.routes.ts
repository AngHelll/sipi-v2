// Search routes - Route definitions for global search endpoints
import { Router } from 'express';
import * as searchController from './search.controller';
import { authenticate, authorize } from '../../middleware/auth';
import { strictLimiter } from '../../middleware/rateLimiter';
import { UserRole } from '../../types';

const router = Router();

/**
 * GET /api/search
 * Global search across all entities (estudiantes, maestros, materias, grupos).
 * Solo ADMIN: expone PII de toda la institución, no debe abrirse a alumnos/maestros.
 * Rate limit estricto: superficie masiva de PII.
 */
router.get(
  '/',
  authenticate,
  authorize(UserRole.ADMIN),
  strictLimiter,
  searchController.search
);

export default router;

