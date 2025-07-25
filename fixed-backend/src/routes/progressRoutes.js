const express = require('express');
const router = express.Router();
const { 
  recordProgress, 
  fetchCourseProgress, 
  fetchUserProgress, 
  modifyProgress,
  fetchCourseStats 
} = require('../controllers/progressController');
const { authenticate } = require('../middleware/authMiddleware');

// All progress routes require authentication

// Record progress (protected)
router.post('/', authenticate, recordProgress);

// Get user's overall progress (protected)
router.get('/', authenticate, fetchUserProgress);

// Get course-specific progress (protected)
router.get('/course/:courseId', authenticate, fetchCourseProgress);

// Get course completion statistics (protected)
router.get('/course/:courseId/stats', authenticate, fetchCourseStats);

// Update progress (protected)
router.put('/:id', authenticate, modifyProgress);

module.exports = router;