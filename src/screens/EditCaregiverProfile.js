import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  Image, 
  TouchableOpacity, 
  Alert,
  ActivityIndicator
} from 'react-native';
import { 
  TextInput, 
  Button, 
  Chip, 
  Snackbar,
  Portal,
  Dialog,
  Avatar
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../contexts/AuthContext';
import { jobsAPI, applicationsAPI, bookingsAPI, caregiversAPI, authAPI, uploadsAPI } from "../config/api";
import { API_CONFIG } from '../config/constants';
import { styles } from './styles/CaregiverDashboard.styles';

const EditCaregiverProfile = ({ navigation, route }) => {
  const { user } = useAuth();
  const { profile } = route.params || {};
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    bio: '',
    experience: '',
    hourlyRate: '',
    skills: [],
    certifications: [],
    profileImage: '',
  });
  
  const [newSkill, setNewSkill] = useState('');
  const [newCertification, setNewCertification] = useState('');

  // Load profile data
  useEffect(() => {
    if (profile) {
      setFormData(profile);
    } else {
      // If no profile passed, load from Firestore
      loadProfile();
    }
  }, [profile]);

  // Load profile from backend REST
  const loadProfile = async () => {
    try {
      if (!user) return;

      setLoading(true);
      console.log('🔍 Loading caregiver profile...');
      const res = await caregiversAPI.getMyProfile();
      console.log('📋 Profile API response:', res);
      
      // Handle different response structures
      const profileData = res?.caregiver || res?.data?.caregiver || res?.provider || res || {};
      console.log('📊 Profile data extracted:', profileData);
      
      setFormData((prev) => ({
        ...prev,
        name: profileData.name || profileData.fullName || prev.name,
        email: profileData.email || profileData.userId?.email || prev.email,
        phone: profileData.phone || profileData.contactNumber || profileData.userId?.phone || prev.phone,
        bio: profileData.bio || profileData.about || prev.bio,
        experience: String(profileData.experience?.years ?? profileData.experience ?? prev.experience ?? ''),
        hourlyRate: String(profileData.hourlyRate ?? profileData.rate ?? prev.hourlyRate ?? ''),
        skills: Array.isArray(profileData.skills) ? profileData.skills : (prev.skills || []),
        certifications: Array.isArray(profileData.certifications) ? profileData.certifications : (prev.certifications || []),
        profileImage: (() => {
          const img = profileData.profileImage || profileData.avatar || profileData.userId?.profileImage || prev.profileImage;
          return img && img.startsWith('/') ? `${API_CONFIG.BASE_URL.replace('/api', '')}${img}` : img;
        })(),
      }));
      
      console.log('✅ Profile data loaded and formatted');
    } catch (error) {
      console.error('❌ Error loading profile:', error);
      console.error('❌ Error details:', error.response?.data || error.message);
      showSnackbar('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  // Handle input changes
  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Add a new skill
  const addSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()]
      }));
      setNewSkill('');
    }
  };

  // Remove a skill
  const removeSkill = (skillToRemove) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  // Add a new certification
  const addCertification = () => {
    if (newCertification.trim() && !formData.certifications.includes(newCertification.trim())) {
      setFormData(prev => ({
        ...prev,
        certifications: [...prev.certifications, newCertification.trim()]
      }));
      setNewCertification('');
    }
  };

  // Remove a certification
  const removeCertification = (certToRemove) => {
    setFormData(prev => ({
      ...prev,
      certifications: prev.certifications.filter(cert => cert !== certToRemove)
    }));
  };

  // Handle profile image upload (base64 -> REST)
  const handleImageUpload = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Please allow access to your photo library to upload an image.');
        return;
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaType?.Images || 'Images',
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });
      
      if (!result.canceled) {
        setUploading(true);
        const asset = result.assets[0];
        const mimeType = asset.mimeType || 'image/jpeg';
        const dataUrl = asset.base64 ? `data:${mimeType};base64,${asset.base64}` : null;
        if (!dataUrl) {
          Alert.alert('Error', 'Failed to read image data');
          setUploading(false);
          return;
        }

        const resp = await authAPI.uploadProfileImageBase64(dataUrl, mimeType);
        const url = resp?.data?.url || resp?.url;
        const absoluteUrl = url && url.startsWith('/') ? `${API_CONFIG.BASE_URL.replace('/api', '')}${url}` : url;

        setFormData(prev => ({ ...prev, profileImage: absoluteUrl || prev.profileImage }));
        showSnackbar('Profile image updated');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      showSnackbar('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  // Save profile via backend REST
  const saveProfile = async () => {
    try {
      if (!user) {
        showSnackbar('You must be logged in to save changes');
        return;
      }
      
      setLoading(true);
      console.log('💾 Saving profile changes...');

      // Build payload expected by backend
      const payload = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        bio: formData.bio,
        experience: Number(formData.experience) || 0,
        hourlyRate: Number(formData.hourlyRate) || undefined,
        skills: Array.isArray(formData.skills) ? formData.skills : [],
        certifications: Array.isArray(formData.certifications) ? formData.certifications : [],
        profileImage: formData.profileImage || undefined,
      };

      console.log('📤 Payload being sent:', payload);
      const response = await caregiversAPI.updateMyProfile(payload);
      console.log('📥 Update response:', response);
      
      showSnackbar('Profile updated successfully');
      
      // Reload profile data to ensure UI shows latest changes
      await loadProfile();
      
      // Navigate back after a short delay to show the success message
      setTimeout(() => {
        navigation.goBack();
      }, 1500);
      
    } catch (error) {
      console.error('❌ Error updating profile:', error);
      console.error('❌ Error details:', error.response?.data || error.message);
      showSnackbar('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  // Show snackbar message
  const showSnackbar = (message) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  if (loading && !profile) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#6E56CF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Profile Image */}
        <View style={{ alignItems: 'center', marginBottom: 24 }}>
          <TouchableOpacity onPress={handleImageUpload} disabled={uploading}>
            {uploading ? (
              <View style={styles.profileImage}>
                <ActivityIndicator size="large" color="#6E56CF" />
              </View>
            ) : (
              <Avatar.Image 
                size={120} 
                source={{ uri: formData.profileImage || 'https://via.placeholder.com/150' }} 
                style={{ backgroundColor: '#f0f0f0' }}
              />
            )}
            <View style={styles.cameraIcon}>
              <Ionicons name="camera" size={20} color="#fff" />
            </View>
          </TouchableOpacity>
        </View>
        
        {/* Basic Info */}
        <Text style={[styles.sectionTitle, { marginTop: 0 }]}>Basic Information</Text>
        <TextInput
          label="Full Name"
          value={formData.name}
          onChangeText={(text) => handleChange('name', text)}
          style={styles.input}
          mode="outlined"
        />
        
        <TextInput
          label="Email"
          value={formData.email}
          onChangeText={(text) => handleChange('email', text)}
          style={styles.input}
          mode="outlined"
          keyboardType="email-address"
          autoCapitalize="none"
          disabled={true}
        />
        
        <TextInput
          label="Phone Number"
          value={formData.phone}
          onChangeText={(text) => handleChange('phone', text)}
          style={styles.input}
          mode="outlined"
          keyboardType="phone-pad"
        />
        
        <TextInput
          label="Hourly Rate (₱/hr)"
          value={formData.hourlyRate}
          onChangeText={(text) => handleChange('hourlyRate', text)}
          style={styles.input}
          mode="outlined"
          keyboardType="numeric"
        />
        
        <TextInput
          label="Years of Experience"
          value={formData.experience}
          onChangeText={(text) => handleChange('experience', text)}
          style={styles.input}
          mode="outlined"
        />
        
        {/* Bio */}
        <Text style={styles.sectionTitle}>About Me</Text>
        <TextInput
          label="Bio"
          value={formData.bio}
          onChangeText={(text) => handleChange('bio', text)}
          style={[styles.input, { height: 120 }]}
          mode="outlined"
          multiline
          numberOfLines={4}
        />
        
        {/* Skills */}
        <Text style={styles.label}>Skills</Text>
        <View style={styles.tagsContainer}>
          {formData.skills?.map((skill, index) => (
            <Chip 
              key={index} 
              style={styles.skillTag}
              onClose={() => removeSkill(skill)}
              closeIcon="close"
            >
              {skill}
            </Chip>
          ))}
        </View>
        <View style={{ flexDirection: 'row', marginTop: 8 }}>
          <TextInput
            label="New Skill"
            value={newSkill}
            onChangeText={setNewSkill}
            placeholder="Add a skill"
            style={[styles.input, { flex: 1, marginRight: 8 }]}
            mode="outlined"
            onSubmitEditing={addSkill}
            returnKeyType="done"
          />
          <Button 
            mode="contained" 
            onPress={addSkill}
            style={{ justifyContent: 'center' }}
            disabled={!newSkill.trim()}
          >
            Add
          </Button>
        </View>
        
        {/* Certifications */}
        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Certifications</Text>
        <View style={styles.tagsContainer}>
          {formData.certifications?.map((cert, index) => (
            <Chip 
              key={index} 
              style={styles.skillTag}
              onClose={() => removeCertification(cert)}
              closeIcon="close"
            >
              {cert}
            </Chip>
          ))}
        </View>
        <View style={{ flexDirection: 'row', marginTop: 8, marginBottom: 24 }}>
          <TextInput
            label="New Certification"
            value={newCertification}
            onChangeText={setNewCertification}
            placeholder="Add a certification"
            style={[styles.input, { flex: 1, marginRight: 8 }]}
            mode="outlined"
            onSubmitEditing={addCertification}
            returnKeyType="done"
          />
          <Button 
            mode="contained" 
            onPress={addCertification}
            style={{ justifyContent: 'center' }}
            disabled={!newCertification.trim()}
          >
            Add
          </Button>
        </View>
        
        {/* Save Button */}
        <Button 
          mode="contained" 
          onPress={saveProfile}
          style={{ marginTop: 8, marginBottom: 32 }}
          loading={loading}
          disabled={loading}
        >
          Save Changes
        </Button>
      </ScrollView>
      
      {/* Snackbar */}
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        action={{
          label: 'OK',
          onPress: () => setSnackbarVisible(false),
        }}
      >
        {snackbarMessage}
      </Snackbar>
    </View>
  );
};

export default EditCaregiverProfile;
