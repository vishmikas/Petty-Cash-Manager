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

module.exports = router;