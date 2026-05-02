export class ApiResponse {
  static success(res, data, message = 'Success', statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      data,
      message
    });
  }

  static error(res, code, message, statusCode = 500, details = null) {
    const errorResponse = {
      success: false,
      error: {
        code,
        message
      }
    };
    if (details) {
      errorResponse.error.details = details;
    }
    return res.status(statusCode).json(errorResponse);
  }

  static paginated(res, data, message, total, page, limit) {
    return res.status(200).json({
      success: true,
      data,
      message,
      meta: {
        total,
        page,
        limit
      }
    });
  }
}
