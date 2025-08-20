import axios from "axios"
import { auth } from "./firebase"
import { API_CONFIG } from "./constants"

const API_BASE_URL = API_CONFIG.BASE_URL

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: API_CONFIG.TIMEOUT,
})

// Add auth token to requests
api.interceptors.request.use(async (config) => {
  try {
    const user = auth.currentUser
    if (user) {
      const token = await user.getIdToken()
      config.headers.Authorization = `Bearer ${token}`
    }

    // Log the request for debugging
    console.log("🚀 API Request:", {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      data: config.data,
      headers: config.headers,
    })
  } catch (error) {
    console.error("Error getting auth token:", error.message || JSON.stringify(error));
  }
  return config
})

// Handle auth errors and network issues
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {
      // Only redirect if not already on the login page
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.log("✅ API Response:", {
      status: response.status,
      url: response.config.url,
      data: response.data,
    })
    return response
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
    try {
      console.error("❌ API Error:", JSON.stringify(details, null, 2));
    } catch (_) {
      console.error("❌ API Error:", details);
    }

    if (error.code === "ECONNREFUSED" || error.message.includes("Network Error")) {
      console.error("🔥 Backend connection failed:", error.message);
      throw new Error("Cannot connect to server. Please check if the backend is running on http://localhost:5000");
    }

    if (error.response?.status === 400) {
      console.error("🔥 Bad Request Error:", typeof error.response.data === 'string' ? error.response.data : JSON.stringify(error.response.data));
      throw new Error(error.response.data?.message || "Invalid request data");
    }

    return Promise.reject(error)
  },
)

// API endpoints with better error handling
export const jobsAPI = {
  getAll: async (params) => {
    try {
      const response = await api.get("/jobs", { params })
      return response.data
    } catch (error) {
      console.error("Jobs API error:", error.message || (error.response?.data?.message) || JSON.stringify(error));
      // Return mock data if backend is not available
      return {
        jobs: [
          {
            _id: "mock-1",
            title: "Full-time Nanny for 2 Children (Mock Data)",
            description: "This is mock data because the backend is not available.",
            location: "Manhattan, NY",
            salary: 25,
            tags: ["Full-time", "Mock Data"],
            employerName: "Mock Employer",
            postedTime: "Just now",
            status: "active",
          },
        ],
      }
    }
  },
  getMy: async () => {
    const response = await api.get('/jobs/my');
    return response.data;
  },
  create: async (jobData) => {
    try {
      // Validate required fields before sending
      if (!jobData.title || !jobData.description || !jobData.location || !jobData.salary) {
        throw new Error("Missing required fields: title, description, location, and salary are required")
      }

      // Ensure salary is a number
      const payload = {
        title: jobData.title,
        description: jobData.description,
        location: jobData.location,
        rate: Number(jobData.rate ?? jobData.salary),
        startDate: jobData.startDate,
        endDate: jobData.endDate || undefined,
        workingHours: jobData.workingHours || jobData.schedule || '',
        requirements: Array.isArray(jobData.requirements) ? jobData.requirements : [],
        children: Array.isArray(jobData.children) ? jobData.children : [],
      }

      console.log("📤 Creating job with payload:", payload)

      const response = await api.post("/jobs", payload)
      return response.data
    } catch (error) {
      console.error("Create job API error:", error.message || (error.response?.data?.message) || JSON.stringify(error));
      throw error; // If it's a validation error, show specific message
      if (error.response?.status === 400) {
        throw new Error(error.response.data?.message || "Invalid job data provided")
      }

      // If backend is not available, simulate success
      if (error.message.includes("Cannot connect to server")) {
        console.warn("🔄 Backend not available, simulating job creation...")
        return {
          _id: `mock-${Date.now()}`,
          ...jobData,
          employerName: "Mock Employer",
          postedTime: "Just now",
          status: "active",
        }
      }

      throw error
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
  }
}

// Providers (Caregivers) API
export const providersAPI = {
  // Search/list caregivers/providers
  search: async (params = {}) => {
    const res = await api.get('/providers', { params });
    return res.data;
  },
  // Get provider details by id
  getById: async (id) => {
    const res = await api.get(`/providers/${id}`);
    return res.data;
  },
  // Get authenticated provider profile
  getMyProfile: async () => {
    const res = await api.get('/providers/profile');
    return res.data;
  },
  // Update authenticated provider profile
  updateMyProfile: async (data) => {
    const res = await api.put('/providers/profile', data);
    return res.data;
  },
};

export const nanniesAPI = {
  getAll: async (params) => {
    try {
      const response = await api.get("/users/nannies", { params })
      return response.data
    } catch (error) {
      console.error("Nannies API error:", error.message || (error.response?.data?.message) || JSON.stringify(error));
      throw error; // Return mock data if backend is not available
      return {
        nannies: [
          {
            id: "mock-nanny-1",
            name: "Sarah Johnson (Mock)",
            experience: "5 years",
            rating: 4.8,
            location: "Manhattan, NY",
            hourlyRate: 28,
            skills: ["Newborn care", "CPR certified", "Mock Data"],
            verified: true,
          },
        ],
      }
    }
  },
  updateStatus: async (applicationId, status) => {
    const res = await api.patch(`/applications/${applicationId}`, { status });
    return res.data;
  }
}

export const authAPI = {
  register: async (userData) => {
    try {
      const response = await api.post("/auth/register", userData)
      return response.data
    } catch (error) {
      console.error("Register API error:", error.message || (error.response?.data?.message) || JSON.stringify(error));
      throw error; // If backend is not available, simulate success
      if (error.message.includes("Cannot connect to server")) {
        console.warn("🔄 Backend not available, simulating registration...")
        return {
          user: userData,
          message: "Registration simulated (backend not available)",
        }
      }

      throw error
    }
  },
  getProfile: async () => {
    try {
      const response = await api.get("/auth/profile")
      return response.data
    } catch (error) {
      console.error("Get profile API error:", error.message || (error.response?.data?.message) || JSON.stringify(error));
      // If backend is not available, return mock profile
      if (error.message.includes("Cannot connect to server")) {
        return {
          name: "Mock User",
          email: "mock@example.com",
          role: "nanny",
        }
      }

      throw error
    }
  },
  updateProfile: async (data) => {
    const response = await api.put('/auth/profile', data);
    return response.data;
  },
  uploadProfileImageBase64: async (imageBase64, mimeType) => {
    const response = await api.post('/auth/profile/image-base64', { imageBase64, mimeType });
    return response.data;
  },
}

export const applicationsAPI = {
  apply: async (applicationData) => {
    try {
      const response = await api.post("/applications", applicationData)
      return response.data
    } catch (error) {
      console.error("Apply API error:", error.message || (error.response?.data?.message) || JSON.stringify(error));
      throw error; // If backend is not available, simulate success
      if (error.message.includes("Cannot connect to server")) {
        console.warn("🔄 Backend not available, simulating application...")
        return {
          _id: `mock-app-${Date.now()}`,
          ...applicationData,
          status: "pending",
          createdAt: new Date().toISOString(),
        }
      }

      throw error
    }
  },
  getMyApplications: async () => {
    try {
      const response = await api.get("/applications/my-applications")
      return response.data
    } catch (error) {
      console.error("Get applications API error:", error.message || (error.response?.data?.message) || JSON.stringify(error));
      throw error; // Return mock data if backend is not available
      return []
    }
  },
}

export const messagesAPI = {
  getConversations: () => api.get("/messages/conversations"),
  getMessages: (conversationId, params) => api.get(`/messages/conversation/${conversationId}`, { params }),
  sendMessage: (messageData) => api.post("/messages", messageData),
}

export const bookingsAPI = {
  create: async (bookingData) => {
    // Minimal client-side shape validation
    const required = ['caregiverId', 'date', 'startTime', 'endTime', 'address', 'hourlyRate', 'totalCost'];
    for (const k of required) {
      if (bookingData[k] === undefined || bookingData[k] === null || bookingData[k] === '') {
        throw new Error(`Missing required booking field: ${k}`);
      }
    }
    // children optional but should be array
    if (!Array.isArray(bookingData.children)) bookingData.children = [];
    const res = await api.post('/bookings', bookingData);
    return res.data;
  },
  getMy: async () => {
    const res = await api.get('/bookings/my');
    return res.data;
  }
}
