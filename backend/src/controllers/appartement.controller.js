import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/appartements
export const getAllAppartements = async (req, res) => {
  try {
    const appartements = await prisma.appartement.findMany({
      include: { resident: { select: { id: true, nom: true, prenom: true, email: true, telephone: true } } },
      orderBy: { numero: 'asc' }
    });
    res.json(appartements);
  } catch (error) {
    console.error('Erreur getAllAppartements:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// GET /api/appartements/:id
export const getAppartementById = async (req, res) => {
  try {
    const appartement = await prisma.appartement.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        resident: { select: { id: true, nom: true, prenom: true, email: true, telephone: true } },
        paiements: { orderBy: { createdAt: 'desc' }, take: 12 }
      }
    });
    if (!appartement) return res.status(404).json({ message: 'Appartement non trouvé.' });
    res.json(appartement);
  } catch (error) {
    console.error('Erreur getAppartementById:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// POST /api/appartements
export const createAppartement = async (req, res) => {
  try {
    const { numero, etage, superficie, nbPieces, type, description, chargesMensuelles } = req.body;

    if (!numero || etage === undefined || !nbPieces) {
      return res.status(400).json({ message: 'Champs obligatoires manquants.' });
    }

    const existing = await prisma.appartement.findUnique({ where: { numero } });
    if (existing) return res.status(400).json({ message: 'Ce numéro d\'appartement existe déjà.' });

    const appartement = await prisma.appartement.create({
      data: { numero, etage: parseInt(etage), superficie: parseFloat(superficie) || 0, nbPieces: parseInt(nbPieces), type, description, chargesMensuelles: parseFloat(chargesMensuelles) || 0 }
    });

    res.status(201).json({ message: 'Appartement créé avec succès.', appartement });
  } catch (error) {
    console.error('Erreur createAppartement:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// PUT /api/appartements/:id
export const updateAppartement = async (req, res) => {
  try {
    const { id } = req.params;
    const { numero, etage, superficie, nbPieces, type, description, chargesMensuelles } = req.body;

    const appartement = await prisma.appartement.findUnique({ where: { id: parseInt(id) } });
    if (!appartement) return res.status(404).json({ message: 'Appartement non trouvé.' });

    if (numero && numero !== appartement.numero) {
      const existing = await prisma.appartement.findUnique({ where: { numero } });
      if (existing) return res.status(400).json({ message: 'Ce numéro existe déjà.' });
    }

    const updated = await prisma.appartement.update({
      where: { id: parseInt(id) },
      data: {
        ...(numero && { numero }),
        ...(etage !== undefined && { etage: parseInt(etage) }),
        ...(superficie && { superficie: parseFloat(superficie) }),
        ...(nbPieces && { nbPieces: parseInt(nbPieces) }),
        ...(type !== undefined && { type }),
        ...(description !== undefined && { description }),
        ...(chargesMensuelles !== undefined && { chargesMensuelles: parseFloat(chargesMensuelles) })
      },
      include: { resident: { select: { id: true, nom: true, prenom: true } } }
    });

    res.json({ message: 'Appartement modifié.', appartement: updated });
  } catch (error) {
    console.error('Erreur updateAppartement:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// DELETE /api/appartements/:id
export const deleteAppartement = async (req, res) => {
  try {
    const { id } = req.params;
    const appartement = await prisma.appartement.findUnique({
      where: { id: parseInt(id) },
      include: { resident: true }
    });
    if (!appartement) return res.status(404).json({ message: 'Appartement non trouvé.' });
    if (appartement.resident) return res.status(400).json({ message: 'Impossible de supprimer un appartement occupé.' });

    await prisma.paiement.deleteMany({ where: { appartementId: parseInt(id) } });
    await prisma.appartement.delete({ where: { id: parseInt(id) } });

    res.json({ message: 'Appartement supprimé.' });
  } catch (error) {
    console.error('Erreur deleteAppartement:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};
