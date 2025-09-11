import React, { createContext, useContext, useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { privacyAPI } from '../../config/api';

// Fallback if privacyAPI is not available
const safePrivacyAPI = privacyAPI || {
  getPrivacySettings: () => Promise.resolve({ data: null }),
  getPendingRequests: () => Promise.resolve({ data: [] }),
  getPrivacyNotifications: () => Promise.resolve({ data: [] }),
  updatePrivacySettings: () => Promise.resolve({ success: true }),
  requestInformation: () => Promise.resolve({ success: true }),
  respondToRequest: () => Promise.resolve({ success: true }),
  grantPermission: () => Promise.resolve({ success: true }),
  revokePermission: () => Promise.resolve({ success: true }),
  markNotificationAsRead: () => Promise.resolve({ success: true })
};
import { isAuthenticated } from '../../utils/authUtils';
import { useProfileData } from './ProfileDataManager';

const PrivacyContext = createContext();

export const usePrivacy = () => {
  const context = useContext(PrivacyContext);
  if (!context) {
    throw new Error('usePrivacy must be used within a PrivacyProvider');
  }
  return context;
};

export const PrivacyProvider = ({ children }) => {
  const { dataClassification, DATA_LEVELS, getFilteredProfileData } = useProfileData();
  
  const [privacySettings, setPrivacySettings] = useState({
    sharePhone: false,
    shareAddress: false,
    shareEmergencyContact: false,
    shareChildMedicalInfo: false,
    shareChildAllergies: false,
    shareChildBehaviorNotes: false,
    shareFinancialInfo: false,
    autoApproveBasicInfo: true,
  });

  const [pendingRequests, setPendingRequests] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadPrivacySettings = async () => {
    setLoading(true);
    try {
      // Check if user is authenticated first
      const authenticated = await isAuthenticated();
      if (!authenticated) {
        console.warn('User not authenticated - skipping privacy settings load');
        return;
      }
      
      const response = await safePrivacyAPI.getPrivacySettings();
      if (response?.data) {
        setPrivacySettings(response.data);
      }
    } catch (error) {
      console.error('Error loading privacy settings:', error);
      // If 401 error, user might not be authenticated - use default settings
      if (error.response?.status === 401 || error.message === 'Authentication required') {
        console.warn('Privacy settings unavailable - using defaults');
        return;
      }
    } finally {
      setLoading(false);
    }
  };

  const updatePrivacySetting = async (setting, value) => {
    try {
      const updatedSettings = { ...privacySettings, [setting]: value };
      setPrivacySettings(updatedSettings);
      
      await safePrivacyAPI.updatePrivacySettings(updatedSettings);
      return true;
    } catch (error) {
      console.error('Error updating privacy setting:', error);
      return false;
    }
  };

  const requestInformation = async (targetUserId, requestedFields, reason, requesterId) => {
    try {
      const requestData = {
        targetUserId,
        requesterId,
        requestedFields,
        reason,
        requestedAt: new Date().toISOString(),
      };

      const response = await safePrivacyAPI.requestInformation(requestData);
      
      if (response?.success) {
        Alert.alert('Request Sent', 'Your information request has been sent and is pending approval.');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error requesting information:', error);
      Alert.alert('Error', 'Failed to send information request.');
      return false;
    }
  };

  const respondToRequest = async (requestId, approved, sharedFields = [], expiresIn = null) => {
    try {
      const response = await safePrivacyAPI.respondToRequest({
        requestId,
        approved,
        sharedFields,
        expiresIn,
        respondedAt: new Date().toISOString(),
      });

      if (response?.success && approved) {
        // Grant specific permissions to the requester
        const request = pendingRequests.find(req => req.id === requestId);
        if (request) {
          await safePrivacyAPI.grantPermission(
            request.targetUserId,
            request.requesterId,
            sharedFields,
            expiresIn
          );
        }
      }

      if (response?.success) {
        // Remove from pending requests
        setPendingRequests(prev => prev.filter(req => req.id !== requestId));
        
        // Add to notifications
        const notification = {
          id: Date.now(),
          type: 'info_request_response',
          message: approved ? 'Information request approved' : 'Information request denied',
          timestamp: new Date().toISOString(),
        };
        setNotifications(prev => [notification, ...prev]);
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error responding to request:', error);
      return false;
    }
  };

  const getVisibleData = async (userData, viewerUserId, targetUserId, viewerType = 'caregiver') => {
    // Use existing profile data manager for consistent data filtering
    if (targetUserId && viewerUserId) {
      return await getFilteredProfileData(targetUserId, viewerUserId, viewerType);
    }
    
    // Fallback to local filtering if no user IDs provided
    const visibleData = {};
    
    Object.keys(userData).forEach(field => {
      const classification = dataClassification[field];
      
      if (classification === DATA_LEVELS.PUBLIC) {
        // Always visible
        visibleData[field] = userData[field];
      } else if (classification === DATA_LEVELS.PRIVATE) {
        // Check privacy settings
        const settingKey = `share${field.charAt(0).toUpperCase() + field.slice(1)}`;
        if (privacySettings[settingKey]) {
          visibleData[field] = userData[field];
        } else {
          visibleData[field] = '[Private - Request Access]';
        }
      } else if (classification === DATA_LEVELS.SENSITIVE) {
        // Sensitive data requires explicit permission
        visibleData[field] = '[Sensitive - Requires Explicit Permission]';
      }
    });

    return visibleData;
  };

  const grantUserPermission = async (targetUserId, viewerUserId, fields, expiresIn = null) => {
    try {
      const response = await safePrivacyAPI.grantPermission(targetUserId, viewerUserId, fields, expiresIn);
      if (response?.success) {
        Alert.alert('Permission Granted', 'Data access has been granted successfully.');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error granting permission:', error);
      Alert.alert('Error', 'Failed to grant permission.');
      return false;
    }
  };

  const revokeUserPermission = async (targetUserId, viewerUserId, fields = null) => {
    try {
      const response = await safePrivacyAPI.revokePermission(targetUserId, viewerUserId, fields);
      if (response?.success) {
        Alert.alert('Permission Revoked', 'Data access has been revoked successfully.');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error revoking permission:', error);
      Alert.alert('Error', 'Failed to revoke permission.');
      return false;
    }
  };

  const loadPendingRequests = async () => {
    setLoading(true);
    try {
      // Check if user is authenticated first
      const authenticated = await isAuthenticated();
      if (!authenticated) {
        console.warn('User not authenticated - skipping pending requests load');
        return;
      }
      
      const response = await safePrivacyAPI.getPendingRequests();
      if (response?.data) {
        setPendingRequests(response.data);
      }
    } catch (error) {
      console.error('Error loading pending requests:', error);
      // If 401 error, user might not be authenticated - skip loading
      if (error.response?.status === 401 || error.message === 'Authentication required') {
        console.warn('Pending requests unavailable - user not authenticated');
        return;
      }
    } finally {
      setLoading(false);
    }
  };

  const loadNotifications = async () => {
    setLoading(true);
    try {
      // Check if user is authenticated first
      const authenticated = await isAuthenticated();
      if (!authenticated) {
        console.warn('User not authenticated - skipping notifications load');
        return;
      }
      
      const response = await safePrivacyAPI.getPrivacyNotifications();
      if (response?.data) {
        setNotifications(response.data);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      // If 401 error, user might not be authenticated - skip loading
      if (error.response?.status === 401 || error.message === 'Authentication required') {
        console.warn('Privacy notifications unavailable - user not authenticated');
        return;
      }
    } finally {
      setLoading(false);
    }
  };

  const markNotificationAsRead = async (notificationId) => {
    try {
      await safePrivacyAPI.markNotificationAsRead(notificationId);
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, read: true }
            : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  useEffect(() => {
    loadPrivacySettings();
    loadPendingRequests();
    loadNotifications();
  }, []);

  const value = {
    privacySettings,
    pendingRequests,
    notifications,
    loading,
    DATA_LEVELS,
    dataClassification,
    updatePrivacySetting,
    requestInformation,
    respondToRequest,
    getVisibleData,
    grantUserPermission,
    revokeUserPermission,
    loadPendingRequests,
    markNotificationAsRead,
  };

  return (
    <PrivacyContext.Provider value={value}>
      {children}
    </PrivacyContext.Provider>
  );
};

export default PrivacyProvider;
