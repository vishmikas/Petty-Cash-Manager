const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');


const validateObjectId = (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid ID format'
    });
  }
  next();
};

// ─────────────────────────────────────────────
// STATIC ROUTES FIRST (before /:id routes)
// ─────────────────────────────────────────────

router.get('/categories/list', protect, async (req, res) => {
  try {
    const categories = [
      'Office Supplies',
      'Transportation',
      'Meals & Entertainment',
      'Utilities',
      'Maintenance',
      'Miscellaneous',
      'General'
    ];

    return res.status(200).json({
      success: true,
      data: categories
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
});

router.get('/pending', protect, authorize('manager', 'admin'),
  async (req, res) => {
    try {
      let query = {
        approvalStatus: 'pending',
        type: 'EXPENSE'
      };

      if (req.user.role === 'manager' && req.user.department) {
        query.department = req.user.department;
      }

      const transactions = await Transaction.find(query)
        .sort({ createdAt: -1 })
        .populate('createdBy', 'name email')
        .populate('employee', 'name email pettyCashBalance')
        .populate('department', 'name');

      return res.status(200).json({
        success: true,
        count: transactions.length,
        data: transactions
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: 'Server Error'
      });
    }
  }
);


router.get('/analytics', protect, async (req, res) => {
  try {
    const { startDate, endDate, employee, department } = req.query;

    let filter = {};

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
      filter.department = req.user.department;
    }

    if (employee && ['admin', 'accountant', 'manager']
      .includes(req.user.role)) {
      filter.employee = employee;
    }
    if (department && ['admin', 'accountant']
      .includes(req.user.role)) {
      filter.department = department;
    }

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
    return res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
});

// ─────────────────────────────────────────────
// ACTION ROUTES
// ─────────────────────────────────────────────

router.post('/allocate', protect, authorize('admin'), async (req, res) => {
  try {
    const { employee, amount, notes } = req.body;

    if (!employee || !amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Please provide employee and valid amount'
      });
    }

    const employeeUser = await User.findById(employee)
      .populate('department');

    if (!employeeUser) {
      return res.status(404).json({
        success: false,
        error: 'Employee not found'
      });
    }

    if (!employeeUser.department) {
      return res.status(400).json({
        success: false,
        error: 'Employee must be assigned to a department first'
      });
    }

    const allocation = await Transaction.create({
      description: `Petty Cash Allocation to ${employeeUser.name}`,
      amount: Number(amount),
      category: 'Petty Cash Allocation',
      type: 'ALLOCATION',
      date: Date.now(),
      notes: notes || '',
      createdBy: req.user._id,
      employee: employee,
      department: employeeUser.department._id,
      approvalStatus: 'approved'
    });

    employeeUser.pettyCashBalance += Number(amount);
    await employeeUser.save();

    const populatedAllocation = await Transaction.findById(allocation._id)
      .populate('createdBy', 'name email')
      .populate('employee', 'name email pettyCashBalance')
      .populate('department', 'name');

    return res.status(201).json({
      success: true,
      data: populatedAllocation
    });
  } catch (err) {
    console.error('Allocation error:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Server Error'
    });
  }
});

module.exports = router;