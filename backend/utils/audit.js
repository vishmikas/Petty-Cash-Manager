const AuditLog = require('../models/AuditLog');

exports.logAudit = async ({ userId, action, resourceType, resourceId, changes = null, ipAddress = null }) => {
  try {
    if (!userId || !action || !resourceType || !resourceId) return;
    await AuditLog.create({ userId, action, resourceType, resourceId, changes, ipAddress });
  } catch (error) {
    console.error('Audit log error:', error.message);
  }
};
