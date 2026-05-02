import jwt from 'jsonwebtoken';
import { ApiResponse } from '../shared/utils/ApiResponse.js';
import { AppError } from '../shared/utils/AppError.js';
import { ERROR_CODES } from '../shared/constants/roles.js';

export const authenticate = (req, res, next) => {
  try {
    const token = req.cookies?.hpms_token;
    if (!token) {
      throw new AppError(ERROR_CODES.AUTH_TOKEN_MISSING, 'Authentication token missing', 401);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretjwt');
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      next(new AppError(ERROR_CODES.AUTH_TOKEN_EXPIRED, 'Authentication token expired', 401));
    } else if (err instanceof AppError) {
      next(err);
    } else {
      next(new AppError(ERROR_CODES.AUTH_UNAUTHORIZED, 'Invalid authentication token', 401));
    }
  }
};
