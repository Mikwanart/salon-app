import { auth } from 'express-oauth2-jwt-bearer';
import { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';

dotenv.config();

// The namespace used in the Auth0 Action for custom claims
const ROLES_CLAIM = 'https://salon-api/roles';

// We will use a dummy middleware for now if the env variables are missing to prevent crashes during early testing.
export const checkJwt = process.env.AUTH0_AUDIENCE && process.env.AUTH0_ISSUER_BASE_URL
  ? auth({
      audience: process.env.AUTH0_AUDIENCE,
      issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL,
    })
  : (req: any, res: any, next: any) => {
      console.warn('⚠️  Auth0 is not fully configured. Bypassing Auth check. DO NOT DO THIS IN PRODUCTION!');
      // Dummy payload to simulate a logged-in user
      req.auth = { payload: { sub: 'auth0|test-user-id', [ROLES_CLAIM]: [] } };
      next();
    };

/**
 * Middleware factory that checks whether the authenticated user has a specific role.
 * Must be used AFTER checkJwt, which validates the JWT and populates req.auth.
 *
 * @param role - The role name to require (e.g. 'salon_owner')
 */
export const requireRole = (role: string) => (req: Request, res: Response, next: NextFunction): void => {
  const roles: string[] = (req.auth?.payload as any)?.[ROLES_CLAIM] ?? [];
  if (!roles.includes(role)) {
    res.status(403).json({ error: `Forbidden: requires role '${role}'` });
    return;
  }
  next();
};
