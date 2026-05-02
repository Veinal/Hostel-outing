import { AdminService } from './admin.service.js';
import { ApiResponse } from '../../shared/utils/ApiResponse.js';

export class AdminController {
  static async getWardens(req, res, next) {
    try {
      const wardens = await AdminService.getWardens();
      ApiResponse.success(res, { wardens });
    } catch (err) { next(err); }
  }

  static async createWarden(req, res, next) {
    try {
      const warden = await AdminService.createWarden(req.body);
      ApiResponse.success(res, { warden }, 'Warden created');
    } catch (err) { next(err); }
  }

  static async updateWarden(req, res, next) {
    try {
      const warden = await AdminService.updateWarden(req.params.id, req.body);
      ApiResponse.success(res, { warden }, 'Warden updated');
    } catch (err) { next(err); }
  }

  static async deleteWarden(req, res, next) {
    try {
      await AdminService.deleteWarden(req.params.id);
      ApiResponse.success(res, null, 'Warden deactivated');
    } catch (err) { next(err); }
  }

  static async assignWarden(req, res, next) {
    try {
      const warden = await AdminService.assignWarden(req.params.id, req.body.blockId);
      ApiResponse.success(res, { warden }, 'Block assigned');
    } catch (err) { next(err); }
  }

  static async getStudents(req, res, next) {
    try {
      const result = await AdminService.getStudents(req.query);
      ApiResponse.paginated(res, { students: result.students }, 'Students retrieved', result.total, result.page, result.limit);
    } catch (err) { next(err); }
  }

  static async getStudentById(req, res, next) {
    try {
      const student = await AdminService.getStudentById(req.params.id);
      ApiResponse.success(res, { student });
    } catch (err) { next(err); }
  }

  static async updateStudent(req, res, next) {
    try {
      const student = await AdminService.updateStudent(req.params.id, req.body);
      ApiResponse.success(res, { student }, 'Student updated');
    } catch (err) { next(err); }
  }

  static async resetStudentPassword(req, res, next) {
    try {
      const result = await AdminService.resetStudentPassword(req.params.id);
      ApiResponse.success(res, result);
    } catch (err) { next(err); }
  }

  static async importStudents(req, res, next) {
    try {
      if (!req.file) throw new Error('No file uploaded');
      const result = await AdminService.importStudents(req.file.buffer);
      ApiResponse.success(res, result, 'Import processing finished');
    } catch (err) { next(err); }
  }

  static async importTemplate(req, res, next) {
    try {
      const headers = "fullName,email,usn,phone,parentPhone,branch,year,gender,block,roomNumber\n";
      const sample = "John Doe,john@hpms.college,1MS20CS001,9876543210,9876543211,CSE,3,MALE,M,101\n";
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=student_import_template.csv');
      res.status(200).send(headers + sample);
    } catch (err) { next(err); }
  }

  static async getRequestsReport(req, res, next) {
    try {
      const result = await AdminService.getRequestsReport(req.query);
      ApiResponse.paginated(res, { requests: result.requests }, 'Report retrieved', result.total, result.page, result.limit);
    } catch (err) { next(err); }
  }

  static async getOverdueReport(req, res, next) {
    try {
      const requests = await AdminService.getOverdueReport();
      ApiResponse.success(res, { requests });
    } catch (err) { next(err); }
  }

  static async getSummary(req, res, next) {
    try {
      const summary = await AdminService.getSummary();
      ApiResponse.success(res, summary);
    } catch (err) { next(err); }
  }
}
