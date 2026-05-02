import express from 'express';
import { RequestsController } from './requests.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { authorize } from '../../middleware/rbac.js';
import { ROLES } from '../../shared/constants/roles.js';

const router = express.Router();

router.post('/', authenticate, authorize(ROLES.STUDENT), RequestsController.create);
router.get('/', authenticate, RequestsController.getMany);
router.get('/:id', authenticate, RequestsController.getOne);

router.put('/:id/approve', authenticate, authorize(ROLES.WARDEN, ROLES.CHIEF_WARDEN), RequestsController.approve);
router.put('/:id/reject', authenticate, authorize(ROLES.WARDEN, ROLES.CHIEF_WARDEN), RequestsController.reject);
router.put('/:id/cancel', authenticate, authorize(ROLES.WARDEN, ROLES.CHIEF_WARDEN), RequestsController.cancel);

router.put('/:id/delay', authenticate, authorize(ROLES.STUDENT), RequestsController.delay);

export default router;
