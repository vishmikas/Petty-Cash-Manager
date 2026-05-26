import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  getUsers,
  getTransactions,
  allocatePettyCash,
  getAnalytics,
  getDepartments
} from '../services/api';
import Navbar from '../components/Navbar';
import DashboardStats from '../components/DashboardStats';
import TransactionTable from '../components/TransactionTable';
import FilterPanel from '../components/FilterPanel';
import Toast from '../components/Toast';
import {
  Wallet,
  Users as UsersIcon,
  TrendingDown,
  DollarSign,
  Plus,
  Filter,
  Download,
  X
} from 'lucide-react';
import { formatCurrency } from '../utils/helpers';
import { exportToExcel } from '../utils/excelExport';

export default function AdminDashboard() {
  const { user } = useAuth();

  // UI STYLE SYSTEM
  const cardClass =
    'rounded-2xl border border-slate-200 bg-white shadow-sm';

  const primaryButton =
    'inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50';

  const secondaryButton =
    'inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50';

  const inputClass =
    'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100';

  const tableHeadClass =
    'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500';

  const tableCellClass =
    'px-4 py-3 align-middle text-sm text-slate-700';

  // STATE
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [showAllocationModal, setShowAllocationModal] = useState(false);

  const [toast, setToast] = useState({
    show: false,
    message: '',
    type: 'success'
  });

  const [allocationData, setAllocationData] = useState({
    employee: '',
    amount: '',
    notes: ''
  });

  const [isAllocating, setIsAllocating] = useState(false);

  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    type: '',
    category: '',
    search: '',
    approvalStatus: '',
    department: '',
    employee: ''
  });

  // LOAD DATA
  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      const [usersRes, deptRes, transRes, analyticsRes] =
        await Promise.all([
          getUsers(),
          getDepartments(),
          getTransactions(),
          getAnalytics()
        ]);

      setEmployees(
        usersRes.data.data.filter((u) =>
          ['employee', 'manager'].includes(u.role)
        )
      );

      setDepartments(deptRes.data.data);
      setTransactions(transRes.data.data);
      setFilteredTransactions(transRes.data.data);
      setAnalytics(analyticsRes.data.data);
    } catch (error) {
      console.error('Load data error:', error);
      showToast('Failed to load data', 'error');
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
      filtered = filtered.filter((t) => new Date(t.date) >= start);
    }

    if (filters.endDate) {
      const end = new Date(filters.endDate);
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter((t) => new Date(t.date) <= end);
    }

    if (filters.type) {
      filtered = filtered.filter((t) => t.type === filters.type);
    }

    if (filters.category) {
      filtered = filtered.filter((t) => t.category === filters.category);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();

      filtered = filtered.filter((t) => {
        const description = t.description || '';
        const notes = t.notes || '';

        return (
          description.toLowerCase().includes(searchLower) ||
          notes.toLowerCase().includes(searchLower)
        );
      });
    }

    if (filters.approvalStatus) {
      filtered = filtered.filter(
        (t) => t.approvalStatus === filters.approvalStatus
      );
    }

    if (filters.department) {
      filtered = filtered.filter(
        (t) => t.department?._id === filters.department
      );
    }

    if (filters.employee) {
      filtered = filtered.filter(
        (t) => t.employee?._id === filters.employee
      );
    }

    setFilteredTransactions(filtered);
  }, [transactions, filters]);

  // HELPERS
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  const clearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      type: '',
      category: '',
      search: '',
      approvalStatus: '',
      department: '',
      employee: ''
    });

    showToast('Filters cleared', 'info');
  };

  const hasActiveFilters = Object.values(filters).some((v) => v !== '');

  const resetAllocationForm = () => {
    setAllocationData({
      employee: '',
      amount: '',
      notes: ''
    });
  };

  const closeAllocationModal = () => {
    setShowAllocationModal(false);
    resetAllocationForm();
  };

  const getBalanceStatus = (balance) => {
    if (balance > 5000) {
      return {
        label: 'Healthy',
        badgeClass: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
        amountClass: 'text-emerald-600'
      };
    }

    if (balance > 1000) {
      return {
        label: 'Low',
        badgeClass: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
        amountClass: 'text-amber-600'
      };
    }

    return {
      label: 'Critical',
      badgeClass: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
      amountClass: 'text-rose-600'
    };
  };

  // ALLOCATE PETTY CASH
  const handleAllocate = async () => {
    if (!allocationData.employee || !allocationData.amount) {
      showToast('Please select employee and enter amount', 'error');
      return;
    }

    if (Number(allocationData.amount) <= 0) {
      showToast('Amount must be greater than 0', 'error');
      return;
    }

    try {
      setIsAllocating(true);

      await allocatePettyCash({
        employee: allocationData.employee,
        amount: Number(allocationData.amount),
        notes: allocationData.notes
      });

      showToast('Petty cash allocated successfully!', 'success');
      closeAllocationModal();
      loadData();
    } catch (error) {
      console.error('Allocation error:', error);

      showToast(
        error.response?.data?.error || 'Failed to allocate petty cash',
        'error'
      );
    } finally {
      setIsAllocating(false);
    }
  };

  // DELETE TRANSACTION
  const handleDelete = async (id) => {
    if (
      !window.confirm('Are you sure you want to delete this transaction?')
    ) {
      return;
    }

    try {
      const { deleteTransaction } = await import('../services/api');

      await deleteTransaction(id);

      setTransactions((prev) => prev.filter((t) => t._id !== id));
      showToast('Transaction deleted successfully!', 'success');
    } catch (error) {
      showToast(
        error.response?.data?.error || 'Failed to delete transaction',
        'error'
      );
    }
  };

  // EXPORT
  const handleExport = async () => {
    try {
      if (filteredTransactions.length === 0) {
        showToast('No transactions to export', 'error');
        return;
      }

      const fileName = await exportToExcel(filteredTransactions);
      showToast(`Exported to ${fileName}`, 'success');
    } catch (error) {
      showToast('Failed to export data', 'error');
    }
  };

  // RENDER
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />

      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="mb-8 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="mb-1 text-sm font-medium text-blue-600">
              Petty Cash Management
            </p>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Admin Dashboard
            </h1>

            <p className="mt-1 max-w-2xl text-sm text-slate-500">
              Manage petty cash allocations, monitor employee balances, and
              review all transaction activity from one place.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowAllocationModal(true)}
              className={primaryButton}
            >
              <Plus size={18} />
              Allocate Cash
            </button>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={
                showFilters
                  ? 'inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-slate-800'
                  : secondaryButton
              }
            >
              <Filter size={18} />
              Filters

              {hasActiveFilters && (
                <span className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                  !
                </span>
              )}
            </button>

            <button
              onClick={handleExport}
              disabled={filteredTransactions.length === 0}
              className={secondaryButton}
            >
              <Download size={18} />
              Export
            </button>
          </div>
        </header>

        {loading ? (
          <div className={`${cardClass} flex min-h-[420px] items-center justify-center`}>
            <div className="text-center">
              <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

              <p className="mt-4 text-sm font-medium text-slate-600">
                Loading dashboard...
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Fetching users, departments, analytics, and transactions
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Analytics Stats */}
            <section className="mb-8">
              <DashboardStats analytics={analytics} />
            </section>

            {/* Employee Balances Table */}
            <section className={`${cardClass} mb-8 overflow-hidden`}>
              <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div>
                  <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <UsersIcon size={19} />
                    </span>
                    Employee Petty Cash Balances
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Review available balance and allocate additional cash when
                    needed.
                  </p>
                </div>

                <span className="inline-flex w-fit items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  {employees.length} employees
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px]">
                  <thead className="border-b border-slate-200 bg-slate-50/80">
                    <tr>
                      <th className={tableHeadClass}>Employee</th>
                      <th className={tableHeadClass}>Department</th>
                      <th className={tableHeadClass}>Role</th>
                      <th className={`${tableHeadClass} text-right`}>
                        Current Balance
                      </th>
                      <th className={`${tableHeadClass} text-right`}>
                        Status
                      </th>
                      <th className={`${tableHeadClass} text-right`}>
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 bg-white">
                    {employees.length > 0 ? (
                      employees.map((emp) => {
                        const balance = emp.pettyCashBalance || 0;
                        const status = getBalanceStatus(balance);

                        return (
                          <tr
                            key={emp._id}
                            className="transition-colors hover:bg-slate-50/80"
                          >
                            <td className={tableCellClass}>
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold uppercase text-slate-600">
                                  {emp.name?.charAt(0) || 'U'}
                                </div>

                                <div className="min-w-0">
                                  <div className="truncate font-semibold text-slate-900">
                                    {emp.name}
                                  </div>

                                  <div className="truncate text-xs text-slate-500">
                                    {emp.email}
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td className={tableCellClass}>
                              {emp.department?.name || (
                                <span className="text-slate-400">N/A</span>
                              )}
                            </td>

                            <td className={tableCellClass}>
                              <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold capitalize text-blue-700 ring-1 ring-blue-200">
                                {emp.role}
                              </span>
                            </td>

                            <td className={`${tableCellClass} text-right`}>
                              <span className={`font-bold ${status.amountClass}`}>
                                {formatCurrency(balance)}
                              </span>
                            </td>

                            <td className={`${tableCellClass} text-right`}>
                              <span
                                className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${status.badgeClass}`}
                              >
                                {status.label}
                              </span>
                            </td>

                            <td className={`${tableCellClass} text-right`}>
                              <button
                                onClick={() => {
                                  setAllocationData({
                                    employee: emp._id,
                                    amount: '',
                                    notes: ''
                                  });

                                  setShowAllocationModal(true);
                                }}
                                className="inline-flex items-center justify-center rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition-all hover:bg-blue-100"
                              >
                                Allocate
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td
                          colSpan="6"
                          className="px-4 py-12 text-center text-sm text-slate-500"
                        >
                          No employees found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Filter Panel */}
            {showFilters && (
              <section className="mb-8">
                <FilterPanel
                  filters={filters}
                  setFilters={setFilters}
                  onClear={clearFilters}
                  hasActiveFilters={hasActiveFilters}
                  showDepartmentFilter={true}
                  showApprovalFilter={true}
                  departments={departments}
                />
              </section>
            )}

            {/* All Transactions */}
            <section>
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                      <TrendingDown size={19} />
                    </span>
                    All Transactions
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Showing {filteredTransactions.length} record
                    {filteredTransactions.length === 1 ? '' : 's'}
                    {hasActiveFilters ? ' based on selected filters.' : '.'}
                  </p>
                </div>

                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="inline-flex w-fit items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50"
                  >
                    Clear filters
                  </button>
                )}
              </div>

              <div className={`${cardClass} overflow-hidden`}>
                <TransactionTable
                  transactions={filteredTransactions}
                  onDelete={handleDelete}
                  onEdit={() => {}}
                  userRole={user?.role}
                  userId={user?._id}
                />
              </div>
            </section>
          </>
        )}
      </main>

      {/* Allocation Modal */}
      {showAllocationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            {/* Modal Header */}
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h3 className="flex items-center gap-2 text-xl font-bold text-slate-900">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <Wallet size={21} />
                  </span>
                  Allocate Petty Cash
                </h3>

                <p className="mt-2 text-sm text-slate-500">
                  Select an employee and enter the amount you want to allocate.
                </p>
              </div>

              <button
                onClick={closeAllocationModal}
                className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close allocation modal"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Employee Select */}
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Employee <span className="text-rose-500">*</span>
                </label>

                <select
                  value={allocationData.employee}
                  onChange={(e) =>
                    setAllocationData({
                      ...allocationData,
                      employee: e.target.value
                    })
                  }
                  className={inputClass}
                >
                  <option value="">Select employee</option>

                  {employees.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.name} — Current:{' '}
                      {formatCurrency(emp.pettyCashBalance || 0)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount */}
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Amount (LKR) <span className="text-rose-500">*</span>
                </label>

                <input
                  type="number"
                  value={allocationData.amount}
                  onChange={(e) =>
                    setAllocationData({
                      ...allocationData,
                      amount: e.target.value
                    })
                  }
                  className={inputClass}
                  placeholder="10000"
                  min="1"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Notes{' '}
                  <span className="font-normal text-slate-400">
                    Optional
                  </span>
                </label>

                <textarea
                  value={allocationData.notes}
                  onChange={(e) =>
                    setAllocationData({
                      ...allocationData,
                      notes: e.target.value
                    })
                  }
                  className={`${inputClass} resize-none`}
                  rows="3"
                  placeholder="Purpose of allocation..."
                />
              </div>

              {/* Modal Actions */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={closeAllocationModal}
                  className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  onClick={handleAllocate}
                  disabled={isAllocating}
                  className="flex-1 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span className="flex items-center justify-center gap-2">
                    {isAllocating ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                        Allocating...
                      </>
                    ) : (
                      <>
                        <DollarSign size={18} />
                        Allocate
                      </>
                    )}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() =>
            setToast((prev) => ({
              ...prev,
              show: false
            }))
          }
        />
      )}
    </div>
  );
}