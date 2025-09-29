import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import firebaseMessagingService from '../services/firebaseMessagingService';

const MessagingContext = createContext();

export const MessagingProvider = ({ children }) => {
  const [conversations, setConversations] = useState([]);
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const [conversationsError, setConversationsError] = useState(null);

  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messagesError, setMessagesError] = useState(null);

  const conversationsUnsubscribeRef = useRef(null);
  const messagesUnsubscribeRef = useRef(null);

  useEffect(() => {
    return () => {
      if (conversationsUnsubscribeRef.current) {
        conversationsUnsubscribeRef.current();
      }
      if (messagesUnsubscribeRef.current) {
        messagesUnsubscribeRef.current();
      }
    };
  }, []);

  const subscribeToConversations = useCallback((userId, userType = 'parent') => {
    if (!userId) {
      setConversations([]);
      setConversationsLoading(false);
      return;
    }

    setConversationsLoading(true);
    setConversationsError(null);

    if (conversationsUnsubscribeRef.current) {
      conversationsUnsubscribeRef.current();
      conversationsUnsubscribeRef.current = null;
    }

    try {
      const unsubscribe = firebaseMessagingService.getConversations(
        userId,
        (data) => {
          setConversations(data || []);
          setConversationsLoading(false);
        },
        userType
      );

      conversationsUnsubscribeRef.current = unsubscribe;
    } catch (error) {
      console.error('MessagingContext: conversations subscription failed', error);
      setConversationsError(error);
      setConversationsLoading(false);
    }
  }, []);

  const subscribeToMessages = useCallback((conversationId, userId, caregiverId) => {
    if (messagesUnsubscribeRef.current) {
      messagesUnsubscribeRef.current();
      messagesUnsubscribeRef.current = null;
    }

    if (!conversationId) {
      setMessages([]);
      setMessagesLoading(false);
      return;
    }

    setMessagesLoading(true);
    setMessagesError(null);

    try {
      const unsubscribe = firebaseMessagingService.getMessages(
        userId,
        caregiverId,
        (data) => {
          setMessages(data?.messages || []);
          setMessagesLoading(false);
        }
      );

      messagesUnsubscribeRef.current = unsubscribe;
    } catch (error) {
      console.error('MessagingContext: messages subscription failed', error);
      setMessagesError(error);
      setMessagesLoading(false);
    }
  }, []);

  const sendMessage = useCallback(async (userId, caregiverId, messageText, messageType = 'text', fileData = null, conversationId = null) => {
    try {
      return await firebaseMessagingService.sendMessage(userId, caregiverId, messageText, messageType, fileData, conversationId);
    } catch (error) {
      console.error('MessagingContext: sendMessage failed', error);
      throw error;
    }
  }, []);

  const markMessagesAsRead = useCallback(async (userId, caregiverId, conversationId = null) => {
    try {
      await firebaseMessagingService.markMessagesAsRead(userId, caregiverId, conversationId);
    } catch (error) {
      console.error('MessagingContext: markMessagesAsRead failed', error);
      throw error;
    }
  }, []);

  const value = useMemo(
    () => ({
      conversations,
      conversationsLoading,
      conversationsError,
      activeConversationId,
      setActiveConversationId,
      messages,
      messagesLoading,
      messagesError,
      subscribeToConversations,
      subscribeToMessages,
      sendMessage,
      markMessagesAsRead
    }),
    [
      conversations,
      conversationsLoading,
      conversationsError,
      activeConversationId,
      messages,
      messagesLoading,
      messagesError,
      subscribeToConversations,
      subscribeToMessages,
      sendMessage,
      markMessagesAsRead
    ]
  );

  return <MessagingContext.Provider value={value}>{children}</MessagingContext.Provider>;
};

export const useMessaging = () => {
  const context = useContext(MessagingContext);
  if (!context) {
    throw new Error('useMessaging must be used within a MessagingProvider');
  }
  return context;
};

export default MessagingContext;
