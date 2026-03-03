const express = require('express');
const router = express.Router();
const RoleTemplate = require('../models/RoleTemplate');
const Profile = require('../models/Profile');
const { protect, adminOnly } = require('../middleware/auth');

// @route   GET /api/roadmap/me
// @desc    Get roadmap based on student's target role
router.get('/me', protect, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user._id });
    if (!profile || !profile.targetRole) {
      return res.status(404).json({ message: 'Please select a target role in your profile first.' });
    }

    const roadmap = await RoleTemplate.findOne({ role: profile.targetRole });
    if (!roadmap) {
      return res.status(404).json({ message: 'Roadmap not found for your target role.' });
    }

    res.json(roadmap);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/roadmap/roles
// @desc    Get all available roles
router.get('/roles', protect, async (req, res) => {
  try {
    const roles = await RoleTemplate.find().select('role description requiredSkills');
    res.json(roles);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/roadmap/seed
// @desc    Seed role templates (admin only)
router.post('/seed', protect, adminOnly, async (req, res) => {
  try {
    await RoleTemplate.deleteMany({});

    const templates = [
      {
        role: 'Full Stack Developer',
        description: 'Build complete web applications using frontend and backend technologies.',
        requiredSkills: ['HTML', 'CSS', 'JavaScript', 'React', 'Node.js', 'Express', 'MongoDB', 'Git'],
        weeklyRoadmap: [
          {
            week: 1,
            title: 'HTML, CSS & JavaScript Fundamentals',
            tasks: ['Learn HTML5 semantic tags', 'CSS Flexbox and Grid', 'JavaScript basics - variables, loops, functions', 'Build a static portfolio page'],
            resources: [
              { title: 'HTML & CSS Crash Course', link: 'https://www.youtube.com/watch?v=916GWv2Qs08', type: 'video' },
              { title: 'JavaScript Tutorial for Beginners', link: 'https://www.youtube.com/watch?v=W6NZfCO5SIk', type: 'video' },
              { title: 'MDN Web Docs', link: 'https://developer.mozilla.org', type: 'article' }
            ]
          },
          {
            week: 2,
            title: 'React.js Basics',
            tasks: ['Components and Props', 'State and useState hook', 'useEffect hook', 'Build a Todo app in React'],
            resources: [
              { title: 'React Official Docs', link: 'https://react.dev', type: 'article' },
              { title: 'React Crash Course', link: 'https://www.youtube.com/watch?v=w7ejDZ8SWv8', type: 'video' }
            ]
          },
          {
            week: 3,
            title: 'Node.js & Express Backend',
            tasks: ['Node.js basics', 'Build REST APIs with Express', 'Middleware and routing', 'Connect to MongoDB'],
            resources: [
              { title: 'Node.js Crash Course', link: 'https://www.youtube.com/watch?v=fBNz5xF-Kx4', type: 'video' },
              { title: 'Express.js Docs', link: 'https://expressjs.com', type: 'article' }
            ]
          },
          {
            week: 4,
            title: 'Full Stack Project & DSA',
            tasks: ['Build a full stack MERN project', 'Practice 20 DSA problems on arrays and strings', 'Deploy project on Vercel/Render', 'Push code to GitHub'],
            resources: [
              { title: 'MERN Stack Project Tutorial', link: 'https://www.youtube.com/watch?v=7CqJlxBYj-M', type: 'video' },
              { title: 'LeetCode Practice', link: 'https://leetcode.com', type: 'practice' }
            ]
          }
        ]
      },
      {
        role: 'SDE',
        description: 'Software Development Engineer focused on DSA, problem solving and core CS concepts.',
        requiredSkills: ['DSA', 'C++/Java', 'System Design basics', 'OOP', 'OS', 'DBMS', 'Computer Networks'],
        weeklyRoadmap: [
          {
            week: 1,
            title: 'Arrays, Strings & Recursion',
            tasks: ['Solve 30 array problems', 'Solve 20 string problems', 'Recursion basics and practice', 'Learn Big O notation'],
            resources: [
              { title: 'Striver DSA Sheet', link: 'https://takeuforward.org/strivers-a2z-dsa-course', type: 'practice' },
              { title: 'LeetCode', link: 'https://leetcode.com', type: 'practice' }
            ]
          },
          {
            week: 2,
            title: 'Linked Lists, Stacks & Queues',
            tasks: ['Linked list operations', 'Stack and Queue problems', 'Solve 25 problems', 'Learn sliding window technique'],
            resources: [
              { title: 'Striver DSA Playlist', link: 'https://www.youtube.com/watch?v=0IAPZzGSbME', type: 'video' },
              { title: 'GFG DSA', link: 'https://www.geeksforgeeks.org/data-structures', type: 'article' }
            ]
          },
          {
            week: 3,
            title: 'Trees, Graphs & Dynamic Programming',
            tasks: ['Binary trees traversals', 'Graph BFS and DFS', 'DP basics - memoization and tabulation', 'Solve 30 problems'],
            resources: [
              { title: 'DP Playlist by Striver', link: 'https://www.youtube.com/watch?v=FfXoiwwnxFw', type: 'video' },
              { title: 'LeetCode DP problems', link: 'https://leetcode.com/tag/dynamic-programming', type: 'practice' }
            ]
          },
          {
            week: 4,
            title: 'Core CS Subjects & Mock Interviews',
            tasks: ['OS concepts - processes, threads, scheduling', 'DBMS - SQL queries, normalization', 'CN - TCP/IP, HTTP', 'Give 3 mock interviews'],
            resources: [
              { title: 'OS by Gate Smashers', link: 'https://www.youtube.com/watch?v=bkSWJJZNgf8', type: 'video' },
              { title: 'InterviewBit', link: 'https://www.interviewbit.com', type: 'practice' }
            ]
          }
        ]
      },
      {
        role: 'Data Analyst',
        description: 'Analyze data to provide business insights using Python, SQL and visualization tools.',
        requiredSkills: ['Python', 'SQL', 'Pandas', 'NumPy', 'Matplotlib', 'Excel', 'Power BI/Tableau'],
        weeklyRoadmap: [
          {
            week: 1,
            title: 'Python & SQL Basics',
            tasks: ['Python basics - lists, dicts, loops, functions', 'SQL - SELECT, WHERE, JOIN, GROUP BY', 'Solve 20 SQL problems', 'Build a simple Python script'],
            resources: [
              { title: 'Python for Beginners', link: 'https://www.youtube.com/watch?v=_uQrJ0TkZlc', type: 'video' },
              { title: 'SQLZoo Practice', link: 'https://sqlzoo.net', type: 'practice' }
            ]
          },
          {
            week: 2,
            title: 'Pandas & NumPy for Data Analysis',
            tasks: ['Load and clean datasets with Pandas', 'NumPy array operations', 'Handle missing data', 'Analyze a real dataset from Kaggle'],
            resources: [
              { title: 'Pandas Tutorial', link: 'https://www.youtube.com/watch?v=vmEHCJofslg', type: 'video' },
              { title: 'Kaggle Datasets', link: 'https://www.kaggle.com/datasets', type: 'practice' }
            ]
          },
          {
            week: 3,
            title: 'Data Visualization',
            tasks: ['Matplotlib and Seaborn charts', 'Build dashboards in Power BI', 'Create 3 visualizations from a dataset', 'Learn storytelling with data'],
            resources: [
              { title: 'Matplotlib Tutorial', link: 'https://www.youtube.com/watch?v=3Xc3CA655Y4', type: 'video' },
              { title: 'Power BI Tutorial', link: 'https://www.youtube.com/watch?v=AGrl-H87pRU', type: 'video' }
            ]
          },
          {
            week: 4,
            title: 'End to End Data Project',
            tasks: ['Pick a dataset from Kaggle', 'Clean, analyze and visualize it', 'Write findings in a report', 'Upload project to GitHub'],
            resources: [
              { title: 'Kaggle', link: 'https://www.kaggle.com', type: 'practice' },
              { title: 'Google Data Analytics Certificate', link: 'https://www.coursera.org/professional-certificates/google-data-analytics', type: 'course' }
            ]
          }
        ]
      }
    ];

    await RoleTemplate.insertMany(templates);
    res.json({ message: 'Role templates seeded successfully!', count: templates.length });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;