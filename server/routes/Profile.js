const express = require('express');
const router = express.Router();
const Profile = require('../models/Profile');
const { protect } = require('../middleware/auth');
const { validateProfile } = require('../middleware/validators');

// @route   POST /api/profile
// @desc    Create or Update profile (works for both student and admin)
router.post('/', protect, async (req, res) => {
  const {
    // Common
    phone,
    // Student
    college, branch, cgpa, yearOfGraduation,
    skills, interests, dsaLevel, targetRole,
    projects, internships, certifications,
    linkedIn, github,
    // Admin
    designation, department, workExperience, bio
  } = req.body;

  // Build profileFields based on role
  const profileFields = {
    user: req.user._id,
    phone
  };

  if (req.user.role === 'admin') {
    // Admin-only fields
    if (designation !== undefined) profileFields.designation = designation;
    if (department !== undefined) profileFields.department = department;
    if (workExperience !== undefined) profileFields.workExperience = workExperience;
    if (bio !== undefined) profileFields.bio = bio;
  } else {
    // Student fields
    if (college !== undefined) profileFields.college = college;
    if (branch !== undefined) profileFields.branch = branch;
    if (cgpa !== undefined) profileFields.cgpa = cgpa;
    if (yearOfGraduation !== undefined) profileFields.yearOfGraduation = yearOfGraduation;
    if (skills !== undefined) profileFields.skills = skills;
    if (interests !== undefined) profileFields.interests = interests;
    if (dsaLevel !== undefined) profileFields.dsaLevel = dsaLevel;
    if (targetRole !== undefined) profileFields.targetRole = targetRole;
    if (projects !== undefined) profileFields.projects = projects;
    if (internships !== undefined) profileFields.internships = internships;
    if (certifications !== undefined) profileFields.certifications = certifications;
    if (linkedIn !== undefined) profileFields.linkedIn = linkedIn;
    if (github !== undefined) profileFields.github = github;
  }

  try {
    let profile = await Profile.findOne({ user: req.user._id });

    if (profile) {
      profile = await Profile.findOneAndUpdate(
        { user: req.user._id },
        { $set: profileFields },
        { new: true }
      );
      return res.json({ message: 'Profile updated successfully', profile });
    }

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