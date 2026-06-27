'use strict';
/**
 * chatController.js — HTTP layer for Chat
 */

const Chat = require('../models/Chat');
const mongoose = require('mongoose');
const asyncHandler = require('../middleware/asyncHandler');
const AppError = require('../utils/appError');

// POST /api/chat/send — Send a message
const sendMessage = asyncHandler(async (req, res) => {
  const { receiverId, text } = req.body;
  const senderId = req.user._id;

  if (!receiverId || !text) {
    throw new AppError('receiverId and text are required.', 400);
  }

  if (senderId.toString() === receiverId) {
    throw new AppError('Cannot message yourself.', 400);
  }

  const receiverObjId = mongoose.Types.ObjectId.createFromHexString(receiverId);

  // Find or create chat thread between these two users
  let chat = await Chat.findOne({
    participants: { $all: [senderId, receiverObjId] },
  });

  if (!chat) {
    chat = await Chat.create({
      participants: [senderId, receiverObjId],
      messages: [],
    });
  }

  const newMessage = {
    text,
    senderId,
    read: false,
  };

  chat.messages.push(newMessage);
  chat.lastMessage = text;
  chat.lastMessageAt = new Date();
  await chat.save();

  const savedMessage = chat.messages[chat.messages.length - 1];

  // Emit socket event for realtime updates across REST + socket sends.
  const io = req.app.get('io');
  if (io) {
    io.to(senderId.toString()).to(receiverObjId.toString()).emit('chat:newMessage', {
      chatId: chat._id.toString(),
      senderId: senderId.toString(),
      receiverId: receiverObjId.toString(),
      message: savedMessage.toObject ? savedMessage.toObject() : savedMessage,
    });
  }

  res.status(201).json({
    success: true,
    message: 'Message sent.',
    data: savedMessage,
    chatId: chat._id,
  });
});

// GET /api/chat/:userId — Get full chat thread between current user and another
const getChatThread = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const currentUser = req.user._id;

  const chat = await Chat.findOne({
    participants: { $all: [currentUser, mongoose.Types.ObjectId.createFromHexString(userId)] },
  }).populate('participants', 'username email');

  if (!chat) {
    return res.status(200).json({ success: true, messages: [], chatId: null });
  }

  // Mark all messages from the other user as read
  let hasUnread = false;
  chat.messages.forEach((msg) => {
    if (msg.senderId.toString() !== currentUser.toString() && !msg.read) {
      msg.read = true;
      hasUnread = true;
    }
  });
  if (hasUnread) await chat.save();

  res.status(200).json({
    success: true,
    chatId: chat._id,
    participants: chat.participants,
    messages: chat.messages,
  });
});

// GET /api/chat — Get all chat threads for current user with unread counts
const getMyChatList = asyncHandler(async (req, res) => {
  const chats = await Chat.find({ participants: req.user._id })
    .populate('participants', 'username email')
    .sort({ lastMessageAt: -1 });

  const formattedChats = chats.map(chat => {
    const otherParticipant = chat.participants.find(p => p._id.toString() !== req.user._id.toString());
    const unreadCount = chat.messages.filter(m => m.senderId.toString() !== req.user._id.toString() && !m.read).length;
    
    const chatObj = chat.toObject();
    delete chatObj.messages; // Don't send all messages in the list view
    
    return {
      ...chatObj,
      otherParticipant,
      unreadCount
    };
  });

  res.status(200).json({ success: true, count: formattedChats.length, chats: formattedChats });
});

// DELETE /api/chat/:chatId — Delete an entire chat thread
const deleteChat = asyncHandler(async (req, res) => {
  const chat = await Chat.findById(req.params.chatId);
  if (!chat) throw new AppError('Chat not found.', 404);

  const isParticipant = chat.participants.some(
    (p) => p.toString() === req.user._id.toString()
  );
  if (!isParticipant && req.user.role !== 'admin') {
    throw new AppError('Not authorized.', 403);
  }

  await chat.deleteOne();
  res.status(200).json({ success: true, message: 'Chat deleted.' });
});

module.exports = { sendMessage, getChatThread, getMyChatList, deleteChat };
