import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const normalizeText = (value) => {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

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

const translateTexts = async (texts, sourceLang, targetLang) => {
  const params = new URLSearchParams();
  params.set('auth_key', process.env.DEEPL_API_KEY);
  if (sourceLang) params.set('source_lang', sourceLang.toUpperCase());
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

const buildTranslations = async (title, content, sourceLang) => {
  const translations = {
    fr: { title: null, content: null },
    en: { title: null, content: null },
    ar: { title: null, content: null }
  };

  translations[sourceLang] = { title, content };

  const targets = supportedLangs.filter((lang) => lang !== sourceLang);
  const results = await Promise.all(targets.map(async (target) => {
    const [tTitle, tContent] = await translateTexts([title, content], sourceLang, target);
    return { target, tTitle, tContent };
  }));

  results.forEach(({ target, tTitle, tContent }) => {
    translations[target] = { title: tTitle, content: tContent };
  });

  return translations;
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

    const [tTitle, tContent] = await translateTexts([sourceTitle, sourceContent], null, lang);
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

export const getAllAnnonces = async (req, res) => {
  try {
    const lang = getLang(req);
    const annonces = await prisma.annonce.findMany({ orderBy: { createdAt: 'desc' } });
    const translated = await Promise.all(annonces.map((annonce) => autoTranslateAnnonce(annonce, lang)));
    res.json(translated.map((annonce) => localizeAnnonce(annonce, lang)));
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

export const getAnnonceById = async (req, res) => {
  try {
    const annonce = await prisma.annonce.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!annonce) return res.status(404).json({ message: 'Annonce non trouvée.' });
    const lang = getLang(req);
    const translated = await autoTranslateAnnonce(annonce, lang);
    res.json(localizeAnnonce(translated, lang));
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

export const createAnnonce = async (req, res) => {
  try {
    const { titre, contenu, categorie } = req.body;

    const baseTitre = normalizeText(titre);
    const baseContenu = normalizeText(contenu);

    if (!baseTitre || !baseContenu || !categorie) {
      return res.status(400).json({ message: 'Champs obligatoires manquants.' });
    }

    if (!process.env.DEEPL_API_KEY) {
      return res.status(500).json({ message: 'Configuration DeepL manquante.' });
    }

    const lang = getLang(req);
    const translations = await buildTranslations(baseTitre, baseContenu, lang);

    const annonce = await prisma.annonce.create({
      data: {
        titre: baseTitre,
        contenu: baseContenu,
        categorie,
        titreFr: translations.fr.title,
        contenuFr: translations.fr.content,
        titreEn: translations.en.title,
        titreAr: translations.ar.title,
        contenuEn: translations.en.content,
        contenuAr: translations.ar.content
      }
    });
    res.status(201).json({ message: 'Annonce créée.', annonce });
  } catch (error) {
    console.error('Erreur createAnnonce:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

export const updateAnnonce = async (req, res) => {
  try {
    const { titre, contenu, categorie } = req.body;
    const annonce = await prisma.annonce.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!annonce) return res.status(404).json({ message: 'Annonce non trouvée.' });

    const data = {};

    if (categorie) data.categorie = categorie;

    const nextTitre = normalizeText(titre);
    const nextContenu = normalizeText(contenu);

    if (nextTitre || nextContenu) {
      if (!process.env.DEEPL_API_KEY) {
        return res.status(500).json({ message: 'Configuration DeepL manquante.' });
      }

      const lang = getLang(req);
      const titleToUse = nextTitre || annonce.titre;
      const contentToUse = nextContenu || annonce.contenu;
      const translations = await buildTranslations(titleToUse, contentToUse, lang);

      data.titre = titleToUse;
      data.contenu = contentToUse;
      data.titreFr = translations.fr.title;
      data.contenuFr = translations.fr.content;
      data.titreEn = translations.en.title;
      data.contenuEn = translations.en.content;
      data.titreAr = translations.ar.title;
      data.contenuAr = translations.ar.content;
    }

    const updated = await prisma.annonce.update({
      where: { id: parseInt(req.params.id) },
      data
    });
    res.json({ message: 'Annonce modifiée.', annonce: updated });
  } catch (error) {
    console.error('Erreur updateAnnonce:', error);
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
