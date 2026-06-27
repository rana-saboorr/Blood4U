const News = require('../models/News');

// POST /api/news — Admin creates broadcast
const createNews = async (req, res, next) => {
  try {
    const news = await News.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ success: true, message: 'Broadcast published.', news });
  } catch (error) {
    next(error);
  }
};

// GET /api/news — All active news (public)
const getNews = async (req, res, next) => {
  try {
    const filter = req.user.role === 'admin' ? {} : { active: true };
    const news = await News.find(filter)
      .populate('createdBy', 'username')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: news.length, news });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/news/:id — Admin update/deactivate
const updateNews = async (req, res, next) => {
  try {
    const news = await News.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
    if (!news) return res.status(404).json({ success: false, message: 'News not found.' });
    res.status(200).json({ success: true, news });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/news/:id — Admin only
const deleteNews = async (req, res, next) => {
  try {
    const news = await News.findByIdAndDelete(req.params.id);
    if (!news) return res.status(404).json({ success: false, message: 'News not found.' });
    res.status(200).json({ success: true, message: 'News deleted.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { createNews, getNews, updateNews, deleteNews };
