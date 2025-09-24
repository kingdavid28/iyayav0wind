import { useState, useEffect, useCallback } from 'react';
import messagingService from '../services/firebaseMessagingService';
import { useAuth } from '../contexts/AuthContext';

/**
 * Custom hook for messaging functionality
 * Provides conversation management and real-time updates
 */
export const useMessaging = (userRole = 'parent') => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  // Set current user in messaging service
  useEffect(() => {
    if (user?.uid) {
      messagingService.setCurrentUser(user.uid);
    }
  }, [user]);

  const loadConversations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await messagingService.getConversations();
      setConversations(data);
    } catch (err) {
      setError(err.message);
      console.error('Error loading conversations:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Set up real-time listener
  useEffect(() => {
    loadConversations();

    const unsubscribe = messagingService.subscribeToConversations((updatedConversations) => {
      setConversations(updatedConversations);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [loadConversations]);

  // Send a message
  const sendMessage = useCallback(async (recipientId, messageText, messageType = 'text', fileData = null) => {
    try {
      if (!user?.uid) {
        throw new Error('User not authenticated');
      }

      const messageId = await messagingService.sendMessage(
        user.uid,
        recipientId,
        messageText,
        messageType,
        fileData
      );

      return messageId;
    } catch (err) {
      console.error('Error sending message:', err);
      throw err;
    }
  }, [user]);

  // Mark messages as read
  const markAsRead = useCallback(async (conversationId, messageIds) => {
    try {
      await messagingService.markAsRead(conversationId, messageIds);
    } catch (err) {
      console.error('Error marking messages as read:', err);
      throw err;
    }
  }, []);

  // Get messages for a conversation
  const getMessages = useCallback(async (conversationId) => {
    try {
      const messages = await messagingService.getMessages(conversationId);
      return messages;
    } catch (err) {
      console.error('Error getting messages:', err);
      throw err;
    }
  }, []);

  // Create connection with another user
  const createConnection = useCallback(async (otherUserId) => {
    try {
      if (!user?.uid) {
        throw new Error('User not authenticated');
      }

      await messagingService.createConnection(user.uid, otherUserId);
    } catch (err) {
      console.error('Error creating connection:', err);
      throw err;
    }
  }, [user]);

  // Subscribe to messages for a specific conversation
  const subscribeToMessages = useCallback((conversationId, callback) => {
    return messagingService.subscribeToMessages(conversationId, callback);
  }, []);

  return {
    conversations,
    loading,
    error,
    loadConversations,
    sendMessage,
    markAsRead,
    getMessages,
    createConnection,
    subscribeToMessages,
    userRole,
  };
};
