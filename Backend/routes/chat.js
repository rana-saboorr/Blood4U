const express = require('express');
const router = express.Router();
const { sendMessage, getChatThread, getMyChatList, deleteChat } = require('../controllers/chatController');
const { protect } = require('../middleware/auth');

// POST /api/chat/send — Send a message
router.post('/send', protect, sendMessage);

// GET /api/chat — All chat threads for logged-in user
router.get('/', protect, getMyChatList);

// GET /api/chat/:userId — Full thread with specific user
router.get('/:userId', protect, getChatThread);

// DELETE /api/chat/:chatId — Delete a thread
router.delete('/:chatId', protect, deleteChat);

module.exports = router;
