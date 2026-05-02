import { UsersService } from './users.service.js';
import { ApiResponse } from '../../shared/utils/ApiResponse.js';

export class UsersController {
  static async getProfile(req, res, next) {
    try {
      const user = await UsersService.getProfile(req.user.sub);
      ApiResponse.success(res, { user });
    } catch (err) {
      next(err);
    }
  }

  static async updateProfile(req, res, next) {
    try {
      // Basic check, validation logic can be added later or pushed to service
      const updatedUser = await UsersService.updateProfile(req.user.sub, req.user.role, req.body);
      ApiResponse.success(res, { user: updatedUser }, 'Profile updated successfully');
    } catch (err) {
      next(err);
    }
  }

  static async getWardens(req, res, next) {
    try {
      const wardens = await UsersService.getActiveWardens();
      ApiResponse.success(res, { wardens });
    } catch (err) {
      next(err);
    }
  }
}
