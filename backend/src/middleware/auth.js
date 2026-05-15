import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Middleware d'authentification JWT
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Token manquant.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, nom: true, prenom: true, role: true, actif: true, appartementId: true }
    });

    if (!user) return res.status(401).json({ message: 'Utilisateur non trouvé.' });
    if (!user.actif) return res.status(403).json({ message: 'Compte désactivé.' });

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') return res.status(401).json({ message: 'Token expiré.' });
    if (error.name === 'JsonWebTokenError') return res.status(401).json({ message: 'Token invalide.' });
    return res.status(500).json({ message: 'Erreur d\'authentification.' });
  }
};

// Middleware d'autorisation par rôle
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Non authentifié.' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Accès interdit.' });
    }
    next();
  };
};
