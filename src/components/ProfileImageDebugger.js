import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Button } from 'react-native-paper';
import { useAuth } from '../core/contexts/AuthContext';
import { caregiversAPI, authAPI } from '../config/api';
import { getCurrentSocketURL } from '../config/api';

const ProfileImageDebugger = () => {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      console.log('🔍 ProfileImageDebugger - Fetching profile data...');
      
      // Get both caregiver and user profiles
      let caregiverProfile = null;
      let userProfile = null;
      
      try {
        const caregiverResponse = await caregiversAPI.getMyProfile();
        caregiverProfile = caregiverResponse?.caregiver || caregiverResponse?.data?.caregiver || caregiverResponse;
        console.log('👩‍💼 Caregiver profile:', caregiverProfile);
      } catch (error) {
        console.log('No caregiver profile found:', error.message);
      }
      
      try {
        const userResponse = await authAPI.getProfile();
        userProfile = userResponse?.data || userResponse;
        console.log('👤 User profile:', userProfile);
      } catch (error) {
        console.log('Failed to get user profile:', error.message);
      }
      
      setProfileData({ caregiverProfile, userProfile });
      
      // Extract image URL
      const rawImageUrl = caregiverProfile?.profileImage || caregiverProfile?.imageUrl || caregiverProfile?.image ||
                         userProfile?.profileImage || userProfile?.imageUrl || userProfile?.image;
      
      console.log('🖼️ Raw image URL found:', rawImageUrl);
      
      if (rawImageUrl) {
        let processedUrl;
        const baseUrl = getCurrentSocketURL();
        
        if (rawImageUrl.startsWith('http')) {
          processedUrl = rawImageUrl;
        } else if (rawImageUrl.startsWith('/')) {
          processedUrl = `${baseUrl}${rawImageUrl}`;
        } else {
          processedUrl = `${baseUrl}/uploads/${rawImageUrl}`;
        }
        
        // Add cache busting
        const timestamp = Date.now();
        processedUrl = processedUrl.includes('?') ? `${processedUrl}&t=${timestamp}` : `${processedUrl}?t=${timestamp}`;
        
        console.log('✅ Final processed URL:', processedUrl);
        setImageUrl(processedUrl);
      } else {
        console.log('❌ No image URL found in profiles');
        setImageUrl(null);
      }
      
    } catch (error) {
      console.error('❌ Error fetching profile data:', error);
      Alert.alert('Error', 'Failed to fetch profile data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  const testImageLoad = () => {
    if (imageUrl) {
      console.log('🧪 Testing image load for URL:', imageUrl);
      // Force a re-render to test image loading
      setImageUrl(null);
      setTimeout(() => setImageUrl(imageUrl), 100);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile Image Debugger</Text>
      
      <Button mode="outlined" onPress={fetchProfileData} loading={loading}>
        Refresh Profile Data
      </Button>
      
      <View style={styles.debugInfo}>
        <Text style={styles.debugTitle}>Debug Information:</Text>
        <Text style={styles.debugText}>User ID: {user?.id || 'Not found'}</Text>
        <Text style={styles.debugText}>User Role: {user?.role || 'Not found'}</Text>
        <Text style={styles.debugText}>Socket URL: {getCurrentSocketURL()}</Text>
        <Text style={styles.debugText}>Raw Image URL: {profileData?.caregiverProfile?.profileImage || profileData?.userProfile?.profileImage || 'Not found'}</Text>
        <Text style={styles.debugText}>Processed URL: {imageUrl || 'Not processed'}</Text>
      </View>
      
      <View style={styles.imageContainer}>
        <Text style={styles.imageTitle}>Profile Image Test:</Text>
        {imageUrl ? (
          <View>
            <Image
              source={{ uri: imageUrl }}
              style={styles.testImage}
              onLoad={() => console.log('✅ Image loaded successfully')}
              onError={(error) => console.log('❌ Image load error:', error.nativeEvent?.error)}
              onLoadStart={() => console.log('🔄 Image loading started')}
            />
            <Button mode="outlined" onPress={testImageLoad} style={styles.testButton}>
              Test Image Reload
            </Button>
          </View>
        ) : (
          <View style={styles.noImageContainer}>
            <Text style={styles.noImageText}>No image URL available</Text>
          </View>
        )}
      </View>
      
      <View style={styles.rawDataContainer}>
        <Text style={styles.rawDataTitle}>Raw Profile Data:</Text>
        <Text style={styles.rawDataText}>
          {JSON.stringify(profileData, null, 2)}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  debugInfo: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginVertical: 16,
  },
  debugTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  debugText: {
    fontSize: 12,
    marginBottom: 4,
    fontFamily: 'monospace',
  },
  imageContainer: {
    marginVertical: 16,
    alignItems: 'center',
  },
  imageTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  testImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: '#ddd',
  },
  testButton: {
    marginTop: 8,
  },
  noImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  noImageText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  rawDataContainer: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    maxHeight: 200,
  },
  rawDataTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  rawDataText: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: '#333',
  },
});

export default ProfileImageDebugger;