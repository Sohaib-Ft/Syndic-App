import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/paiements
export const getAllPaiements = async (req, res) => {
  try {
    const { mois, annee, statut } = req.query;
    const where = {
      appartement: { syndicId: req.user.id }
    };
    if (mois) where.mois = parseInt(mois);
    if (annee) where.annee = parseInt(annee);
    if (statut) where.statut = statut;

    const paiements = await prisma.paiement.findMany({
      where,
      include: {
        resident: { select: { id: true, nom: true, prenom: true, email: true } },
        appartement: { select: { id: true, numero: true } }
      },
      orderBy: [{ annee: 'desc' }, { mois: 'desc' }, { createdAt: 'desc' }]
    });
    res.json(paiements);
  } catch (error) {
    console.error('Erreur getAllPaiements:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// POST /api/paiements
export const createPaiement = async (req, res) => {
  try {
    const { montant, mois, annee, appartementId, residentId, statut } = req.body;

    if (!montant || !mois || !annee || !appartementId || !residentId) {
      return res.status(400).json({ message: 'Champs obligatoires manquants.' });
    }

    const appart = await prisma.appartement.findFirst({
      where: { id: parseInt(appartementId), syndicId: req.user.id }
    });
    if (!appart) return res.status(400).json({ message: 'Appartement non trouvé.' });

    const resident = await prisma.user.findFirst({
      where: { id: parseInt(residentId), role: 'RESIDENT', syndicId: req.user.id }
    });
    if (!resident) return res.status(400).json({ message: 'Résident non trouvé.' });

    const existing = await prisma.paiement.findUnique({
      where: { appartementId_mois_annee: { appartementId: parseInt(appartementId), mois: parseInt(mois), annee: parseInt(annee) } }
    });
    if (existing) return res.status(400).json({ message: 'Un paiement existe déjà pour ce mois.' });

    const paiement = await prisma.paiement.create({
      data: {
        montant: parseFloat(montant),
        mois: parseInt(mois),
        annee: parseInt(annee),
        appartementId: parseInt(appartementId),
        residentId: parseInt(residentId),
        statut: statut || 'EN_ATTENTE'
      },
      include: {
        resident: { select: { nom: true, prenom: true } },
        appartement: { select: { numero: true } }
      }
    });

    res.status(201).json({ message: 'Paiement créé.', paiement });
  } catch (error) {
    console.error('Erreur createPaiement:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// PUT /api/paiements/:id/valider
export const validerPaiement = async (req, res) => {
  try {
    const { id } = req.params;
    const paiement = await prisma.paiement.findFirst({
      where: { id: parseInt(id), appartement: { syndicId: req.user.id } }
    });
    if (!paiement) return res.status(404).json({ message: 'Paiement non trouvé.' });

    const updated = await prisma.paiement.update({
      where: { id: parseInt(id) },
      data: { statut: 'PAYE', datePaiement: new Date() },
      include: {
        resident: { select: { nom: true, prenom: true } },
        appartement: { select: { numero: true } }
      }
    });

    res.json({ message: 'Paiement validé.', paiement: updated });
  } catch (error) {
    console.error('Erreur validerPaiement:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// GET /api/paiements/stats/mensuel — Stats des 12 derniers mois
export const getStatsMensuel = async (req, res) => {
  try {
    const now = new Date();
    const stats = [];

    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mois = date.getMonth() + 1;
      const annee = date.getFullYear();

      const [totalPaye, totalAttendu] = await Promise.all([
        prisma.paiement.aggregate({
          where: { mois, annee, statut: 'PAYE', appartement: { syndicId: req.user.id } },
          _sum: { montant: true }
        }),
        prisma.paiement.aggregate({
          where: { mois, annee, appartement: { syndicId: req.user.id } },
          _sum: { montant: true }
        })
      ]);

      const moisNoms = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

      stats.push({
        mois, annee,
        label: `${moisNoms[mois - 1]} ${annee}`,
        totalPaye: totalPaye._sum.montant || 0,
        totalAttendu: totalAttendu._sum.montant || 0
      });
    }

    res.json(stats);
  } catch (error) {
    console.error('Erreur getStatsMensuel:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// GET /api/paiements/stats/annuel
export const getStatsAnnuel = async (req, res) => {
  try {
    const annee = parseInt(req.query.annee) || new Date().getFullYear();

    const [totalPaye, totalAttendu, impayes] = await Promise.all([
      prisma.paiement.aggregate({
        where: { annee, statut: 'PAYE', appartement: { syndicId: req.user.id } },
        _sum: { montant: true }
      }),
      prisma.paiement.aggregate({
        where: { annee, appartement: { syndicId: req.user.id } },
        _sum: { montant: true }
      }),
      prisma.paiement.aggregate({
        where: { annee, statut: { not: 'PAYE' }, appartement: { syndicId: req.user.id } },
        _sum: { montant: true }
      })
    ]);

    const totalPayeVal = totalPaye._sum.montant || 0;
    const totalAttenduVal = totalAttendu._sum.montant || 0;
    const tauxRecouvrement = totalAttenduVal > 0 ? ((totalPayeVal / totalAttenduVal) * 100).toFixed(1) : 0;

    res.json({
      annee,
      totalPaye: totalPayeVal,
      totalAttendu: totalAttenduVal,
      totalImpayes: impayes._sum.montant || 0,
      tauxRecouvrement: parseFloat(tauxRecouvrement)
    });
  } catch (error) {
    console.error('Erreur getStatsAnnuel:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// POST /api/paiements/generer — Générer les paiements mensuels pour tous les résidents
export const genererPaiementsMensuels = async (req, res) => {
  try {
    const { mois, annee } = req.body;
    if (!mois || !annee) return res.status(400).json({ message: 'Mois et année requis.' });

    const appartements = await prisma.appartement.findMany({
      where: { statut: 'OCCUPE', syndicId: req.user.id },
      include: { resident: true }
    });

    let created = 0;
    for (const appart of appartements) {
      if (!appart.resident) continue;

      const existing = await prisma.paiement.findUnique({
        where: { appartementId_mois_annee: { appartementId: appart.id, mois: parseInt(mois), annee: parseInt(annee) } }
      });

      if (!existing) {
        await prisma.paiement.create({
          data: {
            montant: appart.chargesMensuelles,
            mois: parseInt(mois),
            annee: parseInt(annee),
            appartementId: appart.id,
            residentId: appart.resident.id,
            statut: 'EN_ATTENTE'
          }
        });
        created++;
      }
    }

    res.json({ message: `${created} paiements générés pour ${mois}/${annee}.` });
  } catch (error) {
    console.error('Erreur genererPaiementsMensuels:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};
