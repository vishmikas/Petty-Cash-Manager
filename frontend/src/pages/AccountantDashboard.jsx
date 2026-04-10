import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  getTransactions,
  getAnalytics,
  getDepartments,
  getUsers
} from '../services/api';
import Navbar from '../components/Navbar';
import DashboardStats from '../components/DashboardStats';
import TransactionTable from '../components/TransactionTable';
import FilterPanel from '../components/FilterPanel';
import Toast from '../components/Toast';
import {
  Download,
  Filter,
  PieChart,
  TrendingDown,
  Users,
  Building2
} from 'lucide-react';
import { formatCurrency } from '../utils/helpers';
import { exportToExcel } from '../utils/excelExport';

export default function AccountantDashboard() {
  const { user } = useAuth();

  
  // STATE
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] =
    useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [toast, setToast] = useState({
    show: false,
    message: '',
    type: 'success'
  });

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
      const [transRes, analyticsRes, deptRes, usersRes] =
        await Promise.all([
          getTransactions(),
          getAnalytics(),
          getDepartments(),
          getUsers()
        ]);

      setTransactions(transRes.data.data);
      setFilteredTransactions(transRes.data.data);
      setAnalytics(analyticsRes.data.data);
      setDepartments(deptRes.data.data);
      setEmployees(
        usersRes.data.data.filter(u =>
          ['employee', 'manager'].includes(u.role)
        )
      );
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

    
  // EXPORT
  const handleExport = async () => {
    try {
      if (filteredTransactions.length === 0) {
        showToast('No transactions to export', 'error');
        return;
      }
      const fileName = await exportToExcel(
        filteredTransactions
      );
      showToast(`Exported to ${fileName}`, 'success');
    } catch (error) {
      showToast('Failed to export data', 'error');
    }
  };

  

  // CATEGORY BREAKDOWN
  const categoryBreakdown = filteredTransactions
    .filter(t =>
      t.type === 'EXPENSE' &&
      t.approvalStatus === 'approved'
    )
    .reduce((acc, t) => {
      const cat = t.category || 'General';
      acc[cat] = (acc[cat] || 0) + t.amount;
      return acc;
    }, {});

  const totalExpense = Object.values(categoryBreakdown)
    .reduce((sum, val) => sum + val, 0);


  // DEPARTMENT BREAKDOWN
  const departmentBreakdown = filteredTransactions
    .filter(t =>
      t.type === 'EXPENSE' &&
      t.approvalStatus === 'approved'
    )
    .reduce((acc, t) => {
      const dept = t.department?.name || 'Unknown';
      acc[dept] = (acc[dept] || 0) + t.amount;
      return acc;
    }, {});


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
            <h1 className="text-3xl font-bold
              text-slate-800">
              Accountant Dashboard
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Read-only financial overview and reporting
            </p>
          </div>

          <div className="flex gap-2 flex-wrap">

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2
                px-4 py-2 rounded-lg font-medium
                shadow-sm transition-all ${
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
                disabled:opacity-50
                disabled:cursor-not-allowed"
            >
              <Download size={18} />
              Export Report
            </button>
          </div>
        </header>

        {/* Loading */}
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin
              rounded-full h-12 w-12 border-b-2
              border-blue-600" />
            <p className="text-slate-400 mt-4">
              Loading financial data...
            </p>
          </div>
        ) : (
          <>
            {/* Analytics Summary */}
            <DashboardStats analytics={analytics} />

            {/* Breakdown Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2
              gap-6 mb-8">

              {/* Category Breakdown */}
              <div className="bg-white rounded-xl
                shadow-lg overflow-hidden">
                <div className="p-5 border-b
                  border-slate-200 flex items-center gap-2">
                  <PieChart
                    size={18}
                    className="text-purple-600"
                  />
                  <h3 className="font-bold text-slate-800">
                    Expense by Category
                  </h3>
                </div>
                <div className="p-5 space-y-3">
                  {Object.keys(categoryBreakdown).length === 0
                    ? (
                      <p className="text-slate-400 text-sm
                        text-center py-4">
                        No approved expenses yet
                      </p>
                    ) : (
                      Object.entries(categoryBreakdown)
                        .sort((a, b) => b[1] - a[1])
                        .map(([category, amount]) => {
                          const percentage = totalExpense > 0
                            ? ((amount / totalExpense) * 100)
                              .toFixed(1)
                            : 0;
                          return (
                            <div key={category}>
                              <div className="flex
                                justify-between
                                items-center mb-1">
                                <span className="text-sm
                                  text-slate-700 font-medium">
                                  {category}
                                </span>
                                <div className="flex
                                  items-center gap-3">
                                  <span className="text-xs
                                    text-slate-500">
                                    {percentage}%
                                  </span>
                                  <span className="text-sm
                                    font-bold text-slate-800">
                                    {formatCurrency(amount)}
                                  </span>
                                </div>
                              </div>
                              <div className="bg-slate-100
                                rounded-full h-2">
                                <div
                                  className="bg-purple-500
                                    h-2 rounded-full
                                    transition-all
                                    duration-500"
                                  style={{
                                    width: `${percentage}%`
                                  }}
                                />
                              </div>
                            </div>
                          );
                        })
                    )
                  }
                </div>
              </div>

              {/* Department Breakdown */}
              <div className="bg-white rounded-xl
                shadow-lg overflow-hidden">
                <div className="p-5 border-b
                  border-slate-200 flex items-center gap-2">
                  <Building2
                    size={18}
                    className="text-blue-600"
                  />
                  <h3 className="font-bold text-slate-800">
                    Expense by Department
                  </h3>
                </div>
                <div className="p-5 space-y-3">
                  {Object.keys(departmentBreakdown).length === 0
                    ? (
                      <p className="text-slate-400 text-sm
                        text-center py-4">
                        No approved expenses yet
                      </p>
                    ) : (
                      Object.entries(departmentBreakdown)
                        .sort((a, b) => b[1] - a[1])
                        .map(([dept, amount]) => {
                          const percentage = totalExpense > 0
                            ? ((amount / totalExpense) * 100)
                              .toFixed(1)
                            : 0;
                          return (
                            <div key={dept}>
                              <div className="flex
                                justify-between
                                items-center mb-1">
                                <span className="text-sm
                                  text-slate-700 font-medium">
                                  {dept}
                                </span>
                                <div className="flex
                                  items-center gap-3">
                                  <span className="text-xs
                                    text-slate-500">
                                    {percentage}%
                                  </span>
                                  <span className="text-sm
                                    font-bold text-slate-800">
                                    {formatCurrency(amount)}
                                  </span>
                                </div>
                              </div>
                              <div className="bg-slate-100
                                rounded-full h-2">
                                <div
                                  className="bg-blue-500
                                    h-2 rounded-full
                                    transition-all
                                    duration-500"
                                  style={{
                                    width: `${percentage}%`
                                  }}
                                />
                              </div>
                            </div>
                          );
                        })
                    )
                  }
                </div>
              </div>
            </div>

            {/* Employee Balance Table */}
            <div className="bg-white rounded-xl
              shadow-lg overflow-hidden mb-8">
              <div className="p-5 border-b border-slate-200
                flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users
                    size={18}
                    className="text-emerald-600"
                  />
                  <h3 className="font-bold text-slate-800">
                    Employee Balance Overview
                  </h3>
                </div>
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

            {/* Transactions Table - Read Only */}
            <div className="mb-4">
              <h3 className="text-lg font-bold
                text-slate-800 mb-4
                flex items-center gap-2">
                <TrendingDown
                  size={20}
                  className="text-rose-600"
                />
                All Transactions
                <span className="text-sm font-normal
                  text-slate-500 ml-2">
                  ({filteredTransactions.length} records)
                </span>
                <span className="text-xs font-medium
                  bg-slate-100 text-slate-600
                  px-2 py-1 rounded-full ml-1">
                  Read Only
                </span>
              </h3>
            </div>

            <TransactionTable
              transactions={filteredTransactions}
              onDelete={() => {}}
              onEdit={() => {}}
              userRole="accountant"
              userId={user?._id}
            />
          </>
        )}
      </div>

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