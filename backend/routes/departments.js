const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Department = require('../models/Department');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const { logAudit } = require('../utils/audit');

const isObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const cleanDepartmentPayload = (body) => {
  const payload = { ...body };

  if (payload.name) payload.name = payload.name.trim();
  if (payload.description) payload.description = payload.description.trim();

  if (!payload.manager) {
    delete payload.manager;
  }

  if (payload.monthlyBudget !== undefined) {
    payload.monthlyBudget = Number(payload.monthlyBudget) || 0;
  }

  return payload;
};

const validateManager = async (managerId, departmentId = null) => {
  if (!managerId) return null;
  if (!isObjectId(managerId)) throw new Error('Invalid manager ID');

  const manager = await User.findById(managerId);
  if (!manager) throw new Error('Manager user not found');
  if (manager.role !== 'manager') throw new Error('Selected user must have manager role');

  const existingDepartment = await Department.findOne({ manager: managerId, _id: { $ne: departmentId } });
  if (existingDepartment) throw new Error('This manager is already assigned to another department');

  return manager;
};

router.get('/', protect, async (req, res) => {
  try {
    const departments = await Department.find().populate('manager', 'name email');
    res.status(200).json({ success: true, count: departments.length, data: departments });
  } catch (error) {
    console.error('Get departments error:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const payload = cleanDepartmentPayload(req.body);

    if (!payload.name) {
      return res.status(400).json({ success: false, error: 'Department name is required' });
    }

    const manager = await validateManager(payload.manager);
    const department = await Department.create(payload);

    if (manager) {
      manager.department = department._id;
      await manager.save();
    }

    await logAudit({
      userId: req.user._id,
      action: 'CREATE',
      resourceType: 'Department',
      resourceId: department._id,
      changes: payload,
      ipAddress: req.ip
    });

    const populated = await Department.findById(department._id).populate('manager', 'name email');
    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    console.error('Create department error:', error);
    res.status(500).json({ success: false, error: error.message || 'Server Error' });
  }
});

router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    if (!isObjectId(req.params.id)) return res.status(400).json({ success: false, error: 'Invalid department ID' });

    const existing = await Department.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, error: 'Department not found' });

    const previousManager = existing.manager;
    const payload = cleanDepartmentPayload(req.body);
    const manager = await validateManager(payload.manager, req.params.id);

    if (payload.manager === undefined) {
      existing.manager = undefined;
    }

    Object.assign(existing, payload);
    await existing.save();

    if (previousManager && (!payload.manager || previousManager.toString() !== payload.manager)) {
      await User.updateOne({ _id: previousManager }, { $unset: { department: '' } });
    }

    if (manager) {
      manager.department = existing._id;
      await manager.save();
    }

    await logAudit({
      userId: req.user._id,
      action: 'UPDATE',
      resourceType: 'Department',
      resourceId: existing._id,
      changes: payload,
      ipAddress: req.ip
    });

    const populated = await Department.findById(existing._id).populate('manager', 'name email');
    res.status(200).json({ success: true, data: populated });
  } catch (error) {
    console.error('Update department error:', error);
    res.status(500).json({ success: false, error: error.message || 'Server Error' });
  }
});

router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    if (!isObjectId(req.params.id)) return res.status(400).json({ success: false, error: 'Invalid department ID' });

    const department = await Department.findById(req.params.id);
    if (!department) return res.status(404).json({ success: false, error: 'Department not found' });

    const assignedUsers = await User.countDocuments({ department: department._id, isActive: true });
    if (assignedUsers > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete a department that still has active users. Reassign or deactivate users first.'
      });
    }

    await logAudit({
      userId: req.user._id,
      action: 'DELETE',
      resourceType: 'Department',
      resourceId: department._id,
      changes: { name: department.name },
      ipAddress: req.ip
    });

    await department.deleteOne();
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    console.error('Delete department error:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

module.exports = router;
