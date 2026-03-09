const express = require('express');
const router = express.Router();
const Department = require('../models/Department');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, async (req, res) => {
  try {
    const departments = await Department.find()
      .populate('manager', 'name email');

    res.status(200).json({
      success: true,
      count: departments.length,
      data: departments
    });
  } catch (error) {
    console.error('Get departments error:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
});


router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const department = await Department.create(req.body);

    res.status(201).json({
      success: true,
      data: department
    });
  } catch (error) {
    console.error('Create department error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server Error'
    });
  }
});


router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const department = await Department.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,          // Return updated document
        runValidators: true // Run schema validators on update
      }
    );

    if (!department) {
      return res.status(404).json({
        success: false,
        error: 'Department not found'
      });
    }

    res.status(200).json({
      success: true,
      data: department
    });
  } catch (error) {
    console.error('Update department error:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
});


router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({
        success: false,
        error: 'Department not found'
      });
    }

    await department.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Delete department error:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
});

module.exports = router;