const mongoose = require('mongoose');
const { EXPENSE_CATEGORIES } = require('../utils/constants');

const TransactionSchema = new mongoose.Schema({
  referenceNumber: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
    trim: true,
    maxlength: [200, 'Description cannot be more than 200 characters']
  },
  amount: {
    type: Number,
    required: [true, 'Please add an amount'],
    min: [0.01, 'Amount must be a positive number']
  },
  category: {
    type: String,
    required: [true, 'Please add a category'],
    enum: EXPENSE_CATEGORIES,
    default: 'General'
  },
  type: {
    type: String,
    enum: ['ALLOCATION', 'EXPENSE'],
    required: [true, 'Please specify the transaction type']
  },
  date: {
    type: Date,
    default: Date.now,
    required: true
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot be more than 500 characters']
  },
  receiptUrl: {
    type: String,
    trim: true,
    maxlength: [500, 'Receipt link cannot be more than 500 characters']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true
  },
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  },
  approvalComment: {
    type: String,
    trim: true,
    maxlength: [500, 'Approval comment cannot be more than 500 characters']
  },
  rejectionReason: {
    type: String,
    trim: true,
    maxlength: [500, 'Rejection reason cannot be more than 500 characters']
  }
}, {
  timestamps: true
});

TransactionSchema.index({ referenceNumber: 1 });
TransactionSchema.index({ date: -1 });
TransactionSchema.index({ employee: 1 });
TransactionSchema.index({ department: 1 });
TransactionSchema.index({ category: 1 });
TransactionSchema.index({ type: 1 });
TransactionSchema.index({ approvalStatus: 1 });
TransactionSchema.index({ createdBy: 1 });

TransactionSchema.virtual('formattedAmount').get(function () {
  return this.amount.toLocaleString('en-LK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
});

module.exports = mongoose.model('Transaction', TransactionSchema);
