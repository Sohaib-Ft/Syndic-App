import { Router } from 'express';
import { login, register, logout, getMe, forgotPassword, resetPassword, changePassword, googleAuth } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/login', login);
router.post('/register', register);
router.post('/google', googleAuth);
router.post('/forgot-password', forgotPassword);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getMe);
router.post('/reset-password', resetPassword);
router.post('/change-password', authenticate, changePassword);

export default router;
