import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState } from 'react-native';

import notificationService from '../services/notificationService';
import { useAuth } from './AuthContext';
import { usePushNotifications } from '../hooks/usePushNotifications';
import Toast from '../components/ui/feedback/Toast';
import { notificationEvents } from '../utils/notificationEvents';

const INITIAL_PAGINATION = Object.freeze({
  page: 1,
  limit: 20,
  total: 0,
  pages: 0,
});
const POLL_INTERVAL = 30_000;
const TOAST_DEFAULT_DURATION = 4_000;

const NotificationContext = createContext(null);

/**
 * Deduplicate notifications by id while keeping newest first.
 */
const mergeNotifications = (incoming, existing = []) => {
  const merged = [...incoming, ...existing];
  const map = new Map();
  merged.forEach((item) => {
    if (item?.id) {
      if (!map.has(item.id) || (item.createdAt ?? 0) > (map.get(item.id)?.createdAt ?? 0)) {
        map.set(item.id, item);
      }
    }
  });
  return Array.from(map.values()).sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
};

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const { registerPushTokenForCurrentDevice, removePushTokenForCurrentDevice } =
    usePushNotifications();

  const abortRef = useRef(0);
  const pollTimerRef = useRef(null);
  const appStateRef = useRef(AppState.currentState);

  const [notifications, setNotifications] = useState([]);
  const [pagination, setPagination] = useState(INITIAL_PAGINATION);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('idle');

  const [pollingEnabled, setPollingEnabled] = useState(true);

  const [toastQueue, setToastQueue] = useState([]);
  const [activeToast, setActiveToast] = useState(null);
  const toastTimerRef = useRef(null);

  const [listModalVisible, setListModalVisible] = useState(false);
  const [lastFetchedAt, setLastFetchedAt] = useState(null);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item?.read).length,
    [notifications]
  );

  const badgeCounts = useMemo(() => {
    return notifications.reduce(
      (acc, item) => {
        const key = item?.type ?? 'general';
        const next = { ...acc };
        next[key] = (next[key] ?? 0) + (item?.read ? 0 : 1);
        return next;
      },
      { total: unreadCount }
    );
  }, [notifications, unreadCount]);

  const clearToastTimer = useCallback(() => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!activeToast) {
      return undefined;
    }

    clearToastTimer();
    toastTimerRef.current = setTimeout(() => {
      setActiveToast(null);
    }, activeToast.duration ?? TOAST_DEFAULT_DURATION);

    return clearToastTimer;
  }, [activeToast, clearToastTimer]);

  useEffect(() => {
    if (!activeToast && toastQueue.length > 0) {
      const [next, ...rest] = toastQueue;
      setActiveToast(next);
      setToastQueue(rest);
    }
  }, [activeToast, toastQueue]);

  const enqueueToast = useCallback((toastPayload) => {
    setToastQueue((queue) => [
      ...queue,
      {
        id: toastPayload?.id ?? `toast-${Date.now()}-${queue.length}`,
        message: toastPayload?.message ?? '',
        type: toastPayload?.type ?? 'info',
        duration: toastPayload?.duration ?? TOAST_DEFAULT_DURATION,
        metadata: toastPayload?.metadata ?? {},
      },
    ]);
  }, []);

  const clearToasts = useCallback(() => {
    clearToastTimer();
    setToastQueue([]);
    setActiveToast(null);
  }, [clearToastTimer]);

  const loadNotifications = useCallback(
    async ({ page = 1, limit = 20, append = false } = {}) => {
      if (!user) {
        return null;
      }

      abortRef.current += 1;
      const requestId = abortRef.current;

      try {
        setLoading(true);
        setError(null);
        if (!append || page === 1) {
          setStatus('loading');
        }

        const result = await notificationService.fetchNotifications({ page, limit });

        if (requestId !== abortRef.current) {
          return null;
        }

        setNotifications((prev) => {
          const nextBatch = append && page > 1 ? [...prev, ...result.notifications] : result.notifications;
          return mergeNotifications(nextBatch);
        });

        setPagination(result.pagination ?? INITIAL_PAGINATION);
        setStatus('ready');
        setLastFetchedAt(Date.now());
        return result.notifications;
      } catch (err) {
        if (requestId === abortRef.current) {
          setError(err);
          setStatus('error');
        }
        throw err;
      } finally {
        if (requestId === abortRef.current) {
          setLoading(false);
        }
      }
    },
    [user]
  );

  const markAsRead = useCallback(async (notificationId) => {
    if (!notificationId) return null;

    try {
      const updated = await notificationService.markNotificationAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((item) =>
          item.id === updated.id
            ? {
                ...item,
                ...updated,
                read: true,
                readAt: updated.readAt ?? Date.now(),
              }
            : item
        )
      );
      enqueueToast({
        message: updated?.message ? `Marked: ${updated.message}` : 'Notification marked as read',
        type: 'success',
        duration: 2500,
      });
      return updated;
    } catch (err) {
      enqueueToast({
        message: 'Failed to mark notification as read',
        type: 'error',
      });
      throw err;
    }
  }, [enqueueToast]);

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationService.markAllNotificationsAsRead();
      const timestamp = Date.now();
      setNotifications((prev) =>
        prev.map((item) => ({
          ...item,
          read: true,
          readAt: item.readAt ?? timestamp,
        }))
      );
      enqueueToast({
        message: 'All notifications marked as read',
        type: 'success',
      });
    } catch (err) {
      enqueueToast({
        message: 'Unable to mark all as read',
        type: 'error',
      });
      throw err;
    }
  }, [enqueueToast]);

  const ingestNotification = useCallback(
    (incomingNotification, { showToast = true } = {}) => {
      if (!incomingNotification) return;

      setNotifications((prev) => mergeNotifications([incomingNotification], prev));
      if (showToast && incomingNotification?.message) {
        enqueueToast({
          id: `toast-${incomingNotification.id}`,
          message: incomingNotification.message,
          type: incomingNotification.type === 'error' ? 'error' : 'info',
        });
      }
    },
    [enqueueToast]
  );

  const ingestBatch = useCallback(
    (incomingList = [], options = {}) => {
      if (!incomingList.length) return;
      setNotifications((prev) => mergeNotifications(incomingList, prev));
      if (options.showToast !== false) {
        enqueueToast({
          message: `You have ${incomingList.length} new notification${incomingList.length > 1 ? 's' : ''}`,
          type: 'info',
        });
      }
    },
    [enqueueToast]
  );

  const handleBackendEvent = useCallback(
    (payload) => {
      if (!payload) return;
      const { category, entityId, data } = payload;

      switch (category) {
        case 'booking':
        case 'message':
        case 'review':
          ingestNotification(
            {
              id: entityId ?? `event-${Date.now()}`,
              type: category,
              title: data?.title ?? `New ${category}`,
              message: data?.message ?? 'You have a new update.',
              read: false,
              createdAt: Date.now(),
              data,
            },
            { showToast: true }
          );
          break;
        default:
          ingestNotification(payload, { showToast: true });
          break;
      }
    },
    [ingestNotification]
  );

  const startPolling = useCallback(() => {
    if (pollTimerRef.current || !pollingEnabled || !user) {
      return;
    }

    const poll = async () => {
      try {
        const latest = await loadNotifications({ page: 1, limit: pagination.limit, append: false });
        if (latest?.length) {
          ingestBatch(latest, { showToast: false });
        }
      } catch (err) {
        // surface error via toast only if we do not already have notifications
        if (!notifications.length) {
          enqueueToast({
            message: 'Unable to refresh notifications',
            type: 'error',
          });
        }
      }
    };

    pollTimerRef.current = setInterval(poll, POLL_INTERVAL);
  }, [enqueueToast, ingestBatch, loadNotifications, notifications.length, pagination.limit, pollingEnabled, user]);

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      const previous = appStateRef.current;
      appStateRef.current = nextState;

      if (previous.match(/inactive|background/) && nextState === 'active') {
        if (pollingEnabled) {
          startPolling();
        }
        loadNotifications({ page: 1, limit: pagination.limit, append: false }).catch(() => {});
      }

      if (nextState.match(/inactive|background/)) {
        stopPolling();
      }
    });

    return () => {
      subscription?.remove?.();
    };
  }, [loadNotifications, pagination.limit, pollingEnabled, startPolling, stopPolling]);

  useEffect(() => {
    if (user && pollingEnabled) {
      loadNotifications({ page: 1, limit: pagination.limit, append: false }).catch(() => {});
      startPolling();
      return stopPolling;
    }
    stopPolling();
    return undefined;
  }, [loadNotifications, pagination.limit, pollingEnabled, startPolling, stopPolling, user]);

  useEffect(() => {
    if (!user) {
      stopPolling();
      setNotifications([]);
      setPagination(INITIAL_PAGINATION);
      setStatus('idle');
      clearToasts();
      return undefined;
    }

    let cancelled = false;
    const registerPush = async () => {
      try {
        await registerPushTokenForCurrentDevice();
      } catch (err) {
        if (!cancelled) {
          enqueueToast({
            message: 'Unable to register for push notifications',
            type: 'error',
          });
        }
      }
    };

    registerPush();

    return () => {
      cancelled = true;
      removePushTokenForCurrentDevice().catch(() => {});
    };
  }, [
    clearToasts,
    enqueueToast,
    registerPushTokenForCurrentDevice,
    removePushTokenForCurrentDevice,
    stopPolling,
    user,
  ]);

  useEffect(() => {
    const generalUnsub = notificationEvents.subscribe('notification', (payload) => {
      handleBackendEvent(payload);
    });

    const bookingUnsub = notificationEvents.subscribe('booking', (payload) => {
      handleBackendEvent({ category: 'booking', ...payload });
    });

    const messageUnsub = notificationEvents.subscribe('message', (payload) => {
      handleBackendEvent({ category: 'message', ...payload });
    });

    const reviewUnsub = notificationEvents.subscribe('review', (payload) => {
      handleBackendEvent({ category: 'review', ...payload });
    });

    return () => {
      generalUnsub();
      bookingUnsub();
      messageUnsub();
      reviewUnsub();
    };
  }, [handleBackendEvent]);

  const contextValue = useMemo(
    () => ({
      notifications,
      pagination,
      loading,
      error,
      status,
      unreadCount,
      badgeCounts,
      lastFetchedAt,
      listModalVisible,
      setListModalVisible,
      activeToast,
      toastQueue,
      enqueueToast,
      clearToasts,
      loadMore: ({ page, limit }) =>
        loadNotifications({ page, limit, append: page > 1 }),
      reload: () => loadNotifications({ page: 1, limit: pagination.limit, append: false }),
      markAsRead,
      markAllAsRead,
      ingestNotification,
      ingestBatch,
      handleBackendEvent,
      setPollingEnabled,
      pollingEnabled,
    }),
    [
      activeToast,
      badgeCounts,
      clearToasts,
      error,
      handleBackendEvent,
      ingestBatch,
      ingestNotification,
      lastFetchedAt,
      listModalVisible,
      loading,
      loadNotifications,
      markAllAsRead,
      markAsRead,
      notifications,
      pagination,
      pollingEnabled,
      status,
      toastQueue,
      unreadCount,
    ]
  );

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      <Toast
        visible={!!activeToast}
        message={activeToast?.message ?? ''}
        type={activeToast?.type ?? 'info'}
        duration={activeToast?.duration ?? TOAST_DEFAULT_DURATION}
        onHide={() => setActiveToast(null)}
      />
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export default NotificationContext;