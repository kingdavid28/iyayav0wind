import React from 'react';
import { View, Text, Image, Platform } from 'react-native';
import { User } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getCurrentSocketURL } from '../../../config/api';
import { useAuth } from '../../../core/contexts/AuthContext';
import { calculateAge } from '../../../utils/dateUtils';
import { __DEV__ } from '../../../config/constants';

const CaregiverProfileSection = ({ profile, activeTab }) => {
  const { user } = useAuth();
  
  const userAge = user?.birthDate ? calculateAge(user.birthDate) : null;
  const caregiverName = profile?.name || user?.name;
  const displayName = caregiverName;

  // Handle image URI construction with better debugging
  const getImageSource = () => {
    const profileImage = profile?.imageUrl || profile?.profileImage || profile?.image || profile?.photoUrl;
    
    console.log('🖼️ CaregiverProfileSection - Profile image debug:');
    console.log('- Raw profile object:', profile);
    console.log('- Profile imageUrl:', profile?.imageUrl);
    console.log('- Profile profileImage:', profile?.profileImage);
    console.log('- Selected image:', profileImage);
    
    if (!profileImage || profileImage.trim() === '' || profileImage === 'null' || profileImage === 'undefined') {
      console.log('❌ No valid image URL found');
      return null;
    }
    
    let finalUrl;
    if (profileImage.startsWith('http')) {
      finalUrl = profileImage;
    } else {
      // Use dynamic API URL
      const baseUrl = getCurrentSocketURL();
      if (profileImage.startsWith('/')) {
        finalUrl = `${baseUrl}${profileImage}`;
      } else {
        finalUrl = `${baseUrl}/uploads/${profileImage}`;
      }
    }
    
    // Add cache busting parameter
    const timestamp = Date.now();
    finalUrl = finalUrl.includes('?') ? `${finalUrl}&t=${timestamp}` : `${finalUrl}?t=${timestamp}`;
    
    console.log('✅ Final image URL:', finalUrl);
    return { uri: finalUrl };
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
                onError={(error) => {
                  console.log('❌ Image load error:', error.nativeEvent?.error || error);
                  console.log('❌ Failed URL:', imageSource.uri);
                }}
                onLoad={() => {
                  console.log('✅ Image loaded successfully:', imageSource.uri);
                }}
                onLoadStart={() => {
                  console.log('🔄 Image loading started:', imageSource.uri);
                }}
                resizeMode="cover"
                defaultSource={Platform.OS === 'ios' ? 
                  require('../../../../assets/icon.png') : 
                  undefined
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
            {/* Debug info - remove in production */}
            {__DEV__ && (
              <Text style={{ fontSize: 10, color: '#666', marginTop: 4 }}>
                Debug: {profile?.imageUrl ? 'Has image URL' : 'No image URL'}
              </Text>
            )}
            <View style={styles.profileDetails}>
              {userAge ? (
                <Text style={styles.profileDetailText}>🎂 {userAge} years old</Text>
              ) : null}
              <Text style={styles.profileDetailText}>📧 {user?.email || 'No email'}</Text>
              {user?.phone ? (
                <Text style={styles.profileDetailText}>📱 {user.phone}</Text>
              ) : null}
              <Text style={styles.profileDetailText}>📍 {profile?.location || user?.address?.street || 'Location not set'}</Text>
              {profile?.hourlyRate ? (
                <Text style={styles.profileDetailText}>💰 ₱{profile.hourlyRate}/hr</Text>
              ) : null}
              {profile?.experience ? (
                <Text style={styles.profileDetailText}>⭐ {profile.experience}</Text>
              ) : null}
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