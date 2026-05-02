import { RequestsService } from './requests.service.js';
import { ApiResponse } from '../../shared/utils/ApiResponse.js';
import { RequestsValidator } from './requests.validator.js';
import { AppError } from '../../shared/utils/AppError.js';
import { ERROR_CODES } from '../../shared/constants/roles.js';

export class RequestsController {
  static async create(req, res, next) {
    try {
      const { error, value } = RequestsValidator.create(req.body);
      if (error) {
        throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'Validation failed', 400, error.details.map(e => e.message));
      }
      const request = await RequestsService.createRequest(req.user.sub, value);
      ApiResponse.success(res, { request }, 'Request submitted successfully');
    } catch (err) {
      next(err);
    }
  }

  static async getMany(req, res, next) {
    try {
      const { requests, total, page, limit } = await RequestsService.getRequests(req.user, req.query);
      ApiResponse.paginated(res, { requests }, 'Requests retrieved', total, page, limit);
    } catch (err) {
      next(err);
    }
  }

  static async getOne(req, res, next) {
    try {
      const request = await RequestsService.getRequestById(req.params.id, req.user);
      ApiResponse.success(res, { request });
    } catch (err) {
      next(err);
    }
  }

  static async approve(req, res, next) {
    try {
      const data = await RequestsService.approve(req.params.id, req.user.sub);
      ApiResponse.success(res, data, 'Request approved');
    } catch (err) {
      next(err);
    }
  }

  static async reject(req, res, next) {
    try {
      const { error, value } = RequestsValidator.reject(req.body);
      if (error) throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'Validation failed', 400, error.details.map(e => e.message));
      
      const request = await RequestsService.reject(req.params.id, req.user.sub, value.rejectionReason);
      ApiResponse.success(res, { request }, 'Request rejected');
    } catch (err) {
      next(err);
    }
  }

  static async cancel(req, res, next) {
    try {
      const { error, value } = RequestsValidator.cancel(req.body);
      if (error) throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'Validation failed', 400, error.details.map(e => e.message));

      const request = await RequestsService.cancel(req.params.id, req.user.sub, value.reason);
      ApiResponse.success(res, { request }, 'Request cancelled');
    } catch (err) {
      next(err);
    }
  }

  static async delay(req, res, next) {
    try {
      const { error, value } = RequestsValidator.delay(req.body);
      if (error) throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'Validation failed', 400, error.details.map(e => e.message));

      const request = await RequestsService.delay(req.params.id, req.user.sub, value.newExpectedReturnDateTime);
      ApiResponse.success(res, { request }, 'Request delayed');
    } catch (err) {
      next(err);
    }
  }
}
