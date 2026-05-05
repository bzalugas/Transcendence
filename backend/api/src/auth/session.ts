import { UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { auth } from '../../lib/auth';

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
