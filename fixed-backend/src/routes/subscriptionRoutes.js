const express = require('express');
const router = express.Router();
const { 
  createNewSubscription, 
  fetchUserSubscriptions, 
  fetchAllSubscriptions, 
  fetchSubscriptionById, 
  updateSubscriptionPayment,
  cancelSubscription,
  fetchSubscriptionStats,
  checkCourseAccess 
} = require('../controllers/subscriptionController');
const { authenticate } = require('../middleware/authMiddleware');

// All subscription routes require authentication

// Create new subscription (protected)
router.post('/', authenticate, createNewSubscription);

// Get user's subscriptions (protected)
router.get('/my-subscriptions', authenticate, fetchUserSubscriptions);

// Check course access (protected)
router.get('/access/:courseId', authenticate, checkCourseAccess);

// Get subscription by ID (protected)
router.get('/:id', authenticate, fetchSubscriptionById);

// Update subscription payment status (protected)
router.patch('/:id/payment', authenticate, updateSubscriptionPayment);

// Cancel subscription (protected)
router.patch('/:id/cancel', authenticate, cancelSubscription);

// Get all subscriptions - admin only (protected)
router.get('/', authenticate, fetchAllSubscriptions);

// Get subscription statistics - admin only (protected)
router.get('/admin/stats', authenticate, fetchSubscriptionStats);

module.exports = router;