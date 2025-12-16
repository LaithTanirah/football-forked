import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/index.js';
import { pitches, pitchImages, pitchWorkingHours, blockedSlots, bookings } from '../db/schema.js';
import { eq, and, gte, lte, or, like, sql } from 'drizzle-orm';

export const pitchesRouter = Router();

pitchesRouter.get('/', async (req, res) => {
  try {
    const city = req.query.city as string | undefined;
    const indoor = req.query.indoor as string | undefined;
    const minPrice = req.query.minPrice ? parseInt(req.query.minPrice as string) : undefined;
    const maxPrice = req.query.maxPrice ? parseInt(req.query.maxPrice as string) : undefined;
    const search = req.query.search as string | undefined;

    let query = db.select().from(pitches);

    const conditions = [];

    if (city) {
      conditions.push(eq(pitches.city, city));
    }

    if (indoor !== undefined) {
      conditions.push(eq(pitches.indoor, indoor === 'true'));
    }

    if (minPrice !== undefined) {
      conditions.push(gte(pitches.pricePerHour, minPrice));
    }

    if (maxPrice !== undefined) {
      conditions.push(lte(pitches.pricePerHour, maxPrice));
    }

    if (search) {
      conditions.push(
        or(
          like(pitches.name, `%${search}%`),
          like(pitches.description, `%${search}%`),
          like(pitches.address, `%${search}%`)
        )!
      );
    }

    const allPitches = conditions.length > 0
      ? await db.select().from(pitches).where(and(...conditions))
      : await db.select().from(pitches);

    // Get images for each pitch
    const pitchesWithImages = await Promise.all(
      allPitches.map(async (pitch) => {
        const images = await db
          .select()
          .from(pitchImages)
          .where(eq(pitchImages.pitchId, pitch.id))
          .orderBy(pitchImages.sortOrder);

        return {
          ...pitch,
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

    res.json({
      data: {
        ...pitch,
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

