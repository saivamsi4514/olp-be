const { 
  createProgress, 
  getCourseProgress, 
  getUserProgress, 
  updateProgress, 
  getProgressById,
  getCourseCompletionRate 
} = require('../models/progressModels');
const { getCourseById } = require('../models/courseModels');
const { findUserById } = require('../models/authModels');

/**
 * Record progress
 */
const recordProgress = async (req, res) => {
  try {
    const { courseId, lessonId, testId, progressType, status, score, timeSpent } = req.body;
    const userId = req.user.userId;

    // Validate required fields
    if (!courseId || !progressType || !status) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing required fields' 
      });
    }

    // Verify course exists
    const course = await getCourseById(courseId);
    if (!course) {
      return res.status(404).json({ 
        success: false,
        error: 'Course not found' 
      });
    }

    const progressId = await createProgress({
      userId,
      courseId: parseInt(courseId),
      lessonId: lessonId ? parseInt(lessonId) : null,
      testId: testId ? parseInt(testId) : null,
      progressType,
      status,
      score: score || null,
      timeSpent: timeSpent || 0,
    });

    res.status(201).json({ 
      success: true,
      message: 'Progress recorded successfully', 
      data: { progressId }
    });
  } catch (err) {
    console.error('Error recording progress:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { details: err.message })
    });
  }
};

/**
 * Get user's course progress
 */
const fetchCourseProgress = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.userId;
    
    if (!courseId || isNaN(courseId)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid course ID' 
      });
    }

    // Verify course exists
    const course = await getCourseById(parseInt(courseId));
    if (!course) {
      return res.status(404).json({ 
        success: false,
        error: 'Course not found' 
      });
    }

    const progress = await getCourseProgress(userId, parseInt(courseId));
    const completionData = await getCourseCompletionRate(userId, parseInt(courseId));

    res.status(200).json({
      success: true,
      data: {
        course: {
          id: course.id,
          title: course.title
        },
        progress,
        completion: completionData
      }
    });
  } catch (err) {
    console.error('Error fetching course progress:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
};

/**
 * Get user's overall progress
 */
const fetchUserProgress = async (req, res) => {
  try {
    const userId = req.user.userId;
    const progress = await getUserProgress(userId);

    res.status(200).json({
      success: true,
      data: progress
    });
  } catch (err) {
    console.error('Error fetching user progress:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
};

/**
 * Update progress
 */
const modifyProgress = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid progress ID' 
      });
    }

    const existingProgress = await getProgressById(parseInt(id));
    if (!existingProgress) {
      return res.status(404).json({ 
        success: false,
        error: 'Progress record not found' 
      });
    }

    // Check if user owns this progress record
    if (existingProgress.user_id !== userId) {
      return res.status(403).json({ 
        success: false,
        error: 'Access denied' 
      });
    }

    const allowedUpdates = ['status', 'score', 'time_spent'];
    const updates = {};
    
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key) && req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    });

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ 
        success: false,
        error: 'No valid fields to update' 
      });
    }

    const updated = await updateProgress(parseInt(id), updates);

    res.status(200).json({
      success: true,
      message: 'Progress updated successfully',
      data: { updated }
    });
  } catch (err) {
    console.error('Error updating progress:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
};

/**
 * Get course completion statistics
 */
const fetchCourseStats = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.userId;
    
    if (!courseId || isNaN(courseId)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid course ID' 
      });
    }

    const course = await getCourseById(parseInt(courseId));
    if (!course) {
      return res.status(404).json({ 
        success: false,
        error: 'Course not found' 
      });
    }

    const stats = await getCourseCompletionRate(userId, parseInt(courseId));

    res.status(200).json({
      success: true,
      data: {
        courseId: parseInt(courseId),
        courseTitle: course.title,
        statistics: stats
      }
    });
  } catch (err) {
    console.error('Error fetching course stats:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
};

module.exports = {
  recordProgress,
  fetchCourseProgress,
  fetchUserProgress,
  modifyProgress,
  fetchCourseStats,
};