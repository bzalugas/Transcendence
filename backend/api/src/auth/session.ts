import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { PrismaClient } from '@prisma/client';
import { auth } from '../../lib/auth';

const prisma = new PrismaClient();
type AppRole = 'GUEST' | 'USER' | 'ADMIN';

// Reads the better-auth session cookie from an Express request and returns its user id.
export async function getSessionUserId(req: Request): Promise<string> {
  const session = await auth.api.getSession({
    headers: toHeaders(req),
  });

  if (!session?.user?.id) {
    throw new UnauthorizedException('Authentication required');
  }

  return session.user.id;
}

// Like getSessionUserId but also enforces ADMIN role.
export async function getSessionAdmin(req: Request): Promise<string> {
  const userId = await getSessionUserId(req);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (user?.role !== 'ADMIN') {
    throw new ForbiddenException('Admin access required');
  }

  return userId;
}

// Reads the current session and rejects users whose role is not allowed.
export async function getSessionUserWithRole(
  req: Request,
  allowedRoles: AppRole[],
): Promise<{ userId: string; role: AppRole }> {
  const userId = await getSessionUserId(req);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!user || !allowedRoles.includes(user.role)) {
    throw new ForbiddenException('This area is not available for your role');
  }

  return { userId, role: user.role };
}

// Converts Express request headers into the standard Headers shape expected by better-auth.
function toHeaders(req: Request): Headers {
  const headers = new Headers();

  for (const [key, value] of Object.entries(req.headers)) {
    if (typeof value === 'string') {
      headers.set(key, value);
    } else if (Array.isArray(value)) {
      headers.set(key, value.join(', '));
    }
  }

  return headers;
}
