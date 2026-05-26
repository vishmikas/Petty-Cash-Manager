import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  getTransactions,
  createExpense,
  updateTransaction,
  deleteTransaction
} from '../services/api';
import Navbar from '../components/Navbar';
import EmployeeExpenseForm from '../components/EmployeeExpenseForm';
import TransactionTable from '../components/TransactionTable';
import FilterPanel from '../components/FilterPanel';
import Toast from '../components/Toast';
import {
  Download,
  Filter,
  Wallet,
  TrendingDown,
  AlertCircle
} from 'lucide-react';
import { exportToExcel } from '../utils/excelExport';
import { formatCurrency } from '../utils/helpers';

export default function EmployeeDashboard() {
  const { user } = useAuth();

  
  // STATE
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [toast, setToast] = useState({
    show: false,
    message: '',
    type: 'success'
  });

  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    category: '',
    search: '',
    approvalStatus: '',
    type: ''
  });

  

  // LOAD DATA
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getTransactions();
      setTransactions(response.data.data);
    } catch (error) {
      console.error('Load data error:', error);
      showToast(
        error.response?.data?.error || 'Failed to load data',
        'error'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);


  // APPLY FILTERS
  useEffect(() => {
    let filtered = [...transactions];

    if (filters.startDate) {
      const start = new Date(filters.startDate);
      start.setHours(0, 0, 0, 0);
      filtered = filtered.filter(
        t => new Date(t.date) >= start
      );
    }

    if (filters.endDate) {
      const end = new Date(filters.endDate);
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter(
        t => new Date(t.date) <= end
      );
    }

    if (filters.category) {
      filtered = filtered.filter(
        t => t.category === filters.category
      );
    }

    if (filters.type) {
      filtered = filtered.filter(
        t => t.type === filters.type
      );
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(t =>
        t.description.toLowerCase().includes(searchLower) ||
        (t.notes && t.notes.toLowerCase().includes(searchLower))
      );
    }

    if (filters.approvalStatus) {
      filtered = filtered.filter(
        t => t.approvalStatus === filters.approvalStatus
      );
    }

    setFilteredTransactions(filtered);
  }, [transactions, filters]);


  // TOAST HELPER
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };


  // HANDLERS

  const handleAdd = async (newExpense) => {
    if (isSubmitting) return false;

    try {
      setIsSubmitting(true);
      const response = await createExpense(newExpense);

      setTransactions(prev => [response.data.data, ...prev]);
      showToast(
        'Expense added successfully! Pending approval.',
        'success'
      );
      return true;
    } catch (error) {
      console.error('Add expense error:', error);
      showToast(
        error.response?.data?.error || 'Failed to add expense',
        'error'
      );
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (id, updatedData) => {
    if (isSubmitting) return false;

    try {
      setIsSubmitting(true);
      const response = await updateTransaction(id, updatedData);

      setTransactions(prev =>
        prev.map(t => t._id === id ? response.data.data : t)
      );
      setEditingTransaction(null);
      showToast('Expense updated successfully!', 'success');
      return true;
    } catch (error) {
      console.error('Update expense error:', error);
      showToast(
        error.response?.data?.error || 'Failed to update expense',
        'error'
      );
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(
      'Are you sure you want to delete this expense?'
    )) return;

    try {
      await deleteTransaction(id);
      setTransactions(prev => prev.filter(t => t._id !== id));
      showToast('Expense deleted successfully!', 'success');
    } catch (error) {
      console.error('Delete expense error:', error);
      showToast(
        error.response?.data?.error || 'Failed to delete expense',
        'error'
      );
    }
  };

  const handleExport = async () => {
    try {
      if (filteredTransactions.length === 0) {
        showToast('No expenses to export', 'error');
        return;
      }
      const fileName = await exportToExcel(filteredTransactions);
      showToast(`Exported to ${fileName}`, 'success');
    } catch (error) {
      console.error('Export error:', error);
      showToast('Failed to export data', 'error');
    }
  };

  const clearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      category: '',
      search: '',
      approvalStatus: '',
      type: ''
    });
    showToast('Filters cleared', 'info');
  };

  const hasActiveFilters = Object.values(filters)
    .some(v => v !== '');


  // CALCULATED STATS
  const currentBalance = user?.pettyCashBalance || 0;

  const totalSpent = filteredTransactions
    .filter(t =>
      t.type === 'EXPENSE' &&
      t.approvalStatus === 'approved'
    )
    .reduce((sum, t) => sum + t.amount, 0);

  const pendingAmount = filteredTransactions
    .filter(t =>
      t.type === 'EXPENSE' &&
      t.approvalStatus === 'pending'
    )
    .reduce((sum, t) => sum + t.amount, 0);


  // RENDER
  return (
    <div className="app-shell">
      <Navbar />

      <div className="page-container">

        {/* Header */}
        <header className="flex flex-col md:flex-row
          justify-between items-start md:items-center
          gap-4 mb-8">
          <div>
            <h1 className="page-title">
              My Expenses
            </h1>
            <p className="page-subtitle">
              Welcome back, {user?.name}
            </p>
          </div>

          <div className="flex gap-2 flex-wrap">
            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2
                rounded-lg font-medium shadow-sm transition-all ${
                showFilters
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Filter size={18} />
              Filters
              {hasActiveFilters && (
                <span className="bg-red-500 text-white
                  text-xs rounded-full w-5 h-5
                  flex items-center justify-center">
                  !
                </span>
              )}
            </button>

            {/* Export Button */}
            <button
              onClick={handleExport}
              disabled={filteredTransactions.length === 0}
              className="flex items-center gap-2
                btn-success disabled:cursor-not-allowed"
            >
              <Download size={18} />
              Export
            </button>
          </div>
        </header>

        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3
          gap-6 mb-8">

          {/* Available Balance */}
          <div className={`p-6 rounded-xl shadow-sm text-white ${
            currentBalance < 1000
              ? 'bg-gradient-to-r from-red-500 to-red-600'
              : 'bg-gradient-to-r from-blue-500 to-blue-600'
          }`}>
            <div className="flex items-center
              justify-between mb-4">
              <Wallet size={28} />
              {currentBalance < 1000 && (
                <AlertCircle
                  size={22}
                  className="animate-pulse"
                />
              )}
            </div>
            <p className="text-blue-100 text-sm mb-1">
              Available Petty Cash
            </p>
            <p className="text-3xl font-bold">
              {formatCurrency(currentBalance)}
            </p>
            {currentBalance < 1000 && (
              <p className="text-xs text-red-100 mt-2">
                Low balance — Contact admin
              </p>
            )}
          </div>

          {/* Total Spent */}
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center
              justify-between mb-4">
              <div className="p-3 bg-red-100 rounded-lg">
                <TrendingDown
                  className="text-red-600"
                  size={22}
                />
              </div>
            </div>
            <p className="text-slate-500 text-sm mb-1">
              Total Approved Expenses
            </p>
            <p className="text-2xl font-bold text-slate-800">
              {formatCurrency(totalSpent)}
            </p>
          </div>

          {/* Pending Approval */}
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center
              justify-between mb-4">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <AlertCircle
                  className="text-yellow-600"
                  size={22}
                />
              </div>
            </div>
            <p className="text-slate-500 text-sm mb-1">
              Pending Approval
            </p>
            <p className="text-2xl font-bold text-slate-800">
              {formatCurrency(pendingAmount)}
            </p>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <FilterPanel
            filters={filters}
            setFilters={setFilters}
            onClear={clearFilters}
            hasActiveFilters={hasActiveFilters}
            showDepartmentFilter={false}
            showApprovalFilter={true}
          />
        )}

        {/* Loading State */}
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin
              rounded-full h-12 w-12 border-b-2
              border-blue-600" />
            <p className="text-slate-400 mt-4">
              Loading expenses...
            </p>
          </div>
        ) : (
          <>
            {/* Expense Form */}
            <EmployeeExpenseForm
              onAdd={handleAdd}
              onUpdate={handleUpdate}
              editingTransaction={editingTransaction}
              setEditingTransaction={setEditingTransaction}
              isSubmitting={isSubmitting}
              currentBalance={Math.max(currentBalance - pendingAmount, 0)}
            />

            {/* Transaction Table */}
            <TransactionTable
              transactions={filteredTransactions}
              onDelete={handleDelete}
              onEdit={setEditingTransaction}
              userRole={user?.role}
              userId={user?._id}
            />

            {/* No Results After Filter */}
            {filteredTransactions.length === 0 &&
              transactions.length > 0 && (
              <div className="text-center py-12
                bg-white rounded-xl shadow-sm mt-4">
                <p className="text-slate-400 text-lg">
                  No expenses match your filters
                </p>
                <button
                  onClick={clearFilters}
                  className="mt-4 text-blue-600
                    hover:text-blue-700 font-medium"
                >
                  Clear filters
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Toast Notification */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() =>
            setToast(prev => ({ ...prev, show: false }))
          }
        />
      )}
    </div>
  );
}