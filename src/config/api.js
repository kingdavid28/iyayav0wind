import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { Platform } from "react-native";

import { API_CONFIG, STORAGE_KEYS } from "./constants";

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
  timeout: 60000, // Increase timeout to 60 seconds
});

// Add retry interceptor
api.interceptors.response.use(undefined, async (error) => {
  const { config, message } = error;

  if (message.includes("timeout") && !config._retry) {
    config._retry = true;
    config.timeout = 90000; // Extended timeout for retry

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
      if (stored) config.headers.Authorization = `Bearer ${stored}`;
    } catch (_) {}

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
      "Error getting auth token:",
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
      throw error; // If it's a validation error, show specific message
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
      throw error; // Return mock data if backend is not available
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

export const authAPI = {
  login: async ({ email, password }) => {
    const response = await api.post("/auth/login", { email, password });
    return response.data;
  },
  register: async (userData) => {
    try {
      const response = await api.post("/auth/register", userData);
      return response.data;
    } catch (error) {
      console.error(
        "Register API error:",
        error?.message || error.response?.data?.message || safeStringify(error)
      );
      throw error; // If backend is not available, simulate success
      if (error.message.includes("Cannot connect to server")) {
        console.warn("🔄 Backend not available, simulating registration...");
        return {
          user: userData,
          message: "Registration simulated (backend not available)",
        };
      }

      throw error;
    }
  },
  getProfile: async () => {
    try {
      const response = await api.get("/auth/profile");
      return response.data;
    } catch (error) {
      console.error(
        "Get profile API error:",
        error?.message || error.response?.data?.message || safeStringify(error)
      );
      // If backend is not available, return mock profile
      if (error.message.includes("Cannot connect to server")) {
        return {
          name: "Mock User",
          email: "mock@example.com",
          role: "caregiver",
        };
      }

      throw error;
    }
  },
  updateProfile: async (data) => {
    const response = await api.put("/auth/profile", data);
    return response.data;
  },
  setRole: async (role) => {
    // role: 'parent' | 'caregiver'
    const response = await api.patch("/auth/role", { role });
    return response.data;
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
      throw error; // If backend is not available, simulate success
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
