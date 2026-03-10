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

module.exports = router;