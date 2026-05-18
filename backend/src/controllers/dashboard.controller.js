import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const getLang = (req) => {
  const header = (req.headers['x-lang'] || req.headers['accept-language'] || 'fr').toString().toLowerCase();
  const lang = header.slice(0, 2);
  return ['fr', 'en', 'ar'].includes(lang) ? lang : 'fr';
};

const localizeAnnonce = (annonce, lang) => {
  const fallbackTitle = annonce.titreFr || annonce.titre;
  const fallbackContent = annonce.contenuFr || annonce.contenu;

  const titre = lang === 'ar'
    ? (annonce.titreAr || fallbackTitle)
    : lang === 'en'
      ? (annonce.titreEn || fallbackTitle)
      : (annonce.titreFr || fallbackTitle);

  const contenu = lang === 'ar'
    ? (annonce.contenuAr || fallbackContent)
    : lang === 'en'
      ? (annonce.contenuEn || fallbackContent)
      : (annonce.contenuFr || fallbackContent);

  return { ...annonce, titre, contenu };
};

const supportedLangs = ['fr', 'en', 'ar'];

const getDeepLUrl = () => {
  if (process.env.DEEPL_API_URL) return process.env.DEEPL_API_URL;
  const key = process.env.DEEPL_API_KEY || '';
  return key.endsWith(':fx')
    ? 'https://api-free.deepl.com/v2/translate'
    : 'https://api.deepl.com/v2/translate';
};

const translateTexts = async (texts, targetLang) => {
  const params = new URLSearchParams();
  params.set('auth_key', process.env.DEEPL_API_KEY);
  params.set('target_lang', targetLang.toUpperCase());
  texts.forEach((text) => params.append('text', text));

  const response = await fetch(getDeepLUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`DeepL error: ${response.status} ${body}`);
  }

  const data = await response.json();
  return data.translations.map((item) => item.text);
};

const hasTranslation = (annonce, lang) => {
  if (lang === 'fr') return Boolean(annonce.titreFr && annonce.contenuFr);
  if (lang === 'en') return Boolean(annonce.titreEn && annonce.contenuEn);
  if (lang === 'ar') return Boolean(annonce.titreAr && annonce.contenuAr);
  return true;
};

const autoTranslateAnnonce = async (annonce, lang) => {
  try {
    if (!process.env.DEEPL_API_KEY) return annonce;
    if (!supportedLangs.includes(lang)) return annonce;
    if (hasTranslation(annonce, lang)) return annonce;

    const sourceTitle = annonce.titreFr || annonce.titreEn || annonce.titreAr || annonce.titre;
    const sourceContent = annonce.contenuFr || annonce.contenuEn || annonce.contenuAr || annonce.contenu;

    if (!sourceTitle || !sourceContent) return annonce;

    const [tTitle, tContent] = await translateTexts([sourceTitle, sourceContent], lang);
    const data = lang === 'fr'
      ? { titreFr: tTitle, contenuFr: tContent }
      : lang === 'en'
        ? { titreEn: tTitle, contenuEn: tContent }
        : { titreAr: tTitle, contenuAr: tContent };

    return await prisma.annonce.update({ where: { id: annonce.id }, data });
  } catch (error) {
    console.error('Erreur autoTranslateAnnonce:', error);
    return annonce;
  }
};

export const getDashboardSyndic = async (req, res) => {
  try {
    const lang = getLang(req);
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

    const translatedDernieres = await Promise.all(
      dernieresAnnonces.map((annonce) => autoTranslateAnnonce(annonce, lang))
    );

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
      dernieresAnnonces: translatedDernieres.map((annonce) => localizeAnnonce(annonce, lang))
    });
  } catch (error) {
    console.error('Erreur getDashboardSyndic:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

export const getDashboardResident = async (req, res) => {
  try {
    const lang = getLang(req);
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
    const translatedAnnonces = await Promise.all(
      annonces.map((annonce) => autoTranslateAnnonce(annonce, lang))
    );

    const { password: _, ...userData } = user;

    res.json({
      user: userData,
      appartement: user.appartement,
      paiementMoisActuel,
      historiquePaiements,
      chargeMensuelle,
      annonces: translatedAnnonces.map((annonce) => localizeAnnonce(annonce, lang))
    });
  } catch (error) {
    console.error('Erreur getDashboardResident:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};
