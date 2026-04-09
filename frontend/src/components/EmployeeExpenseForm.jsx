import React, { useState, useEffect } from 'react';
import { PlusCircle, Edit3, X } from 'lucide-react';
import { EXPENSE_CATEGORIES, VALIDATION_RULES } from '../utils/constants';
import { formatCurrency, getTodayString, isFutureDate } from '../utils/helpers';


export default function EmployeeExpenseForm({
  onAdd,
  onUpdate,
  editingTransaction,
  setEditingTransaction,
  isSubmitting,
  currentBalance
}) {
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: 'Office Supplies',
    date: getTodayString(),
    notes: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (editingTransaction) {
      setFormData({
        description: editingTransaction.description,
        amount: editingTransaction.amount,
        category: editingTransaction.category,
        date: new Date(editingTransaction.date)
          .toISOString().split('T')[0],
        notes: editingTransaction.notes || ''
      });
    }
  }, [editingTransaction]);

  const validate = () => {
    const newErrors = {};

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (
      formData.description.length >
      VALIDATION_RULES.DESCRIPTION.MAX
    ) {
      newErrors.description =
        `Description cannot exceed ${VALIDATION_RULES.DESCRIPTION.MAX} characters`;
    }

    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    } else if (Number(formData.amount) > currentBalance) {
      newErrors.amount =
        `Insufficient balance. Available: ${formatCurrency(currentBalance)}`;
    }

    if (!formData.date) {
      newErrors.date = 'Date is required';
    } else if (isFutureDate(formData.date)) {
      newErrors.date = 'Date cannot be in the future';
    }

    if (
      formData.notes &&
      formData.notes.length > VALIDATION_RULES.NOTES.MAX
    ) {
      newErrors.notes =
        `Notes cannot exceed ${VALIDATION_RULES.NOTES.MAX} characters`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate() || isSubmitting) return;

    const expenseData = {
      ...formData,
      amount: Number(formData.amount)
    };

    let success = false;

    if (editingTransaction) {
      success = await onUpdate(editingTransaction._id, expenseData);
    } else {
      success = await onAdd(expenseData);
    }

    if (success) resetForm();
  };

  const resetForm = () => {
    setFormData({
      description: '',
      amount: '',
      category: 'Office Supplies',
      date: getTodayString(),
      notes: ''
    });
    setErrors({});
    setEditingTransaction(null);
  };

  // How much will be left after this expense
  const remainingBalance = currentBalance - (Number(formData.amount) || 0);

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-6 rounded-xl shadow-lg
        border border-slate-200 mb-8"
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-slate-800
          flex items-center gap-2">
          {editingTransaction ? (
            <>
              <Edit3 size={20} className="text-blue-600" />
              Edit Expense
            </>
          ) : (
            <>
              <PlusCircle size={20} className="text-red-600" />
              Add Expense
            </>
          )}
        </h3>
        {editingTransaction && (
          <button
            type="button"
            onClick={resetForm}
            className="text-slate-400 hover:text-slate-600
              transition-colors"
            disabled={isSubmitting}
          >
            <X size={20} />
          </button>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200
        rounded-lg p-4 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-blue-700 font-medium">
              Available Petty Cash
            </p>
            <p className="text-2xl font-bold text-blue-900">
              {formatCurrency(currentBalance)}
            </p>
          </div>
          {formData.amount > 0 && (
            <div className="text-right">
              <p className="text-sm text-slate-600">
                After this expense
              </p>
              <p className={`text-xl font-bold ${
                remainingBalance < 0
                  ? 'text-red-600'
                  : 'text-green-600'
              }`}>
                {formatCurrency(remainingBalance)}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        <div className="md:col-span-2">
          <label className="block text-sm font-medium
            text-slate-700 mb-1">
            Description <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="e.g., Taxi fare for client meeting"
            maxLength={VALIDATION_RULES.DESCRIPTION.MAX}
            className={`w-full p-2.5 border rounded-lg
              focus:ring-2 focus:ring-red-500
              focus:border-transparent transition-all ${
              errors.description
                ? 'border-red-500'
                : 'border-slate-300'
            }`}
            value={formData.description}
            onChange={e => setFormData({
              ...formData,
              description: e.target.value
            })}
            disabled={isSubmitting}
          />
          {errors.description && (
            <p className="text-red-500 text-xs mt-1">
              {errors.description}
            </p>
          )}
          <p className="text-xs text-slate-400 mt-1">
            {formData.description.length}/
            {VALIDATION_RULES.DESCRIPTION.MAX}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium
            text-slate-700 mb-1">
            Category
          </label>
          <select
            className="w-full p-2.5 border border-slate-300
              rounded-lg focus:ring-2 focus:ring-red-500
              focus:border-transparent transition-all"
            value={formData.category}
            onChange={e => setFormData({
              ...formData,
              category: e.target.value
            })}
            disabled={isSubmitting}
          >
            {EXPENSE_CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium
            text-slate-700 mb-1">
            Amount (LKR) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0.00"
            className={`w-full p-2.5 border rounded-lg
              focus:ring-2 focus:ring-red-500
              focus:border-transparent transition-all ${
              errors.amount
                ? 'border-red-500'
                : 'border-slate-300'
            }`}
            value={formData.amount}
            onChange={e => setFormData({
              ...formData,
              amount: e.target.value
            })}
            disabled={isSubmitting}
          />
          {errors.amount && (
            <p className="text-red-500 text-xs mt-1">
              {errors.amount}
            </p>
          )}
        </div>

        {/* Date */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium
            text-slate-700 mb-1">
            Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            max={getTodayString()}
            className={`w-full p-2.5 border rounded-lg
              focus:ring-2 focus:ring-red-500
              focus:border-transparent transition-all ${
              errors.date
                ? 'border-red-500'
                : 'border-slate-300'
            }`}
            value={formData.date}
            onChange={e => setFormData({
              ...formData,
              date: e.target.value
            })}
            disabled={isSubmitting}
          />
          {errors.date && (
            <p className="text-red-500 text-xs mt-1">
              {errors.date}
            </p>
          )}
        </div>
      </div>

      <div className="mt-4">
        <label className="block text-sm font-medium
          text-slate-700 mb-1">
          Notes (Optional)
        </label>
        <textarea
          placeholder="Additional details about this expense..."
          maxLength={VALIDATION_RULES.NOTES.MAX}
          className={`w-full p-2.5 border rounded-lg
            focus:ring-2 focus:ring-red-500
            focus:border-transparent transition-all
            resize-none ${
            errors.notes
              ? 'border-red-500'
              : 'border-slate-300'
          }`}
          rows="2"
          value={formData.notes}
          onChange={e => setFormData({
            ...formData,
            notes: e.target.value
          })}
          disabled={isSubmitting}
        />
        {errors.notes && (
          <p className="text-red-500 text-xs mt-1">
            {errors.notes}
          </p>
        )}
        <p className="text-xs text-slate-400 mt-1">
          {formData.notes.length}/{VALIDATION_RULES.NOTES.MAX}
        </p>
      </div>

      <div className="flex gap-2 mt-4">
        <button
          type="submit"
          disabled={
            isSubmitting ||
            Number(formData.amount) > currentBalance
          }
          className="flex-1 bg-red-600 hover:bg-red-700
            text-white p-2.5 rounded-lg flex items-center
            justify-center gap-2 font-medium transition-all
            active:scale-95 shadow-md
            disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full
                h-4 w-4 border-b-2 border-white" />
              {editingTransaction ? 'Updating...' : 'Adding...'}
            </>
          ) : editingTransaction ? (
            <>
              <Edit3 size={18} />
              Update Expense
            </>
          ) : (
            <>
              <PlusCircle size={18} />
              Add Expense
            </>
          )}
        </button>

        {editingTransaction && (
          <button
            type="button"
            onClick={resetForm}
            disabled={isSubmitting}
            className="px-6 bg-slate-200 hover:bg-slate-300
              text-slate-700 p-2.5 rounded-lg font-medium
              transition-all disabled:opacity-50"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}