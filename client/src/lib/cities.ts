/**
 * Jordan Cities - Standardized list of governorates/cities
 * Used throughout the application for consistent city selection and validation
 */

export interface City {
  key: string;
  en: string;
  ar: string;
}

export const JORDAN_CITIES: City[] = [
  { key: 'AMMAN', en: 'Amman', ar: 'عمّان' },
  { key: 'IRBID', en: 'Irbid', ar: 'إربد' },
  { key: 'ZARQA', en: 'Zarqa', ar: 'الزرقاء' },
  { key: 'AQABA', en: 'Aqaba', ar: 'العقبة' },
  { key: 'SALT', en: 'Salt', ar: 'السلط' },
  { key: 'MADABA', en: 'Madaba', ar: 'مادبا' },
  { key: 'KARAK', en: 'Karak', ar: 'الكرك' },
  { key: 'TAFILAH', en: "Tafilah", ar: 'الطفيلة' },
  { key: 'MAAN', en: "Ma'an", ar: 'معان' },
  { key: 'JERASH', en: 'Jerash', ar: 'جرش' },
  { key: 'AJLOUN', en: 'Ajloun', ar: 'عجلون' },
  { key: 'MAFRAQ', en: 'Mafraq', ar: 'المفرق' },
];

/**
 * Get city by key
 */
export function getCityByKey(key: string): City | undefined {
  return JORDAN_CITIES.find(city => city.key === key);
}

/**
 * Get city display name based on locale
 */
export function getCityDisplayName(key: string, locale: 'en' | 'ar' = 'ar'): string {
  const city = getCityByKey(key);
  if (!city) return key;
  return locale === 'ar' ? city.ar : city.en;
}

/**
 * Check if a city key is valid
 */
export function isValidCityKey(key: string): boolean {
  return JORDAN_CITIES.some(city => city.key === key);
}

/**
 * Get all city keys
 */
export function getAllCityKeys(): string[] {
  return JORDAN_CITIES.map(city => city.key);
}

