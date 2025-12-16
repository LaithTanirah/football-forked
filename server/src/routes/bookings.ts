import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/index.js';
import { bookings, pitches } from '../db/schema.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { eq, and, sql } from 'drizzle-orm';

export const bookingsRouter = Router();

const createBookingSchema = z.object({
  pitchId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  durationMinutes: z.number().int().min(30).max(240).default(60),
});

bookingsRouter.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const data = createBookingSchema.parse(req.body);
    const userId = req.userId!;

    // Verify pitch exists
    const [pitch] = await db
      .select()
      .from(pitches)
      .where(eq(pitches.id, data.pitchId))
      .limit(1);

    if (!pitch) {
      return res.status(404).json({ message: 'Pitch not found', code: 'NOT_FOUND' });
    }

    // Check for existing booking (concurrency safety)
    const existing = await db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.pitchId, data.pitchId),
          eq(bookings.date, data.date),
          eq(bookings.startTime, data.startTime),
          sql`${bookings.status} IN ('PENDING', 'CONFIRMED')`
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return res.status(409).json({
        message: 'This time slot is already booked',
        code: 'SLOT_ALREADY_BOOKED',
      });
    }

    // Create booking
    const [newBooking] = await db
      .insert(bookings)
      .values({
        userId,
        pitchId: data.pitchId,
        date: data.date,
        startTime: data.startTime,
        durationMinutes: data.durationMinutes,
        status: 'CONFIRMED',
      })
      .returning();

    // Fetch full booking with pitch details
    const [bookingWithPitch] = await db
      .select({
        booking: bookings,
        pitch: pitches,
      })
      .from(bookings)
      .innerJoin(pitches, eq(bookings.pitchId, pitches.id))
      .where(eq(bookings.id, newBooking.id))
      .limit(1);

    res.status(201).json({
      data: {
        booking: bookingWithPitch?.booking,
        pitch: bookingWithPitch?.pitch,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: 'Validation error',
        code: 'VALIDATION_ERROR',
        details: error.errors,
      });
    }
    console.error('Create booking error:', error);
    res.status(500).json({ message: 'Internal server error', code: 'INTERNAL_ERROR' });
  }
});

bookingsRouter.get('/me', authenticate, async (req: AuthRequest, res) => {
  try {
    const userBookings = await db
      .select({
        booking: bookings,
        pitch: pitches,
      })
      .from(bookings)
      .innerJoin(pitches, eq(bookings.pitchId, pitches.id))
      .where(eq(bookings.userId, req.userId!))
      .orderBy(bookings.createdAt);

    res.json({
      data: userBookings.map(item => ({
        ...item.booking,
        pitch: item.pitch,
      })),
    });
  } catch (error) {
    console.error('Get my bookings error:', error);
    res.status(500).json({ message: 'Internal server error', code: 'INTERNAL_ERROR' });
  }
});

bookingsRouter.patch('/:id/cancel', authenticate, async (req: AuthRequest, res) => {
  try {
    const bookingId = req.params.id;

    // Get booking
    const [booking] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, bookingId))
      .limit(1);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found', code: 'NOT_FOUND' });
    }

    // Check ownership (unless admin)
    if (booking.userId !== req.userId && req.user?.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Forbidden', code: 'FORBIDDEN' });
    }

    // Check if already cancelled or completed
    if (booking.status === 'CANCELLED' || booking.status === 'COMPLETED') {
      return res.status(400).json({
        message: 'Booking is already cancelled or completed',
        code: 'INVALID_STATUS',
      });
    }

    // Update status
    const [updated] = await db
      .update(bookings)
      .set({ status: 'CANCELLED' })
      .where(eq(bookings.id, bookingId))
      .returning();

    res.json({ data: updated });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ message: 'Internal server error', code: 'INTERNAL_ERROR' });
  }
});

