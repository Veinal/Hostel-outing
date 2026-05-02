import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { db } from './src/config/db.js';
import { errorHandler } from './src/middleware/errorHandler.js';
import { ApiResponse } from './src/shared/utils/ApiResponse.js';

dotenv.config();

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());

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
