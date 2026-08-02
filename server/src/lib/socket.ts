import type { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import { prisma } from './prisma';

let io: SocketIOServer | null = null;

const domain = (process.env.AUTH0_ISSUER_BASE_URL || '').replace(/\/$/, '');
const jwks = domain
  ? jwksClient({ jwksUri: `${domain}/.well-known/jwks.json` })
  : null;

const getSigningKey = (kid: string): Promise<string> =>
  new Promise((resolve, reject) => {
    if (!jwks) return reject(new Error('Auth0 not configured'));
    jwks.getSigningKey(kid, (err, key) => {
      if (err || !key) return reject(err || new Error('Signing key not found'));
      resolve(key.getPublicKey());
    });
  });

/**
 * Verifies an Auth0 access token the same way our REST middleware does,
 * but manually — Socket.IO connections don't go through Express middleware.
 */
const verifySocketToken = (token: string): Promise<string> =>
  new Promise((resolve, reject) => {
    const decoded = jwt.decode(token, { complete: true });
    const kid = decoded?.header?.kid;
    if (!kid) return reject(new Error('Invalid token'));

    getSigningKey(kid)
      .then((signingKey) => {
        jwt.verify(
          token,
          signingKey,
          { audience: process.env.AUTH0_AUDIENCE, issuer: `${domain}/`, algorithms: ['RS256'] },
          (err, payload: any) => {
            if (err || !payload?.sub) return reject(err || new Error('Invalid token payload'));
            resolve(payload.sub);
          }
        );
      })
      .catch(reject);
  });

/**
 * Initializes the Socket.IO server on top of the existing HTTP server.
 * Each authenticated connection joins a private room named "user:<internalUserId>",
 * so notifications can be pushed to exactly the right person and no one else.
 */
export const initSocket = (httpServer: HttpServer): void => {
  io = new SocketIOServer(httpServer, {
    cors: { origin: true, credentials: true },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Missing auth token'));

      const auth0Id = await verifySocketToken(token);
      const user = await prisma.user.findUnique({ where: { auth0Id } });
      if (!user) return next(new Error('User not found'));

      socket.data.userId = user.id;
      next();
    } catch (err) {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.data.userId as string;
    socket.join(`user:${userId}`);
    console.log(`🔌 Socket connected for user ${userId}`);

    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected for user ${userId}`);
    });
  });

  console.log('🔌 Socket.IO server initialized');
};

/**
 * Pushes a real-time event to a specific user, if they currently have a
 * live connection. Safe to call even if Socket.IO hasn't been initialized
 * yet (e.g. in tests) or the user isn't currently connected — it just no-ops.
 */
export const emitToUser = (userId: string, event: string, payload: any): void => {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, payload);
};
