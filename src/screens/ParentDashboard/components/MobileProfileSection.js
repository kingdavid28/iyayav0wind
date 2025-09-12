import React from 'react';
import { View, Text, Image, Platform } from 'react-native';
import { User } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getCurrentSocketURL } from '../../../config/api';
import { useAuth } from '../../../core/contexts/AuthContext';
import { calculateAge, formatBirthDate } from '../../../utils/dateUtils';

const MobileProfileSection = ({ greetingName, profileImage, profileContact, profileLocation, activeTab, userData }) => {
  const { user } = useAuth();
  
  // Use userData prop if available, fallback to user context
  const profileData = userData || user;
  
  const userAge = profileData?.birthDate ? calculateAge(profileData.birthDate) : null;
  const fullName = profileData?.name || greetingName;
  const displayName = profileData?.firstName && profileData?.lastName 
    ? `${profileData.firstName} ${profileData.middleInitial ? profileData.middleInitial + '. ' : ''}${profileData.lastName}`.trim()
    : fullName;
  // Handle image URI construction
  const getImageSource = () => {
    console.log('🖼️ MobileProfileSection - profileImage:', profileImage);
    
    if (!profileImage || profileImage.trim() === '' || profileImage === 'null' || profileImage === 'undefined') {
      console.log('🖼️ MobileProfileSection - No valid profile image');
      return null;
    }
    
    if (profileImage.startsWith('http')) {
      console.log('🖼️ MobileProfileSection - Using full URL:', profileImage);
      return { uri: profileImage };
    }
    
    // Use dynamic API URL
    const baseUrl = getCurrentSocketURL();
    const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const cleanImagePath = profileImage.startsWith('/') ? profileImage : `/${profileImage}`;
    const fullUrl = `${cleanBaseUrl}${cleanImagePath}`;
    console.log('🖼️ MobileProfileSection - Constructed URL:', fullUrl);
    return { uri: fullUrl };
  };
  
  const imageSource = getImageSource();

  // Only render on mobile platforms
  if (Platform.OS === 'web') {
    return null;
  }

  return (
    <View style={styles.mobileProfileContainer}>
      <LinearGradient
        colors={["#f8fafc", "#f1f5f9"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.mobileProfileCard}
      >
        <View style={styles.mobileProfileContent}>
          <View style={styles.mobileProfileImageContainer}>
            {imageSource ? (
              <Image 
                source={imageSource}
                style={styles.mobileProfileImage}
                onError={(error) => console.log('Image load error:', error)}
                resizeMode="cover"
                defaultSource={Platform.OS === 'ios' ? 
                  require('../../../../assets/icon.png') : 
                  { uri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==' }
                }
              />
            ) : (
              <View style={styles.mobileDefaultProfileImage}>
                <User size={40} color="#db2777" />
              </View>
            )}
          </View>
          
          <View style={styles.mobileProfileInfo}>
            <Text style={styles.mobileWelcomeText}>
              {displayName ? `Welcome back, ${displayName}! 👋` : 'Welcome back! 👋'}
            </Text>
            <View style={styles.mobileProfileDetails}>
              {userAge && (
                <Text style={styles.mobileProfileDetailText}>🎂 {userAge} years old</Text>
              )}
              <Text style={styles.mobileProfileDetailText}>📧 {profileData?.email || profileContact || 'No email'}</Text>
              {profileData?.phone && (
                <Text style={styles.mobileProfileDetailText}>📱 {profileData.phone}</Text>
              )}
              <Text style={styles.mobileProfileDetailText}>📍 {profileData?.address?.street || profileLocation || 'Location not set'}</Text>
              {profileData?.role === 'caregiver' && profileData?.caregiverProfile?.hourlyRate && (
                <Text style={styles.mobileProfileDetailText}>💰 ₱{profileData.caregiverProfile.hourlyRate}/hr</Text>
              )}
            </View>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = {
  mobileProfileContainer: {
    paddingHorizontal: 1,
    paddingVertical: 5,
    backgroundColor: 'transparent',
  },
  mobileProfileCard: {
    borderRadius: 20,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  mobileProfileContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mobileProfileImageContainer: {
    marginRight: 16,
  },
  mobileProfileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#db2777',
  },
  mobileDefaultProfileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 3,
    borderColor: '#db2777',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mobileProfileInfo: {
    flex: 1,
  },
  mobileWelcomeText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
    lineHeight: 28,
  },
  mobileProfileDetails: {
    gap: 4,
  },
  mobileProfileDetailText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
    lineHeight: 20,
  },
};

export default MobileProfileSection;
