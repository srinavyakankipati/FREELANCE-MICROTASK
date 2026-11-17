const express = require('express');
const router = express.Router();
const {
  createTask,
  updateTask,
  deleteTask,
  getTaskById,
  getMyTasks,
  getCategories,
  getAllTasks,
} = require('../controllers/taskController');
const { protect } = require('../middleware/auth');

// Public route to get categories
router.get('/categories', getCategories);

// Route to get tasks created by / assigned to current user (must be before /:id)
router.get('/my-tasks', protect, getMyTasks);

// General tasks list / search
router.get('/', getAllTasks);

// Create task (Poster-only / Client / Admin)
router.post('/', protect, createTask);

// Get single task by ID
router.get('/:id', getTaskById);

// Update task (Poster-only)
router.put('/:id', protect, updateTask);

// Delete task (Poster-only)
router.delete('/:id', protect, deleteTask);

module.exports = router;
