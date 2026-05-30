import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

import authRoutes from './routes/auth.js';
import vehicleRoutes from './routes/vehicles.js';
import serviceRoutes from './routes/services.js';
import requestRoutes from './routes/requests.js';
import paymentRoutes from './routes/payments.js';
import volunteerRoutes from './routes/volunteer.js';
import adminRoutes from './routes/admin.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

app.set('io', io);

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'Kalon API' });
});

app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/volunteer', volunteerRoutes);
app.use('/api/admin', adminRoutes);

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('Authentication required'));

  try {
    socket.user = jwt.verify(token, process.env.JWT_SECRET || 'kalon_super_secret');
    next();
  } catch {
    next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  const { role, id } = socket.user;

  if (role === 'volunteer') socket.join('volunteers');
  if (role === 'admin') socket.join('admin');

  socket.on('join:request', (requestId) => {
    socket.join(`request:${requestId}`);
  });

  socket.on('leave:request', (requestId) => {
    socket.leave(`request:${requestId}`);
  });

  console.log(`Socket connected: user ${id} (${role})`);
});

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';
httpServer.listen(PORT, HOST, () => {
  console.log(`Kalon API running on http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`);
  console.log(`Mobile: use your PC IP, e.g. http://192.168.x.x:${PORT}`);
});

export default app;
