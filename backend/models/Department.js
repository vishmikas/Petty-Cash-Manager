const mongoose = require('mongoose');

const DepartmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,  // creates the index — schema.index({ name: 1 }) below is redundant
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  manager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    unique: true,  // creates the index — schema.index({ manager: 1 }) below is redundant
    sparse: true
  },
  monthlyBudget: {
    type: Number,
    default: 0,
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for name and manager are already created by `unique: true` in the
// field definitions above. No schema.index() calls needed here.

module.exports = mongoose.model('Department', DepartmentSchema);
