import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/index.js';
import { matches, matchResults, leagues, leagueTeams, teams, users, bookings, pitches } from '../db/schema.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { eq, and, or } from 'drizzle-orm';
import { generateRoundRobinFixtures } from '../utils/fixtureGenerator.js';

export const matchesRouter = Router();

const recordResultSchema = z.object({
  homeScore: z.number().int().min(0),
  awayScore: z.number().int().min(0),
});

// Generate fixtures for a league
matchesRouter.post('/leagues/:id/generate-schedule', authenticate, async (req: AuthRequest, res) => {
  try {
    const leagueId = req.params.id;
    const userId = req.userId!;

    // Get league
    const [league] = await db.select().from(leagues).where(eq(leagues.id, leagueId)).limit(1);

    if (!league) {
      return res.status(404).json({ message: 'League not found', code: 'NOT_FOUND' });
    }

    // Check permissions: league owner only
    if (league.ownerId !== userId) {
      return res.status(403).json({
        message: 'Only the league owner can generate the schedule',
        code: 'FORBIDDEN',
      });
    }

    // League must be ACTIVE (locked)
    if (league.status !== 'ACTIVE') {
      return res.status(400).json({
        message: 'League must be locked (ACTIVE) before generating schedule',
        code: 'LEAGUE_NOT_LOCKED',
      });
    }

    // Check if fixtures already exist
    const existingMatches = await db
      .select()
      .from(matches)
      .where(eq(matches.leagueId, leagueId))
      .limit(1);

    if (existingMatches.length > 0) {
      return res.status(409).json({
        message: 'Schedule already generated for this league',
        code: 'SCHEDULE_EXISTS',
      });
    }

    // Get all teams in league
    const leagueTeamsData = await db
      .select()
      .from(leagueTeams)
      .where(eq(leagueTeams.leagueId, leagueId));

    if (leagueTeamsData.length < 2) {
      return res.status(400).json({
        message: 'League must have at least 2 teams',
        code: 'INSUFFICIENT_TEAMS',
      });
    }

    const teamIds = leagueTeamsData.map(lt => lt.teamId);

    // Generate fixtures
    const fixtures = generateRoundRobinFixtures(teamIds);

    // Insert matches into database
    const createdMatches = await Promise.all(
      fixtures.map(fixture =>
        db
          .insert(matches)
          .values({
            leagueId,
            homeTeamId: fixture.homeTeamId,
            awayTeamId: fixture.awayTeamId,
            round: fixture.round,
            status: 'SCHEDULED',
          })
          .returning()
      )
    );

    res.status(201).json({
      data: {
        matches: createdMatches.flat(),
        message: `Generated ${createdMatches.length} fixtures`,
      },
    });
  } catch (error) {
    console.error('Generate schedule error:', error);
    res.status(500).json({ message: 'Internal server error', code: 'INTERNAL_ERROR' });
  }
});

// Get all matches for a league
matchesRouter.get('/leagues/:id/matches', async (req, res) => {
  try {
    const leagueId = req.params.id;

    // Verify league exists
    const [league] = await db.select().from(leagues).where(eq(leagues.id, leagueId)).limit(1);

    if (!league) {
      return res.status(404).json({ message: 'League not found', code: 'NOT_FOUND' });
    }

    // Get all matches
    const allMatchesData = await db
      .select()
      .from(matches)
      .where(eq(matches.leagueId, leagueId));

    // Get team details for each match
    const matchesWithDetails = await Promise.all(
      allMatchesData.map(async (match) => {
        const [homeTeam] = await db
          .select()
          .from(teams)
          .where(eq(teams.id, match.homeTeamId))
          .limit(1);

        const [awayTeam] = await db
          .select()
          .from(teams)
          .where(eq(teams.id, match.awayTeamId))
          .limit(1);

        let pitch = null;
        if (match.pitchId) {
          const [pitchData] = await db
            .select()
            .from(pitches)
            .where(eq(pitches.id, match.pitchId))
            .limit(1);
          pitch = pitchData;
        }

        return {
          match,
          homeTeam,
          awayTeam,
          pitch,
        };
      })
    );

    // Get results for each match
    const matchesWithResults = await Promise.all(
      matchesWithDetails.map(async (item) => {
        const [result] = await db
          .select()
          .from(matchResults)
          .where(eq(matchResults.matchId, item.match.id))
          .limit(1);

        return {
          ...item.match,
          homeTeam: item.homeTeam,
          awayTeam: item.awayTeam,
          pitch: item.pitch,
          result: result || null,
        };
      })
    );

    res.json({ data: matchesWithResults });
  } catch (error) {
    console.error('Get matches error:', error);
    res.status(500).json({ message: 'Internal server error', code: 'INTERNAL_ERROR' });
  }
});

// Record match result
matchesRouter.post('/:id/result', authenticate, async (req: AuthRequest, res) => {
  try {
    const matchId = req.params.id;
    const userId = req.userId!;
    const data = recordResultSchema.parse(req.body);

    // Get match
    const [match] = await db.select().from(matches).where(eq(matches.id, matchId)).limit(1);

    if (!match) {
      return res.status(404).json({ message: 'Match not found', code: 'NOT_FOUND' });
    }

    // Check if result already exists
    const [existingResult] = await db
      .select()
      .from(matchResults)
      .where(eq(matchResults.matchId, matchId))
      .limit(1);

    if (existingResult) {
      return res.status(409).json({
        message: 'Result already recorded for this match',
        code: 'RESULT_EXISTS',
      });
    }

    // Get league to check permissions
    const [league] = await db.select().from(leagues).where(eq(leagues.id, match.leagueId)).limit(1);

    if (!league) {
      return res.status(404).json({ message: 'League not found', code: 'NOT_FOUND' });
    }

    // Get teams to check if user is captain
    const [homeTeam] = await db.select().from(teams).where(eq(teams.id, match.homeTeamId)).limit(1);
    const [awayTeam] = await db.select().from(teams).where(eq(teams.id, match.awayTeamId)).limit(1);

    // Check permissions: league owner or team captain
    const isLeagueOwner = league.ownerId === userId;
    const isHomeCaptain = homeTeam?.captainId === userId;
    const isAwayCaptain = awayTeam?.captainId === userId;

    if (!isLeagueOwner && !isHomeCaptain && !isAwayCaptain) {
      return res.status(403).json({
        message: 'Only the league owner or team captains can record results',
        code: 'FORBIDDEN',
      });
    }

    // Record result
    const [result] = await db
      .insert(matchResults)
      .values({
        matchId,
        homeScore: data.homeScore,
        awayScore: data.awayScore,
        recordedBy: userId,
      })
      .returning();

    // Update match status to PLAYED
    await db
      .update(matches)
      .set({ status: 'PLAYED' })
      .where(eq(matches.id, matchId));

    res.status(201).json({ data: result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: 'Validation error',
        code: 'VALIDATION_ERROR',
        details: error.errors,
      });
    }
    console.error('Record result error:', error);
    res.status(500).json({ message: 'Internal server error', code: 'INTERNAL_ERROR' });
  }
});

// Update match (schedule date/time, pitch, booking)
matchesRouter.patch('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const matchId = req.params.id;
    const userId = req.userId!;
    const data = z.object({
      scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      scheduledTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
      pitchId: z.string().uuid().optional(),
      bookingId: z.string().uuid().optional(),
    }).parse(req.body);

    // Get match
    const [match] = await db.select().from(matches).where(eq(matches.id, matchId)).limit(1);

    if (!match) {
      return res.status(404).json({ message: 'Match not found', code: 'NOT_FOUND' });
    }

    // Get league to check permissions
    const [league] = await db.select().from(leagues).where(eq(leagues.id, match.leagueId)).limit(1);

    if (!league) {
      return res.status(404).json({ message: 'League not found', code: 'NOT_FOUND' });
    }

    // Check permissions: league owner only
    if (league.ownerId !== userId) {
      return res.status(403).json({
        message: 'Only the league owner can update match details',
        code: 'FORBIDDEN',
      });
    }

    // Update match
    const [updated] = await db
      .update(matches)
      .set(data)
      .where(eq(matches.id, matchId))
      .returning();

    res.json({ data: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: 'Validation error',
        code: 'VALIDATION_ERROR',
        details: error.errors,
      });
    }
    console.error('Update match error:', error);
    res.status(500).json({ message: 'Internal server error', code: 'INTERNAL_ERROR' });
  }
});

