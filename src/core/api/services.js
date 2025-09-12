import APIClient from './APIClient';

// Auth Service
export const authService = {
  async login(credentials) {
    const response = await APIClient.post('/auth/login', credentials);
    return response.data;
  },

  async register(userData) {
    const response = await APIClient.post('/auth/register', userData);
    return response.data;
  },

  async getProfile() {
    const response = await APIClient.get('/auth/profile');
    return response.data;
  },

  async updateProfile(profileData) {
    const response = await APIClient.put('/auth/profile', profileData);
    return response.data;
  },

  async uploadProfileImage(imageBase64, mimeType) {
    const response = await APIClient.post('/auth/upload-profile-image', {
      imageBase64,
      mimeType
    });
    return response.data;
  }
};

// Caregivers Service
export const caregiversService = {
  async getCaregivers() {
    const response = await APIClient.get('/caregivers');
    return response.data;
  },

  async getMyProfile() {
    const response = await APIClient.get('/caregivers/profile');
    return response.data;
  },

  async updateMyProfile(profileData) {
    const response = await APIClient.put('/caregivers/profile', profileData);
    return response.data;
  },

  async createProfile(profileData) {
    const response = await APIClient.post('/caregivers/profile', profileData);
    return response.data;
  }
};

// Jobs Service
export const jobsService = {
  async getMyJobs() {
    const response = await APIClient.get('/jobs/my');
    return response.data;
  },

  async getAvailableJobs() {
    const response = await APIClient.get('/jobs');
    return response.data;
  },

  async createJob(jobData) {
    const response = await APIClient.post('/jobs', jobData);
    return response.data;
  },

  async updateJob(jobId, jobData) {
    const response = await APIClient.put(`/jobs/${jobId}`, jobData);
    return response.data;
  },

  async deleteJob(jobId) {
    const response = await APIClient.delete(`/jobs/${jobId}`);
    return response.data;
  }
};

// Bookings Service
export const bookingsService = {
  async create(bookingData) {
    const response = await APIClient.post('/bookings', bookingData);
    return response.data;
  },

  async getMy() {
    const response = await APIClient.get('/bookings/my');
    return response.data;
  },

  async uploadPaymentProof(bookingId, imageBase64, mimeType) {
    const response = await APIClient.post(`/bookings/${bookingId}/payment-proof`, {
      imageBase64,
      mimeType
    });
    return response.data;
  }
};

// Applications Service
export const applicationsService = {
  async getMyApplications() {
    const response = await APIClient.get('/applications/my');
    return response.data;
  },

  async apply(jobId, applicationData) {
    const response = await APIClient.post('/applications', {
      jobId,
      ...applicationData
    });
    return response.data;
  }
};

// Children Service
export const childrenService = {
  async getMyChildren() {
    const response = await APIClient.get('/children');
    return response.data;
  },

  async create(childData) {
    const response = await APIClient.post('/children', childData);
    return response.data;
  },

  async update(childId, childData) {
    const response = await APIClient.put(`/children/${childId}`, childData);
    return response.data;
  },

  async delete(childId) {
    const response = await APIClient.delete(`/children/${childId}`);
    return response.data;
  }
};