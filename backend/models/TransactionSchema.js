const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
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
        enum: [
            'Office Supplies',
            'Transportation',
            'Meals',
            'Maintenance',
            'Miscellaneous',
            'General',
            'Petty Cash Allocation'
        ],
        default: 'Transportation'
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
        enum: ['PENDING', 'APPROVED', 'REJECTED'],
        default: function() {
            return this.type === 'ALLOCATION' ? 'APPROVED' : 'PENDING';
        }
    },
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    approvedAt: {
        type: Date
    },
    rejectionReason: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

TransactionSchema.index({ date: -1 });
TransactionSchema.index({ employee: 1 });
TransactionSchema.index({ department: 1 });
TransactionSchema.index({ category: 1 });
TransactionSchema.index({ type: 1 });
TransactionSchema.index({ approvalStatus: 1 });
TransactionSchema.index({ createdBy: 1 });

TransactionSchema.virtual('formattedAmount').get(function() {
    return this.amount.toLocaleString('en-LK', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
});

module.exports = mongoose.model('Transaction', TransactionSchema);