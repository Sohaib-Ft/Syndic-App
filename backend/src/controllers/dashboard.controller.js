import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getDashboardSyndic = async (req, res) => {
  try {
    const now = new Date();
    const moisActuel = now.getMonth() + 1;
    const anneeActuelle = now.getFullYear();

    const [totalApparts, residentsActifs, paiementsMois, impayesMois, derniersPaiements, residentsEnRetard, dernieresAnnonces] = await Promise.all([
      prisma.appartement.count(),
      prisma.user.count({ where: { role: 'RESIDENT', actif: true } }),
      prisma.paiement.aggregate({ where: { mois: moisActuel, annee: anneeActuelle, statut: 'PAYE' }, _sum: { montant: true } }),
      prisma.paiement.aggregate({ where: { mois: moisActuel, annee: anneeActuelle, statut: { not: 'PAYE' } }, _sum: { montant: true }, _count: true }),
      prisma.paiement.findMany({
        where: { statut: 'PAYE' }, orderBy: { datePaiement: 'desc' }, take: 5,
        include: { resident: { select: { nom: true, prenom: true } }, appartement: { select: { numero: true } } }
      }),
      prisma.paiement.findMany({
        where: { statut: { not: 'PAYE' }, OR: [{ annee: anneeActuelle, mois: { lt: moisActuel } }, { annee: { lt: anneeActuelle } }] },
        include: { resident: { select: { id: true, nom: true, prenom: true, email: true } }, appartement: { select: { numero: true } } },
        orderBy: [{ annee: 'asc' }, { mois: 'asc' }]
      }),
      prisma.annonce.findMany({ orderBy: { createdAt: 'desc' }, take: 5 })
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
      residentsEnRetard,
      dernieresAnnonces
    });
  } catch (error) {
    console.error('Erreur getDashboardSyndic:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

export const getDashboardResident = async (req, res) => {
  try {
    const now = new Date();
    const moisActuel = now.getMonth() + 1;
    const anneeActuelle = now.getFullYear();

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { appartement: true }
    });

    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé.' });

    let paiementMoisActuel = null;
    let historiquePaiements = [];
    let chargeMensuelle = 0;

    if (user.appartement) {
      chargeMensuelle = user.appartement.chargesMensuelles;
      paiementMoisActuel = await prisma.paiement.findUnique({
        where: { appartementId_mois_annee: { appartementId: user.appartement.id, mois: moisActuel, annee: anneeActuelle } }
      });
      historiquePaiements = await prisma.paiement.findMany({
        where: { residentId: user.id },
        orderBy: [{ annee: 'desc' }, { mois: 'desc' }],
        take: 12
      });
    }

    const annonces = await prisma.annonce.findMany({ orderBy: { createdAt: 'desc' }, take: 10 });

    const { password: _, ...userData } = user;

    res.json({
      user: userData,
      appartement: user.appartement,
      paiementMoisActuel,
      historiquePaiements,
      chargeMensuelle,
      annonces
    });
  } catch (error) {
    console.error('Erreur getDashboardResident:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};
