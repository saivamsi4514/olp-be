const express = require('express');
const router = express.Router();
const { 
  createNewLesson, 
  fetchAllLessons, 
  fetchLessonsByCourse, 
  fetchLessonById, 
  modifyLesson, 
  removeLesson 
} = require('../controllers/lessonController');
const { authenticate, optionalAuth } = require('../middleware/authMiddleware');

// Get all lessons (public)
router.get('/', optionalAuth, fetchAllLessons);

// Get lesson by ID (public)
router.get('/:id', optionalAuth, fetchLessonById);

// Get lessons by course ID (public)
router.get('/course/:courseId', optionalAuth, fetchLessonsByCourse);

// Create new lesson (protected)
router.post('/', authenticate, createNewLesson);

// Update lesson (protected)
router.put('/:id', authenticate, modifyLesson);

// Delete lesson (protected)
router.delete('/:id', authenticate, removeLesson);

module.exports = router;