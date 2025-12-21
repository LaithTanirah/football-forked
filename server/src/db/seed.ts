import { db } from './index.js';
import { pitches, pitchImages, pitchWorkingHours, users } from './schema.js';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const jordanPitches = [
  {
    nameAr: 'مجمع الأهلي الرياضي',
    nameEn: 'Al-Ahli Sports Complex',
    cityKey: 'AMMAN',
    cityAr: 'عمّان',
    cityEn: 'Amman',
    addressAr: 'عبدون، عمّان، الأردن',
    addressEn: 'Abdoun, Amman, Jordan',
    typeKey: 'outdoor',
    typeAr: 'خارجي',
    typeEn: 'Outdoor',
    indoor: false,
    descriptionAr: 'ملعب 6 ضد 6 متميز مع عشب احترافي وإضاءة ممتازة',
    descriptionEn: 'Premium 6-a-side pitch with professional turf and lighting',
    pricePerHour: 50,
    images: [
      'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=800',
      'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800',
    ],
  },
  {
    nameAr: 'ساحة الزرقاء لكرة القدم',
    nameEn: 'Zarqa Football Arena',
    cityKey: 'ZARQA',
    cityAr: 'الزرقاء',
    cityEn: 'Zarqa',
    addressAr: 'وسط البلد، الزرقاء، الأردن',
    addressEn: 'Downtown Zarqa, Jordan',
    typeKey: 'indoor',
    typeAr: 'داخلي',
    typeEn: 'Indoor',
    indoor: true,
    descriptionAr: 'منشأة داخلية 6 ضد 6 مع تكييف هواء',
    descriptionEn: 'Indoor 6-a-side facility with climate control',
    pricePerHour: 40,
    images: [
      'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=800',
    ],
  },
  {
    nameAr: 'مركز إربد الرياضي',
    nameEn: 'Irbid Sports Center',
    cityKey: 'IRBID',
    cityAr: 'إربد',
    cityEn: 'Irbid',
    addressAr: 'شارع الجامعة، إربد، الأردن',
    addressEn: 'University Street, Irbid, Jordan',
    typeKey: 'outdoor',
    typeAr: 'خارجي',
    typeEn: 'Outdoor',
    indoor: false,
    descriptionAr: 'ملعب خارجي حديث مع مرافق ممتازة',
    descriptionEn: 'Modern outdoor pitch with excellent facilities',
    pricePerHour: 35,
    images: [
      'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800',
      'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=800',
    ],
  },
  {
    nameAr: 'نادي العقبة الشاطئي الرياضي',
    nameEn: 'Aqaba Beach Sports Club',
    cityKey: 'AQABA',
    cityAr: 'العقبة',
    cityEn: 'Aqaba',
    addressAr: 'طريق الشاطئ، العقبة، الأردن',
    addressEn: 'Beach Road, Aqaba, Jordan',
    typeKey: 'outdoor',
    typeAr: 'خارجي',
    typeEn: 'Outdoor',
    indoor: false,
    descriptionAr: 'ملعب 6 ضد 6 بجانب الشاطئ مع إطلالة رائعة',
    descriptionEn: 'Scenic beachside 6-a-side pitch',
    pricePerHour: 45,
    images: [
      'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=800',
    ],
  },
  {
    nameAr: 'ملعب عمّان المدينة',
    nameEn: 'Amman City Pitch',
    cityKey: 'AMMAN',
    cityAr: 'عمّان',
    cityEn: 'Amman',
    addressAr: 'جبل عمّان، عمّان، الأردن',
    addressEn: 'Jabal Amman, Amman, Jordan',
    typeKey: 'outdoor',
    typeAr: 'خارجي',
    typeEn: 'Outdoor',
    indoor: false,
    descriptionAr: 'موقع مركزي مع سهولة الوصول',
    descriptionEn: 'Central location with easy access',
    pricePerHour: 30,
    images: [
      'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800',
    ],
  },
  {
    nameAr: 'المجمع الرياضي الملكي',
    nameEn: 'Royal Sports Complex',
    cityKey: 'AMMAN',
    cityAr: 'عمّان',
    cityEn: 'Amman',
    addressAr: 'دابوق، عمّان، الأردن',
    addressEn: 'Dabouq, Amman, Jordan',
    typeKey: 'indoor',
    typeAr: 'داخلي',
    typeEn: 'Indoor',
    indoor: true,
    descriptionAr: 'منشأة داخلية فاخرة مع مرافق متميزة',
    descriptionEn: 'Luxury indoor facility with premium amenities',
    pricePerHour: 60,
    images: [
      'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=800',
      'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800',
    ],
  },
  {
    nameAr: 'مركز الزرقاء الشبابي',
    nameEn: 'Zarqa Youth Center',
    cityKey: 'ZARQA',
    cityAr: 'الزرقاء',
    cityEn: 'Zarqa',
    addressAr: 'الهاشمي، الزرقاء، الأردن',
    addressEn: 'Al-Hashimi, Zarqa, Jordan',
    typeKey: 'outdoor',
    typeAr: 'خارجي',
    typeEn: 'Outdoor',
    indoor: false,
    descriptionAr: 'ملعب مجتمعي بأسعار معقولة',
    descriptionEn: 'Affordable community pitch',
    pricePerHour: 25,
    images: [
      'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800',
    ],
  },
  {
    nameAr: 'ملعب إربد الجامعي',
    nameEn: 'Irbid University Pitch',
    cityKey: 'IRBID',
    cityAr: 'إربد',
    cityEn: 'Irbid',
    addressAr: 'منطقة جامعة اليرموك، إربد، الأردن',
    addressEn: 'Yarmouk University Area, Irbid, Jordan',
    typeKey: 'outdoor',
    typeAr: 'خارجي',
    typeEn: 'Outdoor',
    indoor: false,
    descriptionAr: 'شائع بين الطلاب والسكان المحليين',
    descriptionEn: 'Popular among students and locals',
    pricePerHour: 30,
    images: [
      'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=800',
    ],
  },
];

async function seed() {
  try {
    console.log('Seeding database...');

    // Seed development users for quick login
    const devUsers = [
      {
        name: 'Admin User',
        username: 'admin',
        email: 'admin@example.com',
        password: 'admin123',
        role: 'ADMIN' as const,
        city: 'Amman',
      },
      {
        name: 'Test User 1',
        username: 'user1',
        email: 'user1@example.com',
        password: 'password123',
        role: 'USER' as const,
        city: 'Amman',
      },
      {
        name: 'Test User 2',
        username: 'user2',
        email: 'user2@example.com',
        password: 'password123',
        role: 'USER' as const,
        city: 'Zarqa',
      },
      {
        name: 'Nazzal',
        username: 'nazzal',
        email: 'nazzal@example.com',
        password: 'password123',
        role: 'USER' as const,
        city: 'Amman',
      },
    ];

    console.log('Seeding development users...');
    for (const userData of devUsers) {
      // Check if user already exists
      const existing = await db
        .select()
        .from(users)
        .where(eq(users.username, userData.username))
        .limit(1);

      const passwordHash = await bcrypt.hash(userData.password, 10);

      if (existing.length === 0) {
        // Create new user
        await db.insert(users).values({
          name: userData.name,
          username: userData.username,
          email: userData.email,
          passwordHash,
          role: userData.role,
          city: userData.city,
        });
        console.log(`✓ Seeded user: ${userData.username}`);
      } else {
        // Update existing user's password to match quick login credentials
        // Only update password, name, role, and city (skip email to avoid conflicts)
        try {
          await db
            .update(users)
            .set({
              passwordHash,
              name: userData.name,
              role: userData.role,
              city: userData.city,
            })
            .where(eq(users.username, userData.username));
          console.log(`✓ Updated password for user: ${userData.username}`);
        } catch (error) {
          console.error(`Error updating user ${userData.username}:`, error);
        }
      }
    }

    // Clear existing data (optional - comment out if you want to keep existing data)
    // await db.delete(pitchImages);
    // await db.delete(pitchWorkingHours);
    // await db.delete(pitches);

    for (const pitchData of jordanPitches) {
      const [pitch] = await db
        .insert(pitches)
        .values({
          // Bilingual fields
          nameAr: pitchData.nameAr,
          nameEn: pitchData.nameEn,
          cityKey: pitchData.cityKey,
          cityAr: pitchData.cityAr,
          cityEn: pitchData.cityEn,
          addressAr: pitchData.addressAr,
          addressEn: pitchData.addressEn,
          descriptionAr: pitchData.descriptionAr,
          descriptionEn: pitchData.descriptionEn,
          typeKey: pitchData.typeKey,
          typeAr: pitchData.typeAr,
          typeEn: pitchData.typeEn,
          // Legacy fields (for backward compatibility)
          name: pitchData.nameEn,
          city: pitchData.cityEn,
          address: pitchData.addressEn,
          indoor: pitchData.indoor,
          description: pitchData.descriptionEn,
          pricePerHour: pitchData.pricePerHour,
          openTime: '08:00:00',
          closeTime: '22:00:00',
        })
        .returning();

      // Add images
      if (pitchData.images.length > 0) {
        await db.insert(pitchImages).values(
          pitchData.images.map((url, index) => ({
            pitchId: pitch.id,
            url,
            sortOrder: index,
          }))
        );
      }

      // Add default working hours (all days, 8 AM - 10 PM)
      const workingHours = Array.from({ length: 7 }, (_, day) => ({
        pitchId: pitch.id,
        dayOfWeek: day,
        openTime: '08:00:00',
        closeTime: '22:00:00',
      }));

      await db.insert(pitchWorkingHours).values(workingHours);

      console.log(`✓ Seeded pitch: ${pitch.name}`);
    }

    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seed();

