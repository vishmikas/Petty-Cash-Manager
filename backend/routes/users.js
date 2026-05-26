const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const User = require('../models/User');
const Department = require('../models/Department');
const { protect, authorize } = require('../middleware/auth');
const { logAudit } = require('../utils/audit');

const allowedRoles = ['employee', 'admin', 'accountant', 'manager'];

const validateObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const syncDepartmentManager = async (user, previousDepartment, previousRole) => {
  if (previousDepartment && (previousRole === 'manager' || user.role !== 'manager')) {
    await Department.updateOne({ _id: previousDepartment, manager: user._id }, { $unset: { manager: '' } });
  }

  if (user.role === 'manager' && user.department) {
    const existingManagedDept = await Department.findOne({ manager: user._id, _id: { $ne: user.department } });
    if (existingManagedDept) {
      existingManagedDept.manager = undefined;
      await existingManagedDept.save();
    }

    const department = await Department.findById(user.department);
    if (department) {
      department.manager = user._id;
      await department.save();
    }
  }
};

router.get('/', protect, authorize('admin', 'manager', 'accountant'), async (req, res) => {
  try {
    const users = await User.find()
      .populate('department')
      .select('-password')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: users.length, data: users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { name, email, password, role = 'employee', department, isActive = true } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'Name, email and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters' });
    }

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ success: false, error: 'Invalid user role' });
    }

    if (department && !validateObjectId(department)) {
      return res.status(400).json({ success: false, error: 'Invalid department ID' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, error: 'User already exists with this email' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role,
      department: department || undefined,
      isActive
    });

    await syncDepartmentManager(user, null, null);

    await logAudit({
      userId: req.user._id,
      action: 'CREATE',
      resourceType: 'User',
      resourceId: user._id,
      changes: { name, email, role, department, isActive },
      ipAddress: req.ip
    });

    const createdUser = await User.findById(user._id).populate('department').select('-password');
    res.status(201).json({ success: true, data: createdUser });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ success: false, error: error.message || 'Server Error' });
  }
});

router.get('/:id', protect, async (req, res) => {
  try {
    if (!validateObjectId(req.params.id)) {
      return res.status(400).json({ success: false, error: 'Invalid user ID' });
    }

    const user = await User.findById(req.params.id).populate('department').select('-password');
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    const sameUser = user._id.toString() === req.user._id.toString();
    const privileged = ['admin', 'accountant'].includes(req.user.role);
    const sameDepartmentManager = req.user.role === 'manager' && req.user.department && user.department &&
      user.department._id.toString() === (req.user.department._id || req.user.department).toString();

    if (!sameUser && !privileged && !sameDepartmentManager) {
      return res.status(403).json({ success: false, error: 'Not authorized to view this user' });
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    if (!validateObjectId(req.params.id)) {
      return res.status(400).json({ success: false, error: 'Invalid user ID' });
    }

    const { name, email, role, department, isActive, password } = req.body;

    if (role && !allowedRoles.includes(role)) {
      return res.status(400).json({ success: false, error: 'Invalid user role' });
    }

    if (department && !validateObjectId(department)) {
      return res.status(400).json({ success: false, error: 'Invalid department ID' });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    const previousDepartment = user.department;
    const previousRole = user.role;

    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;
    if (department !== undefined) user.department = department || undefined;
    if (isActive !== undefined) user.isActive = isActive;
    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ success: false, error: 'Password must be at least 6 characters' });
      }
      user.password = password;
    }

    await user.save();
    await syncDepartmentManager(user, previousDepartment, previousRole);

    await logAudit({
      userId: req.user._id,
      action: 'UPDATE',
      resourceType: 'User',
      resourceId: user._id,
      changes: { name, email, role, department, isActive, passwordChanged: !!password },
      ipAddress: req.ip
    });

    const updatedUser = await User.findById(user._id).populate('department').select('-password');
    res.status(200).json({ success: true, data: updatedUser });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ success: false, error: error.message || 'Server Error' });
  }
});

router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    if (!validateObjectId(req.params.id)) {
      return res.status(400).json({ success: false, error: 'Invalid user ID' });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    user.isActive = false;
    await user.save();

    await logAudit({
      userId: req.user._id,
      action: 'DELETE',
      resourceType: 'User',
      resourceId: user._id,
      changes: { isActive: false },
      ipAddress: req.ip
    });

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

module.exports = router;
