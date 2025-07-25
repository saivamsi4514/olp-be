const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { createUser, findUserByEmail } = require('../models/authModels');
const { validateRegistration, validateLogin } = require('../middleware/validation');

// ✅ FIXED: Proper password hashing and validation
const registerUser = async (req, res) => {
  try {
    const { name, email, password, targetExam, preferredLanguage, preparationLevel } = req.body;
    
    // ✅ FIXED: Proper validation
    const validation = validateRegistration(req.body);
    if (!validation.isValid) {
      return res.status(400).json({ 
        success: false,
        error: 'Validation failed', 
        details: validation.errors 
      });
    }

    // Check if user already exists
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ 
        success: false,
        error: 'Email already registered' 
      });
    }

    // ✅ FIXED: Actually hash the password
    const hashedPassword = await bcrypt.hash(password, 12);
    console.log('Password hashed successfully');

    // Create user with hashed password
    const userId = await createUser({
      name,
      email,
      password: hashedPassword,
      targetExam,
      preferredLanguage,
      preparationLevel
    });

    // ✅ FIXED: Secure JWT generation
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET environment variable is required');
    }

    const token = jwt.sign(
      { userId, email, name }, 
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // ✅ FIXED: Consistent response format
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        userId,
        name,
        email,
        targetExam,
        token
      }
    });
  } catch (err) {
    console.error('Error registering user:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { details: err.message })
    });
  }
};

// ✅ FIXED: Proper login with validation
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // ✅ FIXED: Proper validation
    const validation = validateLogin(req.body);
    if (!validation.isValid) {
      return res.status(400).json({ 
        success: false,
        error: 'Validation failed', 
        details: validation.errors 
      });
    }

    // Find user by email
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid email or password' 
      });
    }

    // ✅ FIXED: Proper password comparison
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid email or password' 
      });
    }

    // ✅ FIXED: Secure JWT generation
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET environment variable is required');
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, name: user.name }, 
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // ✅ FIXED: Consistent response format (don't send password)
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        userId: user.id,
        name: user.name,
        email: user.email,
        targetExam: user.target_exam,
        preferredLanguage: user.preferred_language,
        preparationLevel: user.preparation_level,
        token
      }
    });
  } catch (err) {
    console.error('Error logging in user:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { details: err.message })
    });
  }
};

// ✅ NEW: Get user profile
const getUserProfile = async (req, res) => {
  try {
    const { userId } = req.user;
    const user = await findUserByEmail(req.user.email);
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: 'User not found' 
      });
    }

    res.status(200).json({
      success: true,
      data: {
        userId: user.id,
        name: user.name,
        email: user.email,
        targetExam: user.target_exam,
        preferredLanguage: user.preferred_language,
        preparationLevel: user.preparation_level,
        createdAt: user.created_at
      }
    });
  } catch (err) {
    console.error('Error fetching user profile:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
};

module.exports = { 
  registerUser, 
  loginUser, 
  getUserProfile 
};