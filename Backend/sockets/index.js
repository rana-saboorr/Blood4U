const mongoose = require('mongoose');
const Chat = require('../models/Chat');
const logger = require('../utils/logger');

const initializeSockets = (io) => {
  io.on('connection', (socket) => {
    const userId = socket.userId;
    if (!userId) return;

    logger.info(`🔌 Socket connected: ${userId} (${socket.id})`);
    socket.join(userId.toString());

    // ─── Chat System ──────────────────────────────────────────────────────────
    socket.on('chat:message:send', async ({ receiverId, text }) => {
      try {
        if (!receiverId || typeof text !== 'string' || !text.trim()) {
          throw new Error('Receiver ID and message text are required.');
        }

        const receiverObjId = new mongoose.Types.ObjectId(receiverId);
        const senderObjId = new mongoose.Types.ObjectId(userId);

        if (senderObjId.equals(receiverObjId)) {
          throw new Error('You cannot message yourself.');
        }

        // Find or create chat safely
        let chat = await Chat.findOne({
          participants: { $all: [senderObjId, receiverObjId] }
        });
        if (!chat) {
          chat = await Chat.create({
            participants: [senderObjId, receiverObjId],
            messages: []
          });
        }

        const newMessage = {
          text: text.trim(),
          senderId: senderObjId,
          read: false,
          createdAt: new Date(),
        };

        chat.messages.push(newMessage);
        chat.lastMessage = newMessage.text;
        chat.lastMessageAt = newMessage.createdAt;
        await chat.save();

        const savedMsg = chat.messages[chat.messages.length - 1];
        const payload = {
          chatId: chat._id,
          senderId: userId,
          receiverId,
          message: savedMsg,
        };

        // Broadcast to both parties
        io.to(userId.toString()).to(receiverId.toString()).emit('chat:message:received', payload);
      } catch (err) {
        socket.emit('error:socket', { message: err.message });
      }
    });

    // ─── Emergency System ─────────────────────────────────────────────────────
    socket.on('emergency:sos:broadcast', (data) => {
      // Broadcast to everyone except the sender
      socket.broadcast.emit('emergency:sos:notified', {
        ...data,
        id: `sos_${Date.now()}`,
        broadcastedAt: new Date(),
        senderId: userId
      });
    });

    // ─── Data Syncing ─────────────────────────────────────────────────────────
    socket.on('data:sync:request', (data) => {
      // Targeted refetching
      if (data.targetId) {
        io.to(data.targetId).emit('data:sync:command', data);
      } else {
        socket.broadcast.emit('data:sync:command', data);
      }
    });

    socket.on('disconnect', (reason) => {
      logger.info(`🔌 Socket disconnected: ${userId} (${reason})`);
    });
  });
};

module.exports = { initializeSockets };
