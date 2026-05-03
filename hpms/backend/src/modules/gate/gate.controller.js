import { GateService } from './gate.service.js';
import { ApiResponse } from '../../shared/utils/ApiResponse.js';
import { AppError } from '../../shared/utils/AppError.js';
import { ERROR_CODES } from '../../shared/constants/roles.js';

export class GateController {
  static async scan(req, res, next) {
    try {
      const { qrToken, deviceId } = req.body;
      if (!qrToken || !deviceId) {
        throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'qrToken and deviceId are required', 400);
      }

      const result = await GateService.scanQr(qrToken, deviceId, req.user.sub, req.ip);
      const message = result.scanType === 'EXIT' ? 'Exit logged successfully' : 'Entry logged successfully';

      ApiResponse.success(res, result, message);
    } catch (err) {
      next(err);
    }
  static async getScans(req, res, next) {
    try {
      const result = await GateService.getScans(req.user, req.query);
      ApiResponse.success(res, result, 'Scans fetched successfully');
    } catch (err) {
      next(err);
    }
  }
}
