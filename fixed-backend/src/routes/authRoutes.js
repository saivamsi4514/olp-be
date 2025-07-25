const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getUserProfile } = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');
const { validate, validateRegistration, validateLogin } = require('../middleware/validation');

// ✅ FIXED: Enhanced routes with validation middleware

// Register a new user
router.post('/register', validate(validateRegistration), registerUser);

// Login an existing user  
router.post('/login', validate(validateLogin), loginUser);

// ✅ NEW: Get user profile (protected route)
router.get('/profile', authenticate, getUserProfile);

// ✅ NEW: Refresh token endpoint
router.post('/refresh', authenticate, (req, res) => {
  try {
    const jwt = require('jsonwebtoken');
    const { userId, email, name } = req.user;
    
    const newToken = jwt.sign(
      { userId, email, name }, 
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: { token: newToken }
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to refresh token'
    });
  }
});

// ✅ NEW: Logout endpoint (client-side should remove token)
router.post('/logout', authenticate, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
});

// ✅ NEW: Verify token endpoint
router.get('/verify', authenticate, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Token is valid',
    data: {
      userId: req.user.userId,
      email: req.user.email,
      name: req.user.name
    }
  });
});

module.exports = router;