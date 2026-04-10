import React, { useEffect, useState, useCallback } from 'react';
import {
  getUsers,
  getDepartments,
  updateUser,
  deleteUser,
  register
} from '../services/api';
import Navbar from '../components/Navbar';
import Toast from '../components/Toast';
import {
  Users,
  Plus,
  Edit2,
  UserX,
  UserCheck,
  X,
  Search,
  Shield
} from 'lucide-react';
import { getInitials, capitalize } from '../utils/helpers';

export default function UsersPage() {


  // STATE
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [toast, setToast] = useState({
    show: false,
    message: '',
    type: 'success'
  });

  // Modal state
  const [modal, setModal] = useState({
    show: false,
    mode: 'create', // 'create' or 'edit'
    user: null
  });

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'employee',
    department: '',
    isActive: true
  });

  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);


  // LOAD DATA
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [usersRes, deptRes] = await Promise.all([
        getUsers(),
        getDepartments()
      ]);
      setUsers(usersRes.data.data);
      setFilteredUsers(usersRes.data.data);
      setDepartments(deptRes.data.data);
    } catch (error) {
      console.error('Load data error:', error);
      showToast('Failed to load users', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);


  // SEARCH AND FILTER
  useEffect(() => {
    let filtered = [...users];

    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(u =>
        u.name.toLowerCase().includes(searchLower) ||
        u.email.toLowerCase().includes(searchLower)
      );
    }

    if (roleFilter) {
      filtered = filtered.filter(u => u.role === roleFilter);
    }

    setFilteredUsers(filtered);
  }, [users, search, roleFilter]);


  // HELPERS
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  const getRoleColor = (role) => {
    const colors = {
      admin: 'bg-red-100 text-red-700',
      manager: 'bg-blue-100 text-blue-700',
      employee: 'bg-green-100 text-green-700',
      accountant: 'bg-purple-100 text-purple-700'
    };
    return colors[role] || 'bg-gray-100 text-gray-700';
  };


  // OPEN CREATE MODAL
  const openCreateModal = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'employee',
      department: '',
      isActive: true
    });
    setFormErrors({});
    setModal({ show: true, mode: 'create', user: null });
  };


  // OPEN EDIT MODAL
  const openEditModal = (user) => {
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      department: user.department?._id || '',
      isActive: user.isActive
    });
    setFormErrors({});
    setModal({ show: true, mode: 'edit', user });
  };


  // CLOSE MODAL
  const closeModal = () => {
    setModal({ show: false, mode: 'create', user: null });
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'employee',
      department: '',
      isActive: true
    });
    setFormErrors({});
  };


  // VALIDATE FORM
  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email';
    }

    if (modal.mode === 'create') {
      if (!formData.password) {
        errors.password = 'Password is required';
      } else if (formData.password.length < 6) {
        errors.password =
          'Password must be at least 6 characters';
      }
    }

    if (!formData.role) {
      errors.role = 'Role is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };


  // SUBMIT FORM
  const handleSubmit = async () => {
    if (!validateForm() || isSubmitting) return;

    try {
      setIsSubmitting(true);

      if (modal.mode === 'create') {
        // Register new user
        await register({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          department: formData.department || undefined
        });
        showToast('User created successfully!', 'success');
      } else {
        // Update existing user
        await updateUser(modal.user._id, {
          name: formData.name,
          email: formData.email,
          role: formData.role,
          department: formData.department || undefined,
          isActive: formData.isActive
        });
        showToast('User updated successfully!', 'success');
      }

      closeModal();
      loadData();
    } catch (error) {
      console.error('Submit error:', error);
      showToast(
        error.response?.data?.error ||
        'Operation failed',
        'error'
      );
    } finally {
      setIsSubmitting(false);
    }
  };


  // TOGGLE USER ACTIVE STATUS
  const handleToggleActive = async (user) => {
    const action = user.isActive ? 'deactivate' : 'activate';
    if (!window.confirm(
      `Are you sure you want to ${action} ${user.name}?`
    )) return;

    try {
      if (user.isActive) {
        // Soft delete - deactivates the user
        await deleteUser(user._id);
      } else {
        // Reactivate user
        await updateUser(user._id, { isActive: true });
      }
      showToast(
        `User ${action}d successfully!`,
        'success'
      );
      loadData();
    } catch (error) {
      showToast(
        error.response?.data?.error ||
        `Failed to ${action} user`,
        'error'
      );
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
            <h1 className="text-3xl font-bold
              text-slate-800 flex items-center gap-3">
              <Users className="text-blue-600" />
              User Management
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Create and manage system users
            </p>
          </div>

          <button
            onClick={openCreateModal}
            className="flex items-center gap-2
              bg-blue-600 hover:bg-blue-700
              text-white px-4 py-2.5 rounded-lg
              font-medium shadow-sm transition-all
              active:scale-95"
          >
            <Plus size={18} />
            Add New User
          </button>
        </header>

        {/* Search and Filter Bar */}
        <div className="bg-white p-4 rounded-xl
          shadow-lg border border-slate-200 mb-6">
          <div className="flex flex-col md:flex-row
            gap-4">

            {/* Search */}
            <div className="flex-1 relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2
                  -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5
                  border border-slate-300 rounded-lg
                  focus:ring-2 focus:ring-blue-500
                  focus:border-transparent transition-all"
              />
            </div>

            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full md:w-48 p-2.5
                border border-slate-300 rounded-lg
                focus:ring-2 focus:ring-blue-500
                focus:border-transparent transition-all"
            >
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="employee">Employee</option>
              <option value="accountant">Accountant</option>
            </select>

            {/* Stats */}
            <div className="flex items-center gap-4
              text-sm text-slate-600 whitespace-nowrap">
              <span>
                <strong>{users.filter(u =>
                  u.isActive).length}
                </strong> active
              </span>
              <span>
                <strong>{users.filter(u =>
                  !u.isActive).length}
                </strong> inactive
              </span>
            </div>
          </div>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin
              rounded-full h-12 w-12 border-b-2
              border-blue-600" />
            <p className="text-slate-400 mt-4">
              Loading users...
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg
            border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r
                  from-slate-50 to-slate-100
                  border-b-2 border-slate-200">
                  <tr>
                    <th className="p-4 text-left text-sm
                      font-semibold text-slate-700">
                      User
                    </th>
                    <th className="p-4 text-left text-sm
                      font-semibold text-slate-700">
                      Role
                    </th>
                    <th className="p-4 text-left text-sm
                      font-semibold text-slate-700">
                      Department
                    </th>
                    <th className="p-4 text-left text-sm
                      font-semibold text-slate-700">
                      Status
                    </th>
                    <th className="p-4 text-right text-sm
                      font-semibold text-slate-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td
                        colSpan="5"
                        className="p-12 text-center
                          text-slate-400"
                      >
                        No users found
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => (
                      <tr
                        key={u._id}
                        className={`border-b border-slate-100
                          hover:bg-slate-50 transition-colors ${
                          !u.isActive ? 'opacity-60' : ''
                        }`}
                      >
                        {/* User Info */}
                        <td className="p-4">
                          <div className="flex
                            items-center gap-3">
                            <div className="w-9 h-9
                              rounded-full bg-blue-100
                              flex items-center
                              justify-center
                              text-blue-700 font-bold
                              text-sm flex-shrink-0">
                              {getInitials(u.name)}
                            </div>
                            <div>
                              <div className="font-medium
                                text-slate-800">
                                {u.name}
                              </div>
                              <div className="text-xs
                                text-slate-500">
                                {u.email}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Role Badge */}
                        <td className="p-4">
                          <span className={`px-2.5 py-1
                            text-xs font-semibold
                            rounded-full capitalize
                            flex items-center gap-1
                            w-fit ${getRoleColor(u.role)}`}>
                            <Shield size={10} />
                            {capitalize(u.role)}
                          </span>
                        </td>

                        {/* Department */}
                        <td className="p-4 text-slate-600
                          text-sm">
                          {u.department?.name || (
                            <span className="text-slate-400
                              italic">
                              Not assigned
                            </span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="p-4">
                          <span className={`px-2.5 py-1
                            text-xs font-semibold
                            rounded-full ${
                            u.isActive
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {u.isActive
                              ? 'Active'
                              : 'Inactive'
                            }
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="p-4">
                          <div className="flex gap-2
                            justify-end">
                            {/* Edit Button */}
                            <button
                              onClick={() => openEditModal(u)}
                              className="flex items-center
                                gap-1 text-xs
                                bg-blue-50 hover:bg-blue-100
                                text-blue-600 px-3 py-1.5
                                rounded-lg font-medium
                                transition-all"
                            >
                              <Edit2 size={13} />
                              Edit
                            </button>

                            {/* Activate/Deactivate */}
                            <button
                              onClick={() =>
                                handleToggleActive(u)
                              }
                              className={`flex items-center
                                gap-1 text-xs px-3 py-1.5
                                rounded-lg font-medium
                                transition-all ${
                                u.isActive
                                  ? 'bg-red-50 hover:bg-red-100 text-red-600'
                                  : 'bg-green-50 hover:bg-green-100 text-green-600'
                              }`}
                            >
                              {u.isActive ? (
                                <>
                                  <UserX size={13} />
                                  Deactivate
                                </>
                              ) : (
                                <>
                                  <UserCheck size={13} />
                                  Activate
                                </>
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            {filteredUsers.length > 0 && (
              <div className="bg-slate-50 px-4 py-3
                border-t border-slate-200">
                <p className="text-sm text-slate-600">
                  Showing{' '}
                  <span className="font-semibold">
                    {filteredUsers.length}
                  </span>{' '}
                  of{' '}
                  <span className="font-semibold">
                    {users.length}
                  </span>{' '}
                  users
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {modal.show && (
        <div className="fixed inset-0 bg-black
          bg-opacity-50 flex items-center
          justify-center p-4 z-50">
          <div className="bg-white rounded-xl
            shadow-2xl max-w-md w-full p-6
            max-h-screen overflow-y-auto">

            {/* Modal Header */}
            <div className="flex items-center
              justify-between mb-6">
              <h3 className="text-xl font-bold
                text-slate-800">
                {modal.mode === 'create'
                  ? 'Add New User'
                  : 'Edit User'
                }
              </h3>
              <button
                onClick={closeModal}
                className="text-slate-400
                  hover:text-slate-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">

              {/* Name */}
              <div>
                <label className="block text-sm
                  font-medium text-slate-700 mb-1">
                  Full Name{' '}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({
                    ...formData,
                    name: e.target.value
                  })}
                  className={`w-full p-3 border rounded-lg
                    focus:ring-2 focus:ring-blue-500
                    focus:border-transparent transition-all ${
                    formErrors.name
                      ? 'border-red-500'
                      : 'border-slate-300'
                  }`}
                  placeholder="John Smith"
                />
                {formErrors.name && (
                  <p className="text-red-500 text-xs mt-1">
                    {formErrors.name}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm
                  font-medium text-slate-700 mb-1">
                  Email Address{' '}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({
                    ...formData,
                    email: e.target.value
                  })}
                  className={`w-full p-3 border rounded-lg
                    focus:ring-2 focus:ring-blue-500
                    focus:border-transparent transition-all ${
                    formErrors.email
                      ? 'border-red-500'
                      : 'border-slate-300'
                  }`}
                  placeholder="john@company.com"
                />
                {formErrors.email && (
                  <p className="text-red-500 text-xs mt-1">
                    {formErrors.email}
                  </p>
                )}
              </div>

              {/* Password - only for create */}
              {modal.mode === 'create' && (
                <div>
                  <label className="block text-sm
                    font-medium text-slate-700 mb-1">
                    Password{' '}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({
                      ...formData,
                      password: e.target.value
                    })}
                    className={`w-full p-3 border rounded-lg
                      focus:ring-2 focus:ring-blue-500
                      focus:border-transparent
                      transition-all ${
                      formErrors.password
                        ? 'border-red-500'
                        : 'border-slate-300'
                    }`}
                    placeholder="Min 6 characters"
                  />
                  {formErrors.password && (
                    <p className="text-red-500 text-xs mt-1">
                      {formErrors.password}
                    </p>
                  )}
                </div>
              )}

              {/* Role */}
              <div>
                <label className="block text-sm
                  font-medium text-slate-700 mb-1">
                  Role{' '}
                  <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({
                    ...formData,
                    role: e.target.value
                  })}
                  className={`w-full p-3 border rounded-lg
                    focus:ring-2 focus:ring-blue-500
                    focus:border-transparent transition-all ${
                    formErrors.role
                      ? 'border-red-500'
                      : 'border-slate-300'
                  }`}
                >
                  <option value="employee">Employee</option>
                  <option value="manager">Manager</option>
                  <option value="accountant">Accountant</option>
                  <option value="admin">Admin</option>
                </select>
                {formErrors.role && (
                  <p className="text-red-500 text-xs mt-1">
                    {formErrors.role}
                  </p>
                )}
              </div>

              {/* Department */}
              <div>
                <label className="block text-sm
                  font-medium text-slate-700 mb-1">
                  Department
                </label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({
                    ...formData,
                    department: e.target.value
                  })}
                  className="w-full p-3 border
                    border-slate-300 rounded-lg
                    focus:ring-2 focus:ring-blue-500
                    focus:border-transparent transition-all"
                >
                  <option value="">No Department</option>
                  {departments.map(dept => (
                    <option
                      key={dept._id}
                      value={dept._id}
                    >
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Active Status - edit only */}
              {modal.mode === 'edit' && (
                <div className="flex items-center
                  justify-between p-3 bg-slate-50
                  rounded-lg border border-slate-200">
                  <span className="text-sm font-medium
                    text-slate-700">
                    Account Active
                  </span>
                  <button
                    type="button"
                    onClick={() => setFormData({
                      ...formData,
                      isActive: !formData.isActive
                    })}
                    className={`relative inline-flex
                      h-6 w-11 items-center rounded-full
                      transition-colors ${
                      formData.isActive
                        ? 'bg-blue-600'
                        : 'bg-slate-300'
                    }`}
                  >
                    <span className={`inline-block
                      h-4 w-4 transform rounded-full
                      bg-white shadow transition-transform ${
                      formData.isActive
                        ? 'translate-x-6'
                        : 'translate-x-1'
                    }`} />
                  </button>
                </div>
              )}

              {/* Modal Actions */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={closeModal}
                  className="flex-1 bg-slate-200
                    hover:bg-slate-300 text-slate-700
                    px-4 py-3 rounded-lg font-medium
                    transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex-1 bg-blue-600
                    hover:bg-blue-700 text-white
                    px-4 py-3 rounded-lg font-medium
                    transition-all disabled:opacity-50
                    disabled:cursor-not-allowed
                    flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin
                        rounded-full h-4 w-4
                        border-b-2 border-white" />
                      Saving...
                    </>
                  ) : modal.mode === 'create' ? (
                    <>
                      <Plus size={18} />
                      Create User
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