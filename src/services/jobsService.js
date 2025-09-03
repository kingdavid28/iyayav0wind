import { API_BASE_URL } from '../config/api';
import { getAuthToken } from '../utils/auth';
import { logger } from '../utils/logger';

/**
 * Jobs Service
 * Handles all job-related API calls
 */

class JobsService {
  constructor() {
    this.baseURL = `${API_BASE_URL}/jobs`;
  }

  async makeRequest(endpoint, options = {}) {
    try {
      const token = await getAuthToken();
      const url = `${this.baseURL}${endpoint}`;
      
      const config = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        ...options,
      };

      if (config.body && typeof config.body === 'object') {
        config.body = JSON.stringify(config.body);
      }

      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      return data;
    } catch (error) {
      logger.error('JobsService request failed:', { endpoint, error: error.message });
      throw error;
    }
  }

  // Get all jobs with optional filtering and pagination
  async getJobs(filters = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
          queryParams.append(key, filters[key]);
        }
      });

      const endpoint = queryParams.toString() ? `?${queryParams.toString()}` : '';
      const response = await this.makeRequest(endpoint);
      return response.data;
    } catch (error) {
      logger.error('Get jobs failed:', error);
      throw new Error('Failed to load jobs');
    }
  }

  // Get a specific job by ID
  async getJobById(jobId) {
    try {
      const response = await this.makeRequest(`/${jobId}`);
      return response.data;
    } catch (error) {
      logger.error('Get job by ID failed:', error);
      throw new Error('Failed to load job details');
    }
  }

  // Create a new job
  async createJob(jobData) {
    try {
      const response = await this.makeRequest('/', {
        method: 'POST',
        body: jobData,
      });
      return response.data;
    } catch (error) {
      logger.error('Create job failed:', error);
      throw new Error('Failed to create job');
    }
  }

  // Update an existing job
  async updateJob(jobId, jobData) {
    try {
      const response = await this.makeRequest(`/${jobId}`, {
        method: 'PUT',
        body: jobData,
      });
      return response.data;
    } catch (error) {
      logger.error('Update job failed:', error);
      throw new Error('Failed to update job');
    }
  }

  // Delete a job
  async deleteJob(jobId) {
    try {
      const response = await this.makeRequest(`/${jobId}`, {
        method: 'DELETE',
      });
      return response;
    } catch (error) {
      logger.error('Delete job failed:', error);
      throw new Error('Failed to delete job');
    }
  }

  // Get jobs posted by current user
  async getMyJobs(page = 1, limit = 10) {
    try {
      const response = await this.makeRequest(`/my-jobs?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      logger.error('Get my jobs failed:', error);
      throw new Error('Failed to load your jobs');
    }
  }

  // Search jobs with text query
  async searchJobs(query, filters = {}) {
    try {
      const searchParams = {
        search: query,
        ...filters,
      };

      return await this.getJobs(searchParams);
    } catch (error) {
      logger.error('Search jobs failed:', error);
      throw new Error('Failed to search jobs');
    }
  }

  // Get job applications for a specific job
  async getJobApplications(jobId, page = 1, limit = 10) {
    try {
      const response = await this.makeRequest(`/${jobId}/applications?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      logger.error('Get job applications failed:', error);
      throw new Error('Failed to load job applications');
    }
  }

  // Apply to a job
  async applyToJob(jobId, applicationData) {
    try {
      const response = await this.makeRequest(`/${jobId}/apply`, {
        method: 'POST',
        body: applicationData,
      });
      return response.data;
    } catch (error) {
      logger.error('Apply to job failed:', error);
      throw new Error('Failed to apply to job');
    }
  }

  // Get popular job categories
  async getJobCategories() {
    try {
      const response = await this.makeRequest('/categories');
      return response.data;
    } catch (error) {
      logger.error('Get job categories failed:', error);
      throw new Error('Failed to load job categories');
    }
  }

  // Get job statistics
  async getJobStats() {
    try {
      const response = await this.makeRequest('/stats');
      return response.data;
    } catch (error) {
      logger.error('Get job stats failed:', error);
      throw new Error('Failed to load job statistics');
    }
  }
}

export default new JobsService();
