const listeners = new Map();

const subscribe = (eventName, callback) => {
  if (!eventName || typeof callback !== 'function') {
    return () => {};
  }

  const key = String(eventName);
  if (!listeners.has(key)) {
    listeners.set(key, new Set());
  }

  const eventListeners = listeners.get(key);
  eventListeners.add(callback);

  return () => {
    eventListeners.delete(callback);
    if (eventListeners.size === 0) {
      listeners.delete(key);
    }
  };
};

const publish = (eventName, payload) => {
  if (!eventName) {
    return;
  }

  const eventListeners = listeners.get(String(eventName));
  if (!eventListeners || eventListeners.size === 0) {
    return;
  }

  eventListeners.forEach((callback) => {
    try {
      callback(payload);
    } catch (error) {
      if (__DEV__) {
        console.warn('[notificationEvents] subscriber error', { eventName, error });
      }
    }
  });
};

const clear = () => {
  listeners.clear();
};

export const notificationEvents = {
  subscribe,
  publish,
  clear,
};

export default notificationEvents;
