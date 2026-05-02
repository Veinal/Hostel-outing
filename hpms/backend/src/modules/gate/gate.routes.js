import express from 'express';
import rateLimit from 'express-rate-limit';
import { GateController } from './gate.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { authorize } from '../../middleware/rbac.js';
import { ROLES } from '../../shared/constants/roles.js';

const router = express.Router();

const gateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { success: false, error: { message: 'Too many scan attempts.' } }
});

router.post('/scan', authenticate, authorize(ROLES.SECURITY), gateLimiter, GateController.scan);

export default router;
