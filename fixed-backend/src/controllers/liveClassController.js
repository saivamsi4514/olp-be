const { 
  createLiveClass, 
  getLiveClassesByCourse, 
  getLiveClassById, 
  updateLiveClass, 
  deleteLiveClass, 
  getAllLiveClasses,
  registerForLiveClass,
  getClassRegistrations 
} = require('../models/liveClassModels');
const { getCourseById } = require('../models/courseModels');

/**
 * Create a new live class
 */
const createNewLiveClass = async (req, res) => {
  try {
    const { courseId, title, description, scheduledTime, duration, meetingUrl, maxParticipants } = req.body;

    // Validate required fields
    if (!courseId || !title || !description || !scheduledTime || !duration) {
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

    // Validate scheduled time is in the future
    const scheduledDate = new Date(scheduledTime);
    if (scheduledDate <= new Date()) {
      return res.status(400).json({ 
        success: false,
        error: 'Scheduled time must be in the future' 
      });
    }

    const classId = await createLiveClass({
      courseId: parseInt(courseId),
      title: title.trim(),
      description: description.trim(),
      scheduledTime,
      duration: parseInt(duration),
      meetingUrl: meetingUrl || '',
      maxParticipants: maxParticipants || 100,
    });

    res.status(201).json({ 
      success: true,
      message: 'Live class created successfully', 
      data: { classId }
    });
  } catch (err) {
    console.error('Error creating live class:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { details: err.message })
    });
  }
};

/**
 * Get all live classes
 */
const fetchAllLiveClasses = async (req, res) => {
  try {
    const { limit = 50, offset = 0, status } = req.query;
    let classes = await getAllLiveClasses(parseInt(limit), parseInt(offset));
    
    // Filter by status if provided
    if (status) {
      classes = classes.filter(cls => cls.status === status);
    }

    res.status(200).json({
      success: true,
      data: classes,
      meta: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        count: classes.length
      }
    });
  } catch (err) {
    console.error('Error fetching live classes:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
};

/**
 * Get live classes by course ID
 */
const fetchLiveClassesByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    
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

    const classes = await getLiveClassesByCourse(parseInt(courseId));

    res.status(200).json({
      success: true,
      data: classes
    });
  } catch (err) {
    console.error('Error fetching course live classes:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
};

/**
 * Get live class by ID
 */
const fetchLiveClassById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid live class ID' 
      });
    }

    const liveClass = await getLiveClassById(parseInt(id));

    if (!liveClass) {
      return res.status(404).json({ 
        success: false,
        error: 'Live class not found' 
      });
    }

    // Get registrations
    const registrations = await getClassRegistrations(parseInt(id));

    res.status(200).json({
      success: true,
      data: {
        ...liveClass,
        registrations: registrations.length,
        registeredUsers: registrations
      }
    });
  } catch (err) {
    console.error('Error fetching live class:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
};

/**
 * Register for live class
 */
const registerForClass = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid live class ID' 
      });
    }

    const registrationId = await registerForLiveClass(userId, parseInt(id));

    res.status(201).json({ 
      success: true,
      message: 'Successfully registered for live class', 
      data: { registrationId }
    });
  } catch (err) {
    console.error('Error registering for live class:', err);
    
    if (err.message.includes('already registered')) {
      return res.status(409).json({ 
        success: false,
        error: 'Already registered for this class' 
      });
    }
    
    if (err.message.includes('full')) {
      return res.status(410).json({ 
        success: false,
        error: 'Class is full' 
      });
    }

    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
};

/**
 * Update live class
 */
const modifyLiveClass = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid live class ID' 
      });
    }

    const existingClass = await getLiveClassById(parseInt(id));
    if (!existingClass) {
      return res.status(404).json({ 
        success: false,
        error: 'Live class not found' 
      });
    }

    const allowedUpdates = ['title', 'description', 'scheduled_time', 'duration', 'meeting_url', 'max_participants', 'status'];
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

    const updated = await updateLiveClass(parseInt(id), updates);

    res.status(200).json({
      success: true,
      message: 'Live class updated successfully',
      data: updated
    });
  } catch (err) {
    console.error('Error updating live class:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
};

/**
 * Delete live class
 */
const removeLiveClass = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid live class ID' 
      });
    }

    const existingClass = await getLiveClassById(parseInt(id));
    if (!existingClass) {
      return res.status(404).json({ 
        success: false,
        error: 'Live class not found' 
      });
    }

    await deleteLiveClass(parseInt(id));

    res.status(200).json({
      success: true,
      message: 'Live class deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting live class:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
};

module.exports = {
  createNewLiveClass,
  fetchAllLiveClasses,
  fetchLiveClassesByCourse,
  fetchLiveClassById,
  registerForClass,
  modifyLiveClass,
  removeLiveClass,
};