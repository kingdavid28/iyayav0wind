import { authAPI, caregiversAPI, jobsAPI, bookingsAPI, applicationsAPI } from '../config/api';

class CRUDService {
  async getCSRFToken() {
    try {
      const response = await fetch('/api/csrf-token');
      const data = await response.json();
      return data.token;
    } catch (error) {
      return null;
    }
  }
  // Generic CRUD operations
  async create(endpoint, data) {
    try {
      const csrfToken = await this.getCSRFToken();
      const response = await fetch(endpoint, {
        method: 'POST',
        credentials: 'include',
        headers: { 
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken
        },
        body: JSON.stringify(data),
      });
      return response.json();
    } catch (error) {
      console.error('Create error:', error);
      throw error;
    }
  }

  async read(endpoint, id = null) {
    try {
      const url = id ? `${endpoint}/${id}` : endpoint;
      const response = await fetch(url);
      return response.json();
    } catch (error) {
      console.error('Read error:', error);
      throw error;
    }
  }

  async update(endpoint, id, data) {
    try {
      const response = await fetch(`${endpoint}/${id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data),
      });
      return response.json();
    } catch (error) {
      console.error('Update error:', error);
      throw error;
    }
  }

  async delete(endpoint, id) {
    try {
      const response = await fetch(`${endpoint}/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      return response.json();
    } catch (error) {
      console.error('Delete error:', error);
      throw error;
    }
  }

  // Profile operations
  async updateProfile(data) {
    try {
      return await authAPI.updateProfile(data);
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  }

  async getProfile() {
    try {
      return await authAPI.getProfile();
    } catch (error) {
      console.error('Profile fetch error:', error);
      throw error;
    }
  }

  // Job operations
  async createJob(jobData) {
    try {
      return await jobsAPI.create(jobData);
    } catch (error) {
      console.error('Job creation error:', error);
      throw error;
    }
  }

  async getJobs() {
    try {
      return await jobsAPI.getAvailableJobs();
    } catch (error) {
      console.error('Jobs fetch error:', error);
      throw error;
    }
  }

  async getMyJobs() {
    try {
      return await jobsAPI.getMyJobs();
    } catch (error) {
      console.error('My jobs fetch error:', error);
      throw error;
    }
  }

  // Booking operations
  async getBookings() {
    try {
      return await bookingsAPI.getMyBookings();
    } catch (error) {
      console.error('Bookings fetch error:', error);
      throw error;
    }
  }

  // Application operations
  async applyToJob(data) {
    try {
      return await applicationsAPI.apply(data);
    } catch (error) {
      console.error('Application error:', error);
      throw error;
    }
  }

  async getApplications() {
    try {
      return await applicationsAPI.getMyApplications();
    } catch (error) {
      console.error('Applications fetch error:', error);
      throw error;
    }
  }

  // Caregiver operations
  async getCaregivers() {
    try {
      return await caregiversAPI.getProviders();
    } catch (error) {
      console.error('Caregivers fetch error:', error);
      throw error;
    }
  }

  async updateCaregiverProfile(data) {
    try {
      return await caregiversAPI.updateMyProfile(data);
    } catch (error) {
      console.error('Caregiver profile update error:', error);
      throw error;
    }
  }
}

export const crudService = new CRUDService();
