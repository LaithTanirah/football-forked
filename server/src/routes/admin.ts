import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/index.js';
import { pitches, pitchImages, pitchWorkingHours, blockedSlots, bookings } from '../db/schema.js';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth.js';
import { eq, and } from 'drizzle-orm';
import { validateCity } from '../utils/cities.js';

export const adminRouter = Router();

// All admin routes require authentication and ADMIN role
adminRouter.use(authenticate);
adminRouter.use(requireRole('ADMIN'));

const createPitchSchema = z.object({
  name: z.string().min(1).max(255),
  city: z.string().min(1).max(100),
  address: z.string().min(1),
  indoor: z.boolean().default(false),
  description: z.string().optional(),
  pricePerHour: z.number().int().positive(),
  openTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  closeTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  images: z.array(z.string().url()).optional(),
});

const updatePitchSchema = createPitchSchema.partial();

adminRouter.post('/pitches', async (req: AuthRequest, res) => {
  try {
    const data = createPitchSchema.parse(req.body);

    // Validate city
    const cityValidation = validateCity(data.city);
    if (!cityValidation.valid) {
      return res.status(400).json({
        message: cityValidation.error,
        code: 'VALIDATION_ERROR',
      });
    }

    const [newPitch] = await db
      .insert(pitches)
      .values({
        name: data.name,
        city: data.city,
        address: data.address,
        indoor: data.indoor,
        description: data.description,
        pricePerHour: data.pricePerHour,
        openTime: data.openTime || '08:00:00',
        closeTime: data.closeTime || '22:00:00',
      })
      .returning();

    // Add images if provided
    if (data.images && data.images.length > 0) {
      await db.insert(pitchImages).values(
        data.images.map((url, index) => ({
          pitchId: newPitch.id,
          url,
          sortOrder: index,
        }))
      );
    }

    // Set default working hours (all days, same as pitch defaults)
    const defaultWorkingHours = Array.from({ length: 7 }, (_, day) => ({
      pitchId: newPitch.id,
      dayOfWeek: day,
      openTime: data.openTime || '08:00:00',
      closeTime: data.closeTime || '22:00:00',
    }));

    await db.insert(pitchWorkingHours).values(defaultWorkingHours);

    const images = await db
      .select()
      .from(pitchImages)
      .where(eq(pitchImages.pitchId, newPitch.id))
      .orderBy(pitchImages.sortOrder);

    res.status(201).json({
      data: {
        ...newPitch,
        images: images.map(img => img.url),
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
    console.error('Create pitch error:', error);
    res.status(500).json({ message: 'Internal server error', code: 'INTERNAL_ERROR' });
  }
});

adminRouter.patch('/pitches/:id', async (req: AuthRequest, res) => {
  try {
    const pitchId = req.params.id;
    const data = updatePitchSchema.parse(req.body);

    // Validate city if provided
    if (data.city) {
      const cityValidation = validateCity(data.city);
      if (!cityValidation.valid) {
        return res.status(400).json({
          message: cityValidation.error,
          code: 'VALIDATION_ERROR',
        });
      }
    }

    const [existing] = await db
      .select()
      .from(pitches)
      .where(eq(pitches.id, pitchId))
      .limit(1);

    if (!existing) {
      return res.status(404).json({ message: 'Pitch not found', code: 'NOT_FOUND' });
    }

    const updateData: any = {};
    if (data.name) updateData.name = data.name;
    if (data.city) updateData.city = data.city;
    if (data.address) updateData.address = data.address;
    if (data.indoor !== undefined) updateData.indoor = data.indoor;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.pricePerHour) updateData.pricePerHour = data.pricePerHour;
    if (data.openTime) updateData.openTime = data.openTime;
    if (data.closeTime) updateData.closeTime = data.closeTime;

    const [updated] = await db
      .update(pitches)
      .set(updateData)
      .where(eq(pitches.id, pitchId))
      .returning();

    // Update images if provided
    if (data.images) {
      // Delete existing images
      await db.delete(pitchImages).where(eq(pitchImages.pitchId, pitchId));
      // Insert new images
      if (data.images.length > 0) {
        await db.insert(pitchImages).values(
          data.images.map((url, index) => ({
            pitchId,
            url,
            sortOrder: index,
          }))
        );
      }
    }

    const images = await db
      .select()
      .from(pitchImages)
      .where(eq(pitchImages.pitchId, pitchId))
      .orderBy(pitchImages.sortOrder);

    res.json({
      data: {
        ...updated,
        images: images.map(img => img.url),
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
    console.error('Update pitch error:', error);
    res.status(500).json({ message: 'Internal server error', code: 'INTERNAL_ERROR' });
  }
});

adminRouter.patch('/pitches/:id/working-hours', async (req: AuthRequest, res) => {
  try {
    const pitchId = req.params.id;
    const schema = z.object({
      dayOfWeek: z.number().int().min(0).max(6),
      openTime: z.string().regex(/^\d{2}:\d{2}$/),
      closeTime: z.string().regex(/^\d{2}:\d{2}$/),
    });
    const data = schema.parse(req.body);

    const [existing] = await db
      .select()
      .from(pitches)
      .where(eq(pitches.id, pitchId))
      .limit(1);

    if (!existing) {
      return res.status(404).json({ message: 'Pitch not found', code: 'NOT_FOUND' });
    }

    // Upsert working hours
    await db
      .insert(pitchWorkingHours)
      .values({
        pitchId,
        dayOfWeek: data.dayOfWeek,
        openTime: data.openTime,
        closeTime: data.closeTime,
      })
      .onConflictDoUpdate({
        target: [pitchWorkingHours.pitchId, pitchWorkingHours.dayOfWeek],
        set: {
          openTime: data.openTime,
          closeTime: data.closeTime,
        },
      });

    const workingHours = await db
      .select()
      .from(pitchWorkingHours)
      .where(eq(pitchWorkingHours.pitchId, pitchId));

    res.json({ data: workingHours });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: 'Validation error',
        code: 'VALIDATION_ERROR',
        details: error.errors,
      });
    }
    console.error('Update working hours error:', error);
    res.status(500).json({ message: 'Internal server error', code: 'INTERNAL_ERROR' });
  }
});

adminRouter.post('/pitches/:id/block-slot', async (req: AuthRequest, res) => {
  try {
    const pitchId = req.params.id;
    const schema = z.object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      startTime: z.string().regex(/^\d{2}:\d{2}$/),
      endTime: z.string().regex(/^\d{2}:\d{2}$/),
      reason: z.string().optional(),
    });
    const data = schema.parse(req.body);

    const [existing] = await db
      .select()
      .from(pitches)
      .where(eq(pitches.id, pitchId))
      .limit(1);

    if (!existing) {
      return res.status(404).json({ message: 'Pitch not found', code: 'NOT_FOUND' });
    }

    const [blocked] = await db
      .insert(blockedSlots)
      .values({
        pitchId,
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
        reason: data.reason,
      })
      .returning();

    res.status(201).json({ data: blocked });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: 'Validation error',
        code: 'VALIDATION_ERROR',
        details: error.errors,
      });
    }
    console.error('Block slot error:', error);
    res.status(500).json({ message: 'Internal server error', code: 'INTERNAL_ERROR' });
  }
});

adminRouter.delete('/blocked-slots/:id', async (req: AuthRequest, res) => {
  try {
    const slotId = req.params.id;

    const [deleted] = await db
      .delete(blockedSlots)
      .where(eq(blockedSlots.id, slotId))
      .returning();

    if (!deleted) {
      return res.status(404).json({ message: 'Blocked slot not found', code: 'NOT_FOUND' });
    }

    res.json({ data: deleted });
  } catch (error) {
    console.error('Delete blocked slot error:', error);
    res.status(500).json({ message: 'Internal server error', code: 'INTERNAL_ERROR' });
  }
});

adminRouter.get('/bookings', async (req: AuthRequest, res) => {
  try {
    const pitchId = req.query.pitchId as string | undefined;
    const date = req.query.date as string | undefined;

    const conditions = [];
    if (pitchId) {
      conditions.push(eq(bookings.pitchId, pitchId));
    }
    if (date) {
      conditions.push(eq(bookings.date, date));
    }

    const allBookings = conditions.length > 0
      ? await db
          .select({
            booking: bookings,
            pitch: pitches,
          })
          .from(bookings)
          .innerJoin(pitches, eq(bookings.pitchId, pitches.id))
          .where(and(...conditions))
          .orderBy(bookings.createdAt)
      : await db
          .select({
            booking: bookings,
            pitch: pitches,
          })
          .from(bookings)
          .innerJoin(pitches, eq(bookings.pitchId, pitches.id))
          .orderBy(bookings.createdAt);

    res.json({
      data: allBookings.map(item => ({
        ...item.booking,
        pitch: item.pitch,
      })),
    });
  } catch (error) {
    console.error('Get admin bookings error:', error);
    res.status(500).json({ message: 'Internal server error', code: 'INTERNAL_ERROR' });
  }
});

