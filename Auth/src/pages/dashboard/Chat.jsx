import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { apiRequest } from '../../lib/api';
import { socket } from '../../lib/socket';
import { Send, User, Building2, Shield, Trash2, Bell } from 'lucide-react';

export default function Chat() {
  const { user } = useSelector(state => state.auth);
  const { systemUsers, donors, bloodBanks } = useSelector(state => state.data);
  const messagesEndRef = useRef(null);
  const activeChatUserIdRef = useRef(null);

  const allContacts = useMemo(() => {
    const list = [];
    
    // Add Donors
    (donors || []).forEach(d => {
      if (d.userId !== user?._id) {
        list.push({ ...d, type: 'donor' });
      }
    });

    // Add Approved Banks
    (bloodBanks || []).filter(b => b.status === 'approved').forEach(b => {
      if (b.ownerUserId !== user?._id) {
        list.push({ ...b, type: 'bank', isBank: true });
      }
    });

    // Add Other Users (Admins, etc)
    (systemUsers || []).forEach(u => {
      if (u.id !== user?._id) {
        const alreadyInList = list.some(item => (item.userId === u.id || item.ownerUserId === u.id));
        if (!alreadyInList) {
          list.push({ 
            id: u.id, 
            name: u.identifier || u.username, 
            role: u.role, 
            type: 'user',
            userId: u.id 
          });
        }
      }
    });

    return list;
  }, [donors, bloodBanks, systemUsers, user?._id]);

  const location = useLocation();
  const [activeContact, setActiveContact] = useState(location.state?.selectedDonor || allContacts[0] || null);
  const [message, setMessage] = useState('');
  const [threadMessages, setThreadMessages] = useState([]);
  const [chats, setChats] = useState([]);

  const fetchChats = async () => {
    try {
      const payload = await apiRequest('/chat');
      setChats(payload.chats || []);
    } catch { /* silent */ }
  };

  useEffect(() => {
    fetchChats();
  }, [threadMessages]);

  const getContactChatUserId = (contact) => {
    if (!contact) return null;
    if (contact.isBank) return contact.ownerUserId || null;
    return contact.userId || null;
  };

  const activeChatUserId = getContactChatUserId(activeContact);

  const contactsWithUnread = useMemo(() => {
    // 1. Map all potential contacts to their chat info
    const fullList = allContacts.map(contact => {
      const chatUserId = getContactChatUserId(contact);
      const chatInfo = (chats || []).find(c => c.otherParticipant?._id === chatUserId);
      return {
        ...contact,
        unreadCount: chatInfo?.unreadCount || 0,
        chatId: chatInfo?._id,
        lastMessageAt: chatInfo?.lastMessageAt || null,
        hasChat: !!chatInfo
      };
    });

    // 2. Filter list: Show only those with an active chat history OR the currently selected contact
    return fullList.filter(c => c.hasChat || (activeChatUserId && getContactChatUserId(c) === activeChatUserId))
      .sort((a, b) => new Date(b.lastMessageAt || 0) - new Date(a.lastMessageAt || 0));
  }, [allContacts, chats, activeChatUserId]);

  useEffect(() => {
    activeChatUserIdRef.current = activeChatUserId;
  }, [activeChatUserId]);

  // Keep activeContact valid when donors/banks load.
  useEffect(() => {
    if (!activeContact && allContacts.length > 0) {
      setActiveContact(allContacts[0]);
    }
  }, [activeContact, allContacts]);

  const fetchThread = async () => {
    if (!user?._id || !activeChatUserId) return;
    try {
      const payload = await apiRequest(`/chat/${activeChatUserId}`);
      setThreadMessages(payload.messages || []);
    } catch (error) {
      toast.error(error.message || 'Failed to fetch chat thread.');
    }
  };

  useEffect(() => {
    fetchThread();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id, activeChatUserId]);
  // Subscribe to realtime chat events.
  useEffect(() => {
    if (!user?._id) return;

    if (!socket.connected) {
      socket.connect();
    }

    const handleMessageReceived = (payload) => {
      try {
        const currentUserId = user._id.toString();
        const senderId = payload.senderId?.toString();
        const receiverId = payload.receiverId?.toString();
        const otherUserId = senderId === currentUserId ? receiverId : senderId;

        const currentActiveChatUserId = activeChatUserIdRef.current;
        if (!currentActiveChatUserId) return;
        if (otherUserId === currentActiveChatUserId) {
          setThreadMessages((prev) => {
            const alreadyExists = prev.some((m) => m._id && payload.message?._id && m._id.toString() === payload.message._id.toString());
            if (alreadyExists) return prev;
            return [...prev, payload.message];
          });
        }
      } catch {
        // ignore malformed payloads
      }
    };

    const handleSocketError = ({ message: errMsg }) => {
      toast.error(errMsg || 'Socket error');
    };

    socket.on('chat:message:received', handleMessageReceived);
    socket.on('error:socket', handleSocketError);

    return () => {
      socket.off('chat:message:received', handleMessageReceived);
      socket.off('error:socket', handleSocketError);
    };
  }, [user?._id]);

  const handleDeleteThread = async () => {
    const chatId = contactsWithUnread.find(c => getContactChatUserId(c) === activeChatUserId)?.chatId;
    if (!chatId) return;

    if (window.confirm('Are you sure you want to permanently delete this chat thread?')) {
      try {
        await apiRequest(`/chat/${chatId}`, { method: 'DELETE' });
        toast.success('Chat deleted');
        setThreadMessages([]);
        fetchChats();
      } catch (error) {
        toast.error('Failed to delete chat');
      }
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!message.trim() || !activeChatUserId) return;

    const text = message.trim();
    setMessage('');

    try {
      // Use socket for sending if connected, fallback to REST if needed
      if (socket.connected) {
        socket.emit('chat:message:send', { receiverId: activeChatUserId, text });
        // Optimistic UI update or wait for thread refresh
        fetchThread();
        fetchChats();
      } else {
        await apiRequest('/chat/send', {
          method: 'POST',
          body: JSON.stringify({ receiverId: activeChatUserId, text }),
        });
        await fetchThread();
        fetchChats();
      }
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
      toast.error(error.message || 'Failed to send message.');
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [threadMessages]);

  return (
    <div className="flex h-[calc(100vh-8rem)] bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-gray-200 dark:border-zinc-800 overflow-hidden">

      {/* Contact List */}
      <div className="w-1/3 min-w-[220px] max-w-[280px] border-r border-gray-200 dark:border-zinc-800 flex flex-col bg-gray-50 dark:bg-zinc-900/80">
        <div className="p-4 border-b border-gray-200 dark:border-zinc-800 shrink-0">
          <h2 className="text-base font-bold text-gray-900 dark:text-white">Messages</h2>
          <p className="text-xs text-gray-400 mt-0.5">{allContacts.length} contacts</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {contactsWithUnread.map(contact => {
            const isActive =
              activeContact &&
              (getContactChatUserId(activeContact) === getContactChatUserId(contact));
            return (
              <button
                key={`${contact.isBank ? 'b' : 'd'}-${getContactChatUserId(contact) || contact.id}`}
                onClick={() => setActiveContact(contact)}
                className={`w-full text-left p-4 flex items-center gap-3 transition-colors border-b border-gray-100 dark:border-zinc-800 relative
                  ${isActive ? 'bg-red-50 dark:bg-red-900/20' : 'hover:bg-gray-100 dark:hover:bg-zinc-800'}`}
              >
                <div className="relative shrink-0">
                  <div className="w-11 h-11 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400">
                    {contact.isBank ? <Building2 size={20} /> : contact.role === 'admin' ? <Shield size={20} /> : <User size={20} />}
                  </div>
                  {/* Online dot */}
                  <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-zinc-900 ${contact.online ? 'bg-green-500' : 'bg-gray-300 dark:bg-zinc-600'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-white truncate text-sm flex items-center justify-between">
                    {contact.name}
                    {contact.unreadCount > 0 && (
                      <motion.span 
                        animate={{ scale: [1, 1.2, 1], opacity: [1, 0.8, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="w-5 h-5 bg-green-500 text-white text-[10px] rounded-full flex items-center justify-center shadow-sm"
                      >
                        {contact.unreadCount}
                      </motion.span>
                    )}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {contact.isBank ? '🏥 Blood Bank' : contact.role === 'admin' ? '🛡️ Admin' : contact.bloodGroup ? `🩸 ${contact.bloodGroup}` : '👤 User'} · {contact.city || 'Global'}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Chat Thread */}
      <div className="flex-1 flex flex-col min-w-0">
        {activeContact ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between bg-white dark:bg-zinc-900 shrink-0">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400 font-bold">
                    {activeContact.isBank ? <Building2 size={18} /> : activeContact.role === 'admin' ? <Shield size={18} /> : activeContact.bloodGroup || <User size={18} />}
                  </div>
                  <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-zinc-900 ${activeContact.online ? 'bg-green-500' : 'bg-gray-300 dark:bg-zinc-600'}`} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white leading-none">{activeContact.name}</h3>
                  <p className={`text-xs mt-0.5 ${activeContact.online ? 'text-green-500' : 'text-gray-400'}`}>
                    {activeContact.online ? '● Online' : '○ Offline'} · {activeContact.isBank ? 'Blood Bank' : activeContact.role === 'admin' ? 'Administrator' : activeContact.bloodGroup ? 'Blood Donor' : 'User'}
                  </p>
                </div>
              </div>
              
              <button 
                onClick={handleDeleteThread}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                title="Delete chat permanently"
              >
                <Trash2 size={20} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50 dark:bg-zinc-900/50">
              <AnimatePresence initial={false}>
                {threadMessages.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-gray-400 dark:text-gray-600">
                    <p className="text-sm">Start the conversation. Be respectful and clear about your need.</p>
                  </div>
                ) : (
                  threadMessages.map((msg) => {
                    const isMe = msg.senderId?.toString() === user?._id?.toString();
                    return (
                      <motion.div
                        key={msg._id?.toString() || msg.createdAt?.toString() || msg.text}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${isMe ? 'bg-red-600 text-white rounded-br-none' : 'bg-white dark:bg-zinc-800 text-gray-900 dark:text-white rounded-bl-none border border-gray-100 dark:border-zinc-700'}`}>
                          <p>{msg.text}</p>
                          <span className={`text-[10px] mt-1 block ${isMe ? 'text-red-200' : 'text-gray-400'}`}>
                            {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-4 bg-white dark:bg-zinc-900 border-t border-gray-200 dark:border-zinc-800 flex gap-3 shrink-0">
              <input
                type="text"
                placeholder={`Message ${activeContact.name}...`}
                className="flex-1 bg-gray-100 dark:bg-zinc-800 rounded-full px-5 py-3 text-sm text-gray-900 dark:text-white outline-none"
                value={message}
                onChange={e => setMessage(e.target.value)}
              />
              <button
                type="submit"
                disabled={!message.trim()}
                className="w-11 h-11 bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-full flex items-center justify-center text-white transition-all active:scale-95 shrink-0"
              >
                <Send size={18} className="-ml-0.5 mt-0.5" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <p>Select a contact to start chatting.</p>
          </div>
        )}
      </div>
    </div>
  );
}
