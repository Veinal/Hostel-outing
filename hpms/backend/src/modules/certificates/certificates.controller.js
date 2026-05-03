import { CertificatesService } from './certificates.service.js';
import { ApiResponse } from '../../shared/utils/ApiResponse.js';

export class CertificatesController {
  static async getById(req, res, next) {
    try {
      const certificate = await CertificatesService.getById(req.params.id, req.user);
      ApiResponse.success(res, { certificate });
    } catch (err) {
      next(err);
    }
  }

  static async getCertificateByRequest(req, res, next) {
    try {
      const { requestId } = req.params;
      const certificate = await CertificatesService.getCertificateByRequestId(requestId, req.user);
      return ApiResponse.success(res, { certificate }, 'Certificate retrieved');
    } catch (error) {
      next(error);
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
