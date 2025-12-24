import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/index.js';
import { challenges, questions } from '../db/challenges.schema.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { eq, and } from 'drizzle-orm';

export const challengesRouter = Router();

/* =======================
   Zod Schemas
======================= */
const createChallengeSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(5),
});

const createQuestionSchema = z.object({
  challengeId: z.number().int(),
  question: z.string().min(3),
  correctAnswer: z.string().min(1),
});

/* =======================
   Create Challenge (ADMIN)
======================= */
challengesRouter.post(
  '/',
  authenticate,
  async (req: AuthRequest, res) => {
    try {
      if (req.user?.role !== 'ADMIN') {
        return res.status(403).json({ message: 'Forbidden' });
      }

      const data = createChallengeSchema.parse(req.body);

      const [challenge] = await db
        .insert(challenges)
        .values({
          title: data.title,
          description: data.description,
        })
        .returning();

      res.status(201).json({ data: challenge });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: 'Validation error',
          details: error.errors,
        });
      }

      console.error('Create challenge error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

/* =======================
   Get All Challenges
======================= */
challengesRouter.get('/', async (_req, res) => {
  try {
    const allChallenges = await db
      .select()
      .from(challenges)
      .orderBy(challenges.id);

    res.json({ data: allChallenges });
  } catch (error) {
    console.error('Get challenges error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/* =======================
   Add Question to Challenge (ADMIN)
======================= */
challengesRouter.post(
  '/questions',
  authenticate,
  async (req: AuthRequest, res) => {
    try {
      if (req.user?.role !== 'ADMIN') {
        return res.status(403).json({ message: 'Forbidden' });
      }

      const data = createQuestionSchema.parse(req.body);

      const challengeId = Number(data.challengeId);

      const [challenge] = await db
        .select()
        .from(challenges)
        .where(eq(challenges.id, challengeId))
        .limit(1);

      if (!challenge) {
        return res.status(404).json({ message: 'Challenge not found' });
      }

      const [question] = await db
        .insert(questions)
        .values({
          challengeId,
          question: data.question,
          correctAnswer: data.correctAnswer,
        })
        .returning();

      res.status(201).json({ data: question });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: 'Validation error',
          details: error.errors,
        });
      }

      console.error('Add question error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

/* =======================
   Get Questions for Challenge
======================= */
challengesRouter.get('/:id/questions', async (req, res) => {
  try {
    const challengeId = Number(req.params.id);

    const challengeQuestions = await db
      .select()
      .from(questions)
      .where(eq(questions.challengeId, challengeId));

    res.json({ data: challengeQuestions });
  } catch (error) {
    console.error('Get questions error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});
