const getDBConnection = require('../../database/dbConnection');

/**
 * Create a new test
 */
const createTest = async (testData) => {
  try {
    const db = await getDBConnection();
    const { courseId, title, description, duration, totalMarks, passingMarks, testType } = testData;
    
    const stmt = await db.prepare(`
      INSERT INTO Tests (course_id, title, description, duration, total_marks, passing_marks, test_type, created_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime("now"))
    `);

    const result = await stmt.run(courseId, title, description, duration, totalMarks, passingMarks, testType);
    await stmt.finalize();

    return result.lastID;
  } catch (err) {
    console.error('Error in createTest:', err.message);
    throw err;
  }
};

/**
 * Get tests by course ID
 */
const getTestsByCourse = async (courseId) => {
  try {
    const db = await getDBConnection();
    const tests = await db.all(`
      SELECT * FROM Tests 
      WHERE course_id = ? 
      ORDER BY created_at DESC
    `, [courseId]);
    return tests;
  } catch (err) {
    console.error('Error in getTestsByCourse:', err.message);
    throw err;
  }
};

/**
 * Get test by ID
 */
const getTestById = async (id) => {
  try {
    const db = await getDBConnection();
    const test = await db.get(`
      SELECT t.*, c.title as course_title 
      FROM Tests t 
      LEFT JOIN Courses c ON t.course_id = c.id 
      WHERE t.id = ?
    `, [id]);
    return test;
  } catch (err) {
    console.error('Error in getTestById:', err.message);
    throw err;
  }
};

/**
 * Update test
 */
const updateTest = async (id, updates) => {
  try {
    const db = await getDBConnection();
    const allowedFields = ['title', 'description', 'duration', 'total_marks', 'passing_marks'];
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
    const stmt = await db.prepare(`UPDATE Tests SET ${fields.join(', ')}, updated_at = datetime("now") WHERE id = ?`);
    const result = await stmt.run(...values);
    await stmt.finalize();

    if (result.changes > 0) {
      return await getTestById(id);
    }
    return null;
  } catch (err) {
    console.error('Error in updateTest:', err.message);
    throw err;
  }
};

/**
 * Delete test
 */
const deleteTest = async (id) => {
  try {
    const db = await getDBConnection();
    const stmt = await db.prepare('DELETE FROM Tests WHERE id = ?');
    const result = await stmt.run(id);
    await stmt.finalize();

    return result.changes > 0;
  } catch (err) {
    console.error('Error in deleteTest:', err.message);
    throw err;
  }
};

/**
 * Get all tests
 */
const getAllTests = async (limit = 50, offset = 0) => {
  try {
    const db = await getDBConnection();
    const tests = await db.all(`
      SELECT t.*, c.title as course_title 
      FROM Tests t 
      LEFT JOIN Courses c ON t.course_id = c.id 
      ORDER BY t.created_at DESC 
      LIMIT ? OFFSET ?
    `, [limit, offset]);
    return tests;
  } catch (err) {
    console.error('Error in getAllTests:', err.message);
    throw err;
  }
};

/**
 * Create test question
 */
const createTestQuestion = async (questionData) => {
  try {
    const db = await getDBConnection();
    const { testId, question, options, correctAnswer, marks, explanation } = questionData;
    
    const stmt = await db.prepare(`
      INSERT INTO TestQuestions (test_id, question, options, correct_answer, marks, explanation, created_at) 
      VALUES (?, ?, ?, ?, ?, ?, datetime("now"))
    `);

    const result = await stmt.run(testId, question, JSON.stringify(options), correctAnswer, marks, explanation);
    await stmt.finalize();

    return result.lastID;
  } catch (err) {
    console.error('Error in createTestQuestion:', err.message);
    throw err;
  }
};

/**
 * Get questions by test ID
 */
const getQuestionsByTest = async (testId) => {
  try {
    const db = await getDBConnection();
    const questions = await db.all(`
      SELECT * FROM TestQuestions 
      WHERE test_id = ? 
      ORDER BY id ASC
    `, [testId]);
    
    // Parse options JSON
    return questions.map(q => ({
      ...q,
      options: JSON.parse(q.options)
    }));
  } catch (err) {
    console.error('Error in getQuestionsByTest:', err.message);
    throw err;
  }
};

module.exports = {
  createTest,
  getTestsByCourse,
  getTestById,
  updateTest,
  deleteTest,
  getAllTests,
  createTestQuestion,
  getQuestionsByTest
};