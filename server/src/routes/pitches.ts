import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/index.js';
import { pitches, pitchImages, pitchWorkingHours, blockedSlots, bookings } from '../db/schema.js';
import { eq, and, gte, lte, or, like, sql } from 'drizzle-orm';
import { validateCity } from '../utils/cities.js';

// Helper to check if a column exists (for graceful degradation before migration)
// For now, we'll use a try-catch approach in queries

export const pitchesRouter = Router();

// Helper function to get locale from Accept-Language header (defaults to 'ar')
function getLocale(req: any): 'ar' | 'en' {
  const acceptLanguage = req.headers['accept-language'] || '';
  if (acceptLanguage.includes('en')) return 'en';
  return 'ar'; // Default to Arabic
}

// Helper function to localize pitch data
function localizePitch(pitch: any, locale: 'ar' | 'en') {
  return {
    ...pitch,
    name: locale === 'ar' ? (pitch.nameAr || pitch.name) : (pitch.nameEn || pitch.name),
    city: locale === 'ar' ? (pitch.cityAr || pitch.city) : (pitch.cityEn || pitch.city),
    address: locale === 'ar' ? (pitch.addressAr || pitch.address) : (pitch.addressEn || pitch.address),
    description: locale === 'ar' ? (pitch.descriptionAr || pitch.description) : (pitch.descriptionEn || pitch.description),
    type: locale === 'ar' ? (pitch.typeAr || (pitch.indoor ? 'داخلي' : 'خارجي')) : (pitch.typeEn || (pitch.indoor ? 'Indoor' : 'Outdoor')),
    // Keep keys for filtering
    cityKey: pitch.cityKey,
    typeKey: pitch.typeKey || (pitch.indoor ? 'indoor' : 'outdoor'),
  };
}

pitchesRouter.get('/', async (req, res) => {
  try {
    const city = req.query.city as string | undefined; // This is now city_key
    const indoor = req.query.indoor as string | undefined;
    const type = req.query.type as string | undefined; // Alternative to indoor, uses type_key
    const minPrice = req.query.minPrice ? parseInt(req.query.minPrice as string) : undefined;
    const maxPrice = req.query.maxPrice ? parseInt(req.query.maxPrice as string) : undefined;
    const search = req.query.search as string | undefined;
    const locale = getLocale(req);

    // Validate city if provided (city is now city_key)
    if (city) {
      const cityValidation = validateCity(city);
      if (!cityValidation.valid) {
        return res.status(400).json({
          message: cityValidation.error,
          code: 'VALIDATION_ERROR',
        });
      }
    }

    let query = db.select().from(pitches);

    const conditions = [];

    // Filter by city_key (preferred) or fallback to city for backward compatibility
    if (city) {
      // Check if it's a city_key (uppercase like "AMMAN") or legacy city name
      const isCityKey = city === city.toUpperCase() && city.length <= 20 && /^[A-Z_]+$/.test(city);
      if (isCityKey) {
        // It's a city_key, filter by cityKey column (with fallback to city for backward compatibility)
        conditions.push(
          or(
            eq(pitches.cityKey, city),
            eq(pitches.city, city)
          )!
        );
      } else {
        // It's a legacy city name, filter by city column
        conditions.push(eq(pitches.city, city));
      }
    }

    // Filter by type_key (preferred) or indoor boolean (backward compatibility)
    if (type) {
      // Convert type_key to indoor boolean for now (type_key will work after migration)
      conditions.push(eq(pitches.indoor, type === 'indoor'));
    } else if (indoor !== undefined) {
      conditions.push(eq(pitches.indoor, indoor === 'true'));
    }

    if (minPrice !== undefined) {
      conditions.push(gte(pitches.pricePerHour, minPrice));
    }

    if (maxPrice !== undefined) {
      conditions.push(lte(pitches.pricePerHour, maxPrice));
    }

    if (search) {
      // Search in legacy fields (bilingual fields will be added after migration)
      // After migration runs, this will automatically search both languages
      conditions.push(
        or(
          like(pitches.name, `%${search}%`),
          like(pitches.description, `%${search}%`),
          like(pitches.address, `%${search}%`)
        )!
      );
    }

    // Select only existing columns (legacy fields)
    // After migration, bilingual fields will be included automatically
    const allPitches = conditions.length > 0
      ? await db.select({
          id: pitches.id,
          name: pitches.name,
          city: pitches.city,
          address: pitches.address,
          indoor: pitches.indoor,
          description: pitches.description,
          pricePerHour: pitches.pricePerHour,
          openTime: pitches.openTime,
          closeTime: pitches.closeTime,
          createdAt: pitches.createdAt,
          // Bilingual fields (will be undefined if columns don't exist yet)
          nameAr: pitches.nameAr,
          nameEn: pitches.nameEn,
          cityAr: pitches.cityAr,
          cityEn: pitches.cityEn,
          addressAr: pitches.addressAr,
          addressEn: pitches.addressEn,
          descriptionAr: pitches.descriptionAr,
          descriptionEn: pitches.descriptionEn,
          typeAr: pitches.typeAr,
          typeEn: pitches.typeEn,
          cityKey: pitches.cityKey,
          typeKey: pitches.typeKey,
        }).from(pitches).where(and(...conditions))
      : await db.select({
          id: pitches.id,
          name: pitches.name,
          city: pitches.city,
          address: pitches.address,
          indoor: pitches.indoor,
          description: pitches.description,
          pricePerHour: pitches.pricePerHour,
          openTime: pitches.openTime,
          closeTime: pitches.closeTime,
          createdAt: pitches.createdAt,
          // Bilingual fields (will be undefined if columns don't exist yet)
          nameAr: pitches.nameAr,
          nameEn: pitches.nameEn,
          cityAr: pitches.cityAr,
          cityEn: pitches.cityEn,
          addressAr: pitches.addressAr,
          addressEn: pitches.addressEn,
          descriptionAr: pitches.descriptionAr,
          descriptionEn: pitches.descriptionEn,
          typeAr: pitches.typeAr,
          typeEn: pitches.typeEn,
          cityKey: pitches.cityKey,
          typeKey: pitches.typeKey,
        }).from(pitches);

    // Get images for each pitch and localize
    const pitchesWithImages = await Promise.all(
      allPitches.map(async (pitch) => {
        const images = await db
          .select()
          .from(pitchImages)
          .where(eq(pitchImages.pitchId, pitch.id))
          .orderBy(pitchImages.sortOrder);

        const localized = localizePitch(pitch, locale);
        return {
          ...localized,
          images: images.map(img => img.url),
        };
      })
    );

    res.json({ data: pitchesWithImages });
  } catch (error) {
    console.error('Get pitches error:', error);
    res.status(500).json({ message: 'Internal server error', code: 'INTERNAL_ERROR' });
  }
});

pitchesRouter.get('/:id', async (req, res) => {
  try {
    const locale = getLocale(req);
    
    const [pitch] = await db
      .select()
      .from(pitches)
      .where(eq(pitches.id, req.params.id))
      .limit(1);

    if (!pitch) {
      return res.status(404).json({ message: 'Pitch not found', code: 'NOT_FOUND' });
    }

    const images = await db
      .select()
      .from(pitchImages)
      .where(eq(pitchImages.pitchId, pitch.id))
      .orderBy(pitchImages.sortOrder);

    const workingHours = await db
      .select()
      .from(pitchWorkingHours)
      .where(eq(pitchWorkingHours.pitchId, pitch.id));

    const localized = localizePitch(pitch, locale);

    res.json({
      data: {
        ...localized,
        images: images.map(img => img.url),
        workingHours,
      },
    });
  } catch (error) {
    console.error('Get pitch error:', error);
    res.status(500).json({ message: 'Internal server error', code: 'INTERNAL_ERROR' });
  }
});

pitchesRouter.get('/:id/availability', async (req, res) => {
  try {
    const pitchId = req.params.id;
    const date = req.query.date as string;

    if (!date) {
      return res.status(400).json({ message: 'Date parameter is required', code: 'MISSING_DATE' });
    }

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ message: 'Invalid date format. Use YYYY-MM-DD', code: 'INVALID_DATE' });
    }

    // Get pitch
    const [pitch] = await db
      .select()
      .from(pitches)
      .where(eq(pitches.id, pitchId))
      .limit(1);

    if (!pitch) {
      return res.status(404).json({ message: 'Pitch not found', code: 'NOT_FOUND' });
    }

    // Get working hours for this day (0-6, 0 = Sunday)
    const dayOfWeek = new Date(date).getDay();
    const [workingHours] = await db
      .select()
      .from(pitchWorkingHours)
      .where(
        and(
          eq(pitchWorkingHours.pitchId, pitchId),
          eq(pitchWorkingHours.dayOfWeek, dayOfWeek)
        )
      )
      .limit(1);

    // Use working hours if available, otherwise use default pitch hours
    const openTime = workingHours?.openTime || pitch.openTime || '08:00:00';
    const closeTime = workingHours?.closeTime || pitch.closeTime || '22:00:00';

    // Get blocked slots for this date
    const blocked = await db
      .select()
      .from(blockedSlots)
      .where(
        and(
          eq(blockedSlots.pitchId, pitchId),
          eq(blockedSlots.date, date)
        )
      );

    // Get existing bookings for this date
    const existingBookings = await db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.pitchId, pitchId),
          eq(bookings.date, date),
          sql`${bookings.status} IN ('PENDING', 'CONFIRMED')`
        )
      );

    // Generate available time slots (every hour from open to close)
    const availableSlots: string[] = [];
    const [openHour, openMin] = openTime.split(':').map(Number);
    const [closeHour, closeMin] = closeTime.split(':').map(Number);

    const openMinutes = openHour * 60 + openMin;
    const closeMinutes = closeHour * 60 + closeMin;

    for (let minutes = openMinutes; minutes < closeMinutes; minutes += 60) {
      const hour = Math.floor(minutes / 60);
      const min = minutes % 60;
      const timeSlot = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;

      // Check if slot is blocked
      const isBlocked = blocked.some(block => {
        const [blockStartHour, blockStartMin] = block.startTime.split(':').map(Number);
        const [blockEndHour, blockEndMin] = block.endTime.split(':').map(Number);
        const blockStartMinutes = blockStartHour * 60 + blockStartMin;
        const blockEndMinutes = blockEndHour * 60 + blockEndMin;
        return minutes >= blockStartMinutes && minutes < blockEndMinutes;
      });

      // Check if slot is booked
      const isBooked = existingBookings.some(booking => {
        const [bookStartHour, bookStartMin] = booking.startTime.split(':').map(Number);
        const bookStartMinutes = bookStartHour * 60 + bookStartMin;
        return minutes >= bookStartMinutes && minutes < bookStartMinutes + booking.durationMinutes;
      });

      if (!isBlocked && !isBooked) {
        availableSlots.push(timeSlot);
      }
    }

    res.json({ data: { availableSlots, date } });
  } catch (error) {
    console.error('Get availability error:', error);
    res.status(500).json({ message: 'Internal server error', code: 'INTERNAL_ERROR' });
  }
});

