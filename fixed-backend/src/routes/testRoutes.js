const express = require('express');
const router = express.Router();
const { 
  createNewTest, 
  fetchAllTests, 
  fetchTestsByCourse, 
  fetchTestById, 
  addTestQuestion,
  modifyTest, 
  removeTest 
} = require('../controllers/testController');
const { authenticate, optionalAuth } = require('../middleware/authMiddleware');

// Get all tests (public)
router.get('/', optionalAuth, fetchAllTests);

// Get test by ID (public)
router.get('/:id', optionalAuth, fetchTestById);

// Get tests by course ID (public)
router.get('/course/:courseId', optionalAuth, fetchTestsByCourse);

// Create new test (protected)
router.post('/', authenticate, createNewTest);

// Add question to test (protected)
router.post('/:testId/questions', authenticate, addTestQuestion);

// Update test (protected)
router.put('/:id', authenticate, modifyTest);

// Delete test (protected)
router.delete('/:id', authenticate, removeTest);

module.exports = router;