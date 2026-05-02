import { ApiResponse } from '../shared/utils/ApiResponse.js';

export const requireRole = (roles) => {
  return (req, res, next) => {
    const userRole = req.user?.role;
    if (!userRole || !roles.includes(userRole)) {
      return ApiResponse.error(res, 'AUTH_UNAUTHORIZED', 'Unauthorized access', 403);
    }
    next();
  };
};
