const express = require('express');
const router = express.Router();
const { createNews, getNews, updateNews, deleteNews } = require('../controllers/newsController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

// POST /api/news — Admin only
router.post('/', protect, authorize('admin'), createNews);

// GET /api/news — All authenticated users
router.get('/', protect, getNews);

// PATCH /api/news/:id — Admin only
router.patch('/:id', protect, authorize('admin'), updateNews);

// DELETE /api/news/:id — Admin only
router.delete('/:id', protect, authorize('admin'), deleteNews);

module.exports = router;
