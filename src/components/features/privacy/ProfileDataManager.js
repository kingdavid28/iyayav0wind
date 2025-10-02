import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AuthContext } from '../../../contexts/AuthContext';
import { authAPI, caregiversAPI, privacyAPI } from '../../../services';
import { tokenManager } from '../../../utils/tokenManager';

// Helper function to check authentication
const isAuthenticated = async () => {
  try {
    const token = await tokenManager.getValidToken(false);
    return !!token;
  } catch (error) {
    return false;
  }
};

// Data classification levels from existing system
const DATA_LEVELS = {
  PUBLIC: 'public',        // Always visible (name, general location, email)
  PRIVATE: 'private',      // Requires explicit sharing (phone, full address)
  SENSITIVE: 'sensitive'   // Requires approval (medical, financial, emergency contacts)
};

// Reuse existing profile field classification
const dataClassification = {
  // Public - always visible (from EditCaregiverProfile.js)
  name: DATA_LEVELS.PUBLIC,
  email: DATA_LEVELS.PUBLIC,
  bio: DATA_LEVELS.PUBLIC,
  experience: DATA_LEVELS.PUBLIC,
  skills: DATA_LEVELS.PUBLIC,
  certifications: DATA_LEVELS.PUBLIC,
  hourlyRate: DATA_LEVELS.PUBLIC,

  // Private - requires privacy setting (from EnhancedCaregiverProfileWizard.js)
  phone: DATA_LEVELS.PRIVATE,
  address: DATA_LEVELS.PRIVATE,
  profileImage: DATA_LEVELS.PRIVATE,
  portfolio: DATA_LEVELS.PRIVATE,
  availability: DATA_LEVELS.PRIVATE,
  languages: DATA_LEVELS.PRIVATE,

  // Sensitive - requires explicit approval
  emergencyContacts: DATA_LEVELS.SENSITIVE,
  documents: DATA_LEVELS.SENSITIVE,
  backgroundCheck: DATA_LEVELS.SENSITIVE,
  ageCareRanges: DATA_LEVELS.SENSITIVE,
};

// Get filtered data based on privacy settings and permissions
export const getFilteredProfileData = async (targetUserId, viewerUserId, viewerType = 'caregiver', profileData = {}) => {
  try {
    // Check if user is authenticated first
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      console.warn('User not authenticated - returning basic profile data only');
      // Return only public data when not authenticated
      const publicData = {};
      Object.keys(profileData).forEach(field => {
        if (dataClassification[field] === DATA_LEVELS.PUBLIC) {
          publicData[field] = profileData[field];
        }
      });
      return publicData;
    }

    // Get privacy settings for the target user
    const privacySettings = await privacyAPI.getPrivacySettings(targetUserId);
    // Get specific permissions granted to this viewer
    const userPermissions = await privacyAPI.getUserPermissions(targetUserId, viewerUserId);

    const filteredData = {};

    Object.keys(profileData).forEach(field => {
      const classification = dataClassification[field];

      if (classification === DATA_LEVELS.PUBLIC) {
        // Always visible to everyone
        filteredData[field] = profileData[field];
      } else if (classification === DATA_LEVELS.PRIVATE) {
        // Check if viewer has specific permission for this field
        const hasPermission = userPermissions?.permissions?.includes(field) ||
                             userPermissions?.permissions?.includes('all_private');

        if (hasPermission) {
          filteredData[field] = profileData[field];
        } else {
          // Check general privacy settings as fallback
          const settingKey = `share${field.charAt(0).toUpperCase() + field.slice(1)}`;
          if (privacySettings?.data?.[settingKey]) {
            filteredData[field] = profileData[field];
          } else {
            filteredData[field] = '[Private - Request Access]';
          }
        }
      } else if (classification === DATA_LEVELS.SENSITIVE) {
        // Sensitive data requires explicit permission from target user to specific viewer
        const hasSensitivePermission = userPermissions?.permissions?.includes(field) ||
                                     userPermissions?.permissions?.includes('all_sensitive') ||
                                     userPermissions?.sensitiveFields?.includes(field);

        if (hasSensitivePermission && userPermissions?.grantedTo === viewerUserId) {
          filteredData[field] = profileData[field];
        } else {
          filteredData[field] = '[Sensitive - Requires Explicit Permission]';
        }
      }
    });

    return filteredData;
  } catch (error) {
    console.error('Error filtering profile data:', error);
    return profileData; // Return full data on error for safety
  }
};

const ProfileDataContext = createContext();

export const useProfileData = () => {
  const context = useContext(ProfileDataContext);
  if (!context) {
    throw new Error('useProfileData must be used within a ProfileDataProvider');
  }
  return context;
};

export const ProfileDataProvider = ({ children }) => {
  const renderCountRef = useRef(0);
  renderCountRef.current += 1;
  console.log('[ProfileDataProvider] render count:', renderCountRef.current);

  const [profileData, setProfileData] = useState({});
  const [loading, setLoading] = useState(false);
  const lastLoadedKeyRef = useRef(null);
  const profileDataRef = useRef({});
  const authContext = useContext(AuthContext);
  const user = authContext?.user || null;

  const shallowEqual = useCallback((objA, objB) => {
    if (objA === objB) {
      return true;
    }

    if (!objA || !objB) {
      return false;
    }

    const keysA = Object.keys(objA);
    const keysB = Object.keys(objB);

    if (keysA.length !== keysB.length) {
      return false;
    }

    for (let i = 0; i < keysA.length; i += 1) {
      const key = keysA[i];
      if (objA[key] !== objB[key]) {
        return false;
      }
    }

    return true;
  }, []);

  // Load profile data using existing API methods
  const loadProfileData = useCallback(async (userType = 'caregiver', userId = null, options = {}) => {
    const { force = false } = options;
    const loadKey = `${userType}:${userId || 'self'}`;

    if (!force && lastLoadedKeyRef.current === loadKey) {
      console.log('[ProfileDataProvider] loadProfileData skipped - already loaded for key:', loadKey);
      return profileDataRef.current;
    }

    console.log('[ProfileDataProvider] loadProfileData start:', { userType, userId, force });

    try {
      setLoading(true);

      if (userType === 'caregiver') {
        const response = await caregiversAPI.getMyProfile();
        const apiProfile = response?.caregiver || response?.data?.caregiver || response?.provider || response || {};

        const nextProfileData = {
          name: apiProfile.name || apiProfile.fullName || '',
          email: apiProfile.email || apiProfile.userId?.email || '',
          bio: apiProfile.bio || apiProfile.about || '',
          experience: apiProfile.experience?.years ?? apiProfile.experience ?? '',
          hourlyRate: apiProfile.hourlyRate ?? apiProfile.rate ?? '',
          skills: Array.isArray(apiProfile.skills) ? apiProfile.skills : [],
          certifications: Array.isArray(apiProfile.certifications) ? apiProfile.certifications : [],
          phone: apiProfile.phone || apiProfile.contactNumber || '',
          profileImage: apiProfile.profileImage || apiProfile.avatar || '',
          address: apiProfile.address || {},
          portfolio: apiProfile.portfolio || { images: [], videos: [] },
          availability: apiProfile.availability || {},
          languages: apiProfile.languages || [],
          emergencyContacts: apiProfile.emergencyContacts || [],
          documents: apiProfile.documents || [],
          backgroundCheck: apiProfile.backgroundCheck || {},
          ageCareRanges: apiProfile.ageCareRanges || [],
        };

        setProfileData(prev => {
          console.log('[ProfileDataProvider] setProfileData invoked (caregiver)', {
            prev,
            next: nextProfileData,
          });
          if (shallowEqual(prev, nextProfileData)) {
            console.log('[ProfileDataProvider] caregiver profile unchanged, skipping state update');
            profileDataRef.current = prev;
            return prev;
          }
          console.log('[ProfileDataProvider] caregiver profile updated');
          profileDataRef.current = nextProfileData;
          return nextProfileData;
        });
      } else if (userType === 'parent') {
        const response = await authAPI.getProfile();
        const apiProfile = response?.data || response || {};

        const nextProfileData = {
          name: apiProfile.name || '',
          email: apiProfile.email || '',
          phone: apiProfile.phone || apiProfile.contact || '',
          profileImage: apiProfile.profileImage || apiProfile.avatar || '',
          location: apiProfile.location || '',
          emergencyContact: apiProfile.emergencyContact || '',
          childMedicalInfo: apiProfile.childMedicalInfo || '',
          childAllergies: apiProfile.childAllergies || '',
          childBehaviorNotes: apiProfile.childBehaviorNotes || '',
          financialInfo: apiProfile.financialInfo || '',
        };

        setProfileData(prev => {
          console.log('[ProfileDataProvider] setProfileData invoked (parent)', {
            prev,
            next: nextProfileData,
          });
          if (shallowEqual(prev, nextProfileData)) {
            console.log('[ProfileDataProvider] parent profile unchanged, skipping state update');
            profileDataRef.current = prev;
            return prev;
          }
          console.log('[ProfileDataProvider] parent profile updated');
          profileDataRef.current = nextProfileData;
          return nextProfileData;
        });
      }

      lastLoadedKeyRef.current = loadKey;
      return profileDataRef.current;
    } catch (error) {
      console.error('Error loading profile data:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [shallowEqual]);

  const loadProfileDataRef = useRef(loadProfileData);
  useEffect(() => {
    loadProfileDataRef.current = loadProfileData;
  }, [loadProfileData]);

  useEffect(() => {
    console.log('[ProfileDataProvider] effect run', {
      user,
      lastLoadedKey: lastLoadedKeyRef.current,
      profileDataKeys: Object.keys(profileDataRef.current || {}),
    });

    if (!user) {
      const hadCachedData = lastLoadedKeyRef.current !== null || (profileDataRef.current && Object.keys(profileDataRef.current).length > 0);
      if (hadCachedData) {
        console.log('[ProfileDataProvider] clearing cached data due to missing user');
        profileDataRef.current = {};
        lastLoadedKeyRef.current = null;
        setProfileData({});
      }
      return;
    }

    const role = user.role === 'caregiver' ? 'caregiver' : 'parent';
    const resolvedUserId = role === 'caregiver'
      ? user.mongoId || user._id || user.id || user.userId || null
      : null;
    const loadKey = `${role}:${resolvedUserId || 'self'}`;

    if (lastLoadedKeyRef.current === loadKey) {
      console.log('[ProfileDataProvider] skipping load, same key', loadKey);
      return;
    }

    console.log('[ProfileDataProvider] initial load for role:', role, 'userId:', resolvedUserId);

    loadProfileDataRef.current(role, resolvedUserId, { force: false })
      .catch((error) => {
        console.warn('[ProfileDataProvider] initial load failed:', error?.message || error);
      });
  }, [user?.role, user?.mongoId, user?._id, user?.id, user?.userId]);

  // Update profile data using existing update methods
  const updateProfileData = useCallback(async (updates, userType = 'caregiver') => {
    try {
      setLoading(true);
      let response;

      if (userType === 'caregiver') {
        // Use existing caregiver update API from EditCaregiverProfile.js
        const payload = {
          name: updates.name,
          email: updates.email,
          phone: updates.phone,
          bio: updates.bio,
          experience: Number(updates.experience) || 0,
          hourlyRate: Number(updates.hourlyRate) || undefined,
          skills: Array.isArray(updates.skills) ? updates.skills : [],
          certifications: Array.isArray(updates.certifications) ? updates.certifications : [],
          profileImage: updates.profileImage || undefined,
        };

        response = await caregiversAPI.updateMyProfile(payload);
      } else if (userType === 'parent') {
        // Use existing parent update API
        response = await authAPI.updateProfile(updates);
      }

      // Update local state
      setProfileData(prev => {
        console.log('[ProfileDataProvider] setProfileData invoked (updateProfileData)', {
          prev,
          updates,
        });
        const merged = { ...prev, ...updates };
        if (shallowEqual(prev, merged)) {
          console.log('[ProfileDataProvider] updateProfileData skipped - no changes');
          profileDataRef.current = prev;
          return prev;
        }
        console.log('[ProfileDataProvider] updateProfileData applied');
        profileDataRef.current = merged;
        return merged;
      });
      return response;
    } catch (error) {
      console.error('Error updating profile data:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [shallowEqual]);

  // Get filtered data based on privacy settings and permissions
  const getFilteredProfileDataInternal = async (targetUserId, viewerUserId, viewerType = 'caregiver') => {
    return await getFilteredProfileData(targetUserId, viewerUserId, viewerType, profileData);
  };

  // Upload profile image using existing method
  const uploadProfileImage = async (imageUri, mimeType = 'image/jpeg') => {
    try {
      setLoading(true);

      // Use existing image upload from EditCaregiverProfile.js
      const response = await authAPI.uploadProfileImageBase64(imageUri, mimeType);
      const imageUrl = response?.data?.url || response?.url;

      if (imageUrl) {
        // Update profile data with new image
        await updateProfileData({ profileImage: imageUrl });
        return imageUrl;
      }

      throw new Error('Failed to get image URL from response');
    } catch (error) {
      console.error('Error uploading profile image:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value = useMemo(() => ({
    profileData,
    loading,
    dataClassification,
    DATA_LEVELS,
    loadProfileData,
    updateProfileData,
    getFilteredProfileData: getFilteredProfileDataInternal,
    uploadProfileImage,
  }), [profileData, loading, loadProfileData, updateProfileData]);

  return (
    <ProfileDataContext.Provider value={value}>
      {children}
    </ProfileDataContext.Provider>
  );
};

export default ProfileDataProvider;
