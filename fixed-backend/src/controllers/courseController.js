const { createCourse, getAllCourses, getCourseById, updateCourse, deleteCourse } = require('../models/courseModels');
const { validateCourse } = require('../middleware/validation');

// ✅ FIXED: Improved course creation with proper validation
const createNewCourse = async (req, res) => {
  try {
    const { title, description, educatorId, targetExam, duration, validityPeriod, price, discount, courseType } = req.body;

    // ✅ FIXED: Proper validation
    const validation = validateCourse(req.body);
    if (!validation.isValid) {
      return res.status(400).json({ 
        success: false,
        error: 'Validation failed', 
        details: validation.errors 
      });
    }

    const courseData = {
      title: title.trim(),
      description: description.trim(),
      educatorId,
      targetExam,
      duration,
      validityPeriod,
      price: parseFloat(price),
      discount: discount ? parseFloat(discount) : 0,
      courseType,
    };

    const courseId = await createCourse(courseData);

    // ✅ FIXED: Consistent response format
    res.status(201).json({ 
      success: true,
      message: 'Course created successfully', 
      data: { courseId, ...courseData }
    });
  } catch (err) {
    console.error('Error creating course:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { details: err.message })
    });
  }
};

// ✅ FIXED: Improved course fetching with filtering
const fetchAllCourses = async (req, res) => {
  try {
    const { targetExam, courseType, minPrice, maxPrice, limit = 50, offset = 0 } = req.query;
    
    // ✅ NEW: Add filtering options
    const filters = {};
    if (targetExam) filters.targetExam = targetExam;
    if (courseType) filters.courseType = courseType;
    if (minPrice) filters.minPrice = parseFloat(minPrice);
    if (maxPrice) filters.maxPrice = parseFloat(maxPrice);

    const courses = await getAllCourses(filters, parseInt(limit), parseInt(offset));
    
    res.status(200).json({
      success: true,
      data: courses,
      meta: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        count: courses.length
      }
    });
  } catch (err) {
    console.error('Error fetching courses:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
};

// ✅ FIXED: Improved single course fetching
const fetchCourseById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // ✅ FIXED: Validate ID parameter
    if (!id || isNaN(id)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid course ID' 
      });
    }

    const course = await getCourseById(parseInt(id));

    if (!course) {
      return res.status(404).json({ 
        success: false,
        error: 'Course not found' 
      });
    }

    res.status(200).json({
      success: true,
      data: course
    });
  } catch (err) {
    console.error('Error fetching course:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
};

// ✅ FIXED: Implement course update
const modifyCourse = async (req, res) => {
  try {
    const { id } = req.params;
    
    // ✅ FIXED: Validate ID parameter
    if (!id || isNaN(id)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid course ID' 
      });
    }

    // Check if course exists
    const existingCourse = await getCourseById(parseInt(id));
    if (!existingCourse) {
      return res.status(404).json({ 
        success: false,
        error: 'Course not found' 
      });
    }

    // ✅ FIXED: Validate update data
    const allowedUpdates = ['title', 'description', 'duration', 'validityPeriod', 'price', 'discount'];
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

    const updated = await updateCourse(parseInt(id), updates);

    res.status(200).json({
      success: true,
      message: 'Course updated successfully',
      data: updated
    });
  } catch (err) {
    console.error('Error updating course:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
};

// ✅ FIXED: Implement course deletion
const removeCourse = async (req, res) => {
  try {
    const { id } = req.params;
    
    // ✅ FIXED: Validate ID parameter
    if (!id || isNaN(id)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid course ID' 
      });
    }

    // Check if course exists
    const existingCourse = await getCourseById(parseInt(id));
    if (!existingCourse) {
      return res.status(404).json({ 
        success: false,
        error: 'Course not found' 
      });
    }

    await deleteCourse(parseInt(id));

    res.status(200).json({
      success: true,
      message: 'Course deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting course:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
};

module.exports = {
  createNewCourse,
  fetchAllCourses,
  fetchCourseById,
  modifyCourse,
  removeCourse,
};