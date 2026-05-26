const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const { EXPENSE_CATEGORIES, RECEIPT_REQUIRED_OVER, LOW_BALANCE_THRESHOLD } = require('../utils/constants');
const { logAudit } = require('../utils/audit');
const { getPendingExpenseTotal, generateReferenceNumber } = require('../utils/transactionHelpers');

const validateObjectId = (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ success: false, error: 'Invalid ID format' });
  }
  next();
};

const getDepartmentId = (department) => department?._id || department;

const populateTransaction = (query) => query
  .populate('createdBy', 'name email')
  .populate('employee', 'name email pettyCashBalance department')
  .populate('department', 'name')
  .populate('approvedBy', 'name email');

const ensureManagerCanAccessDepartment = (req, departmentId) => {
  if (req.user.role !== 'manager') return true;
  const managerDepartmentId = getDepartmentId(req.user.department);
  return managerDepartmentId && departmentId && departmentId.toString() === managerDepartmentId.toString();
};

router.get('/categories/list', protect, async (req, res) => {
  return res.status(200).json({ success: true, data: EXPENSE_CATEGORIES });
});

router.get('/pending', protect, authorize('manager', 'admin'), async (req, res) => {
  try {
    const query = { approvalStatus: 'pending', type: 'EXPENSE' };
    if (req.user.role === 'manager' && req.user.department) {
      query.department = getDepartmentId(req.user.department);
    }

    const transactions = await populateTransaction(
      Transaction.find(query).sort({ createdAt: -1 })
    );

    return res.status(200).json({ success: true, count: transactions.length, data: transactions });
  } catch (err) {
    console.error('Pending transactions error:', err);
    return res.status(500).json({ success: false, error: 'Server Error' });
  }
});

router.get('/analytics', protect, async (req, res) => {
  try {
    const { startDate, endDate, employee, department } = req.query;
    const filter = {};

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.date.$lte = end;
      }
    }

    if (req.user.role === 'employee') {
      filter.employee = req.user._id;
    } else if (req.user.role === 'manager' && req.user.department) {
      filter.department = getDepartmentId(req.user.department);
    }

    if (employee && ['admin', 'accountant', 'manager'].includes(req.user.role)) filter.employee = employee;
    if (department && ['admin', 'accountant'].includes(req.user.role)) filter.department = department;

    const transactions = await Transaction.find(filter);

    const totalAllocated = transactions
      .filter(t => t.type === 'ALLOCATION' && t.approvalStatus === 'approved')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = transactions
      .filter(t => t.type === 'EXPENSE' && t.approvalStatus === 'approved')
      .reduce((sum, t) => sum + t.amount, 0);
    const pendingExpenses = transactions
      .filter(t => t.type === 'EXPENSE' && t.approvalStatus === 'pending')
      .reduce((sum, t) => sum + t.amount, 0);
    const expenseByCategory = transactions
      .filter(t => t.type === 'EXPENSE' && t.approvalStatus === 'approved')
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {});

    return res.status(200).json({
      success: true,
      data: {
        summary: {
          totalAllocated,
          totalExpense,
          balance: totalAllocated - totalExpense,
          pendingExpenses,
          transactionCount: transactions.length
        },
        expenseByCategory
      }
    });
  } catch (err) {
    console.error('Analytics error:', err);
    return res.status(500).json({ success: false, error: 'Server Error' });
  }
});

router.get('/reports/summary', protect, authorize('admin', 'accountant', 'manager'), async (req, res) => {
  try {
    const { startDate, endDate, department } = req.query;
    const match = {};

    if (startDate || endDate) {
      match.date = {};
      if (startDate) match.date.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        match.date.$lte = end;
      }
    }

    if (req.user.role === 'manager') {
      match.department = getDepartmentId(req.user.department);
    } else if (department) {
      match.department = new mongoose.Types.ObjectId(department);
    }

    const report = await Transaction.aggregate([
      { $match: match },
      {
        $group: {
          _id: { department: '$department', employee: '$employee', type: '$type', status: '$approvalStatus' },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    return res.status(200).json({ success: true, data: report });
  } catch (err) {
    console.error('Report summary error:', err);
    return res.status(500).json({ success: false, error: 'Server Error' });
  }
});

router.get('/reports/low-balances', protect, authorize('admin', 'accountant'), async (req, res) => {
  try {
    const threshold = Number(req.query.threshold) || LOW_BALANCE_THRESHOLD;
    const employees = await User.find({
      role: { $in: ['employee', 'manager'] },
      isActive: true,
      pettyCashBalance: { $lte: threshold }
    }).populate('department').select('-password').sort({ pettyCashBalance: 1 });

    return res.status(200).json({ success: true, threshold, count: employees.length, data: employees });
  } catch (err) {
    console.error('Low balance report error:', err);
    return res.status(500).json({ success: false, error: 'Server Error' });
  }
});

router.post('/allocate', protect, authorize('admin'), async (req, res) => {
  try {
    const { employee, amount, notes } = req.body;
    const numericAmount = Number(amount);

    if (!employee || !numericAmount || numericAmount <= 0) {
      return res.status(400).json({ success: false, error: 'Please provide employee and valid amount' });
    }

    const employeeUser = await User.findById(employee).populate('department');
    if (!employeeUser) return res.status(404).json({ success: false, error: 'Employee not found' });
    if (!employeeUser.department) return res.status(400).json({ success: false, error: 'Employee must be assigned to a department first' });

    const allocation = await Transaction.create({
      referenceNumber: await generateReferenceNumber('ALLOCATION'),
      description: `Petty Cash Allocation to ${employeeUser.name}`,
      amount: numericAmount,
      category: 'Petty Cash Allocation',
      type: 'ALLOCATION',
      date: Date.now(),
      notes: notes || '',
      createdBy: req.user._id,
      employee,
      department: employeeUser.department._id,
      approvalStatus: 'approved',
      approvedBy: req.user._id,
      approvedAt: Date.now()
    });

    employeeUser.pettyCashBalance += numericAmount;
    await employeeUser.save();

    await logAudit({
      userId: req.user._id,
      action: 'CREATE',
      resourceType: 'Transaction',
      resourceId: allocation._id,
      changes: { type: 'ALLOCATION', employee, amount: numericAmount },
      ipAddress: req.ip
    });

    const populatedAllocation = await populateTransaction(Transaction.findById(allocation._id));
    return res.status(201).json({ success: true, data: populatedAllocation });
  } catch (err) {
    console.error('Allocation error:', err);
    return res.status(500).json({ success: false, error: err.message || 'Server Error' });
  }
});

router.post('/expense', protect, async (req, res) => {
  try {
    const { description, amount, category = 'General', date, notes, receiptUrl } = req.body;
    const numericAmount = Number(amount);

    if (!description || !numericAmount) return res.status(400).json({ success: false, error: 'Please provide description and amount' });
    if (numericAmount <= 0) return res.status(400).json({ success: false, error: 'Amount must be greater than 0' });
    if (!EXPENSE_CATEGORIES.includes(category) || category === 'Petty Cash Allocation') {
      return res.status(400).json({ success: false, error: 'Please select a valid expense category' });
    }
    if (!req.user.department) return res.status(400).json({ success: false, error: 'You must be assigned to a department' });
    if (date && new Date(date) > new Date()) return res.status(400).json({ success: false, error: 'Date cannot be in the future' });
    if (numericAmount > RECEIPT_REQUIRED_OVER && !receiptUrl) {
      return res.status(400).json({ success: false, error: `Receipt link is required for expenses above Rs. ${RECEIPT_REQUIRED_OVER}` });
    }

    const pendingTotal = await getPendingExpenseTotal(req.user._id);
    const availableBalance = req.user.pettyCashBalance - pendingTotal;
    if (availableBalance < numericAmount) {
      return res.status(400).json({
        success: false,
        error: `Insufficient available balance. Balance: Rs. ${req.user.pettyCashBalance}, pending: Rs. ${pendingTotal}, available: Rs. ${availableBalance}`
      });
    }

    const expense = await Transaction.create({
      referenceNumber: await generateReferenceNumber('EXPENSE'),
      description,
      amount: numericAmount,
      category,
      type: 'EXPENSE',
      date: date || Date.now(),
      notes,
      receiptUrl,
      createdBy: req.user._id,
      employee: req.user._id,
      department: getDepartmentId(req.user.department),
      approvalStatus: 'pending'
    });

    await logAudit({
      userId: req.user._id,
      action: 'CREATE',
      resourceType: 'Transaction',
      resourceId: expense._id,
      changes: { type: 'EXPENSE', amount: numericAmount, category },
      ipAddress: req.ip
    });

    const populatedExpense = await populateTransaction(Transaction.findById(expense._id));
    return res.status(201).json({ success: true, data: populatedExpense });
  } catch (err) {
    console.error('Create expense error:', err);
    return res.status(500).json({ success: false, error: err.message || 'Server Error' });
  }
});

router.get('/', protect, async (req, res) => {
  try {
    const {
      startDate, endDate, type, category, search, approvalStatus, department, employee,
      page = 1, limit = 100
    } = req.query;

    const query = {};
    if (req.user.role === 'employee') query.employee = req.user._id;
    else if (req.user.role === 'manager' && req.user.department) query.department = getDepartmentId(req.user.department);

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }
    if (type) query.type = type;
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { description: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } },
        { referenceNumber: { $regex: search, $options: 'i' } }
      ];
    }
    if (approvalStatus) query.approvalStatus = approvalStatus;
    if (department && ['admin', 'accountant'].includes(req.user.role)) query.department = department;
    if (employee && ['admin', 'accountant', 'manager'].includes(req.user.role)) query.employee = employee;

    const safePage = Math.max(Number(page) || 1, 1);
    const safeLimit = Math.min(Math.max(Number(limit) || 100, 1), 500);
    const skip = (safePage - 1) * safeLimit;

    const [transactions, total] = await Promise.all([
      populateTransaction(Transaction.find(query).sort({ date: -1, createdAt: -1 }).skip(skip).limit(safeLimit)),
      Transaction.countDocuments(query)
    ]);

    return res.status(200).json({
      success: true,
      count: transactions.length,
      data: transactions,
      pagination: { page: safePage, limit: safeLimit, total, pages: Math.ceil(total / safeLimit) }
    });
  } catch (err) {
    console.error('Get transactions error:', err);
    return res.status(500).json({ success: false, error: 'Server Error' });
  }
});

router.put('/:id', protect, validateObjectId, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) return res.status(404).json({ success: false, error: 'Transaction not found' });

    const isOwner = transaction.createdBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) return res.status(403).json({ success: false, error: 'Not authorized to update this transaction' });
    if (transaction.approvalStatus === 'approved') return res.status(400).json({ success: false, error: 'Cannot edit an approved transaction' });

    const { description, amount, category, date, notes, receiptUrl, resubmit } = req.body;
    const numericAmount = amount !== undefined ? Number(amount) : transaction.amount;

    if (numericAmount <= 0) return res.status(400).json({ success: false, error: 'Amount must be greater than 0' });
    if (category && (!EXPENSE_CATEGORIES.includes(category) || category === 'Petty Cash Allocation')) {
      return res.status(400).json({ success: false, error: 'Please select a valid expense category' });
    }
    if (date && new Date(date) > new Date()) return res.status(400).json({ success: false, error: 'Date cannot be in the future' });
    if (transaction.type === 'EXPENSE' && numericAmount > RECEIPT_REQUIRED_OVER && !(receiptUrl || transaction.receiptUrl)) {
      return res.status(400).json({ success: false, error: `Receipt link is required for expenses above Rs. ${RECEIPT_REQUIRED_OVER}` });
    }

    if (transaction.type === 'EXPENSE') {
      const employee = await User.findById(transaction.employee);
      const pendingTotal = await getPendingExpenseTotal(transaction.employee, transaction._id);
      const availableBalance = employee.pettyCashBalance - pendingTotal;
      if (availableBalance < numericAmount) {
        return res.status(400).json({ success: false, error: `Insufficient available balance. Available: Rs. ${availableBalance}` });
      }
    }

    if (description !== undefined) transaction.description = description;
    if (amount !== undefined) transaction.amount = numericAmount;
    if (category) transaction.category = category;
    if (date) transaction.date = date;
    if (notes !== undefined) transaction.notes = notes;
    if (receiptUrl !== undefined) transaction.receiptUrl = receiptUrl;

    if (transaction.approvalStatus === 'rejected' && resubmit) {
      transaction.approvalStatus = 'pending';
      transaction.approvedBy = undefined;
      transaction.approvedAt = undefined;
      transaction.rejectionReason = undefined;
    }

    await transaction.save();

    await logAudit({
      userId: req.user._id,
      action: 'UPDATE',
      resourceType: 'Transaction',
      resourceId: transaction._id,
      changes: req.body,
      ipAddress: req.ip
    });

    const updatedTransaction = await populateTransaction(Transaction.findById(transaction._id));
    return res.status(200).json({ success: true, data: updatedTransaction });
  } catch (err) {
    console.error('Update transaction error:', err);
    return res.status(500).json({ success: false, error: err.message || 'Server Error' });
  }
});

router.put('/:id/approve', protect, authorize('manager', 'admin'), validateObjectId, async (req, res) => {
  try {
    const { approvalComment } = req.body;
    const transaction = await Transaction.findById(req.params.id).populate('employee');
    if (!transaction) return res.status(404).json({ success: false, error: 'Transaction not found' });
    if (transaction.type !== 'EXPENSE') return res.status(400).json({ success: false, error: 'Only expenses can be approved' });
    if (transaction.approvalStatus !== 'pending') return res.status(400).json({ success: false, error: 'Transaction has already been processed' });
    if (!ensureManagerCanAccessDepartment(req, transaction.department)) return res.status(403).json({ success: false, error: 'Not authorized to approve this transaction' });

    const employee = await User.findById(transaction.employee._id);
    if (!employee) return res.status(404).json({ success: false, error: 'Employee not found' });
    if (employee.pettyCashBalance < transaction.amount) {
      return res.status(400).json({ success: false, error: `Employee balance is insufficient. Current balance: Rs. ${employee.pettyCashBalance}` });
    }

    transaction.approvalStatus = 'approved';
    transaction.approvedBy = req.user._id;
    transaction.approvedAt = Date.now();
    transaction.approvalComment = approvalComment || '';
    await transaction.save();

    employee.pettyCashBalance -= transaction.amount;
    await employee.save();

    await logAudit({
      userId: req.user._id,
      action: 'APPROVE',
      resourceType: 'Transaction',
      resourceId: transaction._id,
      changes: { amount: transaction.amount, employee: employee._id, approvalComment },
      ipAddress: req.ip
    });

    const updatedTransaction = await populateTransaction(Transaction.findById(transaction._id));
    return res.status(200).json({ success: true, data: updatedTransaction });
  } catch (err) {
    console.error('Approve error:', err);
    return res.status(500).json({ success: false, error: 'Server Error' });
  }
});

router.put('/:id/reject', protect, authorize('manager', 'admin'), validateObjectId, async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason || !reason.trim()) return res.status(400).json({ success: false, error: 'Rejection reason is required' });

    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) return res.status(404).json({ success: false, error: 'Transaction not found' });
    if (transaction.type !== 'EXPENSE') return res.status(400).json({ success: false, error: 'Only expenses can be rejected' });
    if (transaction.approvalStatus !== 'pending') return res.status(400).json({ success: false, error: 'Transaction has already been processed' });
    if (!ensureManagerCanAccessDepartment(req, transaction.department)) return res.status(403).json({ success: false, error: 'Not authorized to reject this transaction' });

    transaction.approvalStatus = 'rejected';
    transaction.approvedBy = req.user._id;
    transaction.approvedAt = Date.now();
    transaction.rejectionReason = reason.trim();
    await transaction.save();

    await logAudit({
      userId: req.user._id,
      action: 'REJECT',
      resourceType: 'Transaction',
      resourceId: transaction._id,
      changes: { reason: reason.trim() },
      ipAddress: req.ip
    });

    const updatedTransaction = await populateTransaction(Transaction.findById(transaction._id));
    return res.status(200).json({ success: true, data: updatedTransaction });
  } catch (err) {
    console.error('Reject error:', err);
    return res.status(500).json({ success: false, error: 'Server Error' });
  }
});

router.delete('/:id', protect, validateObjectId, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) return res.status(404).json({ success: false, error: 'Transaction not found' });

    const isOwner = transaction.createdBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) return res.status(403).json({ success: false, error: 'Not authorized to delete this transaction' });
    if (transaction.approvalStatus === 'approved' && !isAdmin) return res.status(400).json({ success: false, error: 'Cannot delete an approved transaction' });

    if (transaction.type === 'ALLOCATION' && transaction.approvalStatus === 'approved') {
      const employee = await User.findById(transaction.employee);
      if (employee) {
        employee.pettyCashBalance = Math.max(0, employee.pettyCashBalance - transaction.amount);
        await employee.save();
      }
    }

    await logAudit({
      userId: req.user._id,
      action: 'DELETE',
      resourceType: 'Transaction',
      resourceId: transaction._id,
      changes: { referenceNumber: transaction.referenceNumber, amount: transaction.amount, type: transaction.type },
      ipAddress: req.ip
    });

    await transaction.deleteOne();
    return res.status(200).json({ success: true, message: 'Transaction deleted successfully', data: {} });
  } catch (err) {
    console.error('Delete transaction error:', err);
    return res.status(500).json({ success: false, error: 'Server Error' });
  }
});

module.exports = router;
