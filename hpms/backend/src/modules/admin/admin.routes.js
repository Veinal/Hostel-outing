import express from 'express';
import multer from 'multer';
import { AdminController } from './admin.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { authorize } from '../../middleware/rbac.js';
import { ROLES } from '../../shared/constants/roles.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// All routes require ADMIN or CHIEF_WARDEN
router.use(authenticate, authorize(ROLES.ADMIN, ROLES.CHIEF_WARDEN));

// Wardens
router.get('/wardens', AdminController.getWardens);
router.post('/wardens', AdminController.createWarden);
router.put('/wardens/:id', AdminController.updateWarden);
router.delete('/wardens/:id', AdminController.deleteWarden);
router.put('/wardens/:id/assign', AdminController.assignWarden);

// Students
router.get('/students', AdminController.getStudents);
router.post('/students/import/template', AdminController.importTemplate);
router.post('/students/import', upload.single('file'), AdminController.importStudents);
router.get('/students/:id', AdminController.getStudentById);
router.put('/students/:id', AdminController.updateStudent);
router.post('/students/:id/reset-password', AdminController.resetStudentPassword);

// Reports
router.get('/reports/requests', AdminController.getRequestsReport);
router.get('/reports/overdue', AdminController.getOverdueReport);
router.get('/reports/summary', AdminController.getSummary);

export default router;
