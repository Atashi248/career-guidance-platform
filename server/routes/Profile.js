const express = require('express');
const router = express.Router();
const Profile = require('../models/Profile');
const { protect } = require('../middleware/auth');

// @route   POST /api/profile
// @desc    Create or Update profile
router.post('/', protect, async (req, res) => {
  const {
    phone, college, branch, cgpa, yearOfGraduation,
    skills, interests, dsaLevel, targetRole,
    projects, internships, certifications,
    linkedIn, github
  } = req.body;

  const profileFields = {
    user: req.user._id,
    phone, college, branch, cgpa, yearOfGraduation,
    skills, interests, dsaLevel, targetRole,
    projects, internships, certifications,
    linkedIn, github
  };

  try {
    let profile = await Profile.findOne({ user: req.user._id });

    if (profile) {
      // Update existing profile
      profile = await Profile.findOneAndUpdate(
        { user: req.user._id },
        { $set: profileFields },
        { new: true }
      );
      return res.json({ message: 'Profile updated successfully', profile });
    }

    // Create new profile
    profile = new Profile(profileFields);
    await profile.save();
    res.status(201).json({ message: 'Profile created successfully', profile });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/profile/me
// @desc    Get logged in user's profile
router.get('/me', protect, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user._id }).populate('user', 'name email role');

    if (!profile) {
      return res.status(404).json({ message: 'Profile not found. Please create your profile.' });
    }

    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/profile/:userId
// @desc    Get profile by user ID (admin use)
router.get('/:userId', protect, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.params.userId }).populate('user', 'name email role');

    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;