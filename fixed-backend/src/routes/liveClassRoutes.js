const express = require('express');
const router = express.Router();
const { 
  createNewLiveClass, 
  fetchAllLiveClasses, 
  fetchLiveClassesByCourse, 
  fetchLiveClassById, 
  registerForClass,
  modifyLiveClass, 
  removeLiveClass 
} = require('../controllers/liveClassController');
const { authenticate, optionalAuth } = require('../middleware/authMiddleware');

// Get all live classes (public)
router.get('/', optionalAuth, fetchAllLiveClasses);

// Get live class by ID (public)
router.get('/:id', optionalAuth, fetchLiveClassById);

// Get live classes by course ID (public)
router.get('/course/:courseId', optionalAuth, fetchLiveClassesByCourse);

// Register for live class (protected)
router.post('/:id/register', authenticate, registerForClass);

// Create new live class (protected)
router.post('/', authenticate, createNewLiveClass);

// Update live class (protected)
router.put('/:id', authenticate, modifyLiveClass);

// Delete live class (protected)
router.delete('/:id', authenticate, removeLiveClass);

module.exports = router;