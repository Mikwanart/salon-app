import { auth } from 'express-oauth2-jwt-bearer';
import dotenv from 'dotenv';

dotenv.config();

// We will use a dummy middleware for now if the env variables are missing to prevent crashes during early testing.
export const checkJwt = process.env.AUTH0_AUDIENCE && process.env.AUTH0_ISSUER_BASE_URL 
  ? auth({
      audience: process.env.AUTH0_AUDIENCE,
      issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL,
    })
  : (req: any, res: any, next: any) => {
      console.warn('⚠️  Auth0 is not fully configured. Bypassing Auth check. DO NOT DO THIS IN PRODUCTION!');
      // Dummy payload to simulate a logged-in user
      req.auth = { payload: { sub: 'auth0|test-user-id' } };
      next();
    };
