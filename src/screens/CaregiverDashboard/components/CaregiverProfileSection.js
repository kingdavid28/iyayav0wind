import React from 'react';
import { View, Text, Platform, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ProfileImage from '../../../components/ui/feedback/ProfileImage';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../../contexts/AuthContext';
import { useNotifications } from '../../../contexts/NotificationContext';
import { calculateAge } from '../../../utils/dateUtils';
import { useNavigation } from '@react-navigation/native';
const CaregiverProfileSection = ({ profile, activeTab }) => {
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const navigation = useNavigation();
  
  const userAge = user?.birthDate ? calculateAge(user.birthDate) : null;
  const caregiverName = profile?.name || user?.name;
  const locationValue = typeof profile?.location === 'string' ? profile.location : undefined;
  const addressValue = profile?.address;
  const userAddressValue = user?.address;
  let formattedAddress = null;
  let formattedUserAddress = null;

  if (addressValue) {
    if (typeof addressValue === 'string') {
      formattedAddress = addressValue;
    } else if (typeof addressValue === 'object') {
      const { street, city, province, country } = addressValue;
      formattedAddress = [street, city, province, country].filter(Boolean).join(', ');
    }
  }

  if (!formattedAddress && userAddressValue) {
    if (typeof userAddressValue === 'string') {
      formattedUserAddress = userAddressValue;
    } else if (typeof userAddressValue === 'object') {
      const { street, city, province, country } = userAddressValue;
      formattedUserAddress = [street, city, province, country].filter(Boolean).join(', ');
    }
  }

  const displayedLocation = locationValue || formattedAddress || formattedUserAddress || 'Location not set';
  const displayName = caregiverName;

  const handleEditProfile = () => {
    navigation.navigate('EnhancedCaregiverProfileWizard', {
      isEdit: true,
      existingProfile: profile
    });
  };

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
          <TouchableOpacity
            style={styles.editButton}
            onPress={handleEditProfile}
          >
            <Ionicons name="pencil" size={16} color="#3b82f6" />
          </TouchableOpacity>
          {unreadCount > 0 && (
            <View style={styles.notificationPill}>
              <Ionicons name="notifications-outline" size={16} color="#fff" />
              <Text style={styles.notificationPillText}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
          <View style={styles.leftSection}>
            <ProfileImage
              imageUrl={profile?.imageUrl || profile?.profileImage || profile?.image || profile?.photoUrl || user?.profileImage || user?.avatar}
              size={80}
              style={styles.profileImageContainer}
              borderColor="#3b82f6"
              defaultIconSize={40}
            />
            <Text style={styles.welcomeText}>
              {displayName ? `Welcome back, ${displayName}! 👋` : 'Welcome back! 👋'}
            </Text>
            <View style={styles.profileDetails}>
              {userAge ? (
                <Text style={styles.profileDetailText}>🎂 {userAge} years old</Text>
              ) : null}
              <Text style={styles.profileDetailText}>📧 {user?.email || 'No email'}</Text>
              {user?.phone ? (
                <Text style={styles.profileDetailText}>📱 {user.phone}</Text>
              ) : null}
              <Text style={styles.profileDetailText}>📍 {displayedLocation}</Text>
              {typeof profile?.hourlyRate === 'number' ? (
                <Text style={styles.profileDetailText}>💰 ₱{profile.hourlyRate}/hr</Text>
              ) : null}
              {profile?.experience ? (
                <Text style={styles.profileDetailText}>
                  ⭐ {typeof profile.experience === 'object'
                    ? `${profile.experience.years || 0} years experience`
                    : profile.experience}
                </Text>
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
    alignItems: 'flex-start',
    position: 'relative',
  },
  notificationPill: {
    position: 'absolute',
    top: 0,
    left: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#3b82f6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  notificationPillText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  editButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1,
  },
  leftSection: {
    alignItems: 'center',
    flex: 1,
  },
  profileImageContainer: {
    marginBottom: 12,
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
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 12,
    lineHeight: 24,
    textAlign: 'center',
  },
  profileDetails: {
    gap: 4,
    alignItems: 'center',
  },
  profileDetailText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
    lineHeight: 20,
  },
};

export default CaregiverProfileSection;