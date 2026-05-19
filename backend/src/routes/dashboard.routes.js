import { Router } from 'express';
import { getDashboardSyndic } from '../controllers/dashboard.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.get('/syndic', authorize('SYNDIC'), getDashboardSyndic);

export default router;
