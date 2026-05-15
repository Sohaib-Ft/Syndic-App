import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';

dotenv.config();

import authRoutes from './routes/auth.routes.js';
import appartementRoutes from './routes/appartement.routes.js';
import residentRoutes from './routes/resident.routes.js';
import paiementRoutes from './routes/paiement.routes.js';
import annonceRoutes from './routes/annonce.routes.js';
import chargeRoutes from './routes/charge.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';

const app = express();
const PORT = process.env.PORT || 5000;

// ==================== MIDDLEWARES ====================
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(morgan('dev'));

// ==================== ROUTES ====================
app.use('/api/auth', authRoutes);
app.use('/api/appartements', appartementRoutes);
app.use('/api/residents', residentRoutes);
app.use('/api/paiements', paiementRoutes);
app.use('/api/annonces', annonceRoutes);
app.use('/api/charges', chargeRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'API Syndic opérationnelle' });
});

// 404
app.use((req, res) => {
  res.status(404).json({ message: 'Route non trouvée' });
});

// Erreur globale
app.use((err, req, res, next) => {
  console.error('Erreur:', err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Erreur interne du serveur'
  });
});

app.listen(PORT, () => {
  console.log(`🏢 Serveur Syndic démarré sur http://localhost:${PORT}`);
});

export default app;
