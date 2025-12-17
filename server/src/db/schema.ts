import { pgTable, uuid, varchar, text, integer, boolean, timestamp, time, date, pgEnum, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const userRoleEnum = pgEnum('user_role', ['USER', 'ADMIN', 'PITCH_OWNER']);

export const bookingStatusEnum = pgEnum('booking_status', ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED']);

export const teamMemberRoleEnum = pgEnum('team_member_role', ['CAPTAIN', 'MEMBER']);

export const leagueStatusEnum = pgEnum('league_status', ['DRAFT', 'ACTIVE', 'COMPLETED']);

export const matchStatusEnum = pgEnum('match_status', ['SCHEDULED', 'PLAYED', 'CANCELLED']);

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

export const teams = pgTable('teams', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  city: varchar('city', { length: 100 }).notNull(),
  logoUrl: text('logo_url'),
  preferredPitchId: uuid('preferred_pitch_id').references(() => pitches.id, { onDelete: 'set null' }),
  captainId: uuid('captain_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  captainIdx: index('teams_captain_id_idx').on(table.captainId),
  cityIdx: index('teams_city_idx').on(table.city),
}));

export const teamMembers = pgTable('team_members', {
  id: uuid('id').defaultRandom().primaryKey(),
  teamId: uuid('team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: teamMemberRoleEnum('role').default('MEMBER').notNull(),
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
}, (table) => ({
  teamUserIdx: uniqueIndex('team_members_team_user_idx').on(table.teamId, table.userId),
  teamIdIdx: index('team_members_team_id_idx').on(table.teamId),
  userIdIdx: index('team_members_user_id_idx').on(table.userId),
}));

export const leagues = pgTable('leagues', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  city: varchar('city', { length: 100 }).notNull(),
  season: varchar('season', { length: 50 }),
  startDate: date('start_date'),
  status: leagueStatusEnum('status').default('DRAFT').notNull(),
  ownerId: uuid('owner_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  ownerIdx: index('leagues_owner_id_idx').on(table.ownerId),
  cityIdx: index('leagues_city_idx').on(table.city),
  statusIdx: index('leagues_status_idx').on(table.status),
}));

export const leagueTeams = pgTable('league_teams', {
  id: uuid('id').defaultRandom().primaryKey(),
  leagueId: uuid('league_id').notNull().references(() => leagues.id, { onDelete: 'cascade' }),
  teamId: uuid('team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
}, (table) => ({
  leagueTeamIdx: uniqueIndex('league_teams_league_team_idx').on(table.leagueId, table.teamId),
  leagueIdIdx: index('league_teams_league_id_idx').on(table.leagueId),
  teamIdIdx: index('league_teams_team_id_idx').on(table.teamId),
}));

export const matches = pgTable('matches', {
  id: uuid('id').defaultRandom().primaryKey(),
  leagueId: uuid('league_id').notNull().references(() => leagues.id, { onDelete: 'cascade' }),
  homeTeamId: uuid('home_team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
  awayTeamId: uuid('away_team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
  pitchId: uuid('pitch_id').references(() => pitches.id, { onDelete: 'set null' }),
  bookingId: uuid('booking_id').references(() => bookings.id, { onDelete: 'set null' }),
  scheduledDate: date('scheduled_date'),
  scheduledTime: time('scheduled_time'),
  status: matchStatusEnum('status').default('SCHEDULED').notNull(),
  round: integer('round').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  leagueIdIdx: index('matches_league_id_idx').on(table.leagueId),
  homeTeamIdx: index('matches_home_team_id_idx').on(table.homeTeamId),
  awayTeamIdx: index('matches_away_team_id_idx').on(table.awayTeamId),
  roundIdx: index('matches_round_idx').on(table.leagueId, table.round),
}));

export const matchResults = pgTable('match_results', {
  id: uuid('id').defaultRandom().primaryKey(),
  matchId: uuid('match_id').notNull().references(() => matches.id, { onDelete: 'cascade' }),
  homeScore: integer('home_score').notNull(),
  awayScore: integer('away_score').notNull(),
  recordedBy: uuid('recorded_by').notNull().references(() => users.id, { onDelete: 'cascade' }),
  recordedAt: timestamp('recorded_at').defaultNow().notNull(),
}, (table) => ({
  matchIdIdx: uniqueIndex('match_results_match_id_idx').on(table.matchId),
  recordedByIdx: index('match_results_recorded_by_idx').on(table.recordedBy),
}));

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  bookings: many(bookings),
  teamsAsCaptain: many(teams),
  teamMemberships: many(teamMembers),
  ownedLeagues: many(leagues),
  recordedResults: many(matchResults),
}));

export const pitchesRelations = relations(pitches, ({ many, one }) => ({
  images: many(pitchImages),
  workingHours: many(pitchWorkingHours),
  blockedSlots: many(blockedSlots),
  bookings: many(bookings),
  preferredByTeams: many(teams),
  matches: many(matches),
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
  match: one(matches, {
    fields: [bookings.id],
    references: [matches.bookingId],
  }),
}));

export const teamsRelations = relations(teams, ({ one, many }) => ({
  captain: one(users, {
    fields: [teams.captainId],
    references: [users.id],
  }),
  preferredPitch: one(pitches, {
    fields: [teams.preferredPitchId],
    references: [pitches.id],
  }),
  members: many(teamMembers),
  leagueMemberships: many(leagueTeams),
  homeMatches: many(matches, { relationName: 'homeMatches' }),
  awayMatches: many(matches, { relationName: 'awayMatches' }),
}));

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  team: one(teams, {
    fields: [teamMembers.teamId],
    references: [teams.id],
  }),
  user: one(users, {
    fields: [teamMembers.userId],
    references: [users.id],
  }),
}));

export const leaguesRelations = relations(leagues, ({ one, many }) => ({
  owner: one(users, {
    fields: [leagues.ownerId],
    references: [users.id],
  }),
  teams: many(leagueTeams),
  matches: many(matches),
}));

export const leagueTeamsRelations = relations(leagueTeams, ({ one }) => ({
  league: one(leagues, {
    fields: [leagueTeams.leagueId],
    references: [leagues.id],
  }),
  team: one(teams, {
    fields: [leagueTeams.teamId],
    references: [teams.id],
  }),
}));

export const matchesRelations = relations(matches, ({ one }) => ({
  league: one(leagues, {
    fields: [matches.leagueId],
    references: [leagues.id],
  }),
  homeTeam: one(teams, {
    fields: [matches.homeTeamId],
    references: [teams.id],
    relationName: 'homeMatches',
  }),
  awayTeam: one(teams, {
    fields: [matches.awayTeamId],
    references: [teams.id],
    relationName: 'awayMatches',
  }),
  pitch: one(pitches, {
    fields: [matches.pitchId],
    references: [pitches.id],
  }),
  booking: one(bookings, {
    fields: [matches.bookingId],
    references: [bookings.id],
  }),
  result: one(matchResults, {
    fields: [matches.id],
    references: [matchResults.matchId],
  }),
}));

export const matchResultsRelations = relations(matchResults, ({ one }) => ({
  match: one(matches, {
    fields: [matchResults.matchId],
    references: [matches.id],
  }),
  recordedByUser: one(users, {
    fields: [matchResults.recordedBy],
    references: [users.id],
  }),
}));

