import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import arTranslations from './locales/ar.json';
import enTranslations from './locales/en.json';
import { Locale } from './types';

// Get initial locale from localStorage or default to Arabic
const getInitialLocale = (): Locale => {
  const stored = localStorage.getItem('locale') as Locale | null;
  return stored || 'ar';
};

const initialLocale = getInitialLocale();

i18n
  .use(initReactI18next)
  .init({
    resources: {
      ar: {
        translation: arTranslations,
      },
      en: {
        translation: enTranslations,
      },
    },
    lng: initialLocale,
    fallbackLng: 'ar',
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    react: {
      useSuspense: false,
    },
  });

// Update HTML dir attribute when locale changes
const updateDocumentDirection = (locale: Locale) => {
  const dir = locale === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.setAttribute('dir', dir);
  document.documentElement.setAttribute('lang', locale);
};

// Set initial direction
updateDocumentDirection(initialLocale);

// Listen for language changes
i18n.on('languageChanged', (lng) => {
  updateDocumentDirection(lng as Locale);
});

export default i18n;

