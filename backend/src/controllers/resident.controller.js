import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';

const prisma = new PrismaClient();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// GET /api/residents
export const getAllResidents = async (req, res) => {
  try {
    const residents = await prisma.user.findMany({
      where: { role: 'RESIDENT' },
      select: {
        id: true, nom: true, prenom: true, email: true, telephone: true, typeResident: true, actif: true, createdAt: true,
        appartement: { select: { id: true, numero: true, etage: true, superficie: true } }
      },
      orderBy: { nom: 'asc' }
    });
    res.json(residents);
  } catch (error) {
    console.error('Erreur getAllResidents:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// GET /api/residents/:id
export const getResidentById = async (req, res) => {
  try {
    const resident = await prisma.user.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        appartement: true,
        paiements: { orderBy: { createdAt: 'desc' }, take: 12, include: { appartement: { select: { numero: true } } } }
      }
    });
    if (!resident || resident.role !== 'RESIDENT') return res.status(404).json({ message: 'Résident non trouvé.' });

    const { password: _, ...data } = resident;
    res.json(data);
  } catch (error) {
    console.error('Erreur getResidentById:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// POST /api/residents
export const createResident = async (req, res) => {
  try {
    const { nom, prenom, email, telephone, typeResident, appartementId } = req.body;

    console.log('Body reçu:', req.body);
    if (!nom || !prenom || !email) {
      return res.status(400).json({ message: 'Champs obligatoires manquants.' });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ message: 'Cet email est déjà utilisé.' });

    if (appartementId) {
      const appart = await prisma.appartement.findUnique({ where: { id: parseInt(appartementId) }, include: { resident: true } });
      if (!appart) return res.status(400).json({ message: 'Appartement non trouvé.' });
      if (appart.resident) return res.status(400).json({ message: 'Cet appartement est déjà occupé.' });
    }

    const generatePassword = () => {
      const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const lower = 'abcdefghijklmnopqrstuvwxyz';
      const numbers = '0123456789';
      const symbols = '!@#$%^&*()_+';
      const all = upper + lower + numbers + symbols;

      let pass = '';
      pass += upper[Math.floor(Math.random() * upper.length)];
      pass += lower[Math.floor(Math.random() * lower.length)];
      pass += numbers[Math.floor(Math.random() * numbers.length)];
      pass += symbols[Math.floor(Math.random() * symbols.length)];

      for (let i = 4; i < 10; i++) {
        pass += all[Math.floor(Math.random() * all.length)];
      }

      // Shuffle the string
      return pass.split('').sort(() => 0.5 - Math.random()).join('');
    };

    const password = generatePassword();
    const hashedPassword = await bcrypt.hash(password, 10);

    const resident = await prisma.user.create({
      data: {
        nom, prenom, email, telephone, typeResident, password: hashedPassword, role: 'RESIDENT',
        mustChangePassword: true,
        ...(appartementId && { appartementId: parseInt(appartementId) })
      },
      include: { appartement: true }
    });

    // Mettre à jour le statut de l'appartement
    if (appartementId) {
      await prisma.appartement.update({ where: { id: parseInt(appartementId) }, data: { statut: 'OCCUPE' } });
    }

    try {
      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        await transporter.sendMail({
          from: `"SyndicPro" <${process.env.EMAIL_USER}>`,
          to: email,
          subject: 'Bienvenue sur SyndicPro - Vos accès',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 16px;">
              <h2 style="color: #1e3a5f; margin-bottom: 20px;">Bienvenue sur SyndicPro</h2>
              <p style="color: #475569;">Bonjour <strong>${prenom} ${nom}</strong>,</p>
              <p style="color: #475569;">Voici vos identifiants de connexion :</p>
              <div style="background: #f1f5f9; padding: 20px; border-radius: 12px; margin: 20px 0;">
                <p style="margin: 5px 0;"><strong>Email :</strong> ${email}</p>
                <p style="margin: 5px 0;"><strong>Mot de passe :</strong> <code style="background: #e2e8f0; padding: 3px 8px; border-radius: 4px; font-size: 16px;">${password}</code></p>
              </div>
              <p style="color: #ef4444; font-weight: bold; font-size: 14px;">⚠️ Vous devrez changer votre mot de passe lors de votre première connexion.</p>
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" style="display: inline-block; margin-top: 15px; padding: 12px 24px; background: #1e3a5f; color: white; text-decoration: none; border-radius: 10px; font-weight: bold;">Se connecter</a>
            </div>
          `
        });
      } else {
        console.warn("L'envoi d'email est désactivé. Veuillez configurer EMAIL_USER et EMAIL_PASS dans le fichier .env");
      }
    } catch (mailError) {
      console.error("Erreur lors de l'envoi de l'email:", mailError);
    }

    const { password: _, ...data } = resident;
    res.status(201).json({ message: 'Résident créé avec succès.', resident: data });
  } catch (error) {
    console.error('Erreur complète createResident:', error);
    res.status(500).json({ message: 'Erreur serveur: ' + error.message });
  }
};

// PUT /api/residents/:id
export const updateResident = async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, prenom, email, telephone, typeResident, appartementId, actif } = req.body;

    const resident = await prisma.user.findUnique({ where: { id: parseInt(id) } });
    if (!resident || resident.role !== 'RESIDENT') return res.status(404).json({ message: 'Résident non trouvé.' });

    if (email && email !== resident.email) {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) return res.status(400).json({ message: 'Email déjà utilisé.' });
    }

    // Gestion du changement d'appartement
    if (appartementId !== undefined && appartementId !== resident.appartementId) {
      // Libérer l'ancien appartement
      if (resident.appartementId) {
        await prisma.appartement.update({ where: { id: resident.appartementId }, data: { statut: 'VACANT' } });
      }
      // Occuper le nouveau
      if (appartementId) {
        const appart = await prisma.appartement.findUnique({ where: { id: parseInt(appartementId) }, include: { resident: true } });
        if (!appart) return res.status(400).json({ message: 'Appartement non trouvé.' });
        if (appart.resident && appart.resident.id !== parseInt(id)) return res.status(400).json({ message: 'Appartement déjà occupé.' });
        await prisma.appartement.update({ where: { id: parseInt(appartementId) }, data: { statut: 'OCCUPE' } });
      }
    }

    const updated = await prisma.user.update({
      where: { id: parseInt(id) },
      data: {
        ...(nom && { nom }),
        ...(prenom && { prenom }),
        ...(email && { email }),
        ...(telephone !== undefined && { telephone }),
        ...(typeResident !== undefined && { typeResident }),
        ...(appartementId !== undefined && { appartementId: appartementId ? parseInt(appartementId) : null }),
        ...(actif !== undefined && { actif })
      },
      include: { appartement: true }
    });

    const { password: _, ...data } = updated;
    res.json({ message: 'Résident modifié.', resident: data });
  } catch (error) {
    console.error('Erreur updateResident:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// DELETE /api/residents/:id
export const deleteResident = async (req, res) => {
  try {
    const { id } = req.params;
    const resident = await prisma.user.findUnique({ where: { id: parseInt(id) } });
    if (!resident || resident.role !== 'RESIDENT') return res.status(404).json({ message: 'Résident non trouvé.' });

    // Libérer l'appartement
    if (resident.appartementId) {
      await prisma.appartement.update({ where: { id: resident.appartementId }, data: { statut: 'VACANT' } });
    }

    // Supprimer les paiements puis le résident
    await prisma.paiement.deleteMany({ where: { residentId: parseInt(id) } });
    await prisma.user.delete({ where: { id: parseInt(id) } });

    res.json({ message: 'Résident supprimé.' });
  } catch (error) {
    console.error('Erreur deleteResident:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// GET /api/residents/:id/paiements
export const getResidentPaiements = async (req, res) => {
  try {
    const paiements = await prisma.paiement.findMany({
      where: { residentId: parseInt(req.params.id) },
      include: { appartement: { select: { numero: true } } },
      orderBy: [{ annee: 'desc' }, { mois: 'desc' }]
    });
    res.json(paiements);
  } catch (error) {
    console.error('Erreur getResidentPaiements:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};
