import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useApi } from '../hooks/useApi';
import profileService from '../services/profileService';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { validateForm, VALIDATION_RULES } from '../utils/validation';
import { logger } from '../utils/logger';
import * as ImagePicker from 'expo-image-picker';

const ProfileScreen = ({ navigation }) => {
  const { user, token, updateUserProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({});
  const [errors, setErrors] = useState({});

  // API hooks
  const {
    execute: fetchProfile,
    loading: fetchingProfile,
    error: fetchError
  } = useApi(profileService.getProfile);

  const {
    execute: updateProfile,
    loading: updatingProfile,
    error: updateError
  } = useApi(profileService.updateProfile);

  const {
    execute: updateImage,
    loading: updatingImage,
    error: imageError
  } = useApi(profileService.updateProfileImage);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const profile = await fetchProfile(token);
      setProfileData(profile);
    } catch (error) {
      logger.error('Failed to load profile:', error);
      Alert.alert('Error', 'Failed to load profile. Please try again.');
    }
  };

  const handleSave = async () => {
    try {
      // Validate form
      const validation = validateForm(profileData, VALIDATION_RULES.profile);
      if (!validation.isValid) {
        setErrors(validation.errors);
        return;
      }

      setErrors({});
      const updatedProfile = await updateProfile(profileData, token);
      
      // Update auth context
      updateUserProfile(updatedProfile);
      
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      logger.error('Failed to update profile:', error);
      Alert.alert('Error', error.userMessage || 'Failed to update profile');
    }
  };

  const handleImagePicker = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Permission to access camera roll is required!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const imageBase64 = `data:image/jpeg;base64,${result.assets[0].base64}`;
        
        const updatedData = await updateImage(imageBase64, token);
        setProfileData(prev => ({ ...prev, avatar: updatedData.avatar }));
        
        Alert.alert('Success', 'Profile image updated successfully!');
      }
    } catch (error) {
      logger.error('Failed to update profile image:', error);
      Alert.alert('Error', error.userMessage || 'Failed to update profile image');
    }
  };

  const renderField = (label, key, placeholder, multiline = false) => (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[
          styles.fieldInput,
          multiline && styles.multilineInput,
          errors[key] && styles.errorInput
        ]}
        value={profileData[key] || ''}
        onChangeText={(value) => setProfileData(prev => ({ ...prev, [key]: value }))}
        placeholder={placeholder}
        editable={isEditing}
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
      />
      {errors[key] && <Text style={styles.errorText}>{errors[key]}</Text>}
    </View>
  );

  if (fetchingProfile) {
    return <LoadingSpinner message="Loading profile..." />;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleImagePicker} disabled={updatingImage}>
          <View style={styles.avatarContainer}>
            {profileData.avatar ? (
              <Image source={{ uri: profileData.avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {profileData.name?.charAt(0)?.toUpperCase() || 'U'}
                </Text>
              </View>
            )}
            {updatingImage && (
              <View style={styles.imageLoadingOverlay}>
                <ActivityIndicator color="#fff" />
              </View>
            )}
          </View>
        </TouchableOpacity>
        
        <Text style={styles.userName}>{profileData.name || 'User'}</Text>
        <Text style={styles.userRole}>{profileData.role || 'User'}</Text>
        
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => {
            if (isEditing) {
              handleSave();
            } else {
              setIsEditing(true);
            }
          }}
          disabled={updatingProfile}
        >
          <Text style={styles.editButtonText}>
            {updatingProfile ? 'Saving...' : isEditing ? 'Save' : 'Edit Profile'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {renderField('Full Name', 'name', 'Enter your full name')}
        {renderField('Phone Number', 'phone', 'Enter your phone number')}
        {renderField('Email', 'email', 'Enter your email address')}

        {profileData.role === 'caregiver' && (
          <>
            {renderField('Bio', 'bio', 'Tell us about yourself...', true)}
            {renderField('Experience (years)', 'experience', 'Years of experience')}
            {renderField('Hourly Rate (₱)', 'hourlyRate', 'Your hourly rate')}
            
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Specialties</Text>
              <TextInput
                style={[styles.fieldInput, errors.specialties && styles.errorInput]}
                value={profileData.specialties?.join(', ') || ''}
                onChangeText={(value) => setProfileData(prev => ({ 
                  ...prev, 
                  specialties: value.split(',').map(s => s.trim()).filter(s => s) 
                }))}
                placeholder="e.g., Infant care, Special needs, Tutoring"
                editable={isEditing}
              />
              {errors.specialties && <Text style={styles.errorText}>{errors.specialties}</Text>}
            </View>
          </>
        )}

        {profileData.role === 'parent' && (
          <TouchableOpacity
            style={styles.sectionButton}
            onPress={() => navigation.navigate('ChildrenManagement')}
          >
            <Text style={styles.sectionButtonText}>Manage Children</Text>
          </TouchableOpacity>
        )}

        {profileData.role === 'caregiver' && (
          <TouchableOpacity
            style={styles.sectionButton}
            onPress={() => navigation.navigate('AvailabilityManagement')}
          >
            <Text style={styles.sectionButtonText}>Manage Availability</Text>
          </TouchableOpacity>
        )}

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Account Information</Text>
          <Text style={styles.infoText}>Verified: {profileData.verified ? 'Yes' : 'No'}</Text>
          <Text style={styles.infoText}>
            Member since: {new Date(profileData.createdAt).toLocaleDateString()}
          </Text>
          {profileData.role === 'caregiver' && (
            <>
              <Text style={styles.infoText}>
                Rating: {profileData.rating || 'No ratings yet'}
              </Text>
              <Text style={styles.infoText}>
                Reviews: {profileData.reviewCount || 0}
              </Text>
            </>
          )}
        </View>

        {isEditing && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => {
              setIsEditing(false);
              setErrors({});
              loadProfile(); // Reset to original data
            }}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
  },
  imageLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  userRole: {
    fontSize: 16,
    color: '#666',
    textTransform: 'capitalize',
    marginBottom: 20,
  },
  editButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    padding: 20,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  fieldInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
  },
  multilineInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  errorInput: {
    borderColor: '#FF3B30',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    marginTop: 5,
  },
  sectionButton: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  sectionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    textAlign: 'center',
  },
  infoSection: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 8,
    marginTop: 20,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  infoText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  cancelButton: {
    backgroundColor: '#FF3B30',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default ProfileScreen;
