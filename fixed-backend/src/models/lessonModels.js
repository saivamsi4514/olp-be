const getDBConnection = require('../../database/dbConnection');

/**
 * Create a new lesson
 */
const createLesson = async (lessonData) => {
  try {
    const db = await getDBConnection();
    const { courseId, title, description, content, duration, orderIndex, lessonType, videoUrl } = lessonData;
    
    const stmt = await db.prepare(`
      INSERT INTO Lessons (course_id, title, description, content, duration, order_index, lesson_type, video_url, created_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime("now"))
    `);

    const result = await stmt.run(courseId, title, description, content, duration, orderIndex, lessonType, videoUrl);
    await stmt.finalize();

    return result.lastID;
  } catch (err) {
    console.error('Error in createLesson:', err.message);
    throw err;
  }
};

/**
 * Get lessons by course ID
 */
const getLessonsByCourse = async (courseId) => {
  try {
    const db = await getDBConnection();
    const lessons = await db.all(`
      SELECT * FROM Lessons 
      WHERE course_id = ? 
      ORDER BY order_index ASC
    `, [courseId]);
    return lessons;
  } catch (err) {
    console.error('Error in getLessonsByCourse:', err.message);
    throw err;
  }
};

/**
 * Get lesson by ID
 */
const getLessonById = async (id) => {
  try {
    const db = await getDBConnection();
    const lesson = await db.get(`
      SELECT l.*, c.title as course_title 
      FROM Lessons l 
      LEFT JOIN Courses c ON l.course_id = c.id 
      WHERE l.id = ?
    `, [id]);
    return lesson;
  } catch (err) {
    console.error('Error in getLessonById:', err.message);
    throw err;
  }
};

/**
 * Update lesson
 */
const updateLesson = async (id, updates) => {
  try {
    const db = await getDBConnection();
    const allowedFields = ['title', 'description', 'content', 'duration', 'order_index', 'video_url'];
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
    const stmt = await db.prepare(`UPDATE Lessons SET ${fields.join(', ')}, updated_at = datetime("now") WHERE id = ?`);
    const result = await stmt.run(...values);
    await stmt.finalize();

    if (result.changes > 0) {
      return await getLessonById(id);
    }
    return null;
  } catch (err) {
    console.error('Error in updateLesson:', err.message);
    throw err;
  }
};

/**
 * Delete lesson
 */
const deleteLesson = async (id) => {
  try {
    const db = await getDBConnection();
    const stmt = await db.prepare('DELETE FROM Lessons WHERE id = ?');
    const result = await stmt.run(id);
    await stmt.finalize();

    return result.changes > 0;
  } catch (err) {
    console.error('Error in deleteLesson:', err.message);
    throw err;
  }
};

/**
 * Get all lessons
 */
const getAllLessons = async (limit = 50, offset = 0) => {
  try {
    const db = await getDBConnection();
    const lessons = await db.all(`
      SELECT l.*, c.title as course_title 
      FROM Lessons l 
      LEFT JOIN Courses c ON l.course_id = c.id 
      ORDER BY l.created_at DESC 
      LIMIT ? OFFSET ?
    `, [limit, offset]);
    return lessons;
  } catch (err) {
    console.error('Error in getAllLessons:', err.message);
    throw err;
  }
};

module.exports = {
  createLesson,
  getLessonsByCourse,
  getLessonById,
  updateLesson,
  deleteLesson,
  getAllLessons
};