import { db } from './index.js';
import { pitches, pitchImages, pitchWorkingHours } from './schema.js';
import dotenv from 'dotenv';

dotenv.config();

const jordanPitches = [
  {
    name: 'Al-Ahli Sports Complex',
    city: 'Amman',
    address: 'Abdoun, Amman, Jordan',
    indoor: false,
    description: 'Premium 6-a-side pitch with professional turf and lighting',
    pricePerHour: 50,
    images: [
      'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=800',
      'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800',
    ],
  },
  {
    name: 'Zarqa Football Arena',
    city: 'Zarqa',
    address: 'Downtown Zarqa, Jordan',
    indoor: true,
    description: 'Indoor 6-a-side facility with climate control',
    pricePerHour: 40,
    images: [
      'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=800',
    ],
  },
  {
    name: 'Irbid Sports Center',
    city: 'Irbid',
    address: 'University Street, Irbid, Jordan',
    indoor: false,
    description: 'Modern outdoor pitch with excellent facilities',
    pricePerHour: 35,
    images: [
      'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800',
      'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=800',
    ],
  },
  {
    name: 'Aqaba Beach Sports Club',
    city: 'Aqaba',
    address: 'Beach Road, Aqaba, Jordan',
    indoor: false,
    description: 'Scenic beachside 6-a-side pitch',
    pricePerHour: 45,
    images: [
      'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=800',
    ],
  },
  {
    name: 'Amman City Pitch',
    city: 'Amman',
    address: 'Jabal Amman, Amman, Jordan',
    indoor: false,
    description: 'Central location with easy access',
    pricePerHour: 30,
    images: [
      'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800',
    ],
  },
  {
    name: 'Royal Sports Complex',
    city: 'Amman',
    address: 'Dabouq, Amman, Jordan',
    indoor: true,
    description: 'Luxury indoor facility with premium amenities',
    pricePerHour: 60,
    images: [
      'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=800',
      'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800',
    ],
  },
  {
    name: 'Zarqa Youth Center',
    city: 'Zarqa',
    address: 'Al-Hashimi, Zarqa, Jordan',
    indoor: false,
    description: 'Affordable community pitch',
    pricePerHour: 25,
    images: [
      'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800',
    ],
  },
  {
    name: 'Irbid University Pitch',
    city: 'Irbid',
    address: 'Yarmouk University Area, Irbid, Jordan',
    indoor: false,
    description: 'Popular among students and locals',
    pricePerHour: 30,
    images: [
      'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=800',
    ],
  },
];

async function seed() {
  try {
    console.log('Seeding database...');

    // Clear existing data (optional - comment out if you want to keep existing data)
    // await db.delete(pitchImages);
    // await db.delete(pitchWorkingHours);
    // await db.delete(pitches);

    for (const pitchData of jordanPitches) {
      const [pitch] = await db
        .insert(pitches)
        .values({
          name: pitchData.name,
          city: pitchData.city,
          address: pitchData.address,
          indoor: pitchData.indoor,
          description: pitchData.description,
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

