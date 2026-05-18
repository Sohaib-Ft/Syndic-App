import { createContext, useContext, useState, useEffect } from 'react';
import fr from '../i18n/fr';
import en from '../i18n/en';
import ar from '../i18n/ar';

const translations = { fr, en, ar };
const LangContext = createContext();

export function LangProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('syndic_lang') || 'fr');

  useEffect(() => {
    localStorage.setItem('syndic_lang', lang);
    document.documentElement.dir = translations[lang].dir;
    document.documentElement.lang = lang;
  }, [lang]);

  const t = translations[lang];
  const switchLang = (newLang) => setLang(newLang);

  return (
    <LangContext.Provider value={{ lang, t, switchLang }}>
      {children}
    </LangContext.Provider>
  );
}

export const useLang = () => useContext(LangContext);
