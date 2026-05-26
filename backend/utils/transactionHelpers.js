const Transaction = require('../models/Transaction');

exports.getPendingExpenseTotal = async (employeeId, excludeTransactionId = null) => {
  const match = {
    employee: employeeId,
    type: 'EXPENSE',
    approvalStatus: 'pending'
  };

  if (excludeTransactionId) {
    match._id = { $ne: excludeTransactionId };
  }

  const result = await Transaction.aggregate([
    { $match: match },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);

  return result[0]?.total || 0;
};

exports.generateReferenceNumber = async (type) => {
  const now = new Date();
  const year = now.getFullYear();
  const prefix = type === 'ALLOCATION' ? 'ALLOC' : 'EXP';
  const yearPrefix = `${prefix}-${year}-`;

  const latest = await Transaction.findOne({ referenceNumber: { $regex: `^${yearPrefix}` } })
    .sort({ createdAt: -1 })
    .select('referenceNumber');

  let nextNumber = 1;
  if (latest?.referenceNumber) {
    const lastNumber = Number(latest.referenceNumber.split('-').pop());
    if (!Number.isNaN(lastNumber)) nextNumber = lastNumber + 1;
  }

  return `${yearPrefix}${String(nextNumber).padStart(4, '0')}`;
};
