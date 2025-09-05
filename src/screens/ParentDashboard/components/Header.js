import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { Image, Platform, Pressable, Text, View } from 'react-native';
import { User } from 'lucide-react-native';
import { styles } from '../../styles/ParentDashboard.styles';
// Privacy components temporarily disabled due to backend API not implemented
import { usePrivacy } from '../../../components/Privacy/PrivacyManager';
import PrivacyNotificationModal from '../../../components/Privacy/PrivacyNotificationModal';
import PrivacySettingsModal from '../../../components/Privacy/PrivacySettingsModal';
import { useMessaging } from '../../../contexts/MessagingContext';

const Header = ({ navigation, onProfilePress, onSignOut, greetingName, onProfileEdit, profileName, profileImage, profileContact, profileLocation }) => {
  // Use real privacy system
  const { pendingRequests, notifications } = usePrivacy();
  const { unreadCount } = useMessaging();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showPrivacySettings, setShowPrivacySettings] = useState(false);
  
  // Calculate real notification counts
  const unreadNotifications = notifications?.filter(n => !n.read)?.length || 0;
  const pendingRequestsCount = pendingRequests?.length || 0;
  
  // Handle image URI construction
  const getImageSource = () => {
    if (!profileImage || profileImage.trim() === '' || profileImage === 'null' || profileImage === 'undefined') {
      return null;
    }
    
    if (profileImage.startsWith('http')) {
      return { uri: profileImage };
    }
    
    const baseUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';
    return { uri: `${baseUrl}${profileImage}` };
  };
  
  const imageSource = getImageSource();
  
  return (
    <View style={headerStyles.parentLikeHeaderContainer}>
      <LinearGradient
        colors={["#ebc5dd", "#ccc8e8"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={headerStyles.parentLikeHeaderGradient}
      >
        <View style={styles.headerTop}>
          <View style={[styles.logoContainer, { flexDirection: 'column', alignItems: 'center' }]}>
            <Image 
              source={require('../../../../assets/icon.png')} 
              style={[styles.logoImage, { marginBottom: 6 }]} 
            />
            
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>I am a Parent</Text>
            </View>
          </View>
          
          {/* Center Profile Section with Welcome and Info - Web Only */}
          {Platform.OS === 'web' && (
            <View style={headerStyles.profileSection}>
              <View style={headerStyles.welcomeRow}>
                <View style={headerStyles.profileImageContainer}>
                  {imageSource ? (
                    <Image 
                      source={imageSource}
                      style={headerStyles.profileImage}
                      onError={(error) => console.log('Image load error:', error)}
                      resizeMode="cover"
                      defaultSource={Platform.OS === 'ios' ? 
                        require('../../../../assets/icon.png') : 
                        { uri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==' }
                      }
                    />
                  ) : (
                    <View style={headerStyles.defaultProfileImage}>
                      <User size={30} color="#db2777" />
                    </View>
                  )}
                </View>
                <Text style={headerStyles.welcomeText}>
                  {greetingName ? `Welcome back, ${greetingName}! 👋` : 'Welcome back! 👋'}
                </Text>
              </View>
              <View style={headerStyles.profileDetails}>
                <Text style={headerStyles.profileDetailText}>📧 {profileContact || 'No email'}</Text>
                <Text style={headerStyles.profileDetailText}>📍 {profileLocation || 'Location not set'}</Text>
              </View>
            </View>
          )}
          
          {/* Header Actions */}
          <View style={styles.headerActions}>
            <Pressable 
              style={[headerStyles.headerButton, { position: 'relative' }]} 
              onPress={() => navigation?.navigate('Messages')}
            >
              <Ionicons name="chatbubble-ellipses-outline" size={22} color="#db2777" />
              {unreadCount > 0 && (
                <View style={headerStyles.notificationBadge}>
                  <Text style={headerStyles.notificationBadgeText}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              )}
            </Pressable>
            
            <Pressable 
              style={[headerStyles.headerButton, { position: 'relative' }]} 
              onPress={() => setShowNotifications(true)}
            >
              <Ionicons name="notifications-outline" size={22} color="#db2777" />
              {(unreadNotifications > 0 || pendingRequestsCount > 0) && (
                <View style={headerStyles.notificationBadge}>
                  <Text style={headerStyles.notificationBadgeText}>
                    {unreadNotifications + pendingRequestsCount > 99 ? 
                      '99+' : 
                      unreadNotifications + pendingRequestsCount
                    }
                  </Text>
                </View>
              )}
            </Pressable>
            
            <Pressable 
              style={headerStyles.headerButton}
              onPress={() => setShowPrivacySettings(true)}
            >
              <Ionicons name="shield-outline" size={22} color="#db2777" />
            </Pressable>
            
            <Pressable 
              style={headerStyles.headerButton}
              onPress={onProfileEdit}
            >
              <Ionicons name="person-outline" size={22} color="#db2777" />
            </Pressable>
            
            <Pressable 
              style={headerStyles.headerButton}
              onPress={onSignOut}
            >
              <Ionicons name="log-out-outline" size={22} color="#db2777" />
            </Pressable>
          </View>
        </View>
      </LinearGradient>
      
      <PrivacyNotificationModal
        visible={showNotifications}
        onClose={() => setShowNotifications(false)}
        requests={pendingRequests}
      />
      
      <PrivacySettingsModal
        visible={showPrivacySettings}
        onClose={() => setShowPrivacySettings(false)}
      />
    </View>
  );
};

const headerStyles = {
  parentLikeHeaderContainer: {
    backgroundColor: 'transparent',
  },
  parentLikeHeaderGradient: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  headerButton: {
    padding: 8,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  profileSection: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Platform.select({
      web: 12,
      default: 16,
    }),
  },
  welcomeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Platform.select({
      web: 4,
      default: 8,
    }),
  },
  profileImageContainer: {
    marginRight: 8,
  },
  profileImage: {
    width: Platform.select({
      web: 54,
      default: 64,
    }),
    height: Platform.select({
      web: 54,
      default: 64,
    }),
    borderRadius: Platform.select({
      web: 27,
      default: 32,
    }),
    borderWidth: Platform.select({
      web: 2,
      default: 3,
    }),
    borderColor: '#db2777',
  },
  defaultProfileImage: {
    width: Platform.select({
      web: 54,
      default: 64,
    }),
    height: Platform.select({
      web: 54,
      default: 64,
    }),
    borderRadius: Platform.select({
      web: 27,
      default: 32,
    }),
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: Platform.select({
      web: 2,
      default: 3,
    }),
    borderColor: '#db2777',
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeText: {
    fontSize: Platform.select({
      web: 21,
      default: 24,
    }),
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: Platform.select({
      web: 0,
      default: 4,
    }),
  },
  profileDetails: {
    alignItems: 'center',
  },
  profileDetailText: {
    fontSize: Platform.select({
      web: 11,
      default: 13,
    }),
    fontWeight: '400',
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: Platform.select({
      web: 2,
      default: 4,
    }),
  },

  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  notificationBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
};

export default Header;