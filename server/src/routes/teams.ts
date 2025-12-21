import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/index.js';
import { teams, teamMembers, users, pitches } from '../db/schema.js';
import { authenticate, AuthRequest, requireTeamOwner } from '../middleware/auth.js';
import { eq, and, or, like, notInArray, sql, inArray } from 'drizzle-orm';
import { validateCity } from '../utils/cities.js';

export const teamsRouter = Router();

const createTeamSchema = z.object({
  name: z.string().min(1).max(255),
  city: z.string().min(1).max(100),
  logoUrl: z.string().url().optional(),
  preferredPitchId: z.string().uuid().optional(),
});

const addMemberSchema = z.object({
  userId: z.string().uuid(),
});

// Create team
teamsRouter.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const data = createTeamSchema.parse(req.body);
    const userId = req.userId!;

    // Validate city
    const cityValidation = validateCity(data.city);
    if (!cityValidation.valid) {
      return res.status(400).json({
        message: cityValidation.error,
        code: 'VALIDATION_ERROR',
      });
    }

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

    // Add captain as team member with OWNER role
    await db.insert(teamMembers).values({
      teamId: newTeam.id,
      userId: userId,
      role: 'OWNER',
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

    // Validate city if provided
    if (city) {
      const cityValidation = validateCity(city);
      if (!cityValidation.valid) {
        return res.status(400).json({
          message: cityValidation.error,
          code: 'VALIDATION_ERROR',
        });
      }
    }

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

// Get team suggestions
teamsRouter.get('/:id/suggestions', authenticate, async (req: AuthRequest, res) => {
  try {
    const teamId = req.params.id;
    const userId = req.userId!;

    // Verify team exists
    const [team] = await db.select().from(teams).where(eq(teams.id, teamId)).limit(1);
    if (!team) {
      return res.status(404).json({ message: 'Team not found', code: 'NOT_FOUND' });
    }

    // Get current team members to exclude
    const currentMembers = await db
      .select({ userId: teamMembers.userId })
      .from(teamMembers)
      .where(eq(teamMembers.teamId, teamId));

    const excludedIds = [userId, ...currentMembers.map((m) => m.userId)];

    // Get users from same city (priority 1)
    const sameCityUsers = team.city
      ? await db
          .select({
            id: users.id,
            name: users.name,
            username: users.username,
            email: users.email,
            phone: users.phone,
            city: users.city,
            createdAt: users.createdAt,
            priority: sql<number>`1`,
          })
          .from(users)
          .where(
            and(
              eq(users.city, team.city),
              notInArray(users.id, excludedIds)
            )
          )
          .limit(10)
      : [];

    // Get users who were in previous teams with current user (priority 2)
    // Find teams where current user is a member, then find other members of those teams
    const userTeams = await db
      .select({ teamId: teamMembers.teamId })
      .from(teamMembers)
      .where(eq(teamMembers.userId, userId));

    const userTeamIds = userTeams.map((t) => t.teamId);

    const previousTeammates =
      userTeamIds.length > 0
        ? await db
            .select({
              id: users.id,
              name: users.name,
              username: users.username,
              email: users.email,
              phone: users.phone,
              city: users.city,
              createdAt: users.createdAt,
              priority: sql<number>`2`,
            })
            .from(users)
            .innerJoin(teamMembers, eq(teamMembers.userId, users.id))
            .where(
              and(
                inArray(teamMembers.teamId, userTeamIds),
                notInArray(users.id, excludedIds)
              )
            )
            .groupBy(users.id)
            .limit(10)
        : [];

    // Combine and deduplicate
    let allSuggestions = [...sameCityUsers, ...previousTeammates];
    let uniqueSuggestions = Array.from(
      new Map(allSuggestions.map((u) => [u.id, u])).values()
    )
      .sort((a, b) => (a.priority || 3) - (b.priority || 3));

    // If we don't have enough suggestions, add random users from database (priority 3)
    if (uniqueSuggestions.length < 12) {
      const randomUsers = await db
        .select({
          id: users.id,
          name: users.name,
          username: users.username,
          email: users.email,
          phone: users.phone,
          city: users.city,
          createdAt: users.createdAt,
          priority: sql<number>`3`,
        })
        .from(users)
        .where(notInArray(users.id, excludedIds))
        .orderBy(sql`RANDOM()`)
        .limit(12 - uniqueSuggestions.length);

      allSuggestions = [...allSuggestions, ...randomUsers];
      uniqueSuggestions = Array.from(
        new Map(allSuggestions.map((u) => [u.id, u])).values()
      )
        .sort((a, b) => (a.priority || 3) - (b.priority || 3));
    }

    const finalSuggestions = uniqueSuggestions
      .slice(0, 12)
      .map(({ priority, ...user }) => user);

    res.json({ data: finalSuggestions });
  } catch (error) {
    console.error('Get suggestions error:', error);
    res.status(500).json({ message: 'Internal server error', code: 'INTERNAL_ERROR' });
  }
});

// Add member to team
teamsRouter.post('/:id/members', authenticate, requireTeamOwner, async (req: AuthRequest, res) => {
  try {
    const teamId = req.params.id;
    const data = addMemberSchema.parse(req.body);

    // Get team
    const [team] = await db.select().from(teams).where(eq(teams.id, teamId)).limit(1);

    if (!team) {
      return res.status(404).json({ message: 'Team not found', code: 'NOT_FOUND' });
    }

    const targetUserId = data.userId;

    // Verify user exists
    const [targetUser] = await db.select().from(users).where(eq(users.id, targetUserId)).limit(1);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found', code: 'USER_NOT_FOUND' });
    }

    // Cannot add yourself
    if (targetUserId === req.userId) {
      return res.status(400).json({ message: 'Cannot add yourself to the team', code: 'CANNOT_ADD_SELF' });
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
teamsRouter.delete('/:id/members/:userId', authenticate, requireTeamOwner, async (req: AuthRequest, res) => {
  try {
    const teamId = req.params.id;
    const targetUserId = req.params.userId;

    // Get team
    const [team] = await db.select().from(teams).where(eq(teams.id, teamId)).limit(1);

    if (!team) {
      return res.status(404).json({ message: 'Team not found', code: 'NOT_FOUND' });
    }

    // Get member
    const [member] = await db
      .select()
      .from(teamMembers)
      .where(
        and(
          eq(teamMembers.teamId, teamId),
          eq(teamMembers.userId, targetUserId)
        )
      )
      .limit(1);

    if (!member) {
      return res.status(404).json({ message: 'Member not found', code: 'NOT_FOUND' });
    }

    // Cannot remove owner (captain)
    if (member.role === 'OWNER' || member.role === 'CAPTAIN') {
      return res.status(400).json({
        message: 'Cannot remove the team owner',
        code: 'CANNOT_REMOVE_OWNER',
      });
    }

    // Check if this is the last owner (shouldn't happen but safety check)
    const owners = await db
      .select()
      .from(teamMembers)
      .where(
        and(
          eq(teamMembers.teamId, teamId),
          or(eq(teamMembers.role, 'OWNER'), eq(teamMembers.role, 'CAPTAIN'))
        )
      );

    if (owners.length <= 1 && (member.role === 'OWNER' || member.role === 'CAPTAIN')) {
      return res.status(400).json({
        message: 'Cannot remove the last owner',
        code: 'CANNOT_REMOVE_LAST_OWNER',
      });
    }

    // Remove member
    await db
      .delete(teamMembers)
      .where(
        and(
          eq(teamMembers.teamId, teamId),
          eq(teamMembers.userId, targetUserId)
        )
      );

    // Remove player from squad if they're in it
    if (team.squad) {
      try {
        const squad = JSON.parse(team.squad);
        if (squad.slots && Array.isArray(squad.slots)) {
          const updatedSlots = squad.slots.map((slot: any) => {
            if (slot.playerId === targetUserId) {
              return { ...slot, playerId: null };
            }
            return slot;
          });
          const updatedSquad = {
            ...squad,
            slots: updatedSlots,
            updatedAt: new Date().toISOString(),
          };
          await db
            .update(teams)
            .set({ squad: JSON.stringify(updatedSquad) })
            .where(eq(teams.id, teamId));
        }
      } catch (e) {
        console.error('Error updating squad after member removal:', e);
        // Don't fail the request if squad update fails
      }
    }

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

// Get team squad
teamsRouter.get('/:id/squad', async (req, res) => {
  try {
    const teamId = req.params.id;

    const [team] = await db.select().from(teams).where(eq(teams.id, teamId)).limit(1);

    if (!team) {
      return res.status(404).json({ message: 'Team not found', code: 'NOT_FOUND' });
    }

    // Parse squad JSON or return null
    let squad = null;
    if (team.squad) {
      try {
        squad = JSON.parse(team.squad);
      } catch (e) {
        console.error('Error parsing squad JSON:', e);
      }
    }

    res.json({ data: squad });
  } catch (error) {
    console.error('Get squad error:', error);
    res.status(500).json({ message: 'Internal server error', code: 'INTERNAL_ERROR' });
  }
});

// Update team squad
teamsRouter.put('/:id/squad', authenticate, requireTeamOwner, async (req: AuthRequest, res) => {
  try {
    const teamId = req.params.id;
    const squadSchema = z.object({
      mode: z.union([z.literal(5), z.literal(6)]),
      formationId: z.string().optional(),
      slots: z.array(z.object({
        slotKey: z.string(),
        playerId: z.string().uuid().nullable(),
      })),
      updatedAt: z.string().optional(),
    });

    const data = squadSchema.parse(req.body);

    // Get team
    const [team] = await db.select().from(teams).where(eq(teams.id, teamId)).limit(1);

    if (!team) {
      return res.status(404).json({ message: 'Team not found', code: 'NOT_FOUND' });
    }

    // Get team members to validate playerIds
    const teamMemberRecords = await db
      .select({ userId: teamMembers.userId })
      .from(teamMembers)
      .where(eq(teamMembers.teamId, teamId));

    const validPlayerIds = new Set(teamMemberRecords.map(m => m.userId));

    // Validate that all playerIds in slots are team members (or null)
    for (const slot of data.slots) {
      if (slot.playerId && !validPlayerIds.has(slot.playerId)) {
        return res.status(400).json({
          message: `Player ${slot.playerId} is not a team member`,
          code: 'INVALID_PLAYER',
        });
      }
    }

    // Check for duplicate player assignments
    const assignedPlayerIds = data.slots
      .map(s => s.playerId)
      .filter((id): id is string => id !== null);
    
    const uniquePlayerIds = new Set(assignedPlayerIds);
    if (assignedPlayerIds.length !== uniquePlayerIds.size) {
      return res.status(400).json({
        message: 'A player cannot be assigned to multiple slots',
        code: 'DUPLICATE_PLAYER',
      });
    }

    // Add updatedAt timestamp
    const squadData = {
      mode: data.mode,
      formationId: data.formationId || null,
      slots: data.slots,
      updatedAt: new Date().toISOString(),
    };

    // Update team squad
    const [updated] = await db
      .update(teams)
      .set({ squad: JSON.stringify(squadData) })
      .where(eq(teams.id, teamId))
      .returning();

    // Parse and return the squad
    let squad = null;
    if (updated.squad) {
      try {
        squad = JSON.parse(updated.squad);
      } catch (e) {
        console.error('Error parsing squad JSON:', e);
      }
    }

    res.json({ data: squad });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: 'Validation error',
        code: 'VALIDATION_ERROR',
        details: error.errors,
      });
    }
    console.error('Update squad error:', error);
    res.status(500).json({ message: 'Internal server error', code: 'INTERNAL_ERROR' });
  }
});

