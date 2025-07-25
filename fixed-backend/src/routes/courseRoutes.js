const express = require('express');
const router = express.Router();
const { 
  createNewCourse, 
  fetchAllCourses, 
  fetchCourseById, 
  modifyCourse, 
  removeCourse 
} = require('../controllers/courseController');
const { authenticate, authorize, optionalAuth } = require('../middleware/authMiddleware');
const { validate, validateCourse } = require('../middleware/validation');

// ✅ FIXED: Enhanced routes with proper authentication and validation

// Get all courses (public, but can be enhanced with user context)
router.get('/', optionalAuth, fetchAllCourses);

// Get a course by ID (public)
router.get('/:id', optionalAuth, fetchCourseById);

// Create a new course (requires authentication)
router.post('/', authenticate, validate(validateCourse), createNewCourse);

// Update a course (requires authentication - only course creator or admin)
router.put('/:id', authenticate, modifyCourse);

// Delete a course (requires authentication - only course creator or admin)
router.delete('/:id', authenticate, removeCourse);

// ✅ NEW: Additional course-related endpoints

// Get courses by educator
router.get('/educator/:educatorId', optionalAuth, async (req, res) => {
  try {
    const { educatorId } = req.params;
    const { getAllCourses } = require('../models/courseModels');
    
    if (!educatorId || isNaN(educatorId)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid educator ID' 
      });
    }

    const courses = await getAllCourses({ educatorId: parseInt(educatorId) });
    
    res.status(200).json({
      success: true,
      data: courses
    });
  } catch (error) {
    console.error('Error fetching educator courses:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Get courses by target exam
router.get('/exam/:targetExam', optionalAuth, async (req, res) => {
  try {
    const { targetExam } = req.params;
    const { getAllCourses } = require('../models/courseModels');
    
    const validExams = ['JEE', 'NEET', 'GATE', 'UPSC', 'CAT', 'GRE', 'GMAT', 'IELTS', 'TOEFL'];
    if (!validExams.includes(targetExam)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid target exam' 
      });
    }

    const courses = await getAllCourses({ targetExam });
    
    res.status(200).json({
      success: true,
      data: courses
    });
  } catch (error) {
    console.error('Error fetching exam courses:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Search courses
router.get('/search/:query', optionalAuth, async (req, res) => {
  try {
    const { query } = req.params;
    const { limit = 20, offset = 0 } = req.query;
    
    if (!query || query.length < 2) {
      return res.status(400).json({ 
        success: false,
        error: 'Search query must be at least 2 characters' 
      });
    }

    // This would require implementing search in your courseModels
    // For now, returning a placeholder response
    res.status(200).json({
      success: true,
      message: 'Search functionality to be implemented',
      data: []
    });
  } catch (error) {
    console.error('Error searching courses:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

module.exports = router;