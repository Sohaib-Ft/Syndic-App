import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// GET /api/residents
export const getAllResidents = async (req, res) => {
  try {
    const residents = await prisma.user.findMany({
      where: { role: 'RESIDENT' },
      select: {
        id: true, nom: true, prenom: true, email: true, telephone: true, actif: true, createdAt: true,
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
    const { nom, prenom, email, telephone, password, appartementId } = req.body;

    if (!nom || !prenom || !email || !password) {
      return res.status(400).json({ message: 'Champs obligatoires manquants.' });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ message: 'Cet email est déjà utilisé.' });

    if (appartementId) {
      const appart = await prisma.appartement.findUnique({ where: { id: parseInt(appartementId) }, include: { resident: true } });
      if (!appart) return res.status(400).json({ message: 'Appartement non trouvé.' });
      if (appart.resident) return res.status(400).json({ message: 'Cet appartement est déjà occupé.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const resident = await prisma.user.create({
      data: {
        nom, prenom, email, telephone, password: hashedPassword, role: 'RESIDENT',
        ...(appartementId && { appartementId: parseInt(appartementId) })
      },
      include: { appartement: true }
    });

    // Mettre à jour le statut de l'appartement
    if (appartementId) {
      await prisma.appartement.update({ where: { id: parseInt(appartementId) }, data: { statut: 'OCCUPE' } });
    }

    const { password: _, ...data } = resident;
    res.status(201).json({ message: 'Résident créé avec succès.', resident: data });
  } catch (error) {
    console.error('Erreur createResident:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// PUT /api/residents/:id
export const updateResident = async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, prenom, email, telephone, appartementId, actif } = req.body;

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
