/**
 * Jordan Cities - Backend validation utility
 * Must match the frontend cities list in client/src/lib/cities.ts
 */

export const JORDAN_CITY_KEYS = [
  'AMMAN',
  'IRBID',
  'ZARQA',
  'AQABA',
  'SALT',
  'MADABA',
  'KARAK',
  'TAFILAH',
  'MAAN',
  'JERASH',
  'AJLOUN',
  'MAFRAQ',
] as const;

export type JordanCityKey = typeof JORDAN_CITY_KEYS[number];

/**
 * Check if a city key is valid
 */
export function isValidCityKey(city: string | null | undefined): city is JordanCityKey {
  if (!city) return false;
  return JORDAN_CITY_KEYS.includes(city as JordanCityKey);
}

/**
 * Validate city key and return error message if invalid
 */
export function validateCity(city: string | null | undefined): { valid: boolean; error?: string } {
  if (!city) {
    return { valid: false, error: 'City is required' };
  }
  
  if (!isValidCityKey(city)) {
    return { 
      valid: false, 
      error: `Invalid city. Must be one of: ${JORDAN_CITY_KEYS.join(', ')}` 
    };
  }
  
  return { valid: true };
}

