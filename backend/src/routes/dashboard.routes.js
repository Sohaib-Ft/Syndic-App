import { Router } from 'express';
import { getDashboardSyndic, getDashboardResident } from '../controllers/dashboard.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.get('/syndic', authorize('SYNDIC'), getDashboardSyndic);
router.get('/resident', authorize('RESIDENT'), getDashboardResident);

export default router;
