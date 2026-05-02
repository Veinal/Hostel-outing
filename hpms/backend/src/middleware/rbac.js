import { AppError } from '../shared/utils/AppError.js';
import { ERROR_CODES } from '../shared/constants/roles.js';

export const authorize = (...roles) => {
  return (req, res, next) => {
    const userRole = req.user?.role;
    if (!userRole || !roles.includes(userRole)) {
      return next(new AppError(ERROR_CODES.AUTH_UNAUTHORIZED, 'Unauthorized access: insufficient role', 403));
    }
    next();
  };
};
