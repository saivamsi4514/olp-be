const { 
  createEducator, 
  getAllEducators, 
  getEducatorById, 
  getEducatorByEmail,
  updateEducator, 
  deleteEducator, 
  getEducatorCourses 
} = require('../models/educatorModels');

/**
 * Create a new educator
 */
const createNewEducator = async (req, res) => {
  try {
    const { name, email, bio, expertise, experience, qualification } = req.body;

    // Validate required fields
    if (!name || !email || !bio || !expertise || !experience || !qualification) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing required fields' 
      });
    }

    // Check if educator email already exists
    const existingEducator = await getEducatorByEmail(email);
    if (existingEducator) {
      return res.status(409).json({ 
        success: false,
        error: 'Educator with this email already exists' 
      });
    }

    const educatorId = await createEducator({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      bio: bio.trim(),
      expertise: expertise.trim(),
      experience: parseInt(experience),
      qualification: qualification.trim(),
    });

    res.status(201).json({ 
      success: true,
      message: 'Educator created successfully', 
      data: { educatorId }
    });
  } catch (err) {
    console.error('Error creating educator:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { details: err.message })
    });
  }
};

/**
 * Get all educators
 */
const fetchAllEducators = async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const educators = await getAllEducators(parseInt(limit), parseInt(offset));
    
    res.status(200).json({
      success: true,
      data: educators,
      meta: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        count: educators.length
      }
    });
  } catch (err) {
    console.error('Error fetching educators:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
};

/**
 * Get educator by ID
 */
const fetchEducatorById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid educator ID' 
      });
    }

    const educator = await getEducatorById(parseInt(id));

    if (!educator) {
      return res.status(404).json({ 
        success: false,
        error: 'Educator not found' 
      });
    }

    res.status(200).json({
      success: true,
      data: educator
    });
  } catch (err) {
    console.error('Error fetching educator:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
};

/**
 * Update educator
 */
const modifyEducator = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid educator ID' 
      });
    }

    const existingEducator = await getEducatorById(parseInt(id));
    if (!existingEducator) {
      return res.status(404).json({ 
        success: false,
        error: 'Educator not found' 
      });
    }

    const allowedUpdates = ['name', 'bio', 'expertise', 'experience', 'qualification'];
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

    const updated = await updateEducator(parseInt(id), updates);

    res.status(200).json({
      success: true,
      message: 'Educator updated successfully',
      data: updated
    });
  } catch (err) {
    console.error('Error updating educator:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
};

/**
 * Delete educator
 */
const removeEducator = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid educator ID' 
      });
    }

    const existingEducator = await getEducatorById(parseInt(id));
    if (!existingEducator) {
      return res.status(404).json({ 
        success: false,
        error: 'Educator not found' 
      });
    }

    await deleteEducator(parseInt(id));

    res.status(200).json({
      success: true,
      message: 'Educator deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting educator:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
};

/**
 * Get educator's courses
 */
const fetchEducatorCourses = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid educator ID' 
      });
    }

    const educator = await getEducatorById(parseInt(id));
    if (!educator) {
      return res.status(404).json({ 
        success: false,
        error: 'Educator not found' 
      });
    }

    const courses = await getEducatorCourses(parseInt(id));

    res.status(200).json({
      success: true,
      data: courses
    });
  } catch (err) {
    console.error('Error fetching educator courses:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
};

module.exports = {
  createNewEducator,
  fetchAllEducators,
  fetchEducatorById,
  modifyEducator,
  removeEducator,
  fetchEducatorCourses,
};