const express = require('express');
const router = express.Router();
const Progress = require('../models/Progress');
const Profile = require('../models/Profile');
const RoleTemplate = require('../models/RoleTemplate');
const { protect } = require('../middleware/auth');

// @route   GET /api/progress
// @desc    Get student's progress
router.get('/', protect, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user._id });
    if (!profile || !profile.targetRole) {
      return res.status(404).json({ message: 'Please select a target role first.' });
    }

    let progress = await Progress.findOne({ user: req.user._id });
    const roadmap = await RoleTemplate.findOne({ role: profile.targetRole });

    if (!roadmap) {
      return res.status(404).json({ message: 'Roadmap not found for your role.' });
    }

    if (!progress) {
      const weeklyProgress = roadmap.weeklyRoadmap.map(week => ({
        week: week.week,
        completedTasks: [],
        totalTasks: week.tasks.length,
        completionPercentage: 0
      }));

      progress = await Progress.create({
        user: req.user._id,
        role: profile.targetRole,
        weeklyProgress,
        overallCompletionPercentage: 0
      });
    }

    // Build response in format frontend expects
    const completedTasks = [];
    const weeklyCompletion = {};

    progress.weeklyProgress.forEach(wp => {
      wp.completedTasks.forEach(taskIndex => {
        completedTasks.push({ weekNumber: wp.week, taskIndex: Number(taskIndex) });
      });
      weeklyCompletion[`week${wp.week}`] = wp.completionPercentage;
    });

    res.json({
      role: progress.role,
      overallCompletionPercentage: progress.overallCompletionPercentage,
      completedTasks,
      weeklyCompletion,
      lastUpdated: progress.lastUpdated
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/progress/task
// @desc    Mark a task as complete or incomplete (TOGGLE)
router.post('/task', protect, async (req, res) => {
  let { weekNumber, taskIndex, completed } = req.body;

  // Coerce to numbers — prevents string/number mismatch bugs
  weekNumber = Number(weekNumber);
  taskIndex = Number(taskIndex);

  if (isNaN(weekNumber) || isNaN(taskIndex)) {
    return res.status(400).json({ message: 'Invalid weekNumber or taskIndex' });
  }

  try {
    const profile = await Profile.findOne({ user: req.user._id });
    if (!profile || !profile.targetRole) {
      return res.status(404).json({ message: 'Please select a target role first.' });
    }

    const roadmap = await RoleTemplate.findOne({ role: profile.targetRole });
    let progress = await Progress.findOne({ user: req.user._id });

    if (!progress) {
      const weeklyProgress = roadmap.weeklyRoadmap.map(w => ({
        week: w.week,
        completedTasks: [],
        totalTasks: w.tasks.length,
        completionPercentage: 0
      }));
      progress = await Progress.create({
        user: req.user._id,
        role: profile.targetRole,
        weeklyProgress,
        overallCompletionPercentage: 0
      });
    }

    const weekProgress = progress.weeklyProgress.find(w => w.week === weekNumber);
    if (!weekProgress) {
      return res.status(404).json({ message: 'Week not found' });
    }

    // Normalize existing entries to numbers (fixes legacy string entries from old bug)
    weekProgress.completedTasks = weekProgress.completedTasks
      .map(t => Number(t))
      .filter(t => !isNaN(t));

    // Deduplicate using Set
    const completedSet = new Set(weekProgress.completedTasks);

    if (completed) {
      completedSet.add(taskIndex);
    } else {
      completedSet.delete(taskIndex);
    }

    weekProgress.completedTasks = Array.from(completedSet);

    // Recalculate week % — capped at 100
    weekProgress.completionPercentage = Math.min(
      100,
      Math.round((weekProgress.completedTasks.length / weekProgress.totalTasks) * 100)
    );

    // Recalculate overall % — capped at 100
    const totalTasks = progress.weeklyProgress.reduce((sum, w) => sum + w.totalTasks, 0);
    const totalCompleted = progress.weeklyProgress.reduce(
      (sum, w) => sum + w.completedTasks.length,
      0
    );
    progress.overallCompletionPercentage = Math.min(
      100,
      Math.round((totalCompleted / totalTasks) * 100)
    );
    progress.lastUpdated = Date.now();

    // Mark nested array as modified so Mongoose saves the change
    progress.markModified('weeklyProgress');
    await progress.save();

    // Return progress in format frontend expects
    const completedTasksList = [];
    const weeklyCompletion = {};
    progress.weeklyProgress.forEach(wp => {
      wp.completedTasks.forEach(ti => {
        completedTasksList.push({ weekNumber: wp.week, taskIndex: Number(ti) });
      });
      weeklyCompletion[`week${wp.week}`] = wp.completionPercentage;
    });

    res.json({
      role: progress.role,
      overallCompletionPercentage: progress.overallCompletionPercentage,
      completedTasks: completedTasksList,
      weeklyCompletion,
      lastUpdated: progress.lastUpdated
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;