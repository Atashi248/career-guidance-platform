const express = require('express');
const router = express.Router();
const Profile = require('../models/Profile');
const RoleTemplate = require('../models/RoleTemplate');
const { protect } = require('../middleware/auth');

// @route   GET /api/recommendation
// @desc    Get recommended career role for the student
router.get('/', protect, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user._id });

    if (!profile) {
      return res.status(404).json({ message: 'Please complete your profile first.' });
    }

    const roleTemplates = await RoleTemplate.find();

    if (roleTemplates.length === 0) {
      return res.status(404).json({ message: 'No role templates found.' });
    }

    const studentSkills = (profile.skills || []).map(s => s.toLowerCase());
    const studentInterests = (profile.interests || []).map(i => i.toLowerCase());
    const dsaLevel = profile.dsaLevel || 'beginner';
    const cgpa = profile.cgpa || 0;

    // Interest-to-role mapping
    const interestRoleMap = {
      'web development': 'Full Stack Developer',
      'dsa': 'SDE',
      'data science': 'Data Analyst',
      'machine learning': 'Data Analyst',
      'cloud computing': 'Full Stack Developer',
      'devops': 'Full Stack Developer'
    };

    // Calculate score for each role
    const roleScores = roleTemplates.map(role => {
      let score = 0;
      const reasons = [];

      // 1. Skill Match (max 40 points)
      const requiredSkills = role.requiredSkills.map(s => s.toLowerCase());
      const matchedSkills = requiredSkills.filter(s => studentSkills.includes(s));
      const skillScore = (matchedSkills.length / requiredSkills.length) * 40;
      score += skillScore;

      if (matchedSkills.length > 0) {
        reasons.push(`You already have ${matchedSkills.length} of ${requiredSkills.length} required skills`);
      }

      // 2. Interest Match (max 25 points)
      const matchingInterests = studentInterests.filter(interest =>
        interestRoleMap[interest] === role.role
      );
      if (matchingInterests.length > 0) {
        score += 25;
        reasons.push(`Matches your interest in ${matchingInterests.join(', ')}`);
      }

      // 3. DSA Level Match (max 20 points)
      if (role.role === 'SDE') {
        if (dsaLevel === 'advanced') { score += 20; reasons.push('Your advanced DSA level is ideal for SDE role'); }
        else if (dsaLevel === 'intermediate') { score += 12; reasons.push('Your intermediate DSA level is good for SDE'); }
        else { score += 5; reasons.push('SDE role requires stronger DSA — you can improve'); }
      } else if (role.role === 'Full Stack Developer') {
        if (dsaLevel === 'intermediate') { score += 15; reasons.push('Intermediate DSA works well for Full Stack roles'); }
        else if (dsaLevel === 'beginner') { score += 10; reasons.push('Basic DSA is enough for Full Stack to start'); }
        else { score += 20; reasons.push('Strong DSA gives you an edge as Full Stack Developer'); }
      } else if (role.role === 'Data Analyst') {
        if (dsaLevel === 'beginner') { score += 15; reasons.push('Data Analyst role focuses more on logic than DSA'); }
        else { score += 10; }
      }

      // 4. CGPA Impact (max 15 points)
      if (cgpa >= 8.5) { score += 15; reasons.push(`Excellent CGPA (${cgpa}) boosts your profile`); }
      else if (cgpa >= 7.5) { score += 10; reasons.push(`Good CGPA (${cgpa}) supports this role`); }
      else if (cgpa >= 6.5) { score += 5; }

      return {
        role: role.role,
        description: role.description,
        requiredSkills: role.requiredSkills,
        matchPercentage: Math.round(score),
        matchedSkills: role.requiredSkills.filter(s => studentSkills.includes(s.toLowerCase())),
        missingSkills: role.requiredSkills.filter(s => !studentSkills.includes(s.toLowerCase())),
        reasons: reasons,
        isCurrentRole: profile.targetRole === role.role
      };
    });

    // Sort by score descending
    roleScores.sort((a, b) => b.matchPercentage - a.matchPercentage);

    const topRole = roleScores[0];

    // Confidence messaging
    let confidence = '';
    let confidenceLevel = '';
    if (topRole.matchPercentage >= 70) {
      confidence = 'High confidence — this role strongly matches your profile!';
      confidenceLevel = 'high';
    } else if (topRole.matchPercentage >= 50) {
      confidence = 'Good match — with some skill improvements, you can excel here.';
      confidenceLevel = 'medium';
    } else {
      confidence = 'Moderate match — you may need to develop more skills for this role.';
      confidenceLevel = 'low';
    }

    res.json({
      recommendedRole: topRole.role,
      recommendedRoleDetails: topRole,
      confidence: confidence,
      confidenceLevel: confidenceLevel,
      allRoles: roleScores,
      currentTargetRole: profile.targetRole || null
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;