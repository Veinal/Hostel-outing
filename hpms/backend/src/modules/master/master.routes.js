import express from 'express';
import { db } from '../../config/db.js';
import { ApiResponse } from '../../shared/utils/ApiResponse.js';

const router = express.Router();

router.get('/blocks', async (req, res, next) => {
  try {
    const blocks = await db.block.findMany({
      include: {
        floors: {
          include: {
            rooms: true
          }
        }
      }
    });
    ApiResponse.success(res, { blocks });
  } catch (err) {
    next(err);
  }
});

router.get('/branches', async (req, res, next) => {
  try {
    const branches = await db.branch.findMany();
    ApiResponse.success(res, { branches });
  } catch (err) {
    next(err);
  }
});

export default router;
