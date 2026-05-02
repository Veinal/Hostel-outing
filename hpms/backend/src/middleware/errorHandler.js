import { AppError } from '../shared/utils/AppError.js';
import { ApiResponse } from '../shared/utils/ApiResponse.js';
import { Prisma } from '@prisma/client';

export const errorHandler = (err, req, res, next) => {
  console.error(err);

  if (err instanceof AppError) {
    return ApiResponse.error(res, err.code, err.message, err.statusCode, err.details);
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return ApiResponse.error(res, 'CONFLICT', 'A unique constraint failed', 409, { target: err.meta?.target });
    }
    if (err.code === 'P2025') {
      return ApiResponse.error(res, 'NOT_FOUND', 'Record not found', 404);
    }
    return ApiResponse.error(res, 'INTERNAL_ERROR', 'Database error', 500);
  }

  return ApiResponse.error(res, 'INTERNAL_ERROR', 'An unexpected error occurred', 500);
};
