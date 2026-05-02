import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { db } from './src/config/db.js';
import { errorHandler } from './src/middleware/errorHandler.js';
import { ApiResponse } from './src/shared/utils/ApiResponse.js';
import authRoutes from './src/modules/auth/auth.routes.js';
import usersRoutes from './src/modules/users/users.routes.js';
import masterRoutes from './src/modules/master/master.routes.js';
import requestsRoutes from './src/modules/requests/requests.routes.js';
import certificatesRoutes from './src/modules/certificates/certificates.routes.js';

dotenv.config();

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/master', masterRoutes);
app.use('/api/requests', requestsRoutes);
app.use('/api/certificates', certificatesRoutes);

app.get('/api/health', async (req, res, next) => {
  try {
    await db.$queryRaw`SELECT 1`;
    ApiResponse.success(res, { status: 'ok', db: 'connected' }, 'Health check passed');
  } catch (error) {
    next(error);
  }
});

app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
