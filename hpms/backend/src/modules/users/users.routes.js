import express from 'express';
import { UsersController } from './users.controller.js';
import { authenticate } from '../../middleware/auth.js';

const router = express.Router();

router.get('/me/profile', authenticate, UsersController.getProfile);
router.put('/me/profile', authenticate, UsersController.updateProfile);
router.get('/wardens', authenticate, UsersController.getWardens);

export default router;
