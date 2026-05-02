import { ApiResponse } from '../shared/utils/ApiResponse.js';

export const verifyAuth = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) {
    return ApiResponse.error(res, 'AUTH_TOKEN_MISSING', 'Token missing', 401);
  }
  next();
};
