const bcrypt = require('bcrypt');
const getDBConnection = require('../../database/dbConnection');

/**
 * Create a new user in the database.
 */
const createUser = async ({ name, email, password, targetExam, preferredLanguage, preparationLevel }) => {
  try {
    const db = await getDBConnection();
    // Password is already hashed in controller
    const stmt = await db.prepare(
      'INSERT INTO Users (name, email, password, target_exam, preferred_language, preparation_level, created_at) VALUES (?, ?, ?, ?, ?, ?, datetime("now"))'
    );

    const result = await stmt.run(name, email, password, targetExam, preferredLanguage, preparationLevel);
    await stmt.finalize();

    return result.lastID;
  } catch (err) {
    console.error('Error in createUser:', err.message);
    throw err;
  }
};

/**
 * Find a user in the database by their email.
 */
const findUserByEmail = async (email) => {
  try {
    const db = await getDBConnection();
    const user = await db.get('SELECT * FROM Users WHERE email = ?', [email]);
    return user;
  } catch (err) {
    console.error('Error in findUserByEmail:', err.message);
    throw err;
  }
};

/**
 * Find a user by ID
 */
const findUserById = async (id) => {
  try {
    const db = await getDBConnection();
    const user = await db.get('SELECT id, name, email, target_exam, preferred_language, preparation_level, created_at FROM Users WHERE id = ?', [id]);
    return user;
  } catch (err) {
    console.error('Error in findUserById:', err.message);
    throw err;
  }
};

/**
 * Update user profile
 */
const updateUser = async (id, updates) => {
  try {
    const db = await getDBConnection();
    const allowedFields = ['name', 'target_exam', 'preferred_language', 'preparation_level'];
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
    const stmt = await db.prepare(`UPDATE Users SET ${fields.join(', ')}, updated_at = datetime("now") WHERE id = ?`);
    const result = await stmt.run(...values);
    await stmt.finalize();

    return result.changes > 0;
  } catch (err) {
    console.error('Error in updateUser:', err.message);
    throw err;
  }
};

module.exports = { 
  createUser, 
  findUserByEmail, 
  findUserById, 
  updateUser 
};