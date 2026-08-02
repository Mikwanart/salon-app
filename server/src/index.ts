import 'dotenv/config'; // Must be first — loads .env before any other module initialises
import http from 'http';
import express from 'express';
import cors from 'cors';

import salonRoutes from './routes/salonRoutes';
import userRoutes from './routes/userRoutes';
import appointmentRoutes from './routes/appointmentRoutes';
import reviewRoutes from './routes/reviewRoutes';
import adminRoutes from './routes/adminRoutes';
import notificationRoutes from './routes/notificationRoutes';
import { autoSeedSalons } from './lib/autoSeed';
import { startReminderScheduler } from './lib/reminders';
import { initSocket } from './lib/socket';

const app = express();
const port = process.env.PORT || 3001;

// Allow all origins so frontend requests are never blocked by CORS
app.use(cors({
  origin: true,
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Incoming request logger for debugging
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] 📡 ${req.method} ${req.originalUrl}`);
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Salon API is running!' });
});

// Register routes
app.use('/api/salons', salonRoutes);
app.use('/api/users', userRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);

process.on('beforeExit', (code) => {
  console.log('DEBUG: process beforeExit event with code:', code);
  console.log('Active handles in beforeExit:', (process as any)._getActiveHandles?.()?.map((h: any) => h.constructor.name) || []);
});
process.on('exit', (code) => {
  console.log('DEBUG: process exit event with code:', code);
});

const server = http.createServer(app);
initSocket(server);

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  autoSeedSalons().catch((err) => console.error('Error during auto-seed:', err));
  startReminderScheduler();
});
