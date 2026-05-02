import { AuthService } from './auth.service.js';
import { ApiResponse } from '../../shared/utils/ApiResponse.js';
import { AuthValidator } from './auth.validator.js';
import { AppError } from '../../shared/utils/AppError.js';
import { ERROR_CODES } from '../../shared/constants/roles.js';

export class AuthController {
  static async login(req, res, next) {
    try {
      const { error, value } = AuthValidator.login(req.body);
      if (error) {
        throw new AppError(
          ERROR_CODES.VALIDATION_ERROR,
          'Invalid login payload',
          400,
          error.details.map(err => err.message)
        );
      }

      const { accessToken, refreshToken, user } = await AuthService.login(value.email, value.password);

      // Set HttpOnly cookies
      const isProduction = process.env.NODE_ENV === 'production';
      res.cookie('hpms_token', accessToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'strict',
        maxAge: AuthService.parseDuration(process.env.JWT_EXPIRES_IN || '8h')
      });
      res.cookie('hpms_refresh', refreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'strict',
        maxAge: AuthService.parseDuration(process.env.JWT_REFRESH_EXPIRES_IN || '7d')
      });

      ApiResponse.success(res, { user }, 'Login successful');
    } catch (err) {
      next(err);
    }
  }

  static async forgotPassword(req, res, next) {
    try {
      await AuthService.forgotPassword(req.body.email);
      ApiResponse.success(res, null, 'If that email exists, an OTP has been sent.');
    } catch (err) { next(err); }
  }

  static async resetPassword(req, res, next) {
    try {
      const { email, otp, newPassword } = req.body;
      await AuthService.resetPassword(email, otp, newPassword);
      ApiResponse.success(res, null, 'Password reset successfully');
    } catch (err) { next(err); }
  }

  static async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      await AuthService.changePassword(req.user.sub, currentPassword, newPassword);
      ApiResponse.success(res, null, 'Password changed successfully');
    } catch (err) { next(err); }
  }

  static async logout(req, res, next) {
    try {
      res.clearCookie('hpms_token');
      res.clearCookie('hpms_refresh');
      ApiResponse.success(res, null, 'Logged out successfully');
    } catch (err) {
      next(err);
    }
  }

  static async refresh(req, res, next) {
    try {
      const refreshToken = req.cookies.hpms_refresh;
      if (!refreshToken) {
        throw new AppError(ERROR_CODES.AUTH_TOKEN_MISSING, 'Refresh token missing', 401);
      }

      const { accessToken } = await AuthService.refresh(refreshToken);

      const isProduction = process.env.NODE_ENV === 'production';
      res.cookie('hpms_token', accessToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'strict',
        maxAge: AuthService.parseDuration(process.env.JWT_EXPIRES_IN || '8h')
      });

      ApiResponse.success(res, null, 'Token refreshed successfully');
    } catch (err) {
      next(err);
    }
  }

  static async me(req, res, next) {
    try {
      // req.user was set by authenticate middleware
      const user = await AuthService.getUserProfile(req.user.sub);
      ApiResponse.success(res, { user });
    } catch (err) {
      next(err);
    }
  }
}
