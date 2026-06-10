// Rutas de inglés retiradas — producto: /api/academic-activities/*
import { Router } from 'express';
import { deprecatedRoute } from '../../../middleware/deprecatedRoute';

const ENGLISH_V2 = '/api/academic-activities';
const DOCS = '/docs/FLUJOS-NEGOCIO.md';

const gone = deprecatedRoute({
  message:
    'Las rutas /api/enrollments/english/* fueron retiradas. Usa el módulo de actividades académicas (V2).',
  replacement: ENGLISH_V2,
  docs: DOCS,
});

const router = Router();

router.all('/exam', gone);
router.all('/course', gone);
router.all('/student-status', gone);
router.all('/pending-approvals', gone);
router.all('/:id/payment', gone);
router.all('/:id/approve-payment', gone);
router.all('/:id/reject-payment', gone);
router.all('/:id/exam-result', gone);
router.all('/:id/course-completion', gone);

export default router;
