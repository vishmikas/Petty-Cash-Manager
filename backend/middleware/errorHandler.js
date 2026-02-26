const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    console.error('Error:', err);

    if (err.name === 'CastError') {
        error = {
            statusCode: 404,
            message: 'Resource not found'
        };
    }

    if (err.code === 11000) {
        error = {
            statusCode: 400,
            message: 'Duplicate field value entered'
        };
    }

    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map(val => val.message);
        error = {
            statusCode: 400,
            message
        };
    }

    if (err.name === 'JsonWebTokenError') {
        error = {
            statusCode: 401,
            message: 'Invalid token'
        };
    }

    if (err.name === 'TokenExpiredError') {
        error = {
            statusCode: 401,
            message: 'Token expired, Please log in again'
        };
    }

    res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Server Error',

        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

module.exports = errorHandler;