import { Router } from 'express';
import { getAllAppartements, getAppartementById, createAppartement, updateAppartement, deleteAppartement } from '../controllers/appartement.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.get('/', getAllAppartements);
router.get('/:id', getAppartementById);
router.post('/', authorize('SYNDIC'), createAppartement);
router.put('/:id', authorize('SYNDIC'), updateAppartement);
router.delete('/:id', authorize('SYNDIC'), deleteAppartement);

export default router;
