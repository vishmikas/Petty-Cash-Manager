import React, { useState, useEffect } from 'react';
import { PlusCircle, Edit3, X, Wallet } from 'lucide-react';
import { EXPENSE_CATEGORIES, VALIDATION_RULES } from '../utils/constants';
import { formatCurrency, getTodayString, isFutureDate } from '../utils/helpers';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label, Select, Textarea } from './ui';

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
    notes: '',
    receiptUrl: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (editingTransaction) {
      setFormData({
        description: editingTransaction.description,
        amount: editingTransaction.amount,
        category: editingTransaction.category,
        date: new Date(editingTransaction.date).toISOString().split('T')[0],
        notes: editingTransaction.notes || '',
        receiptUrl: editingTransaction.receiptUrl || ''
      });
    }
  }, [editingTransaction]);

  const validate = () => {
    const newErrors = {};
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    else if (formData.description.length > VALIDATION_RULES.DESCRIPTION.MAX) newErrors.description = `Description cannot exceed ${VALIDATION_RULES.DESCRIPTION.MAX} characters`;

    if (!formData.amount || formData.amount <= 0) newErrors.amount = 'Amount must be greater than 0';
    else if (Number(formData.amount) > currentBalance) newErrors.amount = `Insufficient balance. Available: ${formatCurrency(currentBalance)}`;

    if (!formData.date) newErrors.date = 'Date is required';
    else if (isFutureDate(formData.date)) newErrors.date = 'Date cannot be in the future';

    if (formData.notes && formData.notes.length > VALIDATION_RULES.NOTES.MAX) newErrors.notes = `Notes cannot exceed ${VALIDATION_RULES.NOTES.MAX} characters`;
    if (Number(formData.amount) > 5000 && !formData.receiptUrl.trim()) newErrors.receiptUrl = 'Receipt link is required for expenses above Rs. 5,000';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = () => {
    setFormData({ description: '', amount: '', category: 'Office Supplies', date: getTodayString(), notes: '', receiptUrl: '' });
    setErrors({});
    setEditingTransaction(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate() || isSubmitting) return;
    const expenseData = {
      ...formData,
      amount: Number(formData.amount),
      resubmit: editingTransaction?.approvalStatus === 'rejected'
    };
    const success = editingTransaction ? await onUpdate(editingTransaction._id, expenseData) : await onAdd(expenseData);
    if (success) resetForm();
  };

  const remainingBalance = currentBalance - (Number(formData.amount) || 0);

  return (
    <Card className="mb-8 bg-white/90 shadow-sm">
      <form onSubmit={handleSubmit}>
        <CardHeader className="flex-row items-center justify-between space-y-0 border-b border-border p-5">
          <CardTitle className="flex items-center gap-2 text-base">
            {editingTransaction ? <Edit3 className="h-4 w-4 text-primary" /> : <PlusCircle className="h-4 w-4 text-primary" />}
            {editingTransaction ? 'Edit Expense' : 'Create Expense Claim'}
          </CardTitle>
          {editingTransaction && (
            <Button type="button" variant="ghost" size="icon" onClick={resetForm} disabled={isSubmitting}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </CardHeader>
        <CardContent className="p-5">
          <div className="mb-5 grid gap-4 rounded-xl border bg-muted/40 p-4 md:grid-cols-2">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-blue-50 p-2.5 text-blue-700 ring-1 ring-blue-600/20"><Wallet className="h-5 w-5" /></div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Available Petty Cash</p>
                <p className="text-2xl font-semibold tracking-tight">{formatCurrency(currentBalance)}</p>
              </div>
            </div>
            {formData.amount > 0 && (
              <div className="md:text-right">
                <p className="text-sm font-medium text-muted-foreground">After this expense</p>
                <p className={`text-2xl font-semibold tracking-tight ${remainingBalance < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {formatCurrency(remainingBalance)}
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <Label className="mb-2 block">Description <span className="text-rose-500">*</span></Label>
              <Input
                type="text"
                placeholder="e.g., Taxi fare for client meeting"
                maxLength={VALIDATION_RULES.DESCRIPTION.MAX}
                className={errors.description ? 'border-rose-500' : ''}
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                disabled={isSubmitting}
              />
              <div className="mt-1 flex justify-between text-xs">
                <span className="text-rose-500">{errors.description}</span>
                <span className="text-muted-foreground">{formData.description.length}/{VALIDATION_RULES.DESCRIPTION.MAX}</span>
              </div>
            </div>

            <div>
              <Label className="mb-2 block">Category</Label>
              <Select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} disabled={isSubmitting}>
                {EXPENSE_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </Select>
            </div>

            <div>
              <Label className="mb-2 block">Amount (LKR) <span className="text-rose-500">*</span></Label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                className={errors.amount ? 'border-rose-500' : ''}
                value={formData.amount}
                onChange={e => setFormData({ ...formData, amount: e.target.value })}
                disabled={isSubmitting}
              />
              {errors.amount && <p className="mt-1 text-xs text-rose-500">{errors.amount}</p>}
            </div>

            <div className="md:col-span-2">
              <Label className="mb-2 block">Receipt Link <span className="text-muted-foreground">(Required above Rs. 5,000)</span></Label>
              <Input
                type="url"
                placeholder="https://example.com/receipt.jpg or PDF link"
                className={errors.receiptUrl ? 'border-rose-500' : ''}
                value={formData.receiptUrl}
                onChange={e => setFormData({ ...formData, receiptUrl: e.target.value })}
                disabled={isSubmitting}
              />
              {errors.receiptUrl && <p className="mt-1 text-xs text-rose-500">{errors.receiptUrl}</p>}
            </div>

            <div className="md:col-span-2">
              <Label className="mb-2 block">Date <span className="text-rose-500">*</span></Label>
              <Input
                type="date"
                max={getTodayString()}
                className={errors.date ? 'border-rose-500' : ''}
                value={formData.date}
                onChange={e => setFormData({ ...formData, date: e.target.value })}
                disabled={isSubmitting}
              />
              {errors.date && <p className="mt-1 text-xs text-rose-500">{errors.date}</p>}
            </div>
          </div>

          <div className="mt-4">
            <Label className="mb-2 block">Notes <span className="text-muted-foreground">(Optional)</span></Label>
            <Textarea
              placeholder="Additional details about this expense..."
              maxLength={VALIDATION_RULES.NOTES.MAX}
              className={errors.notes ? 'border-rose-500' : ''}
              rows="3"
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              disabled={isSubmitting}
            />
            <div className="mt-1 flex justify-between text-xs">
              <span className="text-rose-500">{errors.notes}</span>
              <span className="text-muted-foreground">{formData.notes.length}/{VALIDATION_RULES.NOTES.MAX}</span>
            </div>
          </div>

          <div className="mt-5 flex gap-2">
            <Button type="submit" disabled={isSubmitting || Number(formData.amount) > currentBalance} className="flex-1 gap-2">
              {isSubmitting ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : editingTransaction ? <Edit3 className="h-4 w-4" /> : <PlusCircle className="h-4 w-4" />}
              {isSubmitting ? (editingTransaction ? 'Updating...' : 'Adding...') : (editingTransaction ? 'Update Expense' : 'Submit Expense')}
            </Button>
            {editingTransaction && <Button type="button" variant="outline" onClick={resetForm} disabled={isSubmitting}>Cancel</Button>}
          </div>
        </CardContent>
      </form>
    </Card>
  );
}
