import { Router } from 'express';
import { getAllAnnonces, getAnnonceById, createAnnonce, updateAnnonce, deleteAnnonce } from '../controllers/annonce.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.get('/', getAllAnnonces);
router.get('/:id', getAnnonceById);
router.post('/', authorize('SYNDIC'), createAnnonce);
router.put('/:id', authorize('SYNDIC'), updateAnnonce);
router.delete('/:id', authorize('SYNDIC'), deleteAnnonce);

export default router;
