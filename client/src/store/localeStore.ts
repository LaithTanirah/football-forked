import { create } from 'zustand';
import i18n from '@/lib/i18n';
import { Locale } from '@/lib/i18n/types';

interface LocaleState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

export const useLocaleStore = create<LocaleState>((set) => {
  // Initialize from localStorage or default to Arabic
  const stored = localStorage.getItem('locale') as Locale | null;
  const initialLocale = stored || 'ar';

  // Ensure i18n is initialized with the stored locale
  if (i18n.language !== initialLocale) {
    i18n.changeLanguage(initialLocale);
  }

  return {
    locale: initialLocale,
    setLocale: (locale: Locale) => {
      localStorage.setItem('locale', locale);
      i18n.changeLanguage(locale);
      set({ locale });
    },
  };
});

