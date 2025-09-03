// Analytics utility for production tracking
import Constants from 'expo-constants';

class Analytics {
  constructor() {
    this.isEnabled = process.env.NODE_ENV === 'production' && 
                    Constants.expoConfig?.extra?.analyticsEnabled !== false;
    this.sessionId = this.generateSessionId();
    this.userId = null;
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
  track(eventName, properties) {
    try {
      // In production, you would send this to your analytics service
      // For now, we'll just log it
      console.log('Analytics Event:', eventName, properties);
      
      // Example: Send to your analytics service
      // fetch('https://your-analytics-endpoint.com/track', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ event: eventName, properties })
      // });
    } catch (error) {
      console.warn('Analytics tracking failed:', error);
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
