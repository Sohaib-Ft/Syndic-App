import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getAllAnnonces = async (req, res) => {
  try {
    const annonces = await prisma.annonce.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(annonces);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

export const getAnnonceById = async (req, res) => {
  try {
    const annonce = await prisma.annonce.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!annonce) return res.status(404).json({ message: 'Annonce non trouvée.' });
    res.json(annonce);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

export const createAnnonce = async (req, res) => {
  try {
    const { titre, contenu, categorie } = req.body;
    if (!titre || !contenu || !categorie) return res.status(400).json({ message: 'Champs obligatoires manquants.' });
    const annonce = await prisma.annonce.create({ data: { titre, contenu, categorie } });
    res.status(201).json({ message: 'Annonce créée.', annonce });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

export const updateAnnonce = async (req, res) => {
  try {
    const { titre, contenu, categorie } = req.body;
    const annonce = await prisma.annonce.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!annonce) return res.status(404).json({ message: 'Annonce non trouvée.' });
    const updated = await prisma.annonce.update({
      where: { id: parseInt(req.params.id) },
      data: { ...(titre && { titre }), ...(contenu && { contenu }), ...(categorie && { categorie }) }
    });
    res.json({ message: 'Annonce modifiée.', annonce: updated });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

export const deleteAnnonce = async (req, res) => {
  try {
    const annonce = await prisma.annonce.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!annonce) return res.status(404).json({ message: 'Annonce non trouvée.' });
    await prisma.annonce.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Annonce supprimée.' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};
