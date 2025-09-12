// Analytics utility for production tracking
import Constants from 'expo-constants';
import { logger } from './logger';

class Analytics {
  constructor() {
    this.isEnabled = process.env.NODE_ENV === 'production' && 
                    Constants.expoConfig?.extra?.analyticsEnabled !== false;
    this.sessionId = this.generateSessionId();
    this.userId = null;
    this.queue = [];
    this.isOnline = true;
  }

  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  setUserId(userId) {
    this.userId = userId;
  }

  // Track screen views
  trackScreen(screenName, properties = {}) {
    if (!this.isEnabled) return;
    
    this.track('screen_view', {
      screen_name: screenName,
      session_id: this.sessionId,
      user_id: this.userId,
      timestamp: new Date().toISOString(),
      ...properties
    });
  }

  // Track user actions
  trackEvent(eventName, properties = {}) {
    if (!this.isEnabled) return;
    
    this.track(eventName, {
      session_id: this.sessionId,
      user_id: this.userId,
      timestamp: new Date().toISOString(),
      ...properties
    });
  }

  // Track errors
  trackError(error, context = {}) {
    if (!this.isEnabled) return;
    
    this.track('error', {
      error_message: error.message,
      error_stack: error.stack,
      session_id: this.sessionId,
      user_id: this.userId,
      timestamp: new Date().toISOString(),
      ...context
    });
  }

  // Core tracking method
  async track(eventName, properties) {
    const event = { event: eventName, properties, timestamp: new Date().toISOString() };
    
    if (!this.isOnline) {
      this.queue.push(event);
      return;
    }

    try {
      if (this.isEnabled) {
        // Send to analytics service
        await fetch('/api/analytics/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(event)
        });
      }
      logger.info('Analytics Event:', eventName, properties);
    } catch (error) {
      logger.warn('Analytics tracking failed:', error);
      this.queue.push(event); // Queue for retry
    }
  }

  // Flush queued events when back online
  async flushQueue() {
    if (this.queue.length === 0) return;
    
    const events = [...this.queue];
    this.queue = [];
    
    for (const event of events) {
      await this.track(event.event, event.properties);
    }
  }

  // Set online status
  setOnlineStatus(isOnline) {
    this.isOnline = isOnline;
    if (isOnline) {
      this.flushQueue();
    }
  }

  // Common events
  trackLogin(method = 'email') {
    this.trackEvent('user_login', { method });
  }

  trackSignup(userType) {
    this.trackEvent('user_signup', { user_type: userType });
  }

  trackJobPost() {
    this.trackEvent('job_posted');
  }

  trackJobApply(jobId) {
    this.trackEvent('job_applied', { job_id: jobId });
  }

  trackBookingCreated(bookingId) {
    this.trackEvent('booking_created', { booking_id: bookingId });
  }

  trackMessageSent(conversationId) {
    this.trackEvent('message_sent', { conversation_id: conversationId });
  }
}

export const analytics = new Analytics();
