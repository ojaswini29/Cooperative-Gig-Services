/**
 * Standardized JSON response helpers
 */

function successResponse(res, statusCode = 200, message = 'Success', data = null, meta = undefined) {
  const response = {
    success: true,
    message,
    data,
  };
  if (meta !== undefined) {
    response.meta = meta;
  }
  return res.status(statusCode).json(response);
}

function errorResponse(res, statusCode = 400, message = 'An error occurred', errors = null) {
  const response = {
    success: false,
    message,
  };
  if (errors !== null) {
    response.errors = errors;
  }
  return res.status(statusCode).json(response);
}

module.exports = {
  successResponse,
  errorResponse,
};
