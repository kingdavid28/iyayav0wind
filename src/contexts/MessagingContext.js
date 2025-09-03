import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import { useAuth } from './AuthContext';
import messageService from '../services/notificationService';
import { messagesAPI } from '../config/api';
import { initRealtime, on as onSocket, emit as emitSocket, getSocket } from '../services/realtime';
import { subscribeToNewMessages, fetchHistory, fetchConversations, sendMessage as chatSendMessage } from '../services/chatClient';

const MessagingContext = createContext();

export const MessagingProvider = ({ children }) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const enableRealtime = process.env.EXPO_PUBLIC_ENABLE_REALTIME === 'true';
  const [otherTyping, setOtherTyping] = useState(false);

  // Initialize (optional) realtime and fetch user's conversations via REST with light polling
  useEffect(() => {
    if (!user?.uid) return;

    let mounted = true;
    let pollId;

    const init = async () => {
      setLoading(true);
      try {
        // Only attempt socket.io realtime if explicitly enabled
        if (enableRealtime) {
          await initRealtime(() => user?.getIdToken?.());
        }
      } catch {}

      const load = async () => {
        try {
          const res = await fetchConversations();
          const convs = Array.isArray(res?.conversations) ? res.conversations : Array.isArray(res) ? res : [];
          if (!mounted) return;
          setConversations(convs);

          // Compute unread
          let unread = 0;
          convs.forEach((c) => {
            const lm = c.lastMessage;
            if (lm && !lm.read && lm.senderId && lm.senderId !== user.uid) unread += 1;
          });
          setUnreadCount(unread);
        } catch (e) {
          console.error('Error fetching conversations:', e);
          if (mounted) setError('Failed to load conversations');
        } finally {
          if (mounted) setLoading(false);
        }
      };

      await load();
      // Poll every 5s to update list (until we add server push for conversation updates)
      pollId = setInterval(load, 5000);
    };

    init();
    return () => {
      mounted = false;
      if (pollId) clearInterval(pollId);
    };
  }, [user?.uid, enableRealtime]);

  // Fetch messages for active conversation and subscribe via realtime (fallback to polling inside chatClient)
  useEffect(() => {
    if (!activeConversation?.id) return;
    let unsub = () => {};
    let mounted = true;
    let offTypingStart = null;
    let offTypingStop = null;
    let typingStopTimeout = null;

    const init = async () => {
      setLoading(true);
      try {
        const history = await fetchHistory(activeConversation.id, { limit: 50 });
        const list = Array.isArray(history?.messages) ? history.messages : Array.isArray(history) ? history : [];
        if (mounted) setMessages(list);
      } catch (e) {
        console.error('Error fetching messages:', e);
        if (mounted) setError('Failed to load messages');
      } finally {
        if (mounted) setLoading(false);
      }

      unsub = subscribeToNewMessages(activeConversation.id, (msg) => {
        setMessages((prev) => {
          // Deduplicate by id/clientMessageId
          const exists = prev.some((m) => m.id === msg.id || (m.clientMessageId && m.clientMessageId === msg.clientMessageId));
          if (exists) return prev;
          return [...prev, msg];
        });
      });

      // Listen for typing events via socket.io if available
      const sock = getSocket?.();
      if (sock) {
        offTypingStart = onSocket('typing:start', (payload) => {
          if (!mounted) return;
          // Only react for current conversation
          if (payload?.userId && payload?.conversationId && payload.conversationId !== activeConversation.id) return;
          setOtherTyping(true);
          if (typingStopTimeout) clearTimeout(typingStopTimeout);
          typingStopTimeout = setTimeout(() => setOtherTyping(false), 3000);
        });
        offTypingStop = onSocket('typing:stop', (payload) => {
          if (!mounted) return;
          if (payload?.conversationId && payload.conversationId !== activeConversation.id) return;
          setOtherTyping(false);
        });
      }
    };

    init();
    return () => {
      mounted = false;
      unsub?.();
      if (offTypingStart) offTypingStart();
      if (offTypingStop) offTypingStop();
      if (typingStopTimeout) clearTimeout(typingStopTimeout);
    };
  }, [activeConversation?.id, user?.uid]);

  // Expose typing helpers
  const startTyping = () => {
    if (!activeConversation?.id) return;
    try { emitSocket('typing:start', { conversationId: activeConversation.id }); } catch {}
  };
  const stopTyping = () => {
    if (!activeConversation?.id) return;
    try { emitSocket('typing:stop', { conversationId: activeConversation.id }); } catch {}
  };

  // Start or get existing conversation
  const startConversation = async (otherUserId, jobId = null) => {
    try {
      setLoading(true);
      // Check if conversation already exists
      const existingConvo = conversations.find(
        (conv) => Array.isArray(conv.participants) && conv.participants.includes(otherUserId) && (!jobId || conv.jobId === jobId)
      );
      if (existingConvo) {
        setActiveConversation(existingConvo);
        return existingConvo;
      }
      // Fallback: create a local placeholder; backend should create on first send
      const tempId = `temp-${Date.now()}`;
      const conversation = {
        id: tempId,
        participants: [user.uid, otherUserId],
        jobId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isTemporary: true,
      };
      setActiveConversation(conversation);
      return conversation;
    } catch (error) {
      console.error('Error starting conversation:', error);
      setError('Failed to start conversation');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Send a message
  const sendMessage = async (contentOrOptions) => {
    const isObj = contentOrOptions && typeof contentOrOptions === 'object' && !Array.isArray(contentOrOptions);
    const text = isObj ? (contentOrOptions.text || '') : (contentOrOptions?.trim?.() || '');
    const attachments = isObj && Array.isArray(contentOrOptions.attachments) ? contentOrOptions.attachments : undefined;
    if (!text && (!attachments || attachments.length === 0)) return null;
    try {
      const receiverId = activeConversation?.participants?.find((id) => id !== user?.uid);
      const payload = {
        conversationId: activeConversation?.isTemporary ? undefined : activeConversation?.id,
        recipientId: receiverId,
        jobId: activeConversation?.jobId || undefined,
        text,
        attachments,
        clientMessageId: `client-${Date.now()}`,
      };
      const msg = await chatSendMessage(payload);

      // If conversation was temporary, promote with real id if provided
      if (activeConversation?.isTemporary && msg?.conversationId) {
        const updated = { ...activeConversation, id: msg.conversationId, isTemporary: false };
        setActiveConversation(updated);
      }

      // Push notification (optional, keep behavior)
      if (receiverId) {
        try {
          await messageService.sendPushNotification(
            receiverId,
            'New Message',
            text.length > 30 ? `${text.substring(0, 30)}...` : text,
            {
              type: 'message',
              conversationId: msg?.conversationId || activeConversation?.id,
              jobId: activeConversation?.jobId || null,
            }
          );
        } catch {}
      }

      return msg;
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message');
      throw error;
    }
  };

  // Mark messages as read
  const markMessagesAsRead = async (messageIds) => {
    // Best-effort: update local state and call backend conversation read endpoint
    if (!messageIds?.length && !activeConversation?.id) return;
    try {
      if (Array.isArray(messageIds) && messageIds.length > 0) {
        setMessages((prev) => prev.map((m) => (messageIds.includes(m.id) ? { ...m, read: true, readAt: new Date().toISOString() } : m)));
      } else if (activeConversation?.id) {
        setMessages((prev) => prev.map((m) => ({ ...m, read: true, readAt: new Date().toISOString() })));
      }
      if (activeConversation?.id) {
        try { await messagesAPI.markRead(activeConversation.id); } catch (_) {}
      }
    } catch (error) {
      console.error('Error marking messages as read (local):', error);
    }
  };

  // Get conversation by ID
  const getConversation = (conversationId) => {
    return conversations.find((conv) => conv.id === conversationId);
  };

  // Get or create conversation with a user
  const getOrCreateConversation = async (otherUserId, jobId = null) => {
    const existing = conversations.find(
      (conv) => conv.participants.includes(otherUserId) && (!jobId || conv.jobId === jobId)
    );

    if (existing) {
      setActiveConversation(existing);
      return existing;
    }

    return startConversation(otherUserId, jobId);
  };

  return (
    <MessagingContext.Provider
      value={{
        conversations,
        activeConversation,
        messages,
        unreadCount,
        loading,
        error,
        setActiveConversation,
        startConversation,
        getOrCreateConversation,
        sendMessage,
        markMessagesAsRead,
        getConversation,
        otherTyping,
        startTyping,
        stopTyping,
      }}
    >
      {children}
    </MessagingContext.Provider>
  );
};

export const useMessaging = () => {
  const context = useContext(MessagingContext);
  if (!context) {
    throw new Error('useMessaging must be used within a MessagingProvider');
  }
  return context;
};

export default MessagingContext;
