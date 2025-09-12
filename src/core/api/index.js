// Centralized API exports
export { default as APIClient } from './APIClient';
export * from './services';

// Legacy API compatibility layer
export { 
  authService as authAPI,
  caregiversService as caregiversAPI,
  jobsService as jobsAPI,
  bookingsService as bookingsAPI,
  applicationsService as applicationsAPI,
  childrenService as childrenAPI
} from './services';