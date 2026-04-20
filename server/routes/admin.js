const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Profile = require('../models/Profile');
const { protect, adminOnly } = require('../middleware/auth');

// @route   GET /api/admin/students
// @desc    Get all students with their profiles
router.get('/students', protect, adminOnly, async (req, res) => {
  try {
    const students = await User.find({ role: 'student' }).select('-password');
    const studentsWithProfiles = await Promise.all(
      students.map(async (student) => {
        const profile = await Profile.findOne({ user: student._id }).lean();
        return { 
          ...student.toObject(), 
          profile: profile || null 
        };
      })
    );
    res.json(studentsWithProfiles);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/admin/students/:id
// @desc    Get single student details
router.get('/students/:id', protect, adminOnly, async (req, res) => {
  try {
    const student = await User.findById(req.params.id).select('-password');
    if (!student) return res.status(404).json({ message: 'Student not found' });
    const profile = await Profile.findOne({ user: req.params.id }).lean();
    res.json({ ...student.toObject(), profile: profile || null });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/admin/stats
// @desc    Get platform stats
router.get('/stats', protect, adminOnly, async (req, res) => {
  try {
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalProfiles = await Profile.countDocuments();
    const roleDistribution = await Profile.aggregate([
      { $group: { _id: '$targetRole', count: { $sum: 1 } } }
    ]);
    res.json({ totalStudents, totalProfiles, roleDistribution });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

const RoleTemplate = require('../models/RoleTemplate');

// @route   GET /api/admin/templates
// @desc    Get all role templates
router.get('/templates', protect, adminOnly, async (req, res) => {
  try {
    const templates = await RoleTemplate.find();
    res.json(templates);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/admin/templates
// @desc    Create a new role template
router.post('/templates', protect, adminOnly, async (req, res) => {
  try {
    const { role, description, requiredSkills, weeklyRoadmap } = req.body;
    const existing = await RoleTemplate.findOne({ role });
    if (existing) {
      return res.status(400).json({ message: 'Template for this role already exists' });
    }
    const template = new RoleTemplate({ role, description, requiredSkills, weeklyRoadmap });
    await template.save();
    res.status(201).json(template);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/admin/templates/:id
// @desc    Update a role template
router.put('/templates/:id', protect, adminOnly, async (req, res) => {
  try {
    const template = await RoleTemplate.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!template) return res.status(404).json({ message: 'Template not found' });
    res.json(template);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/admin/templates/:id
// @desc    Delete a role template
router.delete('/templates/:id', protect, adminOnly, async (req, res) => {
  try {
    const template = await RoleTemplate.findByIdAndDelete(req.params.id);
    if (!template) return res.status(404).json({ message: 'Template not found' });
    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;