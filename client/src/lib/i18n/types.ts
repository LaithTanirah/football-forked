export type Locale = 'ar' | 'en';

export interface LocaleConfig {
  code: Locale;
  label: string;
  dir: 'ltr' | 'rtl';
  flag: string;
}

export const locales: Record<Locale, LocaleConfig> = {
  ar: {
    code: 'ar',
    label: 'العربية',
    dir: 'rtl',
    flag: '🇸🇦',
  },
  en: {
    code: 'en',
    label: 'English',
    dir: 'ltr',
    flag: '🇬🇧',
  },
};

