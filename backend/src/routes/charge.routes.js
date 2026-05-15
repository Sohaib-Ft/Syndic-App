import { Router } from 'express';
import { getAllCharges, createCharge, updateCharge, deleteCharge, getChargesStats } from '../controllers/charge.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();
router.use(authenticate, authorize('SYNDIC'));

router.get('/', getAllCharges);
router.get('/stats', getChargesStats);
router.post('/', createCharge);
router.put('/:id', updateCharge);
router.delete('/:id', deleteCharge);

export default router;
