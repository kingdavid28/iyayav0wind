import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { View, ActivityIndicator } from 'react-native';
import { getAuthSync } from '../config/firebase';
import firebaseMessagingService from '../services/firebaseMessagingService';
import { firebaseAuthService } from '../services/firebaseAuthService';
import { firebaseRealtimeService } from '../services/firebaseRealtimeService';
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
  // Firebase user state for proper UID synchronization
  const [currentFirebaseUser, setCurrentFirebaseUser] = useState(null);
  const [firebaseUserLoading, setFirebaseUserLoading] = useState(true);

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
  const firebaseUserUnsubscribeRef = useRef(null);

  const ensurePresenceSubscription = useCallback((targetUserId) => {
    if (!targetUserId) return;
    const key = String(targetUserId);

    if (presenceUnsubscribeRef.current[key]) {
      return;
    }

    console.log('👤 Subscribing to presence for user:', key);
    const unsubscribe = firebaseMessagingService.listenToUserPresence(key, (status) => {
      setPresenceMap((prev) => ({
        ...prev,
        [key]: status || null,
      }));
    });

    presenceUnsubscribeRef.current[key] = unsubscribe;
  }, []);

  // Initialize Firebase user for proper UID synchronization
  useEffect(() => {
    let mounted = true;

    const initializeFirebaseUser = async () => {
      try {
        setFirebaseUserLoading(true);

        // Check if Firebase auth is already initialized and get current user
        const auth = getAuthSync();
        let currentUser = auth.currentUser;

        // If no current user, try to get from firebaseAuthService
        if (!currentUser) {
          currentUser = firebaseAuthService.getCurrentUser();
        }

        if (currentUser) {
          if (mounted) {
            setCurrentFirebaseUser(currentUser);
            setFirebaseUserLoading(false);
            console.log('🔥 Firebase user available for messaging:', currentUser.uid);
          }
        } else {
          // Wait for Firebase auth to be ready before initializing messaging
          try {
            const firebaseUser = await firebaseRealtimeService.initializeRealtimeAuth();

            if (mounted) {
              setCurrentFirebaseUser(firebaseUser);
              setFirebaseUserLoading(false);

              if (firebaseUser) {
                console.log('🔥 Firebase user initialized for messaging:', firebaseUser.uid);
              } else {
                console.warn('⚠️ No Firebase user available for messaging');
              }
            }
          } catch (error) {
            console.error('❌ Failed to initialize Firebase auth for messaging:', error);
            if (mounted) {
              setFirebaseUserLoading(false);
            }
          }
        }
      } catch (error) {
        console.error('❌ Failed to initialize Firebase user for messaging:', error);
        if (mounted) {
          setFirebaseUserLoading(false);
        }
      }
    };

    initializeFirebaseUser();

    return () => {
      mounted = false;
    };
  }, []);

  // Listen to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = firebaseAuthService.onAuthStateChanged((user) => {
      console.log('🔥 Firebase auth state changed in MessagingContext:', user?.uid || 'null');
      setCurrentFirebaseUser(user);

      if (!user) {
        console.warn('⚠️ Firebase user signed out - clearing messaging state');
        // Clear messaging state when user signs out
        setConversations([]);
        setMessages([]);
        setConversationsStatus('idle');
        setMessagesStatus('idle');
      }
    });

    return unsubscribe;
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

        // Use Firebase UID for Firebase operations, but MongoDB ID for API context
        const firebaseUserId = firebaseUid;
        console.log('🔗 Subscribing to conversations with Firebase UID:', {
          firebaseUid,
          mongoUserId: userId,
          userType,
        });

        const unsubscribe = firebaseMessagingService.getConversations(
          firebaseUserId, // Use Firebase UID for Firebase operations
          (data) => {
            const conversationsList = data || [];
            console.log('📨 MessagingContext received conversations:', {
              count: conversationsList.length,
              firebaseUid,
              userType,
              sampleConversation: conversationsList[0] ? {
                id: conversationsList[0].id,
                lastMessage: conversationsList[0].lastMessage,
                conversationId: conversationsList[0].conversationId
              } : null
            });

            setConversations(conversationsList);
            setConversationsLoading(false);
            setConversationsStatus('ready');
            setCachedConversations(conversationsList);
            setConversationsLastSyncedAt(Date.now());

            conversationsList.forEach((conversation) => {
              const participantId = userType === 'caregiver' ? conversation?.parentId : conversation?.caregiverId;

              console.log('👤 Conversation presence subscription:', {
                conversationId: conversation?.conversationId,
                participantId,
                firebaseUid,
                userType,
              });

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
  }, [cachedConversations.length, ensurePresenceSubscription, firebaseAuthService, firebaseMessagingService]);

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
        // Add timeout for loading state to prevent infinite loading
        const loadingTimeout = setTimeout(() => {
          console.warn('⚠️ Messages loading timeout reached - stopping loading state');
          setMessagesLoading(false);

          // Try to load cached messages if available
          if (cachedMessages.length > 0) {
            console.log('🔄 Using cached messages after timeout');
            setMessages(cachedMessages);
            setMessagesStatus('ready');
          } else {
            setMessages([]);
            setMessagesStatus('error');
          }
        }, 15000); // 15 second timeout

        let firebaseUid = currentFirebaseUser?.uid;

        // Fallback to Firebase Auth service if currentFirebaseUser is not available
        if (!firebaseUid) {
          console.warn('⚠️ Using fallback Firebase user for message subscription');
          const fallbackUser = firebaseAuthService.getCurrentUser();
          if (fallbackUser?.uid) {
            firebaseUid = fallbackUser.uid;
            console.log('✅ Fallback Firebase UID obtained for subscription:', firebaseUid);
          } else {
            console.warn('⚠️ No Firebase user available for message subscription');
            clearTimeout(loadingTimeout);
            setMessages([]);
            setMessagesLoading(false);
            setMessagesStatus('error');
            return;
          }
        }

        console.log('🔗 Subscribing to messages with synchronized Firebase UID:', {
          firebaseUid,
          conversationId,
          mongoUserId: userId,
        });
        const unsubscribe = firebaseMessagingService.getMessages(
          firebaseUid, // Use synchronized Firebase UID for Firebase operations
          caregiverId,
          (data) => {
            const messagesArray = data || [];
            console.log('📨 MessagingContext received messages:', {
              count: messagesArray.length,
              conversationId,
              sampleMessage: messagesArray[0] ? {
                id: messagesArray[0].id,
                text: messagesArray[0].text,
                conversationId: messagesArray[0].conversationId
              } : null
            });

            // Clear timeout when messages are received
            clearTimeout(loadingTimeout);
            setMessages(messagesArray);
            setMessagesLoading(false);
            setMessagesStatus('ready');
            setCachedMessages(messagesArray);
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
        const normalizedUserId = firebaseUid ? String(firebaseUid) : null;
        const otherParticipantId = participantIds.length === 2
          ? participantIds.find((id) => id !== normalizedUserId) || participantIds[0]
          : caregiverId || participantIds[0];

        console.log('👤 Presence subscription for participant:', {
          conversationId,
          participantIds,
          firebaseUid,
          mongoUserId: userId,
          otherParticipantId,
        });

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
  }, [cachedMessages.length, currentFirebaseUser?.uid, ensurePresenceSubscription, firebaseAuthService, firebaseMessagingService]);

  const sendMessage = useCallback(async (userId, caregiverId, messageText, messageType = 'text', fileData = null, conversationId = null) => {
    try {
      // Try to use synchronized Firebase UID first, fallback to direct Firebase Auth if needed
      let firebaseUid = currentFirebaseUser?.uid;

      // Fallback to Firebase Auth service if currentFirebaseUser is not available
      if (!firebaseUid) {
        console.warn('⚠️ Using fallback Firebase user for messaging');
        const fallbackUser = firebaseAuthService.getCurrentUser();
        if (fallbackUser?.uid) {
          firebaseUid = fallbackUser.uid;
          console.log('✅ Fallback Firebase UID obtained:', firebaseUid);
        } else {
          console.warn('⚠️ No Firebase user available for messaging');
          return;
        }
      }

      console.log('🔐 Auth State Debug:', {
        isAuthenticated: !!currentFirebaseUser,
        firebaseUid: firebaseUid,
        mongoUserId: userId,
        caregiverId: caregiverId,
        conversationId: conversationId,
        uidMatch: firebaseUid === userId
      });

      const allMessages = await firebaseMessagingService.sendMessage(
        firebaseUid, // Use synchronized Firebase UID
        caregiverId,
        messageText,
        messageType,
        fileData,
        conversationId
      );
    } catch (error) {
      console.error('MessagingContext: sendMessage failed', error);
      throw error;
    }
  }, [currentFirebaseUser?.uid, firebaseAuthService, firebaseMessagingService]);

  const setTypingStatus = useCallback(async (conversationId, userId, typing) => {
    try {
      // Try to use synchronized Firebase UID first, fallback to direct Firebase Auth if needed
      let firebaseUid = currentFirebaseUser?.uid;

      // Fallback to Firebase Auth service if currentFirebaseUser is not available
      if (!firebaseUid) {
        console.warn('⚠️ Using fallback Firebase user for typing status');
        const fallbackUser = firebaseAuthService.getCurrentUser();
        if (fallbackUser?.uid) {
          firebaseUid = fallbackUser.uid;
          console.log('✅ Fallback Firebase UID obtained for typing:', firebaseUid);
        } else {
          console.warn('⚠️ No Firebase user available for typing status');
          return;
        }
      }

      console.log('⌨️ Setting typing status with synchronized Firebase UID:', {
        firebaseUid,
        conversationId,
        mongoUserId: userId,
      });

      setIsTyping(Boolean(typing));
      await firebaseMessagingService.setTypingStatus(conversationId, firebaseUid, typing);
    } catch (error) {
      console.error('MessagingContext: setTypingStatus failed', error);
    }
  }, [currentFirebaseUser?.uid, firebaseAuthService, firebaseMessagingService]);

  const updatePresence = useCallback(async (status = {}) => {
    try {
      await firebaseMessagingService.updateCurrentUserPresence(status);
    } catch (error) {
      console.error('MessagingContext: updatePresence failed', error);
    }
  }, []);

  const markMessagesAsRead = useCallback(async (userId, caregiverId, conversationId = null) => {
    try {
      // Try to use synchronized Firebase UID first, fallback to direct Firebase Auth if needed
      let firebaseUid = currentFirebaseUser?.uid;

      // Fallback to Firebase Auth service if currentFirebaseUser is not available
      if (!firebaseUid) {
        console.warn('⚠️ Using fallback Firebase user for marking messages as read');
        const fallbackUser = firebaseAuthService.getCurrentUser();
        if (fallbackUser?.uid) {
          firebaseUid = fallbackUser.uid;
          console.log('✅ Fallback Firebase UID obtained for marking as read:', firebaseUid);
        } else {
          console.warn('⚠️ No Firebase user available for marking messages as read');
          return;
        }
      }

      console.log('👁️ Marking messages as read with synchronized Firebase UID:', {
        firebaseUid,
        mongoUserId: userId,
        caregiverId,
        conversationId,
      });

      await firebaseMessagingService.markMessagesAsRead(
        firebaseUid, // Use synchronized Firebase UID
        caregiverId,
        conversationId
      );
    } catch (error) {
      console.error('MessagingContext: markMessagesAsRead failed', error);
      throw error;
    }
  }, [currentFirebaseUser?.uid, firebaseAuthService, firebaseMessagingService]);

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
      currentFirebaseUser,
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
      getConversationById,
      typingUsers,
      isTyping,
      queueStatus,
      presenceMap,
      currentFirebaseUser,
    ]
  );

  // Don't provide context until Firebase user is initialized
  if (firebaseUserLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

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
