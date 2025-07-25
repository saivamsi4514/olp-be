// ✅ NEW: Input validation middleware
const validator = require('validator');

// Email validation
const isValidEmail = (email) => {
  return validator.isEmail(email) && email.length <= 100;
};

// Password validation
const isValidPassword = (password) => {
  return password && 
         password.length >= 8 && 
         password.length <= 128 &&
         /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(password);
};

// Name validation
const isValidName = (name) => {
  return name && 
         name.trim().length >= 2 && 
         name.trim().length <= 50 &&
         /^[a-zA-Z\s]+$/.test(name.trim());
};

// Registration validation
const validateRegistration = (data) => {
  const errors = [];
  const { name, email, password, targetExam, preferredLanguage, preparationLevel } = data;

  // Required fields
  if (!name) errors.push('Name is required');
  if (!email) errors.push('Email is required');
  if (!password) errors.push('Password is required');
  if (!targetExam) errors.push('Target exam is required');
  if (!preferredLanguage) errors.push('Preferred language is required');
  if (!preparationLevel) errors.push('Preparation level is required');

  // Field validation
  if (name && !isValidName(name)) {
    errors.push('Name must be 2-50 characters and contain only letters and spaces');
  }

  if (email && !isValidEmail(email)) {
    errors.push('Please provide a valid email address');
  }

  if (password && !isValidPassword(password)) {
    errors.push('Password must be 8-128 characters with at least one uppercase, lowercase, number, and special character');
  }

  // Enum validations
  const validExams = ['JEE', 'NEET', 'GATE', 'UPSC', 'CAT', 'GRE', 'GMAT', 'IELTS', 'TOEFL'];
  if (targetExam && !validExams.includes(targetExam)) {
    errors.push(`Target exam must be one of: ${validExams.join(', ')}`);
  }

  const validLanguages = ['English', 'Hindi', 'Telugu', 'Tamil', 'Malayalam', 'Kannada', 'Bengali'];
  if (preferredLanguage && !validLanguages.includes(preferredLanguage)) {
    errors.push(`Preferred language must be one of: ${validLanguages.join(', ')}`);
  }

  const validLevels = ['Beginner', 'Intermediate', 'Advanced'];
  if (preparationLevel && !validLevels.includes(preparationLevel)) {
    errors.push(`Preparation level must be one of: ${validLevels.join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Login validation
const validateLogin = (data) => {
  const errors = [];
  const { email, password } = data;

  if (!email) errors.push('Email is required');
  if (!password) errors.push('Password is required');

  if (email && !isValidEmail(email)) {
    errors.push('Please provide a valid email address');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Course validation
const validateCourse = (data) => {
  const errors = [];
  const { title, description, educatorId, targetExam, duration, validityPeriod, price, courseType } = data;

  // Required fields
  if (!title) errors.push('Title is required');
  if (!description) errors.push('Description is required');
  if (!educatorId) errors.push('Educator ID is required');
  if (!targetExam) errors.push('Target exam is required');
  if (!duration) errors.push('Duration is required');
  if (!validityPeriod) errors.push('Validity period is required');
  if (price === undefined || price === null) errors.push('Price is required');
  if (!courseType) errors.push('Course type is required');

  // Field validation
  if (title && (title.length < 3 || title.length > 200)) {
    errors.push('Title must be 3-200 characters');
  }

  if (description && (description.length < 10 || description.length > 1000)) {
    errors.push('Description must be 10-1000 characters');
  }

  if (educatorId && (!Number.isInteger(educatorId) || educatorId <= 0)) {
    errors.push('Educator ID must be a positive integer');
  }

  if (price !== undefined && (isNaN(price) || price < 0)) {
    errors.push('Price must be a non-negative number');
  }

  const validCourseTypes = ['Video', 'Live', 'Mixed', 'Text'];
  if (courseType && !validCourseTypes.includes(courseType)) {
    errors.push(`Course type must be one of: ${validCourseTypes.join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Generic validation middleware
const validate = (validationFunction) => {
  return (req, res, next) => {
    const validation = validationFunction(req.body);
    
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validation.errors
      });
    }
    
    next();
  };
};

module.exports = {
  validateRegistration,
  validateLogin,
  validateCourse,
  validate,
  isValidEmail,
  isValidPassword,
  isValidName
};