import React from 'react';
import { View, Text, Image, Platform } from 'react-native';
import { User } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getCurrentSocketURL } from '../../../config/api';
import { useAuth } from '../../../contexts/AuthContext';
import { calculateAge } from '../../../utils/dateUtils';

const CaregiverProfileSection = ({ profile, activeTab }) => {
  const { user } = useAuth();
  
  const userAge = user?.birthDate ? calculateAge(user.birthDate) : null;
  const caregiverName = profile?.name || user?.name;
  const displayName = caregiverName;

  // Handle image URI construction
  const getImageSource = () => {
    const profileImage = profile?.imageUrl;
    
    if (!profileImage || profileImage.trim() === '' || profileImage === 'null' || profileImage === 'undefined') {
      return null;
    }
    
    if (profileImage.startsWith('http')) {
      return { uri: profileImage };
    }
    
    // Use dynamic API URL
    const baseUrl = getCurrentSocketURL();
    const fullUrl = `${baseUrl}${profileImage}`;
    return { uri: fullUrl };
  };
  
  const imageSource = getImageSource();

  // Only render on mobile platforms and Dashboard tab
  if (Platform.OS === 'web' || activeTab !== 'dashboard') {
    return null;
  }

  return (
    <View style={styles.profileContainer}>
      <LinearGradient
        colors={["#f8fafc", "#f1f5f9"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.profileCard}
      >
        <View style={styles.profileContent}>
          <View style={styles.profileImageContainer}>
            {imageSource ? (
              <Image 
                source={imageSource}
                style={styles.profileImage}
                onError={(error) => console.log('Image load error:', error)}
                resizeMode="cover"
                defaultSource={Platform.OS === 'ios' ? 
                  require('../../../../assets/icon.png') : 
                  { uri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==' }
                }
              />
            ) : (
              <View style={styles.defaultProfileImage}>
                <User size={40} color="#3b82f6" />
              </View>
            )}
          </View>
          
          <View style={styles.profileInfo}>
            <Text style={styles.welcomeText}>
              {displayName ? `Welcome back, ${displayName}! 👋` : 'Welcome back! 👋'}
            </Text>
            <View style={styles.profileDetails}>
              {userAge && (
                <Text style={styles.profileDetailText}>🎂 {userAge} years old</Text>
              )}
              <Text style={styles.profileDetailText}>📧 {user?.email || 'No email'}</Text>
              {user?.phone && (
                <Text style={styles.profileDetailText}>📱 {user.phone}</Text>
              )}
              <Text style={styles.profileDetailText}>📍 {profile?.location || user?.address?.street || 'Location not set'}</Text>
              {profile?.hourlyRate && (
                <Text style={styles.profileDetailText}>💰 ₱{profile.hourlyRate}/hr</Text>
              )}
              {profile?.experience && (
                <Text style={styles.profileDetailText}>⭐ {profile.experience}</Text>
              )}
            </View>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = {
  profileContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'transparent',
  },
  profileCard: {
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  profileContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImageContainer: {
    marginRight: 16,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#3b82f6',
  },
  defaultProfileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 3,
    borderColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
    lineHeight: 28,
  },
  profileDetails: {
    gap: 4,
  },
  profileDetailText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
    lineHeight: 20,
  },
};

export default CaregiverProfileSection;