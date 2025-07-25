const { 
  createTest, 
  getTestsByCourse, 
  getTestById, 
  updateTest, 
  deleteTest, 
  getAllTests,
  createTestQuestion,
  getQuestionsByTest 
} = require('../models/testModels');
const { getCourseById } = require('../models/courseModels');

/**
 * Create a new test
 */
const createNewTest = async (req, res) => {
  try {
    const { courseId, title, description, duration, totalMarks, passingMarks, testType } = req.body;

    // Validate required fields
    if (!courseId || !title || !description || !duration || !totalMarks || !passingMarks || !testType) {
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

    const testId = await createTest({
      courseId: parseInt(courseId),
      title: title.trim(),
      description: description.trim(),
      duration: parseInt(duration),
      totalMarks: parseInt(totalMarks),
      passingMarks: parseInt(passingMarks),
      testType,
    });

    res.status(201).json({ 
      success: true,
      message: 'Test created successfully', 
      data: { testId }
    });
  } catch (err) {
    console.error('Error creating test:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { details: err.message })
    });
  }
};

/**
 * Get all tests
 */
const fetchAllTests = async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const tests = await getAllTests(parseInt(limit), parseInt(offset));
    
    res.status(200).json({
      success: true,
      data: tests,
      meta: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        count: tests.length
      }
    });
  } catch (err) {
    console.error('Error fetching tests:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
};

/**
 * Get tests by course ID
 */
const fetchTestsByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    
    if (!courseId || isNaN(courseId)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid course ID' 
      });
    }

    const course = await getCourseById(parseInt(courseId));
    if (!course) {
      return res.status(404).json({ 
        success: false,
        error: 'Course not found' 
      });
    }

    const tests = await getTestsByCourse(parseInt(courseId));

    res.status(200).json({
      success: true,
      data: tests
    });
  } catch (err) {
    console.error('Error fetching course tests:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
};

/**
 * Get test by ID
 */
const fetchTestById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid test ID' 
      });
    }

    const test = await getTestById(parseInt(id));

    if (!test) {
      return res.status(404).json({ 
        success: false,
        error: 'Test not found' 
      });
    }

    // Get test questions
    const questions = await getQuestionsByTest(parseInt(id));

    res.status(200).json({
      success: true,
      data: {
        ...test,
        questions
      }
    });
  } catch (err) {
    console.error('Error fetching test:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
};

/**
 * Add question to test
 */
const addTestQuestion = async (req, res) => {
  try {
    const { testId } = req.params;
    const { question, options, correctAnswer, marks, explanation } = req.body;

    if (!testId || isNaN(testId)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid test ID' 
      });
    }

    // Validate required fields
    if (!question || !options || !correctAnswer || !marks) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing required fields' 
      });
    }

    // Verify test exists
    const test = await getTestById(parseInt(testId));
    if (!test) {
      return res.status(404).json({ 
        success: false,
        error: 'Test not found' 
      });
    }

    const questionId = await createTestQuestion({
      testId: parseInt(testId),
      question: question.trim(),
      options,
      correctAnswer,
      marks: parseInt(marks),
      explanation: explanation || '',
    });

    res.status(201).json({ 
      success: true,
      message: 'Question added successfully', 
      data: { questionId }
    });
  } catch (err) {
    console.error('Error adding test question:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
};

/**
 * Update test
 */
const modifyTest = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid test ID' 
      });
    }

    const existingTest = await getTestById(parseInt(id));
    if (!existingTest) {
      return res.status(404).json({ 
        success: false,
        error: 'Test not found' 
      });
    }

    const allowedUpdates = ['title', 'description', 'duration', 'total_marks', 'passing_marks'];
    const updates = {};
    
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key) && req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    });

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ 
        success: false,
        error: 'No valid fields to update' 
      });
    }

    const updated = await updateTest(parseInt(id), updates);

    res.status(200).json({
      success: true,
      message: 'Test updated successfully',
      data: updated
    });
  } catch (err) {
    console.error('Error updating test:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
};

/**
 * Delete test
 */
const removeTest = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid test ID' 
      });
    }

    const existingTest = await getTestById(parseInt(id));
    if (!existingTest) {
      return res.status(404).json({ 
        success: false,
        error: 'Test not found' 
      });
    }

    await deleteTest(parseInt(id));

    res.status(200).json({
      success: true,
      message: 'Test deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting test:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
};

module.exports = {
  createNewTest,
  fetchAllTests,
  fetchTestsByCourse,
  fetchTestById,
  addTestQuestion,
  modifyTest,
  removeTest,
};