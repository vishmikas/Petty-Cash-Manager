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

