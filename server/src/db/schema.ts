import { pgTable, uuid, varchar, text, integer, boolean, timestamp, time, date, pgEnum, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const userRoleEnum = pgEnum('user_role', ['USER', 'ADMIN', 'PITCH_OWNER']);

export const bookingStatusEnum = pgEnum('booking_status', ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED']);

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  username: varchar('username', { length: 100 }).notNull().unique(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  phone: varchar('phone', { length: 20 }),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  role: userRoleEnum('role').default('USER').notNull(),
  city: varchar('city', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  usernameIdx: index('users_username_idx').on(table.username),
  emailIdx: index('users_email_idx').on(table.email),
}));

export const pitches = pgTable('pitches', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  city: varchar('city', { length: 100 }).notNull(),
  address: text('address').notNull(),
  indoor: boolean('indoor').default(false).notNull(),
  description: text('description'),
  pricePerHour: integer('price_per_hour').notNull(),
  openTime: time('open_time').default('08:00:00'),
  closeTime: time('close_time').default('22:00:00'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  cityIdx: index('pitches_city_idx').on(table.city),
}));

export const pitchImages = pgTable('pitch_images', {
  id: uuid('id').defaultRandom().primaryKey(),
  pitchId: uuid('pitch_id').notNull().references(() => pitches.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
}, (table) => ({
  pitchIdIdx: index('pitch_images_pitch_id_idx').on(table.pitchId),
}));

export const pitchWorkingHours = pgTable('pitch_working_hours', {
  id: uuid('id').defaultRandom().primaryKey(),
  pitchId: uuid('pitch_id').notNull().references(() => pitches.id, { onDelete: 'cascade' }),
  dayOfWeek: integer('day_of_week').notNull(), // 0-6, 0 = Sunday
  openTime: time('open_time').notNull(),
  closeTime: time('close_time').notNull(),
}, (table) => ({
  pitchDayIdx: uniqueIndex('pitch_working_hours_pitch_day_idx').on(table.pitchId, table.dayOfWeek),
}));

export const blockedSlots = pgTable('blocked_slots', {
  id: uuid('id').defaultRandom().primaryKey(),
  pitchId: uuid('pitch_id').notNull().references(() => pitches.id, { onDelete: 'cascade' }),
  date: date('date').notNull(),
  startTime: time('start_time').notNull(),
  endTime: time('end_time').notNull(),
  reason: text('reason'),
}, (table) => ({
  pitchDateIdx: index('blocked_slots_pitch_date_idx').on(table.pitchId, table.date),
}));

export const bookings = pgTable('bookings', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  pitchId: uuid('pitch_id').notNull().references(() => pitches.id, { onDelete: 'cascade' }),
  date: date('date').notNull(),
  startTime: time('start_time').notNull(),
  durationMinutes: integer('duration_minutes').default(60).notNull(),
  status: bookingStatusEnum('status').default('CONFIRMED').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('bookings_user_id_idx').on(table.userId),
  pitchDateIdx: index('bookings_pitch_date_idx').on(table.pitchId, table.date),
}));

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  bookings: many(bookings),
}));

export const pitchesRelations = relations(pitches, ({ many }) => ({
  images: many(pitchImages),
  workingHours: many(pitchWorkingHours),
  blockedSlots: many(blockedSlots),
  bookings: many(bookings),
}));

export const bookingsRelations = relations(bookings, ({ one }) => ({
  user: one(users, {
    fields: [bookings.userId],
    references: [users.id],
  }),
  pitch: one(pitches, {
    fields: [bookings.pitchId],
    references: [pitches.id],
  }),
}));

