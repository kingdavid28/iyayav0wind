import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { Platform } from "react-native";

import { API_CONFIG, STORAGE_KEYS } from "./constants";
import { requiresAuth } from "../utils/authUtils";

// Safe JSON stringify to avoid crashes from circular structures in errors
const getCircularReplacer = () => {
  const seen = new WeakSet();
  return (key, value) => {
    if (typeof value === "object" && value !== null) {
      if (seen.has(value)) return "[Circular]";
      seen.add(value);
    }
    return value;
  };
};
const safeStringify = (value) => {
  try {
    if (typeof value === "string") return value;
    return JSON.stringify(value, getCircularReplacer(), 2);
  } catch (_) {
    try {
      return String(value);
    } catch {
      return "[Unstringifiable]";
    }
  }
};

const resolveBaseUrl = (url) => {
  if (!url) return url;
  try {
    const u = new URL(url);
    const isLocalHost = ["localhost", "127.0.0.1"].includes(u.hostname);
    if (Platform.OS === "android" && isLocalHost) {
      // Android emulator cannot reach host's localhost; use special alias
      u.hostname = "10.0.2.2";
      return u.toString();
    }
    return url;
  } catch (_) {
    return url;
  }
};

const API_BASE_URL = resolveBaseUrl(API_CONFIG.BASE_URL);
const IS_PROD =
  typeof process !== "undefined" && process.env?.NODE_ENV === "production";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: Platform.OS === 'web' ? 60000 : 15000, // Shorter timeout for mobile
});

// Add retry interceptor with mobile-specific handling
api.interceptors.response.use(undefined, async (error) => {
  const { config, message } = error;

  if (message.includes("timeout") && !config._retry) {
    config._retry = true;
    // Use shorter retry timeout on mobile
    config.timeout = Platform.OS === 'web' ? 90000 : 20000;

    try {
      return await api(config);
    } catch (retryError) {
      console.error("Retry failed:", retryError.message);
      return Promise.reject(retryError);
    }
  }

  return Promise.reject(error);
});

// Add auth token interceptor
api.interceptors.request.use(async (config) => {
  try {
    // Read JWT from AsyncStorage
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      if (stored) {
        config.headers.Authorization = `Bearer ${stored}`;
      } else {
        // If no token and this is a protected endpoint, reject the request
        if (requiresAuth(config.url)) {
          console.warn('No auth token available for protected endpoint:', config.url);
          // Return a rejected promise to prevent the request
          return Promise.reject(new Error('Authentication required'));
        }
      }
    } catch (tokenError) {
      console.error('Error retrieving auth token:', tokenError);
    }

    // Dev bypass headers (never in production builds)
    const allowUnverified =
      !IS_PROD &&
      typeof process !== "undefined" &&
      process.env?.EXPO_PUBLIC_ALLOW_UNVERIFIED === "true";
    if (allowUnverified) {
      // Static default role when dev bypass is explicitly enabled
      config.headers["X-Dev-Bypass"] = "1";
      config.headers["X-Dev-Role"] = "parent";
    }

    // Log the request for debugging (dev only)
    if (!IS_PROD) {
      console.log("🚀 API Request:", {
        method: config.method?.toUpperCase(),
        url: config.url,
        baseURL: config.baseURL,
        data: config.data,
        headers: config.headers,
      });
    }
  } catch (error) {
    console.error(
      "Error in request interceptor:",
      error?.message || safeStringify(error)
    );
  }
  return config;
});

// Handle auth errors and network issues
api.interceptors.response.use(
  (response) => response,
  (error) => {
    try {
      if (error.response && error.response.status === 401) {
        // Only perform redirect on web builds. React Native may have a window shim without location.
        const isWeb = Platform?.OS === "web";
        if (
          isWeb &&
          typeof window !== "undefined" &&
          window?.location?.pathname &&
          !window.location.pathname.includes("/login")
        ) {
          window.location.href = "/login";
        }
      }
    } catch (_) {
      // Swallow any redirect errors in native contexts
    }
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    if (!IS_PROD) {
      console.log("✅ API Response:", {
        status: response.status,
        url: response.config.url,
        data: response.data,
      });
    }
    return response;
  },
  (error) => {
    const details = {
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      data: error.response?.data,
      message: error.message,
    };
    // Stringify to make errors readable in Expo Web DevTools (avoids "Object" only)
    console.error("❌ API Error:", safeStringify(details));

    if (
      error.code === "ECONNREFUSED" ||
      error.message.includes("Network Error")
    ) {
      console.error("🔥 Backend connection failed:", error.message);
      throw new Error(
        "Cannot connect to server. Please check if the backend is running on http://localhost:5000"
      );
    }

    if (error.response?.status === 400) {
      console.error(
        "🔥 Bad Request Error:",
        typeof error.response.data === "string"
          ? error.response.data
          : safeStringify(error.response.data)
      );
      throw new Error(error.response.data?.message || "Invalid request data");
    }

    return Promise.reject(error);
  }
);

// API endpoints with better error handling
export const jobsAPI = {
  getAll: async (params) => {
    try {
      const response = await api.get("/jobs", { params });
      return response.data;
    } catch (error) {
      console.error(
        "Jobs API error:",
        error?.message || error.response?.data?.message || safeStringify(error)
      );
      // Return mock data if backend is not available
      return {
        jobs: [
          {
            _id: "mock-1",
            title: "Full-time Nanny for 2 Children (Mock Data)",
            description:
              "This is mock data because the backend is not available.",
            location: "Cebu City",
            salary: 25,
            tags: ["Full-time", "Mock Data"],
            employerName: "Mock Employer",
            postedTime: "Just now",
            status: "active",
          },
        ],
      };
    }
  },
  getMy: async () => {
    const response = await api.get("/jobs/my");
    return response.data;
  },
  getMyJobs: async () => {
    const response = await api.get("/jobs/my");
    return response.data;
  },
  create: async (jobData) => {
    try {
      // Validate required fields before sending
      if (
        !jobData.title ||
        !jobData.description ||
        !jobData.location ||
        !jobData.salary
      ) {
        throw new Error(
          "Missing required fields: title, description, location, and salary are required"
        );
      }

      // Ensure salary is a number
      const payload = {
        title: jobData.title,
        description: jobData.description,
        location: jobData.location,
        rate: Number(jobData.rate ?? jobData.salary),
        startDate: jobData.startDate,
        endDate: jobData.endDate || undefined,
        workingHours: jobData.workingHours || jobData.schedule || "",
        requirements: Array.isArray(jobData.requirements)
          ? jobData.requirements
          : [],
        children: Array.isArray(jobData.children) ? jobData.children : [],
      };

      console.log("📤 Creating job with payload:", payload);

      const response = await api.post("/jobs", payload);
      return response.data;
    } catch (error) {
      console.error(
        "Create job API error:",
        error.message || error.response?.data?.message || JSON.stringify(error)
      );
      // If it's a validation error, show specific message
      if (error.response?.status === 400) {
        throw new Error(
          error.response.data?.message || "Invalid job data provided"
        );
      }
      // If backend is not available, simulate success
      if (error.message.includes("Cannot connect to server")) {
        console.warn("🔄 Backend not available, simulating job creation...");
        return {
          _id: `mock-${Date.now()}`,
          ...jobData,
          employerName: "Mock Employer",
          postedTime: "Just now",
          status: "active",
        };
      }

      throw error;
    }
  },
  getById: (id) => api.get(`/jobs/${id}`),
  update: async (id, data) => {
    const res = await api.patch(`/jobs/${id}`, data);
    return res.data;
  },
  delete: async (id) => {
    const res = await api.delete(`/jobs/${id}`);
    return res.data;
  },
  getApplicationsForJob: async (jobId) => {
    const res = await api.get(`/jobs/${jobId}/applications`);
    return res.data;
  },
  getAvailableJobs: async (params) => {
    try {
      const response = await api.get("/jobs", { params });
      return response.data;
    } catch (error) {
      console.error("Get available jobs API error:", error);
      
      // Handle different error types
      if (error.response?.status === 500) {
        console.warn("🔄 Server error (500) - using fallback data for available jobs");
      } else if (error.message?.includes("Cannot connect to server")) {
        console.warn("🔄 Backend not available - using fallback data for available jobs");
      }
      
      // Return mock data as fallback with proper structure
      return {
        data: {
          jobs: [
            {
              _id: "mock-job-1",
              title: "Full-time Nanny for 2 Children",
              description: "Looking for an experienced nanny to care for our 2 children.",
              location: "Cebu City",
              hourlyRate: 350,
              schedule: "Monday-Friday, 8AM-6PM",
              requirements: ["CPR certified", "Experience with toddlers"],
              employerName: "The Dela Cruz Family",
              postedDate: new Date().toISOString(),
              urgent: true,
              children: 2,
              ages: "2, 5"
            },
            {
              _id: "mock-job-2",
              title: "Part-time Babysitter Needed",
              description: "Seeking a reliable babysitter for weekend evenings.",
              location: "Makati City",
              hourlyRate: 250,
              schedule: "Weekends, 6PM-11PM",
              requirements: ["Background check", "References"],
              employerName: "The Santos Family",
              postedDate: new Date().toISOString(),
              urgent: false,
              children: 1,
              ages: "3"
            }
          ],
          success: true,
          count: 2
        }
      };
    }
  },
};

// Providers (Caregivers) API
export const caregiversAPI = {
  // Get all caregivers
  getProviders: async (params = {}) => {
    console.log("📡 [caregiversAPI] Fetching providers with params:", params);
    try {
      const response = await api.get("/caregivers", { params });
      console.log("✅ [caregiversAPI] API Response:", {
        status: response.status,
        statusText: response.statusText,
        data: {
          hasCaregivers: !!response.data?.caregivers,
          isArray: Array.isArray(response.data?.caregivers),
          count: Array.isArray(response.data?.caregivers)
            ? response.data.caregivers.length
            : 0,
          dataKeys: Object.keys(response.data || {}),
        },
        sampleCaregiver:
          response.data?.caregivers?.[0] || "No caregivers in response",
      });
      return response;
    } catch (error) {
      console.error("❌ [caregiversAPI] Error fetching providers:", {
        message: error.message,
        response: {
          status: error.response?.status,
          data: error.response?.data,
        },
        config: {
          url: error.config?.url,
          method: error.config?.method,
          params: error.config?.params,
        },
      });
      throw error; // Re-throw to be handled by the caller
    }
  },
  // Search/list caregivers/caregivers
  search: async (params) => {
    try {
      const response = await api.get("/caregivers/search", {
        params: {
          search: params.search,
          page: params.page || 1,
          limit: params.limit || 20,
          skills: params.skills,
          minRate: params.minRate,
          maxRate: params.maxRate,
          daysAvailable: params.daysAvailable,
        },
      });

      return {
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      console.error("Caregiver search API error:", error);
      throw error;
    }
  },
  // Get provider details by id
  getById: async (id) => {
    const res = await api.get(`/caregivers/${id}`);
    return res.data;
  },
  // Get authenticated provider profile
  getMyProfile: async () => {
    const res = await api.get("/caregivers/profile");
    return res.data;
  },
  // Create new caregiver profile
  createProfile: async (data) => {
    const res = await api.post("/caregivers/profile", data);
    return res.data;
  },
  // Update authenticated provider profile
  updateMyProfile: async (data) => {
    const res = await api.put("/caregivers/profile", data);
    return res.data;
  },
  requestBackgroundCheck: async (personalInfo) => {
    const res = await api.post("/caregivers/background-check", personalInfo);
    return res.data;
  },

  uploadCertification: async (documentUri, certificationType) => {
    return uploadsAPI.uploadDocument(documentUri, certificationType);
  },

  updateLocation: async (locationData) => {
    const res = await api.patch("/caregivers/profile/location", locationData);
    return res.data;
  },
};

// Alias for backward compatibility
export const providersAPI = caregiversAPI;

export const nanniesAPI = {
  getAll: async (params) => {
    try {
      const response = await api.get("/users/nannies", { params });
      return response.data;
    } catch (error) {
      console.error(
        "Nannies API error:",
        error?.message || error.response?.data?.message || safeStringify(error)
      );
      // Return mock data if backend is not available
      return {
        nannies: [
          {
            id: "mock-nanny-1",
            name: "Ana Dela Cruz (Mock)",
            experience: "5 years",
            rating: 4.8,
            location: "Cebu City",
            hourlyRate: 28,
            skills: ["Newborn care", "CPR certified", "Mock Data"],
            verified: true,
          },
        ],
      };
    }
  },
  updateStatus: async (applicationId, status) => {
    const res = await api.patch(`/applications/${applicationId}`, { status });
    return res.data;
  },
};

export const privacyAPI = {
  getPrivacySettings: async (userId = null) => {
    try {
      const url = userId ? `/privacy/settings/${userId}` : '/privacy/settings';
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Privacy settings API error:', error);
      // If 401 error or auth required, user might not be authenticated - use default settings
      if (error.response?.status === 401 || error.message === 'Authentication required') {
        console.warn('Privacy settings unavailable - using defaults');
        return null;
      }
      throw error;
    }
  },
  
  getUserPermissions: async (targetUserId, viewerUserId) => {
    try {
      const response = await api.get(`/privacy/permissions/${targetUserId}/${viewerUserId}`);
      return response.data;
    } catch (error) {
      console.error('User permissions API error:', error);
      // Return empty permissions on error
      return {
        permissions: [],
        sensitiveFields: [],
        grantedTo: null,
        grantedAt: null,
        expiresAt: null
      };
    }
  },
  
  grantPermission: async (targetUserId, viewerUserId, fields, expiresIn = null) => {
    try {
      const response = await api.post('/privacy/permissions/grant', {
        targetUserId,
        viewerUserId,
        fields,
        expiresIn
      });
      return response.data;
    } catch (error) {
      console.error('Grant permission API error:', error);
      throw error;
    }
  },
  
  revokePermission: async (targetUserId, viewerUserId, fields = null) => {
    try {
      const response = await api.post('/privacy/permissions/revoke', {
        targetUserId,
        viewerUserId,
        fields // null means revoke all permissions
      });
      return response.data;
    } catch (error) {
      console.error('Revoke permission API error:', error);
      throw error;
    }
  },
  updatePrivacySettings: async (settings) => {
    try {
      const response = await api.put('/privacy/settings', settings);
      return response.data;
    } catch (error) {
      console.error('Update privacy settings API error:', error);
      return { success: false };
    }
  },
  requestInformation: async (requestData) => {
    try {
      const response = await api.post('/privacy/request', requestData);
      return response.data;
    } catch (error) {
      console.error('Request information API error:', error);
      return { success: false };
    }
  },
  respondToRequest: async (responseData) => {
    try {
      const response = await api.post('/privacy/respond', responseData);
      return response.data;
    } catch (error) {
      console.error('Respond to request API error:', error);
      return { success: false };
    }
  },
  getPendingRequests: async () => {
    try {
      const response = await api.get('/privacy/requests/pending');
      return response.data;
    } catch (error) {
      console.error('Get pending requests API error:', error);
      return { data: [] }; // Return empty array as fallback
    }
  },
  getPrivacyNotifications: async () => {
    try {
      const response = await api.get('/privacy/notifications');
      return response.data;
    } catch (error) {
      console.error('Get privacy notifications API error:', error);
      return { data: [] }; // Return empty array as fallback
    }
  },
  markNotificationAsRead: async (notificationId) => {
    try {
      const response = await api.put(`/privacy/notifications/${notificationId}/read`);
      return response.data;
    } catch (error) {
      console.error('Mark notification as read API error:', error);
      return { success: false };
    }
  },
  getSharedData: async (userId) => {
    try {
      const response = await api.get(`/privacy/shared/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Get shared data API error:', error);
      return { data: {} };
    }
  },
  revokeAccess: async (userId, fields) => {
    try {
      const response = await api.post('/privacy/revoke', { userId, fields });
      return response.data;
    } catch (error) {
      console.error('Revoke access API error:', error);
      return { success: false };
    }
  },
};

export const authAPI = {
  login: async ({ email, password }) => {
    try {
      const response = await api.post("/auth/login", { email, password });
      return response.data;
    } catch (error) {
      console.error("Login API error:", error?.response?.data || error.message);
      throw error;
    }
  },
  register: async (userData) => {
    try {
      const response = await api.post("/auth/register", userData);
      return response.data;
    } catch (error) {
      console.error("Register API error:", error?.response?.data || error.message);
      throw error;
    }
  },
  logout: async () => {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.warn("Logout API error (non-critical):", error.message);
      // Don't throw - logout should work even if server is down
    }
  },
  getProfile: async () => {
    try {
      const response = await api.get("/auth/profile");
      console.log('🔍 Raw profile API response:', response);
      return response.data;
    } catch (error) {
      console.error(
        "Get profile API error:",
        error?.message || error.response?.data?.message || safeStringify(error)
      );
      // Return mock profile with proper structure for testing
      console.warn('🔄 Using mock profile data');
      return {
        data: {
          name: "John Parent",
          email: "john.parent@example.com",
          contact: "john.parent@example.com",
          location: "Cebu City, Philippines",
          profileImage: "/uploads/profile_68adaeb742ebc97c571c6926_1756265430253.jpg",
          avatar: "/uploads/profile_68adaeb742ebc97c571c6926_1756265430253.jpg",
          role: "parent",
        }
      };
    }
  },
  updateProfile: async (data) => {
    try {
      const response = await api.put("/auth/profile", data);
      return response.data;
    } catch (error) {
      console.error("Update profile API error:", error?.response?.data || error.message);
      throw error;
    }
  },
  setRole: async (role) => {
    try {
      const response = await api.patch("/auth/role", { role });
      return response.data;
    } catch (error) {
      console.warn("Set role API error (non-critical):", error.message);
      // Don't throw - role setting is not critical for basic auth
    }
  },
  uploadProfileImageBase64: async (imageBase64, mimeType) => {
    const response = await api.post("/auth/profile/image-base64", {
      imageBase64,
      mimeType,
    });
    return response.data;
  },
};

export const applicationsAPI = {
  apply: async (applicationData) => {
    try {
      const response = await api.post("/applications", applicationData);
      return response.data;
    } catch (error) {
      console.error(
        "Apply API error:",
        error?.message || error.response?.data?.message || safeStringify(error)
      );
      // If backend is not available, simulate success
      if (error.message.includes("Cannot connect to server")) {
        console.warn("🔄 Backend not available, simulating application...");
        return {
          _id: `mock-app-${Date.now()}`,
          ...applicationData,
          status: "pending",
          createdAt: new Date().toISOString(),
        };
      }

      throw error;
    }
  },
  getMyApplications: async () => {
    try {
      const response = await api.get("/applications/my");
      return response.data;
    } catch (error) {
      console.error("Get my applications API error:", error);
      // Return mock data as fallback
      return {
        applications: [
          {
            _id: "mock-app-1",
            jobId: "mock-job-1",
            jobTitle: "Full-time Nanny for 2 Children",
            family: "The Dela Cruz Family",
            status: "pending",
            appliedDate: new Date().toISOString(),
            hourlyRate: 350
          }
        ]
      };
    }
  },
  sendMessage: (messageData) => api.post("/messages", messageData),
  // Best-effort: mark all messages in a conversation as read for the current user
  // Uses a common REST pattern. If your backend uses a different route, update here.
  markRead: async (conversationId) => {
    try {
      const res = await api.post(
        `/messages/conversation/${conversationId}/read`
      );
      return res.data ?? true;
    } catch (err) {
      // Swallow 404 or unsupported endpoint to avoid breaking UI
      console.warn(
        "messagesAPI.markRead failed or not supported:",
        err?.response?.status || err?.message
      );
      return false;
    }
  },
};

// Generic uploads API for base64 images/files
export const uploadsAPI = {
  base64Upload: async ({
    imageBase64,
    mimeType = "image/jpeg",
    folder = "user",
    name,
  }) => {
    const res = await api.post("/uploads/base64", {
      imageBase64,
      mimeType,
      folder,
      name,
    });
    return res.data; // { success, url, size, mimeType }
  },

  // Document upload method for legal documents (using base64)
  uploadDocument: async (documentData) => {
    const response = await api.post("/uploads/document", documentData);
    return response.data;
  },
};

export const bookingsAPI = {
  create: async (bookingData) => {
    // Minimal client-side shape validation
    const required = [
      "caregiverId",
      "date",
      "startTime",
      "endTime",
      "address",
      "hourlyRate",
      "totalCost",
    ];
    for (const k of required) {
      if (
        bookingData[k] === undefined ||
        bookingData[k] === null ||
        bookingData[k] === ""
      ) {
        throw new Error(`Missing required booking field: ${k}`);
      }
    }
    // children optional but should be array
    if (!Array.isArray(bookingData.children)) bookingData.children = [];
    const res = await api.post("/bookings", bookingData);
    return res.data;
  },
  getMy: async () => {
    const res = await api.get("/bookings/my");
    return res.data;
  },
  getMyBookings: async () => {
    const res = await api.get("/bookings/my");
    return res.data;
  },
  updateStatus: async (bookingId, status, feedback) => {
    const res = await api.patch(`/bookings/${bookingId}/status`, {
      status,
      feedback,
    });
    return res.data;
  },
  cancel: async (bookingId) => {
    const res = await api.delete(`/bookings/${bookingId}`);
    return res.data;
  },
  uploadPaymentProof: async (bookingId, imageBase64, mimeType) => {
    const res = await api.post(`/bookings/${bookingId}/payment-proof`, {
      imageBase64,
      mimeType,
    });
    return res.data;
  },
};
