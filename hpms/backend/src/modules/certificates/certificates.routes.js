import express from 'express';
import { CertificatesController } from './certificates.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { authorize } from '../../middleware/rbac.js';
import { ROLES } from '../../shared/constants/roles.js';

const router = express.Router();

router.get('/approval/:approvalNumber', authenticate, authorize(ROLES.SECURITY), CertificatesController.getByApprovalNumber);
router.get('/verify/:qrToken', authenticate, authorize(ROLES.SECURITY), CertificatesController.verify);
router.get('/by-request/:requestId', authenticate, authorize(ROLES.STUDENT, ROLES.WARDEN, ROLES.CHIEF_WARDEN, ROLES.ADMIN, ROLES.SECURITY), CertificatesController.getCertificateByRequest);
router.get('/:id', authenticate, authorize(ROLES.STUDENT, ROLES.WARDEN, ROLES.CHIEF_WARDEN, ROLES.ADMIN, ROLES.SECURITY), CertificatesController.getById);

export default router;
