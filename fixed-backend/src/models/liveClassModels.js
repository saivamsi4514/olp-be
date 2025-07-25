const getDBConnection = require('../../database/dbConnection');

/**
 * Create a new live class
 */
const createLiveClass = async (classData) => {
  try {
    const db = await getDBConnection();
    const { courseId, title, description, scheduledTime, duration, meetingUrl, maxParticipants } = classData;
    
    const stmt = await db.prepare(`
      INSERT INTO LiveClasses (course_id, title, description, scheduled_time, duration, meeting_url, max_participants, status, created_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?, 'scheduled', datetime("now"))
    `);

    const result = await stmt.run(courseId, title, description, scheduledTime, duration, meetingUrl, maxParticipants);
    await stmt.finalize();

    return result.lastID;
  } catch (err) {
    console.error('Error in createLiveClass:', err.message);
    throw err;
  }
};

/**
 * Get live classes by course ID
 */
const getLiveClassesByCourse = async (courseId) => {
  try {
    const db = await getDBConnection();
    const classes = await db.all(`
      SELECT * FROM LiveClasses 
      WHERE course_id = ? 
      ORDER BY scheduled_time ASC
    `, [courseId]);
    return classes;
  } catch (err) {
    console.error('Error in getLiveClassesByCourse:', err.message);
    throw err;
  }
};

/**
 * Get live class by ID
 */
const getLiveClassById = async (id) => {
  try {
    const db = await getDBConnection();
    const liveClass = await db.get(`
      SELECT lc.*, c.title as course_title 
      FROM LiveClasses lc 
      LEFT JOIN Courses c ON lc.course_id = c.id 
      WHERE lc.id = ?
    `, [id]);
    return liveClass;
  } catch (err) {
    console.error('Error in getLiveClassById:', err.message);
    throw err;
  }
};

/**
 * Update live class
 */
const updateLiveClass = async (id, updates) => {
  try {
    const db = await getDBConnection();
    const allowedFields = ['title', 'description', 'scheduled_time', 'duration', 'meeting_url', 'max_participants', 'status'];
    const fields = [];
    const values = [];

    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        fields.push(`${key} = ?`);
        values.push(updates[key]);
      }
    });

    if (fields.length === 0) {
      throw new Error('No valid fields to update');
    }

    values.push(id);
    const stmt = await db.prepare(`UPDATE LiveClasses SET ${fields.join(', ')}, updated_at = datetime("now") WHERE id = ?`);
    const result = await stmt.run(...values);
    await stmt.finalize();

    if (result.changes > 0) {
      return await getLiveClassById(id);
    }
    return null;
  } catch (err) {
    console.error('Error in updateLiveClass:', err.message);
    throw err;
  }
};

/**
 * Delete live class
 */
const deleteLiveClass = async (id) => {
  try {
    const db = await getDBConnection();
    const stmt = await db.prepare('DELETE FROM LiveClasses WHERE id = ?');
    const result = await stmt.run(id);
    await stmt.finalize();

    return result.changes > 0;
  } catch (err) {
    console.error('Error in deleteLiveClass:', err.message);
    throw err;
  }
};

/**
 * Get all live classes
 */
const getAllLiveClasses = async (limit = 50, offset = 0) => {
  try {
    const db = await getDBConnection();
    const classes = await db.all(`
      SELECT lc.*, c.title as course_title 
      FROM LiveClasses lc 
      LEFT JOIN Courses c ON lc.course_id = c.id 
      ORDER BY lc.scheduled_time ASC 
      LIMIT ? OFFSET ?
    `, [limit, offset]);
    return classes;
  } catch (err) {
    console.error('Error in getAllLiveClasses:', err.message);
    throw err;
  }
};

/**
 * Register user for live class
 */
const registerForLiveClass = async (userId, classId) => {
  try {
    const db = await getDBConnection();
    
    // Check if already registered
    const existing = await db.get(
      'SELECT * FROM LiveClassRegistrations WHERE user_id = ? AND class_id = ?',
      [userId, classId]
    );
    
    if (existing) {
      throw new Error('User already registered for this class');
    }

    // Check class capacity
    const classInfo = await getLiveClassById(classId);
    if (!classInfo) {
      throw new Error('Live class not found');
    }

    const registrationCount = await db.get(
      'SELECT COUNT(*) as count FROM LiveClassRegistrations WHERE class_id = ?',
      [classId]
    );

    if (registrationCount.count >= classInfo.max_participants) {
      throw new Error('Class is full');
    }

    const stmt = await db.prepare(`
      INSERT INTO LiveClassRegistrations (user_id, class_id, registered_at) 
      VALUES (?, ?, datetime("now"))
    `);

    const result = await stmt.run(userId, classId);
    await stmt.finalize();

    return result.lastID;
  } catch (err) {
    console.error('Error in registerForLiveClass:', err.message);
    throw err;
  }
};

/**
 * Get registrations for a live class
 */
const getClassRegistrations = async (classId) => {
  try {
    const db = await getDBConnection();
    const registrations = await db.all(`
      SELECT lcr.*, u.name as user_name, u.email as user_email
      FROM LiveClassRegistrations lcr
      LEFT JOIN Users u ON lcr.user_id = u.id
      WHERE lcr.class_id = ?
      ORDER BY lcr.registered_at ASC
    `, [classId]);
    return registrations;
  } catch (err) {
    console.error('Error in getClassRegistrations:', err.message);
    throw err;
  }
};

module.exports = {
  createLiveClass,
  getLiveClassesByCourse,
  getLiveClassById,
  updateLiveClass,
  deleteLiveClass,
  getAllLiveClasses,
  registerForLiveClass,
  getClassRegistrations
};