import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/index.js';
import { teams, teamMembers, users, pitches } from '../db/schema.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { eq, and, or, like } from 'drizzle-orm';

export const teamsRouter = Router();

const createTeamSchema = z.object({
  name: z.string().min(1).max(255),
  city: z.string().min(1).max(100),
  logoUrl: z.string().url().optional(),
  preferredPitchId: z.string().uuid().optional(),
});

const addMemberSchema = z.object({
  userId: z.string().uuid().optional(),
  username: z.string().optional(),
  email: z.string().email().optional(),
}).refine(data => data.userId || data.username || data.email, {
  message: 'Must provide userId, username, or email',
});

// Create team
teamsRouter.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const data = createTeamSchema.parse(req.body);
    const userId = req.userId!;

    // Check if user already has a team with this name in this city
    const existing = await db
      .select()
      .from(teams)
      .where(
        and(
          eq(teams.name, data.name),
          eq(teams.city, data.city),
          eq(teams.captainId, userId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return res.status(409).json({
        message: 'You already have a team with this name in this city',
        code: 'TEAM_EXISTS',
      });
    }

    // Create team
    const [newTeam] = await db
      .insert(teams)
      .values({
        name: data.name,
        city: data.city,
        logoUrl: data.logoUrl,
        preferredPitchId: data.preferredPitchId,
        captainId: userId,
      })
      .returning();

    // Add captain as team member
    await db.insert(teamMembers).values({
      teamId: newTeam.id,
      userId: userId,
      role: 'CAPTAIN',
    });

    // Fetch full team with relations
    const [teamWithDetails] = await db
      .select({
        team: teams,
        captain: users,
        preferredPitch: pitches,
      })
      .from(teams)
      .leftJoin(users, eq(teams.captainId, users.id))
      .leftJoin(pitches, eq(teams.preferredPitchId, pitches.id))
      .where(eq(teams.id, newTeam.id))
      .limit(1);

    res.status(201).json({ data: teamWithDetails });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: 'Validation error',
        code: 'VALIDATION_ERROR',
        details: error.errors,
      });
    }
    console.error('Create team error:', error);
    res.status(500).json({ message: 'Internal server error', code: 'INTERNAL_ERROR' });
  }
});

// Get all teams (with filters)
teamsRouter.get('/', async (req, res) => {
  try {
    const city = req.query.city as string | undefined;
    const search = req.query.search as string | undefined;

    let query = db
      .select({
        team: teams,
        captain: users,
        preferredPitch: pitches,
      })
      .from(teams)
      .leftJoin(users, eq(teams.captainId, users.id))
      .leftJoin(pitches, eq(teams.preferredPitchId, pitches.id));

    const conditions = [];

    if (city) {
      conditions.push(eq(teams.city, city));
    }

    if (search) {
      conditions.push(
        or(
          like(teams.name, `%${search}%`),
          like(teams.city, `%${search}%`)
        )!
      );
    }

    const allTeams = conditions.length > 0
      ? await query.where(and(...conditions))
      : await query;

    // Get member counts for each team
    const teamsWithMembers = await Promise.all(
      allTeams.map(async (item) => {
        const members = await db
          .select({
            member: teamMembers,
            user: users,
          })
          .from(teamMembers)
          .innerJoin(users, eq(teamMembers.userId, users.id))
          .where(eq(teamMembers.teamId, item.team.id))
          .limit(20); // Limit for performance

        return {
          ...item.team,
          captain: item.captain,
          preferredPitch: item.preferredPitch,
          members: members.map(m => ({
            ...m.member,
            user: m.user,
          })),
          memberCount: members.length,
        };
      })
    );

    res.json({ data: teamsWithMembers });
  } catch (error) {
    console.error('Get teams error:', error);
    res.status(500).json({ message: 'Internal server error', code: 'INTERNAL_ERROR' });
  }
});

// Get team by ID
teamsRouter.get('/:id', async (req, res) => {
  try {
    const teamId = req.params.id;

    const [teamData] = await db
      .select({
        team: teams,
        captain: users,
        preferredPitch: pitches,
      })
      .from(teams)
      .leftJoin(users, eq(teams.captainId, users.id))
      .leftJoin(pitches, eq(teams.preferredPitchId, pitches.id))
      .where(eq(teams.id, teamId))
      .limit(1);

    if (!teamData) {
      return res.status(404).json({ message: 'Team not found', code: 'NOT_FOUND' });
    }

    // Get all members
    const members = await db
      .select({
        member: teamMembers,
        user: users,
      })
      .from(teamMembers)
      .innerJoin(users, eq(teamMembers.userId, users.id))
      .where(eq(teamMembers.teamId, teamId));

    res.json({
      data: {
        ...teamData.team,
        captain: teamData.captain,
        preferredPitch: teamData.preferredPitch,
        members: members.map(m => ({
          ...m.member,
          user: m.user,
        })),
      },
    });
  } catch (error) {
    console.error('Get team error:', error);
    res.status(500).json({ message: 'Internal server error', code: 'INTERNAL_ERROR' });
  }
});

// Add member to team
teamsRouter.post('/:id/members', authenticate, async (req: AuthRequest, res) => {
  try {
    const teamId = req.params.id;
    const data = addMemberSchema.parse(req.body);
    const userId = req.userId!;

    // Get team
    const [team] = await db.select().from(teams).where(eq(teams.id, teamId)).limit(1);

    if (!team) {
      return res.status(404).json({ message: 'Team not found', code: 'NOT_FOUND' });
    }

    // Check if user is captain
    if (team.captainId !== userId) {
      return res.status(403).json({ message: 'Only the captain can add members', code: 'FORBIDDEN' });
    }

    // Find user by userId, username, or email
    let targetUserId: string | null = null;

    if (data.userId) {
      targetUserId = data.userId;
    } else if (data.username) {
      const [user] = await db.select().from(users).where(eq(users.username, data.username)).limit(1);
      if (user) targetUserId = user.id;
    } else if (data.email) {
      const [user] = await db.select().from(users).where(eq(users.email, data.email)).limit(1);
      if (user) targetUserId = user.id;
    }

    if (!targetUserId) {
      return res.status(404).json({ message: 'User not found', code: 'USER_NOT_FOUND' });
    }

    // Check if already a member
    const existing = await db
      .select()
      .from(teamMembers)
      .where(
        and(
          eq(teamMembers.teamId, teamId),
          eq(teamMembers.userId, targetUserId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return res.status(409).json({
        message: 'User is already a member of this team',
        code: 'ALREADY_MEMBER',
      });
    }

    // Add member
    const [newMember] = await db
      .insert(teamMembers)
      .values({
        teamId,
        userId: targetUserId,
        role: 'MEMBER',
      })
      .returning();

    // Fetch user details
    const [user] = await db.select().from(users).where(eq(users.id, targetUserId)).limit(1);

    res.status(201).json({
      data: {
        ...newMember,
        user,
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
    console.error('Add member error:', error);
    res.status(500).json({ message: 'Internal server error', code: 'INTERNAL_ERROR' });
  }
});

// Remove member from team
teamsRouter.delete('/:id/members/:memberId', authenticate, async (req: AuthRequest, res) => {
  try {
    const teamId = req.params.id;
    const memberId = req.params.memberId;
    const userId = req.userId!;

    // Get team
    const [team] = await db.select().from(teams).where(eq(teams.id, teamId)).limit(1);

    if (!team) {
      return res.status(404).json({ message: 'Team not found', code: 'NOT_FOUND' });
    }

    // Get member
    const [member] = await db
      .select()
      .from(teamMembers)
      .where(eq(teamMembers.id, memberId))
      .limit(1);

    if (!member || member.teamId !== teamId) {
      return res.status(404).json({ message: 'Member not found', code: 'NOT_FOUND' });
    }

    // Check permissions: captain can remove anyone, members can remove themselves
    if (team.captainId !== userId && member.userId !== userId) {
      return res.status(403).json({
        message: 'You can only remove yourself or be removed by the captain',
        code: 'FORBIDDEN',
      });
    }

    // Cannot remove captain
    if (member.role === 'CAPTAIN') {
      return res.status(400).json({
        message: 'Cannot remove the captain',
        code: 'CANNOT_REMOVE_CAPTAIN',
      });
    }

    // Remove member
    await db.delete(teamMembers).where(eq(teamMembers.id, memberId));

    res.json({ data: { message: 'Member removed successfully' } });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({ message: 'Internal server error', code: 'INTERNAL_ERROR' });
  }
});

// Update team
teamsRouter.patch('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const teamId = req.params.id;
    const userId = req.userId!;
    const data = createTeamSchema.partial().parse(req.body);

    // Get team
    const [team] = await db.select().from(teams).where(eq(teams.id, teamId)).limit(1);

    if (!team) {
      return res.status(404).json({ message: 'Team not found', code: 'NOT_FOUND' });
    }

    // Check if user is captain
    if (team.captainId !== userId) {
      return res.status(403).json({ message: 'Only the captain can update the team', code: 'FORBIDDEN' });
    }

    // Update team
    const [updated] = await db
      .update(teams)
      .set(data)
      .where(eq(teams.id, teamId))
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
    console.error('Update team error:', error);
    res.status(500).json({ message: 'Internal server error', code: 'INTERNAL_ERROR' });
  }
});

