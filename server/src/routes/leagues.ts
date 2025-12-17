import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/index.js';
import { leagues, leagueTeams, teams, users } from '../db/schema.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { eq, and, or, like } from 'drizzle-orm';
import { matches, matchResults, teamMembers } from '../db/schema.js';
import { calculateStandings } from '../utils/standingsCalculator.js';

export const leaguesRouter = Router();

const createLeagueSchema = z.object({
  name: z.string().min(1).max(255),
  city: z.string().min(1).max(100),
  season: z.string().max(50).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

// Create league
leaguesRouter.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const data = createLeagueSchema.parse(req.body);
    const userId = req.userId!;

    const [newLeague] = await db
      .insert(leagues)
      .values({
        name: data.name,
        city: data.city,
        season: data.season,
        startDate: data.startDate,
        ownerId: userId,
        status: 'DRAFT',
      })
      .returning();

    // Fetch with owner details
    const [leagueWithOwner] = await db
      .select({
        league: leagues,
        owner: users,
      })
      .from(leagues)
      .innerJoin(users, eq(leagues.ownerId, users.id))
      .where(eq(leagues.id, newLeague.id))
      .limit(1);

    res.status(201).json({ data: leagueWithOwner });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: 'Validation error',
        code: 'VALIDATION_ERROR',
        details: error.errors,
      });
    }
    console.error('Create league error:', error);
    res.status(500).json({ message: 'Internal server error', code: 'INTERNAL_ERROR' });
  }
});

// Get all leagues
leaguesRouter.get('/', async (req, res) => {
  try {
    const city = req.query.city as string | undefined;
    const status = req.query.status as string | undefined;
    const search = req.query.search as string | undefined;

    let query = db
      .select({
        league: leagues,
        owner: users,
      })
      .from(leagues)
      .innerJoin(users, eq(leagues.ownerId, users.id));

    const conditions = [];

    if (city) {
      conditions.push(eq(leagues.city, city));
    }

    if (status) {
      conditions.push(eq(leagues.status, status as any));
    }

    if (search) {
      conditions.push(
        or(
          like(leagues.name, `%${search}%`),
          like(leagues.city, `%${search}%`)
        )!
      );
    }

    const allLeagues = conditions.length > 0
      ? await query.where(and(...conditions))
      : await query;

    // Get team counts for each league
    const leaguesWithTeams = await Promise.all(
      allLeagues.map(async (item) => {
        const leagueTeamsData = await db
          .select()
          .from(leagueTeams)
          .where(eq(leagueTeams.leagueId, item.league.id));

        return {
          ...item.league,
          owner: item.owner,
          teamCount: leagueTeamsData.length,
        };
      })
    );

    res.json({ data: leaguesWithTeams });
  } catch (error) {
    console.error('Get leagues error:', error);
    res.status(500).json({ message: 'Internal server error', code: 'INTERNAL_ERROR' });
  }
});

// Get league by ID
leaguesRouter.get('/:id', async (req, res) => {
  try {
    const leagueId = req.params.id;

    const [leagueData] = await db
      .select({
        league: leagues,
        owner: users,
      })
      .from(leagues)
      .innerJoin(users, eq(leagues.ownerId, users.id))
      .where(eq(leagues.id, leagueId))
      .limit(1);

    if (!leagueData) {
      return res.status(404).json({ message: 'League not found', code: 'NOT_FOUND' });
    }

    // Get all teams in league
    const teamsInLeague = await db
      .select({
        leagueTeam: leagueTeams,
        team: teams,
      })
      .from(leagueTeams)
      .innerJoin(teams, eq(leagueTeams.teamId, teams.id))
      .where(eq(leagueTeams.leagueId, leagueId));

    res.json({
      data: {
        ...leagueData.league,
        owner: leagueData.owner,
        teams: teamsInLeague.map(item => ({
          ...item.leagueTeam,
          team: item.team,
        })),
      },
    });
  } catch (error) {
    console.error('Get league error:', error);
    res.status(500).json({ message: 'Internal server error', code: 'INTERNAL_ERROR' });
  }
});

// Add team to league
leaguesRouter.post('/:id/teams', authenticate, async (req: AuthRequest, res) => {
  try {
    const leagueId = req.params.id;
    const { teamId } = z.object({ teamId: z.string().uuid() }).parse(req.body);
    const userId = req.userId!;

    // Get league
    const [league] = await db.select().from(leagues).where(eq(leagues.id, leagueId)).limit(1);

    if (!league) {
      return res.status(404).json({ message: 'League not found', code: 'NOT_FOUND' });
    }

    // Check if league is locked (status is ACTIVE or COMPLETED)
    if (league.status !== 'DRAFT') {
      return res.status(400).json({
        message: 'Cannot add teams to a locked league',
        code: 'LEAGUE_LOCKED',
      });
    }

    // Check permissions: league owner or team captain
    const [team] = await db.select().from(teams).where(eq(teams.id, teamId)).limit(1);

    if (!team) {
      return res.status(404).json({ message: 'Team not found', code: 'NOT_FOUND' });
    }

    if (league.ownerId !== userId && team.captainId !== userId) {
      return res.status(403).json({
        message: 'Only the league owner or team captain can add teams',
        code: 'FORBIDDEN',
      });
    }

    // Check if team is already in league
    const existing = await db
      .select()
      .from(leagueTeams)
      .where(
        and(
          eq(leagueTeams.leagueId, leagueId),
          eq(leagueTeams.teamId, teamId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return res.status(409).json({
        message: 'Team is already in this league',
        code: 'TEAM_ALREADY_IN_LEAGUE',
      });
    }

    // Add team to league
    const [newLeagueTeam] = await db
      .insert(leagueTeams)
      .values({
        leagueId,
        teamId,
      })
      .returning();

    res.status(201).json({ data: newLeagueTeam });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: 'Validation error',
        code: 'VALIDATION_ERROR',
        details: error.errors,
      });
    }
    console.error('Add team to league error:', error);
    res.status(500).json({ message: 'Internal server error', code: 'INTERNAL_ERROR' });
  }
});

// Remove team from league
leaguesRouter.delete('/:id/teams/:teamId', authenticate, async (req: AuthRequest, res) => {
  try {
    const leagueId = req.params.id;
    const teamIdToRemove = req.params.teamId;
    const userId = req.userId!;

    // Get league
    const [league] = await db.select().from(leagues).where(eq(leagues.id, leagueId)).limit(1);

    if (!league) {
      return res.status(404).json({ message: 'League not found', code: 'NOT_FOUND' });
    }

    // Check if league is locked
    if (league.status !== 'DRAFT') {
      return res.status(400).json({
        message: 'Cannot remove teams from a locked league',
        code: 'LEAGUE_LOCKED',
      });
    }

    // Check permissions: league owner only
    if (league.ownerId !== userId) {
      return res.status(403).json({
        message: 'Only the league owner can remove teams',
        code: 'FORBIDDEN',
      });
    }

    // Remove team from league
    await db
      .delete(leagueTeams)
      .where(
        and(
          eq(leagueTeams.leagueId, leagueId),
          eq(leagueTeams.teamId, teamIdToRemove)
        )
      );

    res.json({ data: { message: 'Team removed from league successfully' } });
  } catch (error) {
    console.error('Remove team from league error:', error);
    res.status(500).json({ message: 'Internal server error', code: 'INTERNAL_ERROR' });
  }
});

// Lock league (change status to ACTIVE)
leaguesRouter.post('/:id/lock', authenticate, async (req: AuthRequest, res) => {
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
        message: 'Only the league owner can lock the league',
        code: 'FORBIDDEN',
      });
    }

    // Check if league has at least 2 teams
    const teamCount = await db
      .select()
      .from(leagueTeams)
      .where(eq(leagueTeams.leagueId, leagueId));

    if (teamCount.length < 2) {
      return res.status(400).json({
        message: 'League must have at least 2 teams before locking',
        code: 'INSUFFICIENT_TEAMS',
      });
    }

    // Update status to ACTIVE
    const [updated] = await db
      .update(leagues)
      .set({ status: 'ACTIVE' })
      .where(eq(leagues.id, leagueId))
      .returning();

    res.json({ data: updated });
  } catch (error) {
    console.error('Lock league error:', error);
    res.status(500).json({ message: 'Internal server error', code: 'INTERNAL_ERROR' });
  }
});

// Get league standings
leaguesRouter.get('/:id/standings', async (req, res) => {
  try {
    const leagueId = req.params.id;

    // Get league
    const [league] = await db.select().from(leagues).where(eq(leagues.id, leagueId)).limit(1);

    if (!league) {
      return res.status(404).json({ message: 'League not found', code: 'NOT_FOUND' });
    }

    // Get all teams in league
    const leagueTeamsData = await db
      .select({
        leagueTeam: leagueTeams,
        team: teams,
      })
      .from(leagueTeams)
      .innerJoin(teams, eq(leagueTeams.teamId, teams.id))
      .where(eq(leagueTeams.leagueId, leagueId));

    if (leagueTeamsData.length === 0) {
      return res.json({ data: [] });
    }

    const teamIds = leagueTeamsData.map(lt => lt.team.id);
    const teamNames: Record<string, string> = {};
    leagueTeamsData.forEach(lt => {
      teamNames[lt.team.id] = lt.team.name;
    });

    // Get all matches
    const allMatches = await db
      .select()
      .from(matches)
      .where(eq(matches.leagueId, leagueId));

    // Get all results
    const matchIds = allMatches.map(m => m.id);
    const results = matchIds.length > 0
      ? await db
          .select()
          .from(matchResults)
          .where(or(...matchIds.map(id => eq(matchResults.matchId, id))!))
      : [];

    // Create results map
    const resultsMap = new Map<string, { homeScore: number; awayScore: number }>();
    results.forEach(result => {
      resultsMap.set(result.matchId, {
        homeScore: result.homeScore,
        awayScore: result.awayScore,
      });
    });

    // Prepare match results for calculator
    const matchResultsData = allMatches.map(match => {
      const result = resultsMap.get(match.id);
      return {
        matchId: match.id,
        homeTeamId: match.homeTeamId,
        awayTeamId: match.awayTeamId,
        homeScore: result?.homeScore ?? null,
        awayScore: result?.awayScore ?? null,
      };
    });

    // Calculate standings
    const standings = calculateStandings(teamIds, teamNames, matchResultsData);

    res.json({ data: standings });
  } catch (error) {
    console.error('Get standings error:', error);
    res.status(500).json({ message: 'Internal server error', code: 'INTERNAL_ERROR' });
  }
});

// Update league
leaguesRouter.patch('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const leagueId = req.params.id;
    const userId = req.userId!;
    const data = createLeagueSchema.partial().parse(req.body);

    // Get league
    const [league] = await db.select().from(leagues).where(eq(leagues.id, leagueId)).limit(1);

    if (!league) {
      return res.status(404).json({ message: 'League not found', code: 'NOT_FOUND' });
    }

    // Check permissions: league owner only
    if (league.ownerId !== userId) {
      return res.status(403).json({
        message: 'Only the league owner can update the league',
        code: 'FORBIDDEN',
      });
    }

    // Cannot update locked leagues
    if (league.status !== 'DRAFT') {
      return res.status(400).json({
        message: 'Cannot update a locked league',
        code: 'LEAGUE_LOCKED',
      });
    }

    // Update league
    const [updated] = await db
      .update(leagues)
      .set(data)
      .where(eq(leagues.id, leagueId))
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
    console.error('Update league error:', error);
    res.status(500).json({ message: 'Internal server error', code: 'INTERNAL_ERROR' });
  }
});

