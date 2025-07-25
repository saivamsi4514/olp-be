const getDBConnection = require('../../database/dbConnection');

/**
 * Create progress record
 */
const createProgress = async (progressData) => {
  try {
    const db = await getDBConnection();
    const { userId, courseId, lessonId, testId, progressType, status, score, timeSpent } = progressData;
    
    const stmt = await db.prepare(`
      INSERT INTO Progress (user_id, course_id, lesson_id, test_id, progress_type, status, score, time_spent, created_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime("now"))
    `);

    const result = await stmt.run(userId, courseId, lessonId, testId, progressType, status, score, timeSpent);
    await stmt.finalize();

    return result.lastID;
  } catch (err) {
    console.error('Error in createProgress:', err.message);
    throw err;
  }
};

/**
 * Get user progress for a course
 */
const getCourseProgress = async (userId, courseId) => {
  try {
    const db = await getDBConnection();
    const progress = await db.all(`
      SELECT p.*, l.title as lesson_title, t.title as test_title
      FROM Progress p 
      LEFT JOIN Lessons l ON p.lesson_id = l.id
      LEFT JOIN Tests t ON p.test_id = t.id
      WHERE p.user_id = ? AND p.course_id = ?
      ORDER BY p.created_at DESC
    `, [userId, courseId]);
    return progress;
  } catch (err) {
    console.error('Error in getCourseProgress:', err.message);
    throw err;
  }
};

/**
 * Get user's overall progress
 */
const getUserProgress = async (userId) => {
  try {
    const db = await getDBConnection();
    const progress = await db.all(`
      SELECT p.*, c.title as course_title, l.title as lesson_title, t.title as test_title
      FROM Progress p 
      LEFT JOIN Courses c ON p.course_id = c.id
      LEFT JOIN Lessons l ON p.lesson_id = l.id
      LEFT JOIN Tests t ON p.test_id = t.id
      WHERE p.user_id = ?
      ORDER BY p.created_at DESC
    `, [userId]);
    return progress;
  } catch (err) {
    console.error('Error in getUserProgress:', err.message);
    throw err;
  }
};

/**
 * Update progress
 */
const updateProgress = async (id, updates) => {
  try {
    const db = await getDBConnection();
    const allowedFields = ['status', 'score', 'time_spent'];
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
    const stmt = await db.prepare(`UPDATE Progress SET ${fields.join(', ')}, updated_at = datetime("now") WHERE id = ?`);
    const result = await stmt.run(...values);
    await stmt.finalize();

    return result.changes > 0;
  } catch (err) {
    console.error('Error in updateProgress:', err.message);
    throw err;
  }
};

/**
 * Get progress by ID
 */
const getProgressById = async (id) => {
  try {
    const db = await getDBConnection();
    const progress = await db.get(`
      SELECT p.*, c.title as course_title, l.title as lesson_title, t.title as test_title
      FROM Progress p 
      LEFT JOIN Courses c ON p.course_id = c.id
      LEFT JOIN Lessons l ON p.lesson_id = l.id
      LEFT JOIN Tests t ON p.test_id = t.id
      WHERE p.id = ?
    `, [id]);
    return progress;
  } catch (err) {
    console.error('Error in getProgressById:', err.message);
    throw err;
  }
};

/**
 * Get course completion percentage
 */
const getCourseCompletionRate = async (userId, courseId) => {
  try {
    const db = await getDBConnection();
    
    // Get total lessons and tests
    const totals = await db.get(`
      SELECT 
        (SELECT COUNT(*) FROM Lessons WHERE course_id = ?) as total_lessons,
        (SELECT COUNT(*) FROM Tests WHERE course_id = ?) as total_tests
    `, [courseId, courseId]);

    // Get completed items
    const completed = await db.get(`
      SELECT 
        COUNT(CASE WHEN progress_type = 'lesson' AND status = 'completed' THEN 1 END) as completed_lessons,
        COUNT(CASE WHEN progress_type = 'test' AND status = 'completed' THEN 1 END) as completed_tests
      FROM Progress 
      WHERE user_id = ? AND course_id = ?
    `, [userId, courseId]);

    const totalItems = (totals.total_lessons || 0) + (totals.total_tests || 0);
    const completedItems = (completed.completed_lessons || 0) + (completed.completed_tests || 0);
    
    const completionRate = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

    return {
      totalLessons: totals.total_lessons || 0,
      totalTests: totals.total_tests || 0,
      completedLessons: completed.completed_lessons || 0,
      completedTests: completed.completed_tests || 0,
      completionRate: Math.round(completionRate * 100) / 100
    };
  } catch (err) {
    console.error('Error in getCourseCompletionRate:', err.message);
    throw err;
  }
};

module.exports = {
  createProgress,
  getCourseProgress,
  getUserProgress,
  updateProgress,
  getProgressById,
  getCourseCompletionRate
};