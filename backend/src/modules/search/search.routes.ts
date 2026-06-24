// Search routes - Route definitions for global search endpoints
import { Router } from 'express';
import * as searchController from './search.controller';
import { authenticate, authorize } from '../../middleware/auth';
import { UserRole } from '../../types';

const router = Router();

/**
 * GET /api/search
 * Global search across all entities (estudiantes, maestros, materias, grupos).
 * Solo ADMIN: expone PII de toda la institución, no debe abrirse a alumnos/maestros.
 */
router.get('/', authenticate, authorize(UserRole.ADMIN), searchController.search);

export default router;

