const express = require('express');
const router = express.Router();
const Profile = require('../models/Profile');
const { protect } = require('../middleware/auth');

// Scoring logic function
const calculateReadinessScore = (profile) => {
  let score = 0;
  let feedback = [];
  let strengths = [];
  let weaknesses = [];

  // 1. Skills (max 20 points)
  if (profile.skills && profile.skills.length > 0) {
    const skillScore = Math.min(profile.skills.length * 4, 20);
    score += skillScore;
    if (profile.skills.length >= 5) {
      strengths.push('Good number of skills listed');
    } else {
      weaknesses.push('Add more skills (aim for at least 5)');
      feedback.push('List at least 5 relevant technical skills');
    }
  } else {
    weaknesses.push('No skills added');
    feedback.push('Add your technical skills to your profile');
  }

  // 2. DSA Level (max 20 points)
  if (profile.dsaLevel === 'advanced') {
    score += 20;
    strengths.push('Strong DSA level');
  } else if (profile.dsaLevel === 'intermediate') {
    score += 13;
    feedback.push('Improve DSA to advanced level for better placement chances');
    weaknesses.push('DSA level is intermediate — keep practicing');
  } else {
    score += 5;
    weaknesses.push('DSA level is beginner — needs improvement');
    feedback.push('Focus on DSA practice daily — start with arrays, strings, and recursion');
  }

  // 3. Projects (max 20 points)
  if (profile.projects && profile.projects.length >= 2) {
    score += 20;
    strengths.push(`Has ${profile.projects.length} projects`);
  } else if (profile.projects && profile.projects.length === 1) {
    score += 7;
    weaknesses.push('Only 1 project — add at least 2');
    feedback.push('Add at least 2-3 projects relevant to your target role');
  } else {
    weaknesses.push('No projects added — this is critical');
    feedback.push('Build and add at least 2 projects relevant to your target role');
  }

  // 4. Internship (max 15 points)
  if (profile.internships && profile.internships.length > 0) {
    score += 15;
    strengths.push('Has internship experience');
  } else {
    score += 0;
    weaknesses.push('No internship experience');
    feedback.push('Try to get an internship or do freelance work for experience');
  }

  // 5. Certifications (max 10 points)
  if (profile.certifications && profile.certifications.length > 0) {
    const certScore = Math.min(profile.certifications.length * 5, 10);
    score += certScore;
    strengths.push('Has certifications');
  } else {
    weaknesses.push('No certifications');
    feedback.push('Add relevant certifications to boost your profile');
  }

  // 6. CGPA (max 10 points)
  if (profile.cgpa >= 8.5) {
    score += 10;
    strengths.push('Excellent CGPA');
  } else if (profile.cgpa >= 7.5) {
    score += 7;
    strengths.push('Good CGPA');
  } else if (profile.cgpa >= 6.5) {
    score += 4;
    feedback.push('Work on maintaining a higher CGPA');
  } else {
    score += 1;
    weaknesses.push('Low CGPA — focus on academics too');
  }

  // 7. Target Role selected (max 5 points)
  if (profile.targetRole && profile.targetRole !== '') {
    score += 5;
    strengths.push(`Target role selected: ${profile.targetRole}`);
  } else {
    weaknesses.push('No target role selected');
    feedback.push('Select a target role to get a personalized roadmap');
  }

  // Determine readiness level
  let readinessLevel = '';
  if (score >= 80) readinessLevel = 'Placement Ready';
  else if (score >= 60) readinessLevel = 'Almost Ready';
  else if (score >= 40) readinessLevel = 'In Progress';
  else readinessLevel = 'Just Getting Started';

  return { score, readinessLevel, strengths, weaknesses, feedback };
};

// @route   GET /api/readiness
// @desc    Get readiness score for logged in student
router.get('/', protect, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user._id });

    if (!profile) {
      return res.status(404).json({ message: 'Please complete your profile first to see your readiness score.' });
    }

    const result = calculateReadinessScore(profile);

    res.json({
      studentName: req.user.name,
      targetRole: profile.targetRole || 'Not selected',
      ...result
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;