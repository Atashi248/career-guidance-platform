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

    // If no progress exists yet, create empty one
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

    // Attach task details from roadmap
    const progressWithTasks = progress.weeklyProgress.map(wp => {
      const weekData = roadmap.weeklyRoadmap.find(w => w.week === wp.week);
      return {
        week: wp.week,
        title: weekData?.title || '',
        tasks: weekData?.tasks || [],
        completedTasks: wp.completedTasks,
        totalTasks: wp.totalTasks,
        completionPercentage: wp.completionPercentage
      };
    });

    res.json({
      role: progress.role,
      overallCompletionPercentage: progress.overallCompletionPercentage,
      weeklyProgress: progressWithTasks,
      lastUpdated: progress.lastUpdated
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/progress/task
// @desc    Mark a task as complete or incomplete
router.post('/task', protect, async (req, res) => {
  const { week, task, completed } = req.body;

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

    // Find the week and update completed tasks
    const weekProgress = progress.weeklyProgress.find(w => w.week === week);
    if (!weekProgress) {
      return res.status(404).json({ message: 'Week not found' });
    }

    if (completed) {
      if (!weekProgress.completedTasks.includes(task)) {
        weekProgress.completedTasks.push(task);
      }
    } else {
      weekProgress.completedTasks = weekProgress.completedTasks.filter(t => t !== task);
    }

    // Recalculate week completion percentage
    weekProgress.completionPercentage = Math.round(
      (weekProgress.completedTasks.length / weekProgress.totalTasks) * 100
    );

    // Recalculate overall completion percentage
    const totalTasks = progress.weeklyProgress.reduce((sum, w) => sum + w.totalTasks, 0);
    const totalCompleted = progress.weeklyProgress.reduce((sum, w) => sum + w.completedTasks.length, 0);
    progress.overallCompletionPercentage = Math.round((totalCompleted / totalTasks) * 100);
    progress.lastUpdated = Date.now();

    await progress.save();

    res.json({
      message: 'Progress updated',
      week: weekProgress.week,
      completedTasks: weekProgress.completedTasks,
      weekCompletionPercentage: weekProgress.completionPercentage,
      overallCompletionPercentage: progress.overallCompletionPercentage
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;