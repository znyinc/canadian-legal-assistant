import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import fr from './locales/fr.json';

const STORAGE_KEY = 'cla-language';

const languageFromStorage = (): string => {
  if (typeof window === 'undefined') return 'en';
  const value = window.localStorage.getItem(STORAGE_KEY);
  return value === 'fr' ? 'fr' : 'en';
};

void i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      fr: { translation: fr },
    },
    lng: languageFromStorage(),
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

i18n.on('languageChanged', (lng) => {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, lng === 'fr' ? 'fr' : 'en');
  }
});

export default i18n;
