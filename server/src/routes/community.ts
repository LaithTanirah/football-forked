import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/index.js';
import { posts } from '../db/community.schema.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { eq, desc } from 'drizzle-orm';

export const communityRouter = Router();

/* =======================
   Validation
======================= */
const createPostSchema = z.object({
  content: z.string().min(1).max(1000),
});

/* =======================
   Create Post
======================= */
communityRouter.post(
  '/',
  authenticate,
  async (req: AuthRequest, res) => {
    try {
      const data = createPostSchema.parse(req.body);

      // 🔥 الحل الجذري للمشكلة
      const userId = Number(req.userId);

      if (!userId) {
        return res.status(401).json({
          message: 'Unauthorized',
        });
      }

      const [post] = await db
        .insert(posts)
        .values({
          userId,
          content: data.content,
        })
        .returning();

      res.status(201).json({ data: post });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: 'Validation error',
          details: error.errors,
        });
      }

      console.error('Create post error:', error);
      res.status(500).json({
        message: 'Internal server error',
      });
    }
  }
);

/* =======================
   Get All Posts
======================= */
communityRouter.get('/', async (_req, res) => {
  try {
    const allPosts = await db
      .select()
      .from(posts)
      .orderBy(desc(posts.createdAt));

    res.json({ data: allPosts });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({
      message: 'Internal server error',
    });
  }
});

/* =======================
   Delete Post
======================= */
communityRouter.delete(
  '/:id',
  authenticate,
  async (req: AuthRequest, res) => {
    try {
      const postId = Number(req.params.id);
      const userId = Number(req.userId);

      const [post] = await db
        .select()
        .from(posts)
        .where(eq(posts.id, postId))
        .limit(1);

      if (!post) {
        return res.status(404).json({
          message: 'Post not found',
        });
      }

      if (post.userId !== userId && req.user?.role !== 'ADMIN') {
        return res.status(403).json({
          message: 'Forbidden',
        });
      }

      await db.delete(posts).where(eq(posts.id, postId));

      res.json({ message: 'Post deleted successfully' });
    } catch (error) {
      console.error('Delete post error:', error);
      res.status(500).json({
        message: 'Internal server error',
      });
    }
  }
);
