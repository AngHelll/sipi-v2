// Search routes - Route definitions for global search endpoints
import { Router } from 'express';
import * as searchController from './search.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

/**
 * GET /api/search
 * Global search across all entities
 * Requires authentication
 */
router.get('/', authenticate, searchController.search);

export default router;

