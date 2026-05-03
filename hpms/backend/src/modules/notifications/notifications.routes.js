import express from 'express';
import { authenticate } from '../../middleware/auth.js';
import { db } from '../../config/db.js';
import { ApiResponse } from '../../shared/utils/ApiResponse.js';

const router = express.Router();

/**
 * GET /api/notifications
 * Returns notifications for the currently authenticated user.
 * Filters by userId = req.user.sub (the JWT subject).
 * Only returns IN_APP channel notifications (user-facing).
 * Query params: ?limit=20&page=1
 */
router.get('/', authenticate, async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      db.notification.findMany({
        where: {
          userId: req.user.sub,
          channel: 'IN_APP'
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          type: true,
          channel: true,
          payload: true,
          sentAt: true,
          createdAt: true,
          requestId: true,
          userId: true
        }
      }),
      db.notification.count({
        where: {
          userId: req.user.sub,
          channel: 'IN_APP'
        }
      })
    ]);

    // Flatten payload.message into top-level for frontend convenience
    const formatted = notifications.map(n => ({
      ...n,
      title: n.type?.replace(/_/g, ' '),
      message: n.payload?.message || n.payload?.content || ''
    }));

    return ApiResponse.paginated(
      res,
      { notifications: formatted },
      'Notifications fetched successfully',
      total,
      page,
      limit
    );
  } catch (err) {
    next(err);
  }
});

export default router;
