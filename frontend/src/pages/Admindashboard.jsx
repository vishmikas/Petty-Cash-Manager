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

  
  // STATE
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] =
    useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [showAllocationModal, setShowAllocationModal] =
    useState(false);
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
        usersRes.data.data.filter(u =>
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

    if (filters.type) {
      filtered = filtered.filter(
        t => t.type === filters.type
      );
    }

    if (filters.category) {
      filtered = filtered.filter(
        t => t.category === filters.category
      );
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(t =>
        t.description.toLowerCase().includes(searchLower) ||
        (t.notes &&
          t.notes.toLowerCase().includes(searchLower))
      );
    }

    if (filters.approvalStatus) {
      filtered = filtered.filter(
        t => t.approvalStatus === filters.approvalStatus
      );
    }

    if (filters.department) {
      filtered = filtered.filter(
        t => t.department?._id === filters.department
      );
    }

    if (filters.employee) {
      filtered = filtered.filter(
        t => t.employee?._id === filters.employee
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

  const hasActiveFilters = Object.values(filters)
    .some(v => v !== '');


  // ALLOCATE PETTY CASH
  const handleAllocate = async () => {
    if (!allocationData.employee || !allocationData.amount) {
      showToast(
        'Please select employee and enter amount',
        'error'
      );
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
      setShowAllocationModal(false);
      setAllocationData({ employee: '', amount: '', notes: '' });

      loadData();
    } catch (error) {
      console.error('Allocation error:', error);
      showToast(
        error.response?.data?.error ||
        'Failed to allocate petty cash',
        'error'
      );
    } finally {
      setIsAllocating(false);
    }
  };


  // DELETE TRANSACTION
  const handleDelete = async (id) => {
    if (!window.confirm(
      'Are you sure you want to delete this transaction?'
    )) return;

    try {
      const { deleteTransaction } = await import('../services/api');
      await deleteTransaction(id);
      setTransactions(prev => prev.filter(t => t._id !== id));
      showToast('Transaction deleted successfully!', 'success');
    } catch (error) {
      showToast(
        error.response?.data?.error ||
        'Failed to delete transaction',
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
    <div className="min-h-screen bg-gradient-to-br
      from-slate-50 to-slate-100">
      <Navbar />

      <div className="max-w-7xl mx-auto p-4 md:p-8">

        {/* Header */}
        <header className="flex flex-col md:flex-row
          justify-between items-start md:items-center
          gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">
              Admin Dashboard
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Manage petty cash and monitor spending
            </p>
          </div>

          <div className="flex gap-2 flex-wrap">
            {/* Allocate Button */}
            <button
              onClick={() => setShowAllocationModal(true)}
              className="flex items-center gap-2
                bg-blue-600 hover:bg-blue-700
                text-white px-4 py-2 rounded-lg
                font-medium shadow-sm transition-all"
            >
              <Plus size={18} />
              Allocate Cash
            </button>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2
                rounded-lg font-medium shadow-sm
                transition-all ${
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
                bg-emerald-600 hover:bg-emerald-700
                text-white px-4 py-2 rounded-lg
                font-medium shadow-sm transition-all
                disabled:opacity-50"
            >
              <Download size={18} />
              Export
            </button>
          </div>
        </header>

        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin
              rounded-full h-12 w-12 border-b-2
              border-blue-600" />
            <p className="text-slate-400 mt-4">
              Loading dashboard...
            </p>
          </div>
        ) : (
          <>
            {/* Analytics Stats */}
            <DashboardStats analytics={analytics} />

            {/* Employee Balances Table */}
            <div className="bg-white rounded-xl shadow-lg
              overflow-hidden mb-8">
              <div className="p-6 border-b border-slate-200
                flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-800
                  flex items-center gap-2">
                  <UsersIcon size={20} className="text-blue-600" />
                  Employee Petty Cash Balances
                </h3>
                <span className="text-sm text-slate-500">
                  {employees.length} employees
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50
                    border-b border-slate-200">
                    <tr>
                      <th className="p-4 text-left text-sm
                        font-semibold text-slate-700">
                        Employee
                      </th>
                      <th className="p-4 text-left text-sm
                        font-semibold text-slate-700">
                        Department
                      </th>
                      <th className="p-4 text-left text-sm
                        font-semibold text-slate-700">
                        Role
                      </th>
                      <th className="p-4 text-right text-sm
                        font-semibold text-slate-700">
                        Current Balance
                      </th>
                      <th className="p-4 text-right text-sm
                        font-semibold text-slate-700">
                        Status
                      </th>
                      <th className="p-4 text-right text-sm
                        font-semibold text-slate-700">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map((emp) => {
                      const balance =
                        emp.pettyCashBalance || 0;
                      const statusColor =
                        balance > 5000
                          ? 'bg-green-100 text-green-700'
                          : balance > 1000
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700';
                      const statusLabel =
                        balance > 5000
                          ? 'Healthy'
                          : balance > 1000
                          ? 'Low'
                          : 'Critical';

                      return (
                        <tr
                          key={emp._id}
                          className="border-b border-slate-100
                            hover:bg-slate-50 transition-colors"
                        >
                          <td className="p-4">
                            <div className="font-medium
                              text-slate-800">
                              {emp.name}
                            </div>
                            <div className="text-xs
                              text-slate-500">
                              {emp.email}
                            </div>
                          </td>
                          <td className="p-4 text-slate-600">
                            {emp.department?.name || 'N/A'}
                          </td>
                          <td className="p-4">
                            <span className="px-2 py-1
                              text-xs font-medium rounded-full
                              bg-blue-100 text-blue-700
                              capitalize">
                              {emp.role}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <span className={`font-bold ${
                              balance > 5000
                                ? 'text-green-600'
                                : balance > 1000
                                ? 'text-yellow-600'
                                : 'text-red-600'
                            }`}>
                              {formatCurrency(balance)}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <span className={`px-3 py-1
                              rounded-full text-xs
                              font-semibold ${statusColor}`}>
                              {statusLabel}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => {
                                setAllocationData({
                                  employee: emp._id,
                                  amount: '',
                                  notes: ''
                                });
                                setShowAllocationModal(true);
                              }}
                              className="text-xs
                                bg-blue-50 hover:bg-blue-100
                                text-blue-600 px-3 py-1.5
                                rounded-lg font-medium
                                transition-all"
                            >
                              Allocate
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Filter Panel */}
            {showFilters && (
              <FilterPanel
                filters={filters}
                setFilters={setFilters}
                onClear={clearFilters}
                hasActiveFilters={hasActiveFilters}
                showDepartmentFilter={true}
                showApprovalFilter={true}
                departments={departments}
              />
            )}

            {/* All Transactions Table */}
            <div className="mb-4">
              <h3 className="text-lg font-bold text-slate-800
                mb-4 flex items-center gap-2">
                <TrendingDown
                  size={20}
                  className="text-rose-600"
                />
                All Transactions
                <span className="text-sm font-normal
                  text-slate-500 ml-2">
                  ({filteredTransactions.length} records)
                </span>
              </h3>
            </div>

            <TransactionTable
              transactions={filteredTransactions}
              onDelete={handleDelete}
              onEdit={() => {}}
              userRole={user?.role}
              userId={user?._id}
            />
          </>
        )}
      </div>

      {/* Allocation Modal */}
      {showAllocationModal && (
        <div className="fixed inset-0 bg-black
          bg-opacity-50 flex items-center justify-center
          p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl
            max-w-md w-full p-6">

            {/* Modal Header */}
            <div className="flex items-center
              justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-800
                flex items-center gap-2">
                <Wallet
                  size={22}
                  className="text-blue-600"
                />
                Allocate Petty Cash
              </h3>
              <button
                onClick={() => {
                  setShowAllocationModal(false);
                  setAllocationData({
                    employee: '',
                    amount: '',
                    notes: ''
                  });
                }}
                className="text-slate-400
                  hover:text-slate-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">

              {/* Employee Select */}
              <div>
                <label className="block text-sm font-medium
                  text-slate-700 mb-1">
                  Employee <span className="text-red-500">*</span>
                </label>
                <select
                  value={allocationData.employee}
                  onChange={(e) => setAllocationData({
                    ...allocationData,
                    employee: e.target.value
                  })}
                  className="w-full p-3 border border-slate-300
                    rounded-lg focus:ring-2 focus:ring-blue-500
                    focus:border-transparent"
                >
                  <option value="">Select Employee</option>
                  {employees.map(emp => (
                    <option key={emp._id} value={emp._id}>
                      {emp.name} — Current:{' '}
                      {formatCurrency(emp.pettyCashBalance || 0)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium
                  text-slate-700 mb-1">
                  Amount (LKR){' '}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={allocationData.amount}
                  onChange={(e) => setAllocationData({
                    ...allocationData,
                    amount: e.target.value
                  })}
                  className="w-full p-3 border border-slate-300
                    rounded-lg focus:ring-2 focus:ring-blue-500
                    focus:border-transparent"
                  placeholder="10000"
                  min="1"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium
                  text-slate-700 mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  value={allocationData.notes}
                  onChange={(e) => setAllocationData({
                    ...allocationData,
                    notes: e.target.value
                  })}
                  className="w-full p-3 border border-slate-300
                    rounded-lg focus:ring-2 focus:ring-blue-500
                    focus:border-transparent resize-none"
                  rows="3"
                  placeholder="Purpose of allocation..."
                />
              </div>

              {/* Modal Actions */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => {
                    setShowAllocationModal(false);
                    setAllocationData({
                      employee: '',
                      amount: '',
                      notes: ''
                    });
                  }}
                  className="flex-1 bg-slate-200
                    hover:bg-slate-300 text-slate-700
                    px-4 py-3 rounded-lg font-medium
                    transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAllocate}
                  disabled={isAllocating}
                  className="flex-1 bg-blue-600
                    hover:bg-blue-700 text-white
                    px-4 py-3 rounded-lg font-medium
                    transition-all disabled:opacity-50
                    flex items-center justify-center gap-2"
                >
                  {isAllocating ? (
                    <>
                      <div className="animate-spin
                        rounded-full h-4 w-4
                        border-b-2 border-white" />
                      Allocating...
                    </>
                  ) : (
                    <>
                      <DollarSign size={18} />
                      Allocate
                    </>
                  )}
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
            setToast(prev => ({ ...prev, show: false }))
          }
        />
      )}
    </div>
  );
}