const { 
  createSubscription, 
  getUserSubscriptions, 
  getSubscriptionById, 
  updateSubscription, 
  deleteSubscription, 
  getAllSubscriptions,
  getCourseSubscriptions,
  hasActiveSubscription,
  getSubscriptionStats 
} = require('../models/subscriptionModels');
const { getCourseById } = require('../models/courseModels');

/**
 * Create a new subscription
 */
const createNewSubscription = async (req, res) => {
  try {
    const { courseId, subscriptionType, duration, amount } = req.body;
    const userId = req.user.userId;

    // Validate required fields
    if (!courseId || !subscriptionType || !duration || !amount) {
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

    // Check if user already has active subscription
    const hasActive = await hasActiveSubscription(userId, courseId);
    if (hasActive) {
      return res.status(409).json({ 
        success: false,
        error: 'User already has an active subscription for this course' 
      });
    }

    // Calculate end date based on duration
    const startDate = new Date().toISOString().split('T')[0];
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + parseInt(duration));
    const endDateStr = endDate.toISOString().split('T')[0];

    const subscriptionId = await createSubscription({
      userId,
      courseId: parseInt(courseId),
      subscriptionType,
      startDate,
      endDate: endDateStr,
      amount: parseFloat(amount),
      paymentStatus: 'pending',
    });

    res.status(201).json({ 
      success: true,
      message: 'Subscription created successfully', 
      data: { 
        subscriptionId,
        paymentRequired: true,
        amount: parseFloat(amount)
      }
    });
  } catch (err) {
    console.error('Error creating subscription:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { details: err.message })
    });
  }
};

/**
 * Get user's subscriptions
 */
const fetchUserSubscriptions = async (req, res) => {
  try {
    const userId = req.user.userId;
    const subscriptions = await getUserSubscriptions(userId);

    res.status(200).json({
      success: true,
      data: subscriptions
    });
  } catch (err) {
    console.error('Error fetching user subscriptions:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
};

/**
 * Get all subscriptions (admin only)
 */
const fetchAllSubscriptions = async (req, res) => {
  try {
    const { limit = 50, offset = 0, status } = req.query;
    let subscriptions = await getAllSubscriptions(parseInt(limit), parseInt(offset));
    
    // Filter by status if provided
    if (status) {
      subscriptions = subscriptions.filter(sub => sub.payment_status === status);
    }

    res.status(200).json({
      success: true,
      data: subscriptions,
      meta: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        count: subscriptions.length
      }
    });
  } catch (err) {
    console.error('Error fetching subscriptions:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
};

/**
 * Get subscription by ID
 */
const fetchSubscriptionById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid subscription ID' 
      });
    }

    const subscription = await getSubscriptionById(parseInt(id));

    if (!subscription) {
      return res.status(404).json({ 
        success: false,
        error: 'Subscription not found' 
      });
    }

    // Check if user owns this subscription (or is admin)
    if (subscription.user_id !== userId) {
      return res.status(403).json({ 
        success: false,
        error: 'Access denied' 
      });
    }

    res.status(200).json({
      success: true,
      data: subscription
    });
  } catch (err) {
    console.error('Error fetching subscription:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
};

/**
 * Update subscription payment status
 */
const updateSubscriptionPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentStatus, transactionId } = req.body;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid subscription ID' 
      });
    }

    if (!paymentStatus) {
      return res.status(400).json({ 
        success: false,
        error: 'Payment status is required' 
      });
    }

    const existingSubscription = await getSubscriptionById(parseInt(id));
    if (!existingSubscription) {
      return res.status(404).json({ 
        success: false,
        error: 'Subscription not found' 
      });
    }

    const updates = { 
      payment_status: paymentStatus 
    };

    if (transactionId) {
      updates.transaction_id = transactionId;
    }

    const updated = await updateSubscription(parseInt(id), updates);

    res.status(200).json({
      success: true,
      message: 'Subscription updated successfully',
      data: updated
    });
  } catch (err) {
    console.error('Error updating subscription:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
};

/**
 * Cancel subscription
 */
const cancelSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid subscription ID' 
      });
    }

    const existingSubscription = await getSubscriptionById(parseInt(id));
    if (!existingSubscription) {
      return res.status(404).json({ 
        success: false,
        error: 'Subscription not found' 
      });
    }

    // Check if user owns this subscription
    if (existingSubscription.user_id !== userId) {
      return res.status(403).json({ 
        success: false,
        error: 'Access denied' 
      });
    }

    const updated = await updateSubscription(parseInt(id), { 
      payment_status: 'cancelled',
      end_date: new Date().toISOString().split('T')[0]
    });

    res.status(200).json({
      success: true,
      message: 'Subscription cancelled successfully',
      data: updated
    });
  } catch (err) {
    console.error('Error cancelling subscription:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
};

/**
 * Get subscription statistics
 */
const fetchSubscriptionStats = async (req, res) => {
  try {
    const stats = await getSubscriptionStats();

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (err) {
    console.error('Error fetching subscription stats:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
};

/**
 * Check course access
 */
const checkCourseAccess = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.userId;
    
    if (!courseId || isNaN(courseId)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid course ID' 
      });
    }

    const hasAccess = await hasActiveSubscription(userId, parseInt(courseId));

    res.status(200).json({
      success: true,
      data: {
        courseId: parseInt(courseId),
        hasAccess,
        userId
      }
    });
  } catch (err) {
    console.error('Error checking course access:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
};

module.exports = {
  createNewSubscription,
  fetchUserSubscriptions,
  fetchAllSubscriptions,
  fetchSubscriptionById,
  updateSubscriptionPayment,
  cancelSubscription,
  fetchSubscriptionStats,
  checkCourseAccess,
};