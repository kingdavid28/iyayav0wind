import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import firebaseMessagingService from '../services/firebaseMessagingService';
import { firebaseAuthService } from '../services/firebaseAuthService';
import { getMessageQueue } from '../components/messaging/OfflineMessageQueue';

const MessagingContext = createContext();
const INITIAL_STATUS = 'idle';

const deriveStatusFromError = (error) => {
  const serviceStatus =
    error?.serviceStatus ||
    error?.response?.data?.serviceStatus ||
    error?.response?.serviceStatus ||
    error?.data?.serviceStatus;

  if (serviceStatus === 'maintenance') {
    return 'maintenance';
  }

  const statusCode = error?.status || error?.statusCode || error?.response?.status;
  if (statusCode === 503) {
    return 'maintenance';
  }

  return 'error';
};

export const MessagingProvider = ({ children }) => {
  const [conversations, setConversations] = useState([]);
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const [conversationsError, setConversationsError] = useState(null);
  const [conversationsStatus, setConversationsStatus] = useState(INITIAL_STATUS);
  const [cachedConversations, setCachedConversations] = useState([]);
  const [conversationsLastSyncedAt, setConversationsLastSyncedAt] = useState(null);

  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messagesError, setMessagesError] = useState(null);
  const [messagesStatus, setMessagesStatus] = useState(INITIAL_STATUS);
  const [cachedMessages, setCachedMessages] = useState([]);
  const [messagesLastSyncedAt, setMessagesLastSyncedAt] = useState(null);
  const [typingUsers, setTypingUsers] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [queueStatus, setQueueStatus] = useState(() => getMessageQueue().getQueueStatus());
  const [presenceMap, setPresenceMap] = useState({});

  const conversationsUnsubscribeRef = useRef(null);
  const messagesUnsubscribeRef = useRef(null);
  const typingUnsubscribeRef = useRef(null);
  const presenceUnsubscribeRef = useRef({});

  const ensurePresenceSubscription = useCallback((targetUserId) => {
    if (!targetUserId) return;
    const key = String(targetUserId);

    if (presenceUnsubscribeRef.current[key]) {
      return;
    }

    const unsubscribe = firebaseMessagingService.listenToUserPresence(key, (status) => {
      setPresenceMap((prev) => ({
        ...prev,
        [key]: status || null,
      }));
    });

    presenceUnsubscribeRef.current[key] = unsubscribe;
  }, []);

  useEffect(() => {
    return () => {
      if (conversationsUnsubscribeRef.current) {
        conversationsUnsubscribeRef.current();
      }
      if (messagesUnsubscribeRef.current) {
        messagesUnsubscribeRef.current();
      }
      if (typingUnsubscribeRef.current) {
        typingUnsubscribeRef.current();
      }
      Object.values(presenceUnsubscribeRef.current || {}).forEach((unsub) => {
        if (typeof unsub === 'function') {
          unsub();
        }
      });
      presenceUnsubscribeRef.current = {};
    };
  }, []);

  useEffect(() => {
    const queue = getMessageQueue();
    queue.initialize?.();
    const unsubscribe = queue.addListener?.((status) => {
      setQueueStatus(status);
    });

    setQueueStatus(queue.getQueueStatus?.() || queueStatus);

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  const subscribeToConversations = useCallback((userId, userType = 'parent') => {
    const startSubscription = async () => {
      if (!userId) {
        if (conversationsUnsubscribeRef.current) {
          conversationsUnsubscribeRef.current();
          conversationsUnsubscribeRef.current = null;
        }
        setConversations([]);
        setConversationsLoading(false);
        setConversationsStatus('idle');
        return;
      }

      setConversationsLoading(true);
      setConversationsError(null);
      setConversationsStatus('loading');

      if (conversationsUnsubscribeRef.current) {
        conversationsUnsubscribeRef.current();
        conversationsUnsubscribeRef.current = null;
      }

      try {
        await firebaseMessagingService.ensureRealtimeSession();
        const firebaseUid = firebaseAuthService.getCurrentUser()?.uid;
        if (firebaseUid && String(firebaseUid) !== String(userId)) {
          console.warn('⚠️ MessagingContext: Firebase UID mismatch for conversations subscription', {
            firebaseUid,
            requestedUserId: userId,
            userType,
          });
        }

        const unsubscribe = firebaseMessagingService.getConversations(
          userId,
          (data) => {
            const conversationsList = data || [];
            setConversations(conversationsList);
            setConversationsLoading(false);
            setConversationsStatus('ready');
            setCachedConversations(conversationsList);
            setConversationsLastSyncedAt(Date.now());

            conversationsList.forEach((conversation) => {
              const participantId = userType === 'caregiver' ? conversation?.parentId : conversation?.caregiverId;
              ensurePresenceSubscription(participantId);
            });
          },
          userType
        );

        conversationsUnsubscribeRef.current = unsubscribe;
      } catch (error) {
        console.error('MessagingContext: conversations subscription failed', error);
        setConversationsError(error);
        setConversationsLoading(false);
        const derivedStatus = deriveStatusFromError(error);
        setConversationsStatus(derivedStatus);
        if (derivedStatus === 'maintenance' && cachedConversations.length > 0) {
          setConversations(cachedConversations);
        } else {
          setConversations([]);
        }
      }
    };

    startSubscription();
  }, [cachedConversations.length]);

  const subscribeToMessages = useCallback((conversationId, userId, caregiverId) => {
    const startSubscription = async () => {
      if (messagesUnsubscribeRef.current) {
        messagesUnsubscribeRef.current();
        messagesUnsubscribeRef.current = null;
      }
      if (typingUnsubscribeRef.current) {
        typingUnsubscribeRef.current();
        typingUnsubscribeRef.current = null;
      }

      if (!conversationId) {
        setMessages([]);
        setMessagesLoading(false);
        setMessagesStatus('idle');
        setTypingUsers([]);
        return;
      }

      setMessagesLoading(true);
      setMessagesError(null);
      setMessagesStatus('loading');

      try {
        await firebaseMessagingService.ensureRealtimeSession();
        const firebaseUid = firebaseAuthService.getCurrentUser()?.uid;
        if (firebaseUid && userId && String(firebaseUid) !== String(userId)) {
          console.warn('⚠️ MessagingContext: Firebase UID mismatch for message subscription', {
            firebaseUid,
            conversationId,
            requestedUserId: userId,
          });
        }

        const unsubscribe = firebaseMessagingService.getMessages(
          userId,
          caregiverId,
          (data) => {
            setMessages(data?.messages || []);
            setMessagesLoading(false);
            setMessagesStatus('ready');
            setCachedMessages(data?.messages || []);
            setMessagesLastSyncedAt(Date.now());
          }
        );

        messagesUnsubscribeRef.current = unsubscribe;

        const typingUnsubscribe = firebaseMessagingService.listenToTypingStatus(
          conversationId,
          (users) => {
            setTypingUsers(users);
          }
        );

        typingUnsubscribeRef.current = typingUnsubscribe;
        const participantIds = String(conversationId).split('_');
        const normalizedUserId = userId ? String(userId) : null;
        const otherParticipantId = participantIds.length === 2
          ? participantIds.find((id) => id !== normalizedUserId) || participantIds[0]
          : caregiverId || participantIds[0];

        ensurePresenceSubscription(otherParticipantId);
      } catch (error) {
        console.error('MessagingContext: messages subscription failed', error);
        setMessagesError(error);
        setMessagesLoading(false);
        const derivedStatus = deriveStatusFromError(error);
        setMessagesStatus(derivedStatus);
        if (derivedStatus === 'maintenance' && cachedMessages.length > 0) {
          setMessages(cachedMessages);
        } else {
          setMessages([]);
        }
        setTypingUsers([]);
      }
    };

    startSubscription();
  }, [cachedMessages.length]);

  const sendMessage = useCallback(async (userId, caregiverId, messageText, messageType = 'text', fileData = null, conversationId = null) => {
    try {
      return await firebaseMessagingService.sendMessage(userId, caregiverId, messageText, messageType, fileData, conversationId);
    } catch (error) {
      console.error('MessagingContext: sendMessage failed', error);
      throw error;
    }
  }, []);

  const setTypingStatus = useCallback(async (conversationId, userId, typing) => {
    try {
      setIsTyping(Boolean(typing));
      await firebaseMessagingService.setTypingStatus(conversationId, userId, typing);
    } catch (error) {
      console.error('MessagingContext: setTypingStatus failed', error);
    }
  }, []);

  const updatePresence = useCallback(async (status = {}) => {
    try {
      await firebaseMessagingService.updateCurrentUserPresence(status);
    } catch (error) {
      console.error('MessagingContext: updatePresence failed', error);
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

  const clearConversationsError = useCallback(() => {
    setConversationsError(null);
    if (conversations.length > 0) {
      setConversationsStatus('ready');
    } else {
      setConversationsStatus('idle');
    }
  }, [conversations.length]);

  const clearMessagesError = useCallback(() => {
    setMessagesError(null);
    if (messages.length > 0) {
      setMessagesStatus('ready');
    } else {
      setMessagesStatus('idle');
    }
  }, [messages.length]);

  const totalUnreadCount = useMemo(() => {
    if (!Array.isArray(conversations)) return 0;
    return conversations.reduce((count, conversation) => {
      const unread = conversation?.unreadCount || 0;
      return count + (Number.isFinite(unread) ? unread : 0);
    }, 0);
  }, [conversations]);

  const getConversationById = useCallback(
    (id) => conversations?.find((conversation) => conversation?.id === id) || null,
    [conversations]
  );

  const value = useMemo(
    () => ({
      conversations,
      conversationsLoading,
      conversationsError,
      conversationsStatus,
      cachedConversations,
      conversationsLastSyncedAt,
      activeConversationId,
      setActiveConversationId,
      messages,
      messagesLoading,
      messagesError,
      messagesStatus,
      cachedMessages,
      messagesLastSyncedAt,
      subscribeToConversations,
      subscribeToMessages,
      sendMessage,
      setTypingStatus,
      markMessagesAsRead,
      clearConversationsError,
      clearMessagesError,
      totalUnreadCount,
      getConversationById,
      typingUsers,
      isTyping,
      queueStatus,
      presenceMap,
      updatePresence,
    }),
    [
      conversations,
      conversationsLoading,
      conversationsError,
      conversationsStatus,
      cachedConversations,
      conversationsLastSyncedAt,
      activeConversationId,
      messages,
      messagesLoading,
      messagesError,
      messagesStatus,
      cachedMessages,
      messagesLastSyncedAt,
      subscribeToConversations,
      subscribeToMessages,
      sendMessage,
      setTypingStatus,
      markMessagesAsRead,
      clearConversationsError,
      clearMessagesError,
      totalUnreadCount,
      getConversationById,
      typingUsers,
      isTyping,
      queueStatus,
      presenceMap,
      updatePresence,
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
