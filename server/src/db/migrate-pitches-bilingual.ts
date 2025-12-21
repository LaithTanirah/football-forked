import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

const sql = neon(process.env.DATABASE_URL);

// City mapping from old strings to city_key
const cityMapping: Record<string, string> = {
  'Amman': 'AMMAN',
  'amman': 'AMMAN',
  'Irbid': 'IRBID',
  'irbid': 'IRBID',
  'Zarqa': 'ZARQA',
  'zarqa': 'ZARQA',
  'Aqaba': 'AQABA',
  'aqaba': 'AQABA',
  'Salt': 'SALT',
  'salt': 'SALT',
  'Madaba': 'MADABA',
  'madaba': 'MADABA',
  'Karak': 'KARAK',
  'karak': 'KARAK',
  'Tafilah': 'TAFILAH',
  'tafilah': 'TAFILAH',
  "Ma'an": 'MAAN',
  "ma'an": 'MAAN',
  'Jerash': 'JERASH',
  'jerash': 'JERASH',
  'Ajloun': 'AJLOUN',
  'ajloun': 'AJLOUN',
  'Mafraq': 'MAFRAQ',
  'mafraq': 'MAFRAQ',
};

// City translations
const cityTranslations: Record<string, { ar: string; en: string }> = {
  'AMMAN': { ar: 'عمّان', en: 'Amman' },
  'IRBID': { ar: 'إربد', en: 'Irbid' },
  'ZARQA': { ar: 'الزرقاء', en: 'Zarqa' },
  'AQABA': { ar: 'العقبة', en: 'Aqaba' },
  'SALT': { ar: 'السلط', en: 'Salt' },
  'MADABA': { ar: 'مادبا', en: 'Madaba' },
  'KARAK': { ar: 'الكرك', en: 'Karak' },
  'TAFILAH': { ar: 'الطفيلة', en: 'Tafilah' },
  'MAAN': { ar: 'معان', en: "Ma'an" },
  'JERASH': { ar: 'جرش', en: 'Jerash' },
  'AJLOUN': { ar: 'عجلون', en: 'Ajloun' },
  'MAFRAQ': { ar: 'المفرق', en: 'Mafraq' },
};

async function migratePitchesBilingual() {
  try {
    console.log('Starting pitches bilingual migration...');

    // Step 1: Add new columns if they don't exist
    console.log('Adding bilingual columns...');
    await sql`
      ALTER TABLE "pitches"
      ADD COLUMN IF NOT EXISTS "name_ar" VARCHAR(255),
      ADD COLUMN IF NOT EXISTS "name_en" VARCHAR(255),
      ADD COLUMN IF NOT EXISTS "city_ar" VARCHAR(100),
      ADD COLUMN IF NOT EXISTS "city_en" VARCHAR(100),
      ADD COLUMN IF NOT EXISTS "address_ar" TEXT,
      ADD COLUMN IF NOT EXISTS "address_en" TEXT,
      ADD COLUMN IF NOT EXISTS "description_ar" TEXT,
      ADD COLUMN IF NOT EXISTS "description_en" TEXT,
      ADD COLUMN IF NOT EXISTS "type_ar" VARCHAR(50),
      ADD COLUMN IF NOT EXISTS "type_en" VARCHAR(50),
      ADD COLUMN IF NOT EXISTS "city_key" VARCHAR(50),
      ADD COLUMN IF NOT EXISTS "type_key" VARCHAR(20);
    `;
    console.log('✓ Columns added');

    // Step 2: Create index on city_key
    await sql`
      CREATE INDEX IF NOT EXISTS "pitches_city_key_idx" ON "pitches" ("city_key");
    `;
    console.log('✓ Index created');

    // Step 3: Migrate existing data
    console.log('Migrating existing pitch data...');
    const pitches = await sql`
      SELECT id, name, city, address, description, indoor
      FROM pitches
      WHERE name_ar IS NULL OR city_key IS NULL
    `;

    for (const pitch of pitches) {
      // Determine city_key from existing city value
      const cityKey = cityMapping[pitch.city] || 'AMMAN'; // Default to AMMAN if unknown
      const cityTrans = cityTranslations[cityKey] || { ar: pitch.city, en: pitch.city };

      // Set type translations
      const typeKey = pitch.indoor ? 'indoor' : 'outdoor';
      const typeAr = pitch.indoor ? 'داخلي' : 'خارجي';
      const typeEn = pitch.indoor ? 'Indoor' : 'Outdoor';

      // For now, use existing English values as both languages (will be updated in seed)
      // In production, you'd want to translate these properly
      await sql`
        UPDATE pitches
        SET
          name_ar = COALESCE(name_ar, ${pitch.name}),
          name_en = COALESCE(name_en, ${pitch.name}),
          city_ar = COALESCE(city_ar, ${cityTrans.ar}),
          city_en = COALESCE(city_en, ${cityTrans.en}),
          address_ar = COALESCE(address_ar, ${pitch.address}),
          address_en = COALESCE(address_en, ${pitch.address}),
          description_ar = COALESCE(description_ar, ${pitch.description || ''}),
          description_en = COALESCE(description_en, ${pitch.description || ''}),
          type_ar = COALESCE(type_ar, ${typeAr}),
          type_en = COALESCE(type_en, ${typeEn}),
          city_key = COALESCE(city_key, ${cityKey}),
          type_key = COALESCE(type_key, ${typeKey})
        WHERE id = ${pitch.id}
      `;
    }

    console.log(`✓ Migrated ${pitches.length} pitches`);

    // Step 4: Update legacy fields to match bilingual fields (for backward compatibility)
    console.log('Updating legacy fields...');
    await sql`
      UPDATE pitches
      SET
        name = COALESCE(name_en, name_ar, name),
        city = COALESCE(city_en, city_ar, city),
        address = COALESCE(address_en, address_ar, address),
        description = COALESCE(description_en, description_ar, description)
      WHERE name IS NULL OR city IS NULL OR address IS NULL
    `;
    console.log('✓ Legacy fields updated');

    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migratePitchesBilingual();

