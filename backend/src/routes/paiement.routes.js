import { Router } from 'express';
import { getAllPaiements, createPaiement, validerPaiement, getStatsMensuel, getStatsAnnuel, genererPaiementsMensuels } from '../controllers/paiement.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.get('/', authorize('SYNDIC'), getAllPaiements);
router.post('/', authorize('SYNDIC'), createPaiement);
router.put('/:id/valider', authorize('SYNDIC'), validerPaiement);
router.get('/stats/mensuel', authorize('SYNDIC'), getStatsMensuel);
router.get('/stats/annuel', authorize('SYNDIC'), getStatsAnnuel);
router.post('/generer', authorize('SYNDIC'), genererPaiementsMensuels);

export default router;
