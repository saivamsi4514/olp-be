const jwt = require('jsonwebtoken');

// ✅ FIXED: Converted to CommonJS and improved error handling
const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false,
        error: 'Access denied. No valid token provided.' 
      });
    }

    const token = authHeader.split(' ')[1];

    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET environment variable is required');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid token' 
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        error: 'Token expired' 
      });
    }
    console.error('Authentication error:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
};

// ✅ FIXED: Role-based authorization
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        error: 'Access denied. Authentication required.' 
      });
    }

    if (roles.length > 0 && !roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false,
        error: 'Access denied: insufficient privileges' 
      });
    }
    
    next();
  };
};

// ✅ NEW: Optional authentication (for public endpoints that can benefit from user context)
const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
    }
    
    next();
  } catch (error) {
    // For optional auth, we continue even if token is invalid
    next();
  }
};

module.exports = { 
  authenticate, 
  authorize, 
  optionalAuth 
};