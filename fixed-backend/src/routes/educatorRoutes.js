const express = require('express');
const router = express.Router();
const { 
  createNewEducator, 
  fetchAllEducators, 
  fetchEducatorById, 
  modifyEducator, 
  removeEducator,
  fetchEducatorCourses 
} = require('../controllers/educatorController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

// Get all educators (public)
router.get('/', fetchAllEducators);

// Get educator by ID (public)
router.get('/:id', fetchEducatorById);

// Get educator's courses (public)
router.get('/:id/courses', fetchEducatorCourses);

// Create new educator (protected - admin only)
router.post('/', authenticate, createNewEducator);

// Update educator (protected - admin or educator themselves)
router.put('/:id', authenticate, modifyEducator);

// Delete educator (protected - admin only)
router.delete('/:id', authenticate, removeEducator);

module.exports = router;