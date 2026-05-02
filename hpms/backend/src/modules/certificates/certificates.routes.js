import express from 'express';
import { CertificatesController } from './certificates.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { authorize } from '../../middleware/rbac.js';
import { ROLES } from '../../shared/constants/roles.js';

const router = express.Router();

router.get('/:id', authenticate, CertificatesController.getById);
router.get('/verify/:qrToken', authenticate, authorize(ROLES.SECURITY), CertificatesController.verify);

export default router;
