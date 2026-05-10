const express = require('express');
const router = express.Router();
const Resource = require('../models/Resource');
const { protect, adminOnly } = require('../middleware/auth');

// @route   GET /api/resources
// @desc    Get all resources with optional filters
router.get('/', protect, async (req, res) => {
  try {
    const { category, type, difficulty, search } = req.query;
    const filter = {};

    if (category) filter.category = category;
    if (type) filter.type = type;
    if (difficulty) filter.difficulty = difficulty;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { subCategory: { $regex: search, $options: 'i' } }
      ];
    }

    const resources = await Resource.find(filter).sort({ category: 1, title: 1 });

    // Group by category for stats
    const stats = {
      total: resources.length,
      Development: resources.filter(r => r.category === 'Development').length,
      DSA: resources.filter(r => r.category === 'DSA').length,
      Aptitude: resources.filter(r => r.category === 'Aptitude').length,
      'Core CS': resources.filter(r => r.category === 'Core CS').length
    };

    res.json({ resources, stats });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/resources
// @desc    Add a resource (admin only)
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const resource = new Resource(req.body);
    await resource.save();
    res.status(201).json(resource);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/resources/seed
// @desc    Seed initial resources (admin only) - uses upsert so it can re-run safely
router.post('/seed', protect, adminOnly, async (req, res) => {
  try {
    // Clear old resources first so we can refresh with curated ones
    await Resource.deleteMany({});

    const initialResources = [
      // ===== DEVELOPMENT (3) =====
      {
        title: 'Apna College — Web Development (Delta Course Free Playlist)',
        description: 'Complete Hindi web development course by Shradha Khapra (Apna College) — HTML, CSS, JavaScript, React, Node, MongoDB.',
        url: 'https://www.youtube.com/playlist?list=PLfqMhTWNBTe3H6c9OGXb5_6wcc1Mca52n',
        type: 'video',
        category: 'Development',
        subCategory: 'Full Stack',
        difficulty: 'beginner',
        isFree: true,
        tags: ['hindi', 'apna-college', 'mern', 'html', 'css', 'javascript']
      },
      {
        title: 'CodeWithHarry — JavaScript Tutorials in Hindi',
        description: 'Beginner-friendly JavaScript playlist by Harry. Covers variables, functions, DOM, ES6, async/await — start to finish.',
        url: 'https://www.youtube.com/playlist?list=PLu0W_9lII9ajyk081To1Cbt2eI5913SsL',
        type: 'video',
        category: 'Development',
        subCategory: 'JavaScript',
        difficulty: 'beginner',
        isFree: true,
        tags: ['hindi', 'codewithharry', 'javascript']
      },
      {
        title: 'Chai aur Code — React + Backend (Hitesh Choudhary)',
        description: 'Hitesh Choudhary\'s Hindi channel covering modern React, Node, Express, MongoDB and full backend projects.',
        url: 'https://www.youtube.com/@chaiaurcode',
        type: 'video',
        category: 'Development',
        subCategory: 'React & Backend',
        difficulty: 'intermediate',
        isFree: true,
        tags: ['hindi', 'chai-aur-code', 'react', 'nodejs', 'mern']
      },

      // ===== DSA (3) =====
      {
        title: 'Apna College — DSA in Java (Free Playlist)',
        description: 'Complete DSA series in Java by Apna College in Hindi. Covers all fundamentals, sorting, recursion, trees, graphs and DP.',
        url: 'https://www.youtube.com/playlist?list=PLfqMhTWNBTe0b2nM6JHVCnAkhQRGiZMSJ',
        type: 'video',
        category: 'DSA',
        subCategory: 'Java',
        difficulty: 'beginner',
        isFree: true,
        tags: ['hindi', 'apna-college', 'java', 'dsa']
      },
      {
        title: 'Striver\'s A2Z DSA Course / Sheet (takeUforward)',
        description: 'India\'s most popular structured DSA roadmap with 450+ problems organized by topic. Free video lectures + sheet.',
        url: 'https://takeuforward.org/strivers-a2z-dsa-course/strivers-a2z-dsa-course-sheet-2',
        type: 'practice',
        category: 'DSA',
        subCategory: 'Problem Sheet',
        difficulty: 'intermediate',
        isFree: true,
        tags: ['striver', 'a2z', 'dsa-sheet', 'placement']
      },
      {
        title: 'CodeHelp by Babbar — DSA Supreme (Free Playlist)',
        description: 'Love Babbar\'s free DSA Hindi playlist on his CodeHelp channel — C++ based, very thorough explanations.',
        url: 'https://www.youtube.com/@CodeHelp',
        type: 'video',
        category: 'DSA',
        subCategory: 'C++',
        difficulty: 'beginner',
        isFree: true,
        tags: ['hindi', 'love-babbar', 'codehelp', 'cpp', 'dsa']
      },

      // ===== APTITUDE (2) =====
      {
        title: 'Aman Dhattarwal — Placement Aptitude Preparation',
        description: 'Hindi aptitude prep for campus placements — quant, logical reasoning, verbal — by Aman Dhattarwal.',
        url: 'https://www.youtube.com/@AmanDhattarwal',
        type: 'video',
        category: 'Aptitude',
        subCategory: 'Mixed',
        difficulty: 'beginner',
        isFree: true,
        tags: ['hindi', 'aman-dhattarwal', 'placement', 'aptitude']
      },
      {
        title: 'PrepInsta — Aptitude Practice (Company-wise)',
        description: 'Practice aptitude questions for TCS, Infosys, Wipro, Cognizant, Capgemini and more — actual placement-pattern questions.',
        url: 'https://prepinsta.com/aptitude/',
        type: 'practice',
        category: 'Aptitude',
        subCategory: 'Company-wise',
        difficulty: 'intermediate',
        isFree: true,
        tags: ['prepinsta', 'placement', 'company-wise']
      },

      // ===== CORE CS (4) =====
      {
        title: 'Gate Smashers — Operating Systems (Complete Hindi Playlist)',
        description: 'The gold-standard OS playlist for Indian students. Process scheduling, memory management, deadlocks, file systems — everything in Hindi.',
        url: 'https://www.youtube.com/playlist?list=PLxCzCOWd7aiGz9donHRRE9I3Mwn6XdP8p',
        type: 'video',
        category: 'Core CS',
        subCategory: 'OS',
        difficulty: 'intermediate',
        isFree: true,
        tags: ['hindi', 'gate-smashers', 'os', 'operating-systems']
      },
      {
        title: 'Gate Smashers — DBMS (Complete Hindi Playlist)',
        description: 'Complete DBMS playlist by Gate Smashers — ER model, normalization, SQL, transactions, indexing. Crisp explanations.',
        url: 'https://www.youtube.com/playlist?list=PLxCzCOWd7aiFAN6I8CuViBuCdJgiOkT2Y',
        type: 'video',
        category: 'Core CS',
        subCategory: 'DBMS',
        difficulty: 'intermediate',
        isFree: true,
        tags: ['hindi', 'gate-smashers', 'dbms', 'sql']
      },
      {
        title: 'Gate Smashers — Computer Networks (Complete Hindi Playlist)',
        description: 'OSI model, TCP/IP, routing, network security — full Hindi CN course by Gate Smashers.',
        url: 'https://www.youtube.com/playlist?list=PLxCzCOWd7aiGFBD2-2joCpWOLUrDLvVV_',
        type: 'video',
        category: 'Core CS',
        subCategory: 'Networks',
        difficulty: 'intermediate',
        isFree: true,
        tags: ['hindi', 'gate-smashers', 'computer-networks', 'cn']
      },
      {
        title: 'Knowledge Gate — OOPs Concepts (Hindi)',
        description: 'OOPs fundamentals — classes, objects, inheritance, polymorphism, abstraction — explained in Hindi by Knowledge Gate.',
        url: 'https://www.youtube.com/@KnowledgeGate_kg',
        type: 'video',
        category: 'Core CS',
        subCategory: 'OOP',
        difficulty: 'beginner',
        isFree: true,
        tags: ['hindi', 'knowledge-gate', 'oop', 'oops']
      }
    ];

    await Resource.insertMany(initialResources);
    res.json({ 
      message: `${initialResources.length} curated Hindi-creator resources seeded successfully`,
      count: initialResources.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;