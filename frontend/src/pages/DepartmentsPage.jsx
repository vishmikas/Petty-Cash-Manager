import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Navbar from '../components/Navbar';
import Toast from '../components/Toast';
import {
  createDepartment,
  deleteDepartment,
  getDepartments,
  getUsers,
  updateDepartment
} from '../services/api';
import {
  Building2,
  Edit2,
  Plus,
  Search,
  Trash2,
  Users,
  X
} from 'lucide-react';
import { getInitials } from '../utils/helpers';

const initialFormData = {
  name: '',
  description: '',
  manager: '',
  monthlyBudget: '',
  isActive: true
};

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [modal, setModal] = useState({ show: false, mode: 'create', department: null });
  const [formData, setFormData] = useState(initialFormData);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [departmentsRes, usersRes] = await Promise.all([
        getDepartments(),
        getUsers()
      ]);
      setDepartments(departmentsRes.data.data || []);
      setUsers(usersRes.data.data || []);
    } catch (error) {
      console.error('Load departments error:', error);
      showToast('Failed to load departments', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const managers = useMemo(() => {
    return users.filter(user => user.role === 'manager' && user.isActive);
  }, [users]);

  const departmentUserCounts = useMemo(() => {
    return users.reduce((acc, user) => {
      const departmentId = user.department?._id || user.department;
      if (departmentId && user.isActive) {
        acc[departmentId] = (acc[departmentId] || 0) + 1;
      }
      return acc;
    }, {});
  }, [users]);

  const filteredDepartments = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return departments;

    return departments.filter(department =>
      department.name?.toLowerCase().includes(query) ||
      department.description?.toLowerCase().includes(query) ||
      department.manager?.name?.toLowerCase().includes(query)
    );
  }, [departments, search]);

  const openCreateModal = () => {
    setFormData(initialFormData);
    setFormErrors({});
    setModal({ show: true, mode: 'create', department: null });
  };

  const openEditModal = (department) => {
    setFormData({
      name: department.name || '',
      description: department.description || '',
      manager: department.manager?._id || '',
      monthlyBudget: department.monthlyBudget ?? '',
      isActive: department.isActive !== false
    });
    setFormErrors({});
    setModal({ show: true, mode: 'edit', department });
  };

  const closeModal = () => {
    setModal({ show: false, mode: 'create', department: null });
    setFormData(initialFormData);
    setFormErrors({});
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = 'Department name is required';
    }

    if (formData.monthlyBudget !== '' && Number(formData.monthlyBudget) < 0) {
      errors.monthlyBudget = 'Monthly budget cannot be negative';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm() || isSubmitting) return;

    const payload = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      manager: formData.manager || undefined,
      monthlyBudget: formData.monthlyBudget === '' ? 0 : Number(formData.monthlyBudget),
      isActive: formData.isActive
    };

    try {
      setIsSubmitting(true);

      if (modal.mode === 'create') {
        await createDepartment(payload);
        showToast('Department created successfully!', 'success');
      } else {
        await updateDepartment(modal.department._id, payload);
        showToast('Department updated successfully!', 'success');
      }

      closeModal();
      loadData();
    } catch (error) {
      console.error('Save department error:', error);
      showToast(error.response?.data?.error || 'Department save failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (department) => {
    if (!window.confirm(`Delete ${department.name}? Departments with active users cannot be deleted.`)) {
      return;
    }

    try {
      await deleteDepartment(department._id);
      showToast('Department deleted successfully!', 'success');
      loadData();
    } catch (error) {
      console.error('Delete department error:', error);
      showToast(error.response?.data?.error || 'Department delete failed', 'error');
    }
  };

  return (
    <div className="app-shell">
      <Navbar />

      <div className="page-container">
        <header className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="flex items-center gap-3 text-3xl font-bold text-slate-800">
              <Building2 className="text-blue-600" />
              Department Management
            </h1>
            <p className="page-subtitle">
              Create departments, assign managers, and organize employees.
            </p>
          </div>

          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 font-medium text-white shadow-sm transition-all hover:bg-blue-700 active:scale-95"
          >
            <Plus size={18} />
            Add Department
          </button>
        </header>

        <section className="mb-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">Total Departments</p>
            <p className="mt-1 text-2xl font-bold text-slate-800">{departments.length}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">Active Departments</p>
            <p className="mt-1 text-2xl font-bold text-slate-800">
              {departments.filter(department => department.isActive !== false).length}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">Assigned Managers</p>
            <p className="mt-1 text-2xl font-bold text-slate-800">
              {departments.filter(department => department.manager).length}
            </p>
          </div>
        </section>

        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-lg">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by department, description, or manager..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full rounded-lg border border-slate-300 py-2.5 pl-9 pr-4 transition-all focus:border-transparent focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
            <p className="mt-4 text-slate-400">Loading departments...</p>
          </div>
        ) : (
          <div className="glass-card overflow-hidden border border-slate-200 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b-2 border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100">
                  <tr>
                    <th className="p-4 text-left text-sm font-semibold text-slate-700">Department</th>
                    <th className="p-4 text-left text-sm font-semibold text-slate-700">Manager</th>
                    <th className="p-4 text-left text-sm font-semibold text-slate-700">Active Users</th>
                    <th className="p-4 text-left text-sm font-semibold text-slate-700">Monthly Budget</th>
                    <th className="p-4 text-left text-sm font-semibold text-slate-700">Status</th>
                    <th className="p-4 text-right text-sm font-semibold text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDepartments.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="p-12 text-center text-slate-400">
                        No departments found
                      </td>
                    </tr>
                  ) : (
                    filteredDepartments.map((department) => (
                      <tr key={department._id} className="border-b border-slate-100 transition-colors hover:bg-slate-50">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                              {getInitials(department.name)}
                            </div>
                            <div>
                              <div className="font-medium text-slate-800">{department.name}</div>
                              <div className="max-w-xs truncate text-xs text-slate-500">
                                {department.description || 'No description'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-sm text-slate-600">
                          {department.manager ? (
                            <div>
                              <div className="font-medium text-slate-700">{department.manager.name}</div>
                              <div className="text-xs text-slate-500">{department.manager.email}</div>
                            </div>
                          ) : (
                            <span className="italic text-slate-400">Not assigned</span>
                          )}
                        </td>
                        <td className="p-4 text-sm text-slate-600">
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                            <Users size={12} />
                            {departmentUserCounts[department._id] || 0}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-slate-600">
                          Rs. {Number(department.monthlyBudget || 0).toLocaleString()}
                        </td>
                        <td className="p-4">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            department.isActive !== false
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {department.isActive !== false ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => openEditModal(department)}
                              className="flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-600 transition-all hover:bg-blue-100"
                            >
                              <Edit2 size={13} />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(department)}
                              className="flex items-center gap-1 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 transition-all hover:bg-red-100"
                            >
                              <Trash2 size={13} />
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {filteredDepartments.length > 0 && (
              <div className="border-t border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-sm text-slate-600">
                  Showing <span className="font-semibold">{filteredDepartments.length}</span> of{' '}
                  <span className="font-semibold">{departments.length}</span> departments
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {modal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="max-h-screen w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-800">
                {modal.mode === 'create' ? 'Add Department' : 'Edit Department'}
              </h3>
              <button onClick={closeModal} className="text-slate-400 transition-colors hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Department Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                  className={`w-full rounded-lg border p-3 transition-all focus:border-transparent focus:ring-2 focus:ring-blue-500 ${
                    formErrors.name ? 'border-red-500' : 'border-slate-300'
                  }`}
                  placeholder="Finance"
                />
                {formErrors.name && <p className="mt-1 text-xs text-red-500">{formErrors.name}</p>}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(event) => setFormData({ ...formData, description: event.target.value })}
                  className="min-h-[90px] w-full rounded-lg border border-slate-300 p-3 transition-all focus:border-transparent focus:ring-2 focus:ring-blue-500"
                  placeholder="Short department description"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Department Manager</label>
                <select
                  value={formData.manager}
                  onChange={(event) => setFormData({ ...formData, manager: event.target.value })}
                  className="w-full rounded-lg border border-slate-300 p-3 transition-all focus:border-transparent focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">No Manager</option>
                  {managers.map(manager => {
                    const managedDepartment = departments.find(department =>
                      department.manager?._id === manager._id && department._id !== modal.department?._id
                    );

                    return (
                      <option
                        key={manager._id}
                        value={manager._id}
                        disabled={Boolean(managedDepartment)}
                      >
                        {manager.name}{managedDepartment ? ` - already manages ${managedDepartment.name}` : ''}
                      </option>
                    );
                  })}
                </select>
                <p className="mt-1 text-xs text-slate-500">
                  Only active users with the manager role appear here.
                </p>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Monthly Budget</label>
                <input
                  type="number"
                  min="0"
                  value={formData.monthlyBudget}
                  onChange={(event) => setFormData({ ...formData, monthlyBudget: event.target.value })}
                  className={`w-full rounded-lg border p-3 transition-all focus:border-transparent focus:ring-2 focus:ring-blue-500 ${
                    formErrors.monthlyBudget ? 'border-red-500' : 'border-slate-300'
                  }`}
                  placeholder="0"
                />
                {formErrors.monthlyBudget && <p className="mt-1 text-xs text-red-500">{formErrors.monthlyBudget}</p>}
              </div>

              {modal.mode === 'edit' && (
                <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <span className="text-sm font-medium text-slate-700">Department Active</span>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      formData.isActive ? 'bg-blue-600' : 'bg-slate-300'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                      formData.isActive ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  onClick={closeModal}
                  className="flex-1 rounded-lg bg-slate-200 px-4 py-3 font-medium text-slate-700 transition-all hover:bg-slate-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                      Saving...
                    </>
                  ) : modal.mode === 'create' ? (
                    <>
                      <Plus size={18} />
                      Create Department
                    </>
                  ) : (
                    <>
                      <Edit2 size={18} />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(prev => ({ ...prev, show: false }))}
        />
      )}
    </div>
  );
}
