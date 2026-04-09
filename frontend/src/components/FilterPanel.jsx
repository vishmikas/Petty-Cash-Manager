import React from 'react';
import { Search, Filter as FilterIcon, X } from 'lucide-react';
import { EXPENSE_CATEGORIES } from '../utils/constants';

export default function FilterPanel({
  filters,
  setFilters,
  onClear,
  hasActiveFilters,
  departments,
  showDepartmentFilter = false,
  showApprovalFilter = false
}) {

  const handleChange = (key, value) => {
    setFilters({ ...filters, [key]: value });
  };

  const setToday = () => {
    const today = new Date().toISOString().split('T')[0];
    setFilters({ ...filters, startDate: today, endDate: today });
  };

  const setLast7Days = () => {
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    setFilters({
      ...filters,
      startDate: weekAgo.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0]
    });
  };

  const setLast30Days = () => {
    const today = new Date();
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    setFilters({
      ...filters,
      startDate: monthAgo.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0]
    });
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg 
      border border-slate-200 mb-8 animate-slideDown">

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FilterIcon className="text-blue-600" size={20} />
          <h3 className="text-lg font-bold text-slate-800">
            Filters
          </h3>
        </div>
        {hasActiveFilters && (
          <button
            onClick={onClear}
            className="flex items-center gap-1 text-sm 
              text-red-600 hover:text-red-700 
              font-medium transition-colors"
          >
            <X size={16} />
            Clear All
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 
        lg:grid-cols-4 gap-4">

        <div className="lg:col-span-2">
          <label className="block text-sm font-medium 
            text-slate-700 mb-1">
            <Search size={14} className="inline mr-1" />
            Search
          </label>
          <input
            type="text"
            placeholder="Search transactions..."
            className="w-full p-2.5 border border-slate-300 
              rounded-lg focus:ring-2 focus:ring-blue-500
              focus:border-transparent transition-all"
            value={filters.search}
            onChange={(e) => handleChange('search', e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium 
            text-slate-700 mb-1">
            Start Date
          </label>
          <input
            type="date"
            className="w-full p-2.5 border border-slate-300 
              rounded-lg focus:ring-2 focus:ring-blue-500
              focus:border-transparent transition-all"
            value={filters.startDate}
            onChange={(e) =>
              handleChange('startDate', e.target.value)
            }
          />
        </div>

        <div>
          <label className="block text-sm font-medium 
            text-slate-700 mb-1">
            End Date
          </label>
          <input
            type="date"
            className="w-full p-2.5 border border-slate-300 
              rounded-lg focus:ring-2 focus:ring-blue-500
              focus:border-transparent transition-all"
            value={filters.endDate}
            onChange={(e) =>
              handleChange('endDate', e.target.value)
            }
          />
        </div>

        <div>
          <label className="block text-sm font-medium 
            text-slate-700 mb-1">
            Type
          </label>
          <select
            className="w-full p-2.5 border border-slate-300 
              rounded-lg focus:ring-2 focus:ring-blue-500
              focus:border-transparent transition-all"
            value={filters.type}
            onChange={(e) => handleChange('type', e.target.value)}
          >
            <option value="">All Types</option>
            {/* ✅ Fixed: was INCOME now correctly ALLOCATION */}
            <option value="ALLOCATION">Allocation</option>
            <option value="EXPENSE">Expense</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium 
            text-slate-700 mb-1">
            Category
          </label>
          <select
            className="w-full p-2.5 border border-slate-300 
              rounded-lg focus:ring-2 focus:ring-blue-500
              focus:border-transparent transition-all"
            value={filters.category}
            onChange={(e) =>
              handleChange('category', e.target.value)
            }
          >
            <option value="">All Categories</option>
            {EXPENSE_CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {showApprovalFilter && (
          <div>
            <label className="block text-sm font-medium 
              text-slate-700 mb-1">
              Status
            </label>
            <select
              className="w-full p-2.5 border border-slate-300 
                rounded-lg focus:ring-2 focus:ring-blue-500
                focus:border-transparent transition-all"
              value={filters.approvalStatus}
              onChange={(e) =>
                handleChange('approvalStatus', e.target.value)
              }
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        )}

        {showDepartmentFilter && departments && (
          <div>
            <label className="block text-sm font-medium 
              text-slate-700 mb-1">
              Department
            </label>
            <select
              className="w-full p-2.5 border border-slate-300 
                rounded-lg focus:ring-2 focus:ring-blue-500
                focus:border-transparent transition-all"
              value={filters.department}
              onChange={(e) =>
                handleChange('department', e.target.value)
              }
            >
              <option value="">All Departments</option>
              {departments.map(dept => (
                <option key={dept._id} value={dept._id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="flex gap-2 mt-4">
        <button
          onClick={setToday}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 
            text-slate-700 rounded-lg text-sm font-medium 
            transition-all"
        >
          Today
        </button>
        <button
          onClick={setLast7Days}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 
            text-slate-700 rounded-lg text-sm font-medium 
            transition-all"
        >
          Last 7 Days
        </button>
        <button
          onClick={setLast30Days}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 
            text-slate-700 rounded-lg text-sm font-medium 
            transition-all"
        >
          Last 30 Days
        </button>
      </div>
    </div>
  );
}