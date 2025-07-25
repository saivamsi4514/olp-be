const { 
  createLesson, 
  getLessonsByCourse, 
  getLessonById, 
  updateLesson, 
  deleteLesson, 
  getAllLessons 
} = require('../models/lessonModels');
const { getCourseById } = require('../models/courseModels');

/**
 * Create a new lesson
 */
const createNewLesson = async (req, res) => {
  try {
    const { courseId, title, description, content, duration, orderIndex, lessonType, videoUrl } = req.body;

    // Validate required fields
    if (!courseId || !title || !description || !duration || !lessonType) {
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

    const lessonId = await createLesson({
      courseId: parseInt(courseId),
      title: title.trim(),
      description: description.trim(),
      content: content || '',
      duration: parseInt(duration),
      orderIndex: orderIndex || 0,
      lessonType,
      videoUrl: videoUrl || null,
    });

    res.status(201).json({ 
      success: true,
      message: 'Lesson created successfully', 
      data: { lessonId }
    });
  } catch (err) {
    console.error('Error creating lesson:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { details: err.message })
    });
  }
};

/**
 * Get all lessons
 */
const fetchAllLessons = async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const lessons = await getAllLessons(parseInt(limit), parseInt(offset));
    
    res.status(200).json({
      success: true,
      data: lessons,
      meta: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        count: lessons.length
      }
    });
  } catch (err) {
    console.error('Error fetching lessons:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
};

/**
 * Get lessons by course ID
 */
const fetchLessonsByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    
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

    const lessons = await getLessonsByCourse(parseInt(courseId));

    res.status(200).json({
      success: true,
      data: lessons
    });
  } catch (err) {
    console.error('Error fetching course lessons:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
};

/**
 * Get lesson by ID
 */
const fetchLessonById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid lesson ID' 
      });
    }

    const lesson = await getLessonById(parseInt(id));

    if (!lesson) {
      return res.status(404).json({ 
        success: false,
        error: 'Lesson not found' 
      });
    }

    res.status(200).json({
      success: true,
      data: lesson
    });
  } catch (err) {
    console.error('Error fetching lesson:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
};

/**
 * Update lesson
 */
const modifyLesson = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid lesson ID' 
      });
    }

    const existingLesson = await getLessonById(parseInt(id));
    if (!existingLesson) {
      return res.status(404).json({ 
        success: false,
        error: 'Lesson not found' 
      });
    }

    const allowedUpdates = ['title', 'description', 'content', 'duration', 'order_index', 'video_url'];
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

    const updated = await updateLesson(parseInt(id), updates);

    res.status(200).json({
      success: true,
      message: 'Lesson updated successfully',
      data: updated
    });
  } catch (err) {
    console.error('Error updating lesson:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
};

/**
 * Delete lesson
 */
const removeLesson = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid lesson ID' 
      });
    }

    const existingLesson = await getLessonById(parseInt(id));
    if (!existingLesson) {
      return res.status(404).json({ 
        success: false,
        error: 'Lesson not found' 
      });
    }

    await deleteLesson(parseInt(id));

    res.status(200).json({
      success: true,
      message: 'Lesson deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting lesson:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
};

module.exports = {
  createNewLesson,
  fetchAllLessons,
  fetchLessonsByCourse,
  fetchLessonById,
  modifyLesson,
  removeLesson,
};