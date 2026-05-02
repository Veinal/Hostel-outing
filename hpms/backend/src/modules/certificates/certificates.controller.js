import { CertificatesService } from './certificates.service.js';
import { ApiResponse } from '../../shared/utils/ApiResponse.js';

export class CertificatesController {
  static async getById(req, res, next) {
    try {
      // Authorization checks can be added here based on role if needed
      const certificate = await CertificatesService.getById(req.params.id);
      ApiResponse.success(res, { certificate });
    } catch (err) {
      next(err);
    }
  }

  static async verify(req, res, next) {
    try {
      const certificate = await CertificatesService.verify(req.params.qrToken);
      ApiResponse.success(res, { certificate });
    } catch (err) {
      next(err);
    }
  }

  static async getByApprovalNumber(req, res, next) {
    try {
      const certificate = await CertificatesService.getByApprovalNumber(req.params.approvalNumber);
      ApiResponse.success(res, { certificate });
    } catch (err) {
      next(err);
    }
  }
}
