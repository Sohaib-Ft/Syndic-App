import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { login, logout, getMe, forgotPassword, resetPassword, changePassword, googleAuth, register } from '../controllers/auth.controller.js';

const prisma = new PrismaClient();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const resetTokenTTLMinutes = 30;

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const buildResetUrl = (email, token) => {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const url = new URL('/reset-password', baseUrl);
  url.searchParams.set('email', email);
  url.searchParams.set('token', token);
  return url.toString();
};

// POST /api/auth/google
export const googleAuth = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: 'Token Google manquant.' });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const email = payload.email;
    const googleId = payload.sub;

    if (!email) {
      return res.status(400).json({ message: 'Email introuvable dans le token Google.' });
    }

    let user = await prisma.user.findUnique({
      where: { email },
      include: { appartement: true }
    });

    if (!user) {
      // Auto-register new users as SYNDIC
      const dummyPassword = crypto.randomBytes(16).toString('hex');
      const hashedPassword = await bcrypt.hash(dummyPassword, 10);
      user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          nom: payload.family_name || 'Syndic',
          prenom: payload.given_name || 'Nouveau',
          role: 'SYNDIC',
          googleId,
          authProvider: 'google',
          actif: true
        },
        include: { appartement: true }
      });
    } else {
      if (!user.actif) {
        return res.status(403).json({ message: 'Compte désactivé. Contactez l\'administrateur.' });
      }

      if (user.role !== 'SYNDIC') {
        return res.status(403).json({ message: 'Accès réservé au syndic.' });
      }

      // Lier automatiquement le compte Google si ce n'est pas déjà fait
      if (!user.googleId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { googleId, authProvider: 'google' },
          include: { appartement: true }
        });
      }
    }

    const jwtToken = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' } // Expiration à 7 jours selon le prompt
    );

    const { password: _, ...userWithoutPassword } = user;

    res.json({
      message: 'Connexion Google réussie',
      token: jwtToken,
      user: {
        ...userWithoutPassword,
        googleId,
        authProvider: 'google',
      }
    });
  } catch (error) {
    console.error('Erreur googleAuth:', error);
    res.status(500).json({ message: 'Erreur lors de la vérification Google.' });
  }
};

// POST /api/auth/register
export const register = async (req, res) => {
  try {
    const { email, password, nomComplet } = req.body;
    if (!email || !password || !nomComplet) {
      return res.status(400).json({ message: 'Tous les champs sont requis.' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé.' });
    }

    const parts = nomComplet.trim().split(' ');
    const prenom = parts[0] || 'Syndic';
    const nom = parts.slice(1).join(' ') || 'Pro';

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        nom,
        prenom,
        role: 'SYNDIC',
        authProvider: 'local',
        actif: true
      }
    });

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    const { password: _, ...userWithoutPassword } = user;
    res.status(201).json({
      message: 'Inscription réussie',
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Erreur register:', error);
    res.status(500).json({ message: 'Erreur serveur lors de l\'inscription.' });
  }
};

// POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email et mot de passe requis.' });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { appartement: true }
    });

    if (!user) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect.' });
    }

    if (user.authProvider === 'google') {
      return res.status(400).json({ message: 'Utilisez le bouton Google pour vous connecter.' });
    }

    if (!user.actif) {
      return res.status(403).json({ message: 'Compte désactivé. Contactez le syndic.' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect.' });
    }

    if (user.role !== 'SYNDIC') {
      return res.status(403).json({ message: 'Accès réservé au syndic.' });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    const { password: _, ...userWithoutPassword } = user;

    res.json({
      message: 'Connexion réussie',
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Erreur login:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// POST /api/auth/forgot-password
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email requis.' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: 'Email inexistant.' });
    }

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return res.status(500).json({ message: 'Configuration email manquante.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = hashToken(resetToken);
    const resetTokenExpiry = new Date(Date.now() + resetTokenTTLMinutes * 60 * 1000);

    await prisma.user.update({
      where: { email },
      data: { resetToken: resetTokenHash, resetTokenExpiry }
    });

    const resetUrl = buildResetUrl(email, resetToken);

    await transporter.sendMail({
      from: `"SyndicPro" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Réinitialisation du mot de passe',
      html: `
        <h3>Réinitialisation de votre mot de passe</h3>
        <p>Vous avez demandé à réinitialiser votre mot de passe.</p>
        <p><a href="${resetUrl}">Cliquez ici pour choisir un nouveau mot de passe</a></p>
        <p>Ce lien expire dans ${resetTokenTTLMinutes} minutes.</p>
      `
    });

    res.json({ message: 'Email de réinitialisation envoyé.' });
  } catch (error) {
    console.error('Erreur forgotPassword:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// POST /api/auth/logout
export const logout = async (req, res) => {
  res.json({ message: 'Déconnexion réussie' });
};

// GET /api/auth/me
export const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { appartement: true }
    });

    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé.' });

    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Erreur getMe:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// POST /api/auth/reset-password
export const resetPassword = async (req, res) => {
  try {
    const { email, token, newPassword } = req.body;

    if (!email || !token || !newPassword) {
      return res.status(400).json({ message: 'Email, token et nouveau mot de passe requis.' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: 'Email inexistant.' });
    }

    if (!user.resetToken || !user.resetTokenExpiry) {
      return res.status(400).json({ message: 'Lien invalide ou expiré.' });
    }

    if (user.resetTokenExpiry < new Date()) {
      return res.status(400).json({ message: 'Lien invalide ou expiré.' });
    }

    const tokenHash = hashToken(token);
    if (tokenHash !== user.resetToken) {
      return res.status(400).json({ message: 'Lien invalide ou expiré.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword, resetToken: null, resetTokenExpiry: null }
    });

    res.json({ message: 'Mot de passe mis à jour avec succès.' });
  } catch (error) {
    console.error('Erreur resetPassword:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// POST /api/auth/change-password
export const changePassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword) return res.status(400).json({ message: 'Le nouveau mot de passe est requis.' });

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable.' });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword, mustChangePassword: false }
    });

    res.json({ message: 'Mot de passe mis à jour avec succès.' });
  } catch (error) {
    console.error('Erreur changePassword:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};
