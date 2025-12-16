import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';

export interface AuthRequest extends Request {
  userId?: string;
  user?: typeof users.$inferSelect;
}

export async function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.accessToken;

    if (!token) {
      return res.status(401).json({ message: 'Unauthorized', code: 'NO_TOKEN' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    const user = await db.select().from(users).where(eq(users.id, decoded.userId)).limit(1);

    if (!user[0]) {
      return res.status(401).json({ message: 'User not found', code: 'USER_NOT_FOUND' });
    }

    req.userId = decoded.userId;
    req.user = user[0];
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token', code: 'INVALID_TOKEN' });
  }
}

export function requireRole(...allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized', code: 'NO_USER' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden', code: 'INSUFFICIENT_PERMISSIONS' });
    }

    next();
  };
}

