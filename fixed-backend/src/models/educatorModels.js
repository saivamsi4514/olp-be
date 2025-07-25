const getDBConnection = require('../../database/dbConnection');

/**
 * Create a new educator
 */
const createEducator = async (educatorData) => {
  try {
    const db = await getDBConnection();
    const { name, email, bio, expertise, experience, qualification } = educatorData;
    
    const stmt = await db.prepare(`
      INSERT INTO Educators (name, email, bio, expertise, experience, qualification, created_at) 
      VALUES (?, ?, ?, ?, ?, ?, datetime("now"))
    `);

    const result = await stmt.run(name, email, bio, expertise, experience, qualification);
    await stmt.finalize();

    return result.lastID;
  } catch (err) {
    console.error('Error in createEducator:', err.message);
    throw err;
  }
};

/**
 * Get all educators
 */
const getAllEducators = async (limit = 50, offset = 0) => {
  try {
    const db = await getDBConnection();
    const query = `
      SELECT e.*, COUNT(c.id) as course_count
      FROM Educators e
      LEFT JOIN Courses c ON e.id = c.educator_id
      GROUP BY e.id
      ORDER BY e.created_at DESC
      LIMIT ? OFFSET ?
    `;
    const educators = await db.all(query, [limit, offset]);
    return educators;
  } catch (err) {
    console.error('Error in getAllEducators:', err.message);
    throw err;
  }
};

/**
 * Get educator by ID
 */
const getEducatorById = async (id) => {
  try {
    const db = await getDBConnection();
    const educator = await db.get(`
      SELECT e.*, COUNT(c.id) as course_count
      FROM Educators e
      LEFT JOIN Courses c ON e.id = c.educator_id
      WHERE e.id = ?
      GROUP BY e.id
    `, [id]);
    return educator;
  } catch (err) {
    console.error('Error in getEducatorById:', err.message);
    throw err;
  }
};

/**
 * Get educator by email
 */
const getEducatorByEmail = async (email) => {
  try {
    const db = await getDBConnection();
    const educator = await db.get('SELECT * FROM Educators WHERE email = ?', [email]);
    return educator;
  } catch (err) {
    console.error('Error in getEducatorByEmail:', err.message);
    throw err;
  }
};

/**
 * Update educator
 */
const updateEducator = async (id, updates) => {
  try {
    const db = await getDBConnection();
    const allowedFields = ['name', 'bio', 'expertise', 'experience', 'qualification'];
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
    const stmt = await db.prepare(`UPDATE Educators SET ${fields.join(', ')}, updated_at = datetime("now") WHERE id = ?`);
    const result = await stmt.run(...values);
    await stmt.finalize();

    if (result.changes > 0) {
      return await getEducatorById(id);
    }
    return null;
  } catch (err) {
    console.error('Error in updateEducator:', err.message);
    throw err;
  }
};

/**
 * Delete educator
 */
const deleteEducator = async (id) => {
  try {
    const db = await getDBConnection();
    const stmt = await db.prepare('DELETE FROM Educators WHERE id = ?');
    const result = await stmt.run(id);
    await stmt.finalize();

    return result.changes > 0;
  } catch (err) {
    console.error('Error in deleteEducator:', err.message);
    throw err;
  }
};

/**
 * Get educator's courses
 */
const getEducatorCourses = async (educatorId) => {
  try {
    const db = await getDBConnection();
    const courses = await db.all('SELECT * FROM Courses WHERE educator_id = ? ORDER BY created_at DESC', [educatorId]);
    return courses;
  } catch (err) {
    console.error('Error in getEducatorCourses:', err.message);
    throw err;
  }
};

module.exports = {
  createEducator,
  getAllEducators,
  getEducatorById,
  getEducatorByEmail,
  updateEducator,
  deleteEducator,
  getEducatorCourses
};