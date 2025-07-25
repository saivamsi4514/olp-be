// Subscription-related middleware
const { hasActiveSubscription, getSubscriptionById } = require('../models/subscriptionModels');

/**
 * Check if user has active subscription for any course
 */
const checkActiveSubscription = async (req, res, next) => {
  try {
    const userId = req.user ? req.user.userId : null;

    if (!userId) {
      req.hasActiveSubscriptions = false;
      return next();
    }

    // This is a simplified check - in reality you'd want to check for specific courses
    // For now, we'll just set a flag
    req.hasActiveSubscriptions = true;

    next();
  } catch (error) {
    console.error('Subscription check error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to check subscription status'
    });
  }
};

/**
 * Validate subscription ownership
 */
const validateSubscriptionOwnership = async (req, res, next) => {
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

    // Check if user owns this subscription
    if (subscription.user_id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied - not your subscription'
      });
    }

    req.subscription = subscription;
    next();
  } catch (error) {
    console.error('Subscription ownership validation error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to validate subscription ownership'
    });
  }
};

/**
 * Check if subscription can be modified
 */
const checkSubscriptionModifiable = (req, res, next) => {
  const subscription = req.subscription;

  if (!subscription) {
    return res.status(400).json({
      success: false,
      error: 'Subscription not found in request'
    });
  }

  // Don't allow modification of cancelled subscriptions
  if (subscription.payment_status === 'cancelled') {
    return res.status(400).json({
      success: false,
      error: 'Cannot modify cancelled subscription'
    });
  }

  // Don't allow modification of expired subscriptions
  const now = new Date();
  const endDate = new Date(subscription.end_date);
  
  if (endDate < now) {
    return res.status(400).json({
      success: false,
      error: 'Cannot modify expired subscription'
    });
  }

  next();
};

/**
 * Validate payment status transition
 */
const validatePaymentStatusTransition = (req, res, next) => {
  const { paymentStatus } = req.body;
  const currentStatus = req.subscription.payment_status;

  const validTransitions = {
    'pending': ['completed', 'failed', 'cancelled'],
    'completed': ['cancelled'],
    'failed': ['pending', 'cancelled'],
    'cancelled': [] // No transitions allowed from cancelled
  };

  if (!validTransitions[currentStatus] || !validTransitions[currentStatus].includes(paymentStatus)) {
    return res.status(400).json({
      success: false,
      error: `Invalid payment status transition from ${currentStatus} to ${paymentStatus}`
    });
  }

  next();
};

module.exports = {
  checkActiveSubscription,
  validateSubscriptionOwnership,
  checkSubscriptionModifiable,
  validatePaymentStatusTransition
};