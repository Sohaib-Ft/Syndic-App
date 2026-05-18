import { Router } from 'express';
import { 
  getAllChargesPartielles, 
  createChargePartielle, 
  updateChargePartielle, 
  deleteChargePartielle, 
  validerPaiementChargePartielle,
  getEssentialCharge,
  updateEssentialCharge,
  getResidentCharges
} from '../controllers/residentCharge.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// Routes pour le syndic
router.get('/partielles', authenticate, authorize('SYNDIC'), getAllChargesPartielles);
router.post('/partielles', authenticate, authorize('SYNDIC'), createChargePartielle);
router.put('/partielles/:id', authenticate, authorize('SYNDIC'), updateChargePartielle);
router.delete('/partielles/:id', authenticate, authorize('SYNDIC'), deleteChargePartielle);
router.post('/partielles/:chargeId/valider/:residentId', authenticate, authorize('SYNDIC'), validerPaiementChargePartielle);

router.get('/essentielle', authenticate, authorize('SYNDIC'), getEssentialCharge);
router.put('/essentielle', authenticate, authorize('SYNDIC'), updateEssentialCharge);

// Route pour les résidents
router.get('/mes-charges', authenticate, getResidentCharges);

export default router;
