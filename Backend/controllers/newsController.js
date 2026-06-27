'use strict';
/**
 * newsController.js — HTTP layer for News/Broadcasts
 */

const News = require('../models/News');
const asyncHandler = require('../middleware/asyncHandler');
const AppError = require('../utils/appError');

// POST /api/news — Admin creates broadcast
const createNews = asyncHandler(async (req, res) => {
  const news = await News.create({ ...req.body, createdBy: req.user._id });
  res.status(201).json({ success: true, message: 'Broadcast published.', news });
});

// GET /api/news — All active news (public)
const getNews = asyncHandler(async (req, res) => {
  const filter = req.user.role === 'admin' ? {} : { active: true };
  const news = await News.find(filter)
    .populate('createdBy', 'username')
    .sort({ createdAt: -1 });
  res.status(200).json({ success: true, count: news.length, news });
});

// PATCH /api/news/:id — Admin update/deactivate
const updateNews = asyncHandler(async (req, res) => {
  const news = await News.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
  if (!news) throw new AppError('News not found.', 404);
  res.status(200).json({ success: true, news });
});

// DELETE /api/news/:id — Admin only
const deleteNews = asyncHandler(async (req, res) => {
  const news = await News.findByIdAndDelete(req.params.id);
  if (!news) throw new AppError('News not found.', 404);
  res.status(200).json({ success: true, message: 'News deleted.' });
});

module.exports = { createNews, getNews, updateNews, deleteNews };
