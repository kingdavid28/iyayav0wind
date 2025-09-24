// services/childService.js
import { EnhancedAPIService } from './index';

class ChildService {
  constructor() {
    this.api = new EnhancedAPIService();
  }

  async createChild(childData) {
    try {
      // Ensure we don't send an ID if it's a new child
      const dataToSend = { ...childData };

      // Remove ID if this is a new child creation
      if (dataToSend.id) {
        delete dataToSend.id;
      }

      // Generate a temporary client-side ID for tracking
      const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const response = await this.api.request('POST', '/children', dataToSend);

      return {
        ...response,
        tempId // Return the temp ID for client-side tracking
      };
    } catch (error) {
      console.error('Error creating child:', error);
      throw error;
    }
  }

  async updateChild(childId, childData) {
    try {
      const response = await this.api.request('PUT', `/children/${childId}`, childData);
      return response;
    } catch (error) {
      console.error('Error updating child:', error);
      throw error;
    }
  }

  async getChildren() {
    try {
      const response = await this.api.request('GET', '/children');
      return response;
    } catch (error) {
      console.error('Error fetching children:', error);
      throw error;
    }
  }

  async deleteChild(childId) {
    try {
      const response = await this.api.request('DELETE', `/children/${childId}`);
      return response;
    } catch (error) {
      console.error('Error deleting child:', error);
      throw error;
    }
  }

  // Helper method to generate unique child IDs on client side if needed
  generateChildId() {
    return `child_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const childService = new ChildService();
