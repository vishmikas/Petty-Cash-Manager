const AuditLog = require('../models/AuditLog');

exports.createAuditLog = async (
  userId,
  action,
  resourceType,
  resourceId,
  changes = null,
  ipAddress = null
) => {
  try {
    await AuditLog.create({
      userId,
      action,
      resourceType,
      resourceId,
      changes,
      ipAddress
    });
  } catch (error) {
    console.error('Audit log error:', error);
  }
};

exports.auditLog = (action, resourceType) => {
  return async (req, res, next) => {
    const originalSend = res.send;

    res.send = function(data) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const resourceId = req.params.id ||
          (typeof data === 'object' && data.data && data.data._id);

        if (resourceId && req.user) {
          const ipAddress = req.ip || req.connection.remoteAddress;
          exports.createAuditLog(
            req.user._id,
            action,
            resourceType,
            resourceId,
            req.body,
            ipAddress
          );
        }
      }
      originalSend.call(this, data);
    };

    next();
  };
};