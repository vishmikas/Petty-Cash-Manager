const { STATUS_CODES } = require('./constants');

exports.sendSuccess = (res, data, message = null, statusCode = STATUS_CODES.OK) => {
    const response = { success: true };
    if (message) response.message = message;
    if (data) response.data = data;
    return res.status(statusCode).json(response);
};

exports.sendError = (res, error, statusCode = STATUS_CODES.INTERNAL_SERVER_ERROR) => {
  return res.status(statusCode).json({
    success: false,
    error: error
  });
};

exports.sendCreated = (res, data, message = null) => {
  return exports.sendSuccess(res, data, message, STATUS_CODES.CREATED);
};

exports.sendNotFound = (res, message = 'Resource not found') => {
  return exports.sendError(res, message, STATUS_CODES.NOT_FOUND);
};

exports.sendUnauthorized = (res, message = 'Not authorized') => {
  return exports.sendError(res, message, STATUS_CODES.UNAUTHORIZED);
};

exports.sendForbidden = (res, message = 'Access forbidden') => {
  return exports.sendError(res, message, STATUS_CODES.FORBIDDEN);
};

exports.sendBadRequest = (res, message = 'Bad request') => {
  return exports.sendError(res, message, STATUS_CODES.BAD_REQUEST);
};