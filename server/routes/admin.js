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

// @route   GET /api/admin/analytics
// @desc    Get detailed analytics for charts
router.get('/analytics', protect, adminOnly, async (req, res) => {
  try {
    const profiles = await Profile.find();

    // Role Distribution
    const roleCount = {};
    profiles.forEach(p => {
      const role = p.targetRole || 'Not Selected';
      roleCount[role] = (roleCount[role] || 0) + 1;
    });
    const roleDistribution = Object.entries(roleCount).map(([name, value]) => ({ name, value }));

    // DSA Level Distribution
    const dsaCount = { beginner: 0, intermediate: 0, advanced: 0 };
    profiles.forEach(p => {
      if (p.dsaLevel) dsaCount[p.dsaLevel] = (dsaCount[p.dsaLevel] || 0) + 1;
    });
    const dsaDistribution = Object.entries(dsaCount).map(([name, value]) => ({ name, value }));

    // CGPA Distribution (ranges)
    const cgpaRanges = { 'Below 6': 0, '6 - 7': 0, '7 - 8': 0, '8 - 9': 0, '9 - 10': 0 };
    profiles.forEach(p => {
      const cgpa = p.cgpa || 0;
      if (cgpa < 6) cgpaRanges['Below 6']++;
      else if (cgpa < 7) cgpaRanges['6 - 7']++;
      else if (cgpa < 8) cgpaRanges['7 - 8']++;
      else if (cgpa < 9) cgpaRanges['8 - 9']++;
      else cgpaRanges['9 - 10']++;
    });
    const cgpaDistribution = Object.entries(cgpaRanges).map(([name, value]) => ({ name, value }));

    // Skills Count (top 10 most common skills)
    const skillCount = {};
    profiles.forEach(p => {
      (p.skills || []).forEach(skill => {
        skillCount[skill] = (skillCount[skill] || 0) + 1;
      });
    });
    const topSkills = Object.entries(skillCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, value]) => ({ name, value }));

    // Profile Completeness
    let completeCount = 0;
    let incompleteCount = 0;
    profiles.forEach(p => {
      const hasBasics = p.cgpa && p.targetRole && p.skills?.length >= 3;
      if (hasBasics) completeCount++;
      else incompleteCount++;
    });

    // Average Stats
    const totalCGPA = profiles.reduce((sum, p) => sum + (p.cgpa || 0), 0);
    const avgCGPA = profiles.length > 0 ? (totalCGPA / profiles.length).toFixed(2) : 0;

    const totalSkills = profiles.reduce((sum, p) => sum + (p.skills?.length || 0), 0);
    const avgSkills = profiles.length > 0 ? (totalSkills / profiles.length).toFixed(1) : 0;

    const totalProjects = profiles.reduce((sum, p) => sum + (p.projects?.length || 0), 0);
    const avgProjects = profiles.length > 0 ? (totalProjects / profiles.length).toFixed(1) : 0;

    res.json({
      roleDistribution,
      dsaDistribution,
      cgpaDistribution,
      topSkills,
      profileCompleteness: [
        { name: 'Complete', value: completeCount },
        { name: 'Incomplete', value: incompleteCount }
      ],
      averages: {
        avgCGPA,
        avgSkills,
        avgProjects,
        totalProfiles: profiles.length
      }
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;