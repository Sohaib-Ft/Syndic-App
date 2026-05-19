import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getAllCharges = async (req, res) => {
  try {
    const { mois, annee, categorie } = req.query;
    const where = { syndicId: req.user.id };
    if (categorie) where.categorie = categorie;
    if (mois && annee) {
      const start = new Date(parseInt(annee), parseInt(mois) - 1, 1);
      const end = new Date(parseInt(annee), parseInt(mois), 0, 23, 59, 59);
      where.date = { gte: start, lte: end };
    } else if (annee) {
      where.date = { gte: new Date(parseInt(annee), 0, 1), lte: new Date(parseInt(annee), 11, 31, 23, 59, 59) };
    }
    const charges = await prisma.charge.findMany({ where, orderBy: { date: 'desc' } });
    res.json(charges);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

export const createCharge = async (req, res) => {
  try {
    const { libelle, montant, categorie, date, description } = req.body;
    if (!libelle || !montant || !categorie || !date) return res.status(400).json({ message: 'Champs obligatoires manquants.' });
    const charge = await prisma.charge.create({
      data: { libelle, montant: parseFloat(montant), categorie, date: new Date(date), description, syndicId: req.user.id }
    });
    res.status(201).json({ message: 'Charge ajoutée.', charge });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

export const updateCharge = async (req, res) => {
  try {
    const charge = await prisma.charge.findFirst({
      where: { id: parseInt(req.params.id), syndicId: req.user.id }
    });
    if (!charge) return res.status(404).json({ message: 'Charge non trouvée.' });
    const { libelle, montant, categorie, date, description } = req.body;
    const updated = await prisma.charge.update({
      where: { id: parseInt(req.params.id) },
      data: {
        ...(libelle && { libelle }), ...(montant && { montant: parseFloat(montant) }),
        ...(categorie && { categorie }), ...(date && { date: new Date(date) }),
        ...(description !== undefined && { description })
      }
    });
    res.json({ message: 'Charge modifiée.', charge: updated });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

export const deleteCharge = async (req, res) => {
  try {
    const charge = await prisma.charge.findFirst({
      where: { id: parseInt(req.params.id), syndicId: req.user.id }
    });
    if (!charge) return res.status(404).json({ message: 'Charge non trouvée.' });
    await prisma.charge.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Charge supprimée.' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

export const getChargesStats = async (req, res) => {
  try {
    const annee = parseInt(req.query.annee) || new Date().getFullYear();
    const charges = await prisma.charge.findMany({
      where: {
        syndicId: req.user.id,
        date: { gte: new Date(annee, 0, 1), lte: new Date(annee, 11, 31, 23, 59, 59) }
      }
    });
    const parCategorie = {};
    const parMois = {};
    let total = 0;
    charges.forEach(c => {
      total += c.montant;
      parCategorie[c.categorie] = (parCategorie[c.categorie] || 0) + c.montant;
      const m = new Date(c.date).getMonth() + 1;
      parMois[m] = (parMois[m] || 0) + c.montant;
    });
    res.json({ annee, total, parCategorie, parMois });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};
