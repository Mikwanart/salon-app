import { io, type Socket } from 'socket.io-client';

// Socket.IO connects to the server root, not the /api path used for REST calls.
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const SOCKET_URL = API_URL.replace(/\/api\/?$/, '');

let socket: Socket | null = null;

/**
 * Connects (or reuses an existing connection) to the backend's Socket.IO
 * server, authenticating with the same Auth0 access token used for REST calls.
 */
export const connectSocket = (token: string): Socket => {
  if (socket && socket.connected) return socket;

  if (socket) {
    socket.disconnect();
  }

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
  });

  return socket;
};

export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = (): Socket | null => socket;
