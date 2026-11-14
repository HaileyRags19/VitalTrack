import { auth } from 'express-oauth2-jwt-bearer';
import type { NextFunction, Request, Response } from 'express';
import { config } from './config.js';

export type Role = 'data_entry' | 'medical_admin';

// Verifies the Auth0 access token (RS256) on every API request.
export const checkJwt = auth({
  audience: config.auth0.audience,
  issuerBaseURL: config.auth0.issuerBaseURL,
  tokenSigningAlg: 'RS256',
});

export interface AuthedRequest extends Request {
  userId: string;
  roles: Role[];
}

// Reads the user id (sub) and role from the verified token.
export function attachUser(req: Request, res: Response, next: NextFunction) {
  const payload = (req as any).auth?.payload ?? {};
  const roles = (payload[config.auth0.rolesClaim] ?? []) as Role[];
  (req as AuthedRequest).userId = String(payload.sub ?? 'unknown');
  (req as AuthedRequest).roles = Array.isArray(roles) ? roles : [];
  next();
}

// Allows the request only when the user has one of the given roles.
export function requireRole(...allowed: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const { roles } = req as AuthedRequest;
    if (roles.some((r) => allowed.includes(r))) return next();
    res.status(403).json({ error: 'Forbidden: insufficient role' });
  };
}
