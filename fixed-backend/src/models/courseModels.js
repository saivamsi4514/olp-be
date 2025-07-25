const getDBConnection = require('../../database/dbConnection');

/**
 * Create a new course
 */
const createCourse = async (courseData) => {
  try {
    const db = await getDBConnection();
    const { title, description, educatorId, targetExam, duration, validityPeriod, price, discount, courseType } = courseData;
    
    const stmt = await db.prepare(`
      INSERT INTO Courses (title, description, educator_id, target_exam, duration, validity_period, price, discount, course_type, created_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime("now"))
    `);

    const result = await stmt.run(title, description, educatorId, targetExam, duration, validityPeriod, price, discount, courseType);
    await stmt.finalize();

    return result.lastID;
  } catch (err) {
    console.error('Error in createCourse:', err.message);
    throw err;
  }
};

/**
 * Get all courses with optional filtering
 */
const getAllCourses = async (filters = {}, limit = 50, offset = 0) => {
  try {
    const db = await getDBConnection();
    let query = `
      SELECT c.*, e.name as educator_name 
      FROM Courses c 
      LEFT JOIN Educators e ON c.educator_id = e.id 
      WHERE 1=1
    `;
    const params = [];

    if (filters.targetExam) {
      query += ' AND c.target_exam = ?';
      params.push(filters.targetExam);
    }

    if (filters.courseType) {
      query += ' AND c.course_type = ?';
      params.push(filters.courseType);
    }

    if (filters.educatorId) {
      query += ' AND c.educator_id = ?';
      params.push(filters.educatorId);
    }

    if (filters.minPrice) {
      query += ' AND c.price >= ?';
      params.push(filters.minPrice);
    }

    if (filters.maxPrice) {
      query += ' AND c.price <= ?';
      params.push(filters.maxPrice);
    }

    query += ' ORDER BY c.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const courses = await db.all(query, params);
    return courses;
  } catch (err) {
    console.error('Error in getAllCourses:', err.message);
    throw err;
  }
};

/**
 * Get course by ID
 */
const getCourseById = async (id) => {
  try {
    const db = await getDBConnection();
    const course = await db.get(`
      SELECT c.*, e.name as educator_name, e.bio as educator_bio 
      FROM Courses c 
      LEFT JOIN Educators e ON c.educator_id = e.id 
      WHERE c.id = ?
    `, [id]);
    return course;
  } catch (err) {
    console.error('Error in getCourseById:', err.message);
    throw err;
  }
};

/**
 * Update course
 */
const updateCourse = async (id, updates) => {
  try {
    const db = await getDBConnection();
    const allowedFields = ['title', 'description', 'duration', 'validity_period', 'price', 'discount'];
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
    const stmt = await db.prepare(`UPDATE Courses SET ${fields.join(', ')}, updated_at = datetime("now") WHERE id = ?`);
    const result = await stmt.run(...values);
    await stmt.finalize();

    if (result.changes > 0) {
      return await getCourseById(id);
    }
    return null;
  } catch (err) {
    console.error('Error in updateCourse:', err.message);
    throw err;
  }
};

/**
 * Delete course
 */
const deleteCourse = async (id) => {
  try {
    const db = await getDBConnection();
    const stmt = await db.prepare('DELETE FROM Courses WHERE id = ?');
    const result = await stmt.run(id);
    await stmt.finalize();

    return result.changes > 0;
  } catch (err) {
    console.error('Error in deleteCourse:', err.message);
    throw err;
  }
};

/**
 * Search courses
 */
const searchCourses = async (searchTerm, limit = 20, offset = 0) => {
  try {
    const db = await getDBConnection();
    const query = `
      SELECT c.*, e.name as educator_name 
      FROM Courses c 
      LEFT JOIN Educators e ON c.educator_id = e.id 
      WHERE c.title LIKE ? OR c.description LIKE ? 
      ORDER BY c.created_at DESC 
      LIMIT ? OFFSET ?
    `;
    const searchPattern = `%${searchTerm}%`;
    const courses = await db.all(query, [searchPattern, searchPattern, limit, offset]);
    return courses;
  } catch (err) {
    console.error('Error in searchCourses:', err.message);
    throw err;
  }
};

module.exports = {
  createCourse,
  getAllCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
  searchCourses
};