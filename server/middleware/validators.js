const { body, validationResult } = require('express-validator');

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
};

// Register validation rules
const validateRegister = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/).withMessage('Name can only contain letters and spaces')
    .escape(),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role')
    .optional()
    .isIn(['student', 'admin']).withMessage('Role must be either student or admin'),
  handleValidationErrors
];

// Login validation rules
const validateLogin = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required'),
  handleValidationErrors
];

// Profile validation rules
const validateProfile = [
  body('cgpa')
    .optional({ checkFalsy: true })
    .isFloat({ min: 0, max: 10 }).withMessage('CGPA must be between 0 and 10'),
  body('phone')
    .optional({ checkFalsy: true })
    .matches(/^[0-9+\-\s()]{10,15}$/).withMessage('Please provide a valid phone number'),
  body('yearOfGraduation')
    .optional({ checkFalsy: true })
    .isInt({ min: 2020, max: 2035 }).withMessage('Year of graduation must be between 2020 and 2035'),
  body('dsaLevel')
    .optional({ checkFalsy: true })
    .isIn(['beginner', 'intermediate', 'advanced', '']).withMessage('Invalid DSA level'),
  body('targetRole')
    .optional({ checkFalsy: true })
    .isIn(['Full Stack Developer', 'SDE', 'Data Analyst', '']).withMessage('Invalid target role'),
  body('linkedIn')
    .optional({ checkFalsy: true })
    .isURL().withMessage('Please provide a valid LinkedIn URL'),
  body('github')
    .optional({ checkFalsy: true })
    .isURL().withMessage('Please provide a valid GitHub URL'),
  body('skills')
    .optional()
    .isArray().withMessage('Skills must be an array'),
  body('interests')
    .optional()
    .isArray().withMessage('Interests must be an array'),
  body('certifications')
    .optional()
    .isArray().withMessage('Certifications must be an array'),
  body('projects')
    .optional()
    .isArray().withMessage('Projects must be an array'),
  body('internships')
    .optional()
    .isArray().withMessage('Internships must be an array'),
  handleValidationErrors
];

// Task progress validation
const validateTaskProgress = [
  body('weekNumber')
    .notEmpty().withMessage('Week number is required')
    .isInt({ min: 1, max: 4 }).withMessage('Week number must be between 1 and 4'),
  body('taskIndex')
    .notEmpty().withMessage('Task index is required')
    .isInt({ min: 0 }).withMessage('Task index must be a positive number'),
  body('completed')
    .isBoolean().withMessage('Completed must be true or false'),
  handleValidationErrors
];

// Role template validation
const validateRoleTemplate = [
  body('role')
    .trim()
    .notEmpty().withMessage('Role name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Role name must be between 2 and 50 characters'),
  body('description')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
  body('requiredSkills')
    .optional()
    .isArray().withMessage('Required skills must be an array'),
  handleValidationErrors
];

module.exports = {
  validateRegister,
  validateLogin,
  validateProfile,
  validateTaskProgress,
  validateRoleTemplate,
  handleValidationErrors
};