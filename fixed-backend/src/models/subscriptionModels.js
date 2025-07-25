const getDBConnection = require('../../database/dbConnection');

/**
 * Create a new subscription
 */
const createSubscription = async (subscriptionData) => {
  try {
    const db = await getDBConnection();
    const { userId, courseId, subscriptionType, startDate, endDate, amount, paymentStatus } = subscriptionData;
    
    const stmt = await db.prepare(`
      INSERT INTO Subscriptions (user_id, course_id, subscription_type, start_date, end_date, amount, payment_status, created_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime("now"))
    `);

    const result = await stmt.run(userId, courseId, subscriptionType, startDate, endDate, amount, paymentStatus);
    await stmt.finalize();

    return result.lastID;
  } catch (err) {
    console.error('Error in createSubscription:', err.message);
    throw err;
  }
};

/**
 * Get user subscriptions
 */
const getUserSubscriptions = async (userId) => {
  try {
    const db = await getDBConnection();
    const subscriptions = await db.all(`
      SELECT s.*, c.title as course_title, c.educator_id
      FROM Subscriptions s 
      LEFT JOIN Courses c ON s.course_id = c.id 
      WHERE s.user_id = ?
      ORDER BY s.created_at DESC
    `, [userId]);
    return subscriptions;
  } catch (err) {
    console.error('Error in getUserSubscriptions:', err.message);
    throw err;
  }
};

/**
 * Get subscription by ID
 */
const getSubscriptionById = async (id) => {
  try {
    const db = await getDBConnection();
    const subscription = await db.get(`
      SELECT s.*, c.title as course_title, u.name as user_name, u.email as user_email
      FROM Subscriptions s 
      LEFT JOIN Courses c ON s.course_id = c.id 
      LEFT JOIN Users u ON s.user_id = u.id
      WHERE s.id = ?
    `, [id]);
    return subscription;
  } catch (err) {
    console.error('Error in getSubscriptionById:', err.message);
    throw err;
  }
};

/**
 * Update subscription
 */
const updateSubscription = async (id, updates) => {
  try {
    const db = await getDBConnection();
    const allowedFields = ['subscription_type', 'end_date', 'payment_status', 'amount'];
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
    const stmt = await db.prepare(`UPDATE Subscriptions SET ${fields.join(', ')}, updated_at = datetime("now") WHERE id = ?`);
    const result = await stmt.run(...values);
    await stmt.finalize();

    if (result.changes > 0) {
      return await getSubscriptionById(id);
    }
    return null;
  } catch (err) {
    console.error('Error in updateSubscription:', err.message);
    throw err;
  }
};

/**
 * Delete subscription
 */
const deleteSubscription = async (id) => {
  try {
    const db = await getDBConnection();
    const stmt = await db.prepare('DELETE FROM Subscriptions WHERE id = ?');
    const result = await stmt.run(id);
    await stmt.finalize();

    return result.changes > 0;
  } catch (err) {
    console.error('Error in deleteSubscription:', err.message);
    throw err;
  }
};

/**
 * Get all subscriptions
 */
const getAllSubscriptions = async (limit = 50, offset = 0) => {
  try {
    const db = await getDBConnection();
    const subscriptions = await db.all(`
      SELECT s.*, c.title as course_title, u.name as user_name, u.email as user_email
      FROM Subscriptions s 
      LEFT JOIN Courses c ON s.course_id = c.id 
      LEFT JOIN Users u ON s.user_id = u.id
      ORDER BY s.created_at DESC 
      LIMIT ? OFFSET ?
    `, [limit, offset]);
    return subscriptions;
  } catch (err) {
    console.error('Error in getAllSubscriptions:', err.message);
    throw err;
  }
};

/**
 * Get course subscriptions
 */
const getCourseSubscriptions = async (courseId) => {
  try {
    const db = await getDBConnection();
    const subscriptions = await db.all(`
      SELECT s.*, u.name as user_name, u.email as user_email
      FROM Subscriptions s 
      LEFT JOIN Users u ON s.user_id = u.id
      WHERE s.course_id = ?
      ORDER BY s.created_at DESC
    `, [courseId]);
    return subscriptions;
  } catch (err) {
    console.error('Error in getCourseSubscriptions:', err.message);
    throw err;
  }
};

/**
 * Check if user has active subscription for course
 */
const hasActiveSubscription = async (userId, courseId) => {
  try {
    const db = await getDBConnection();
    const subscription = await db.get(`
      SELECT * FROM Subscriptions 
      WHERE user_id = ? AND course_id = ? 
      AND payment_status = 'completed' 
      AND date('now') BETWEEN start_date AND end_date
    `, [userId, courseId]);
    return !!subscription;
  } catch (err) {
    console.error('Error in hasActiveSubscription:', err.message);
    throw err;
  }
};

/**
 * Get subscription statistics
 */
const getSubscriptionStats = async () => {
  try {
    const db = await getDBConnection();
    const stats = await db.get(`
      SELECT 
        COUNT(*) as total_subscriptions,
        COUNT(CASE WHEN payment_status = 'completed' THEN 1 END) as active_subscriptions,
        COUNT(CASE WHEN payment_status = 'pending' THEN 1 END) as pending_subscriptions,
        SUM(CASE WHEN payment_status = 'completed' THEN amount ELSE 0 END) as total_revenue
      FROM Subscriptions
    `);
    return stats;
  } catch (err) {
    console.error('Error in getSubscriptionStats:', err.message);
    throw err;
  }
};

module.exports = {
  createSubscription,
  getUserSubscriptions,
  getSubscriptionById,
  updateSubscription,
  deleteSubscription,
  getAllSubscriptions,
  getCourseSubscriptions,
  hasActiveSubscription,
  getSubscriptionStats
};