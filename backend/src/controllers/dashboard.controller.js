import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const getLang = (req) => {
  const header = (req.headers['x-lang'] || req.headers['accept-language'] || 'fr').toString().toLowerCase();
  const lang = header.slice(0, 2);
  return ['fr', 'en', 'ar'].includes(lang) ? lang : 'fr';
};

export const getDashboardSyndic = async (req, res) => {
  try {
    const lang = getLang(req);
    const now = new Date();
    const moisActuel = now.getMonth() + 1;
    const anneeActuelle = now.getFullYear();

    const [totalApparts, residentsActifs, paiementsMois, impayesMois, derniersPaiements, residentsEnRetard] = await Promise.all([
      prisma.appartement.count({ where: { syndicId: req.user.id } }),
      prisma.user.count({ where: { role: 'RESIDENT', actif: true, syndicId: req.user.id } }),
      prisma.paiement.aggregate({
        where: { mois: moisActuel, annee: anneeActuelle, statut: 'PAYE', appartement: { syndicId: req.user.id } },
        _sum: { montant: true }
      }),
      prisma.paiement.aggregate({
        where: { mois: moisActuel, annee: anneeActuelle, statut: { not: 'PAYE' }, appartement: { syndicId: req.user.id } },
        _sum: { montant: true },
        _count: true
      }),
      prisma.paiement.findMany({
        where: { statut: 'PAYE', appartement: { syndicId: req.user.id } },
        orderBy: { datePaiement: 'desc' },
        take: 5,
        include: { resident: { select: { nom: true, prenom: true } }, appartement: { select: { numero: true } } }
      }),
      prisma.paiement.findMany({
        where: {
          statut: { not: 'PAYE' },
          appartement: { syndicId: req.user.id },
          OR: [{ annee: anneeActuelle, mois: { lt: moisActuel } }, { annee: { lt: anneeActuelle } }]
        },
        include: { resident: { select: { id: true, nom: true, prenom: true, email: true } }, appartement: { select: { numero: true } } },
        orderBy: [{ annee: 'asc' }, { mois: 'asc' }]
      })
    ]);

    res.json({
      kpis: {
        totalAppartements: totalApparts,
        residentsActifs,
        totalEncaisseMois: paiementsMois._sum.montant || 0,
        impayesMois: impayesMois._sum.montant || 0,
        nbImpayes: impayesMois._count || 0
      },
      derniersPaiements,
      residentsEnRetard
    });
  } catch (error) {
    console.error('Erreur getDashboardSyndic:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};
