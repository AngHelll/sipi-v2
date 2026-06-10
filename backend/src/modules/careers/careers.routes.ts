import { Router } from 'express';
import * as careersController from './careers.controller';
import { authenticate, authorize } from '../../middleware/auth';
import { UserRole } from '../../types';

const router = Router();

router.get(
  '/',
  authenticate,
  authorize(UserRole.ADMIN, UserRole.TEACHER),
  careersController.getAllCareers
);

export default router;
