import { Router } from 'express';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { eq, or } from 'drizzle-orm';

export const authRouter = Router();

const registerSchema = z.object({
  name: z.string().min(1).max(255),
  username: z.string().min(3).max(100),
  email: z.string().email(),
  phone: z.string().optional(),
  password: z.string().min(6),
  city: z.string().optional(),
});

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

authRouter.post('/register', async (req, res) => {
  try {
    const data = registerSchema.parse(req.body);

    // Check if username or email exists
    const existing = await db
      .select()
      .from(users)
      .where(or(eq(users.username, data.username), eq(users.email, data.email)))
      .limit(1);

    if (existing.length > 0) {
      return res.status(400).json({
        message: 'Username or email already exists',
        code: 'USER_EXISTS',
      });
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const [newUser] = await db
      .insert(users)
      .values({
        name: data.name,
        username: data.username,
        email: data.email,
        phone: data.phone,
        passwordHash,
        city: data.city,
      })
      .returning();

    const accessToken = generateAccessToken({ userId: newUser.id });
    const refreshToken = generateRefreshToken({ userId: newUser.id });

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    const { passwordHash: _, ...userWithoutPassword } = newUser;

    res.status(201).json({
      data: {
        user: userWithoutPassword,
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
    console.error('Register error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    res.status(500).json({ 
      message: 'Internal server error', 
      code: 'INTERNAL_ERROR',
      ...(process.env.NODE_ENV === 'development' && { details: errorMessage, stack: errorStack })
    });
  }
});

authRouter.post('/login', async (req, res) => {
  try {
    const data = loginSchema.parse(req.body);

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, data.username))
      .limit(1);

    if (!user) {
      return res.status(401).json({
        message: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS',
      });
    }

    const isValid = await bcrypt.compare(data.password, user.passwordHash);

    if (!isValid) {
      return res.status(401).json({
        message: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS',
      });
    }

    const accessToken = generateAccessToken({ userId: user.id });
    const refreshToken = generateRefreshToken({ userId: user.id });

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const { passwordHash: _, ...userWithoutPassword } = user;

    res.json({
      data: {
        user: userWithoutPassword,
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
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error', code: 'INTERNAL_ERROR' });
  }
});

authRouter.post('/logout', (req, res) => {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
  res.json({ data: { message: 'Logged out successfully' } });
});

authRouter.get('/me', authenticate, async (req: AuthRequest, res) => {
  const { passwordHash: _, ...userWithoutPassword } = req.user!;
  res.json({ data: { user: userWithoutPassword } });
});

