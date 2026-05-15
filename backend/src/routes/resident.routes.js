import { Router } from 'express';
import { getAllResidents, getResidentById, createResident, updateResident, deleteResident, getResidentPaiements } from '../controllers/resident.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();
router.use(authenticate, authorize('SYNDIC'));

router.get('/', getAllResidents);
router.get('/:id', getResidentById);
router.post('/', createResident);
router.put('/:id', updateResident);
router.delete('/:id', deleteResident);
router.get('/:id/paiements', getResidentPaiements);

export default router;
