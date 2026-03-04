const express = require('express');
const router = express.Router();
const Profile = require('../models/Profile');
const RoleTemplate = require('../models/RoleTemplate');
const { protect } = require('../middleware/auth');

// @route   GET /api/skillgap
// @desc    Get skill gap analysis for logged in student
router.get('/', protect, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user._id });

    if (!profile) {
      return res.status(404).json({ message: 'Please complete your profile first.' });
    }

    if (!profile.targetRole) {
      return res.status(404).json({ message: 'Please select a target role in your profile.' });
    }

    const roleTemplate = await RoleTemplate.findOne({ role: profile.targetRole });

    if (!roleTemplate) {
      return res.status(404).json({ message: 'Role template not found.' });
    }

    const requiredSkills = roleTemplate.requiredSkills.map(s => s.toLowerCase());
    const studentSkills = profile.skills.map(s => s.toLowerCase());

    const matchedSkills = requiredSkills.filter(s => studentSkills.includes(s));
    const missingSkills = requiredSkills.filter(s => !studentSkills.includes(s));
    const extraSkills = studentSkills.filter(s => !requiredSkills.includes(s));

    const matchPercentage = Math.round((matchedSkills.length / requiredSkills.length) * 100);

    let recommendation = '';
    if (matchPercentage >= 80) {
      recommendation = 'Excellent! You have most of the required skills. Focus on projects and DSA now.';
    } else if (matchPercentage >= 50) {
      recommendation = 'Good progress! Focus on learning the missing skills one by one.';
    } else {
      recommendation = 'You have a good foundation. Prioritize learning the missing skills for your target role.';
    }

    res.json({
      targetRole: profile.targetRole,
      totalRequired: requiredSkills.length,
      matchedCount: matchedSkills.length,
      missingCount: missingSkills.length,
      matchPercentage,
      matchedSkills: roleTemplate.requiredSkills.filter(s => studentSkills.includes(s.toLowerCase())),
      missingSkills: roleTemplate.requiredSkills.filter(s => !studentSkills.includes(s.toLowerCase())),
      extraSkills: profile.skills.filter(s => !requiredSkills.includes(s.toLowerCase())),
      recommendation
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;