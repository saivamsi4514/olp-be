// Enrollment middleware to check if user has access to course content
const { hasActiveSubscription } = require('../models/subscriptionModels');
const { getCourseById } = require('../models/courseModels');

/**
 * Check if user is enrolled in course
 */
const checkEnrollment = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const userId = req.user ? req.user.userId : null;

    // If no user (public access), continue
    if (!userId) {
      return next();
    }

    // If no courseId in params, continue
    if (!courseId) {
      return next();
    }

    // Check if course exists
    const course = await getCourseById(parseInt(courseId));
    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }

    // Check if user has active subscription
    const isEnrolled = await hasActiveSubscription(userId, parseInt(courseId));
    
    // Add enrollment status to request
    req.isEnrolled = isEnrolled;
    req.course = course;

    next();
  } catch (error) {
    console.error('Enrollment check error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to check enrollment status'
    });
  }
};

/**
 * Require enrollment for protected content
 */
const requireEnrollment = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  if (!req.isEnrolled) {
    return res.status(403).json({
      success: false,
      error: 'Course enrollment required to access this content',
      enrollmentRequired: true,
      courseId: req.course ? req.course.id : null
    });
  }

  next();
};

/**
 * Check enrollment for specific route patterns
 */
const checkCourseAccess = (req, res, next) => {
  // Extract courseId from different possible locations
  let courseId = req.params.courseId || req.body.courseId || req.query.courseId;
  
  // For lesson routes, get courseId from lesson
  if (req.params.lessonId && !courseId) {
    // This would require a database call to get the course from lesson
    // For now, we'll skip this check
    return next();
  }

  if (courseId) {
    req.params.courseId = courseId;
    return checkEnrollment(req, res, next);
  }

  next();
};

module.exports = {
  checkEnrollment,
  requireEnrollment,
  checkCourseAccess
};