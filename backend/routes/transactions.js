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


router.post('/expense', protect, async (req, res) => {
  try {
    const { description, amount, category, date, notes } = req.body;

    if (!description || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Please provide description and amount'
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Amount must be greater than 0'
      });
    }

    if (req.user.pettyCashBalance < amount) {
      return res.status(400).json({
        success: false,
        error: `Insufficient balance. Available: Rs. ${req.user.pettyCashBalance}`
      });
    }

    if (!req.user.department) {
      return res.status(400).json({
        success: false,
        error: 'You must be assigned to a department'
      });
    }

    if (date && new Date(date) > new Date()) {
      return res.status(400).json({
        success: false,
        error: 'Date cannot be in the future'
      });
    }

    const expense = await Transaction.create({
      description,
      amount: Number(amount),
      category: category || 'General',
      type: 'EXPENSE',
      date: date || Date.now(),
      notes,
      createdBy: req.user._id,
      employee: req.user._id,
      department: req.user.department._id || req.user.department,
      approvalStatus: 'pending'
    });

    const populatedExpense = await Transaction.findById(expense._id)
      .populate('createdBy', 'name email')
      .populate('employee', 'name email pettyCashBalance')
      .populate('department', 'name');

    return res.status(201).json({
      success: true,
      data: populatedExpense
    });
  } catch (err) {
    console.error('Create expense error:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Server Error'
    });
  }
});

// ─────────────────────────────────────────────
// GENERAL ROUTES
// ─────────────────────────────────────────────


router.get('/', protect, async (req, res) => {
  try {
    const {
      startDate, endDate, type,
      category, search, approvalStatus,
      department, employee
    } = req.query;

    let query = {};

    if (req.user.role === 'employee') {
      query.employee = req.user._id;
    }
    else if (req.user.role === 'manager') {
      if (req.user.department) {
        query.department = req.user.department._id || req.user.department;
      }
    }

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
    if (search) query.description = { $regex: search, $options: 'i' };
    if (approvalStatus) query.approvalStatus = approvalStatus;

    if (department && ['admin', 'accountant'].includes(req.user.role)) {
      query.department = department;
    }

    if (employee && ['admin', 'accountant', 'manager']
      .includes(req.user.role)) {
      query.employee = employee;
    }

    const transactions = await Transaction.find(query)
      .sort({ date: -1 })
      .populate('createdBy', 'name email')
      .populate('employee', 'name email pettyCashBalance')
      .populate('department', 'name')
      .populate('approvedBy', 'name email');

    return res.status(200).json({
      success: true,
      count: transactions.length,
      data: transactions
    });
  } catch (err) {
    console.error('Get transactions error:', err);
    return res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
});

module.exports = router;