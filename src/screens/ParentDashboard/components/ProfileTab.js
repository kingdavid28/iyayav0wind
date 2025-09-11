import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { User, Edit2, Settings, Shield, Bell, LogOut, Phone, Mail, MapPin, Calendar } from 'lucide-react-native';
import { useAuth } from '../../../contexts/AuthContext';
import { calculateAge } from '../../../utils/dateUtils';
import { styles } from '../../styles/ParentDashboard.styles';

const ProfileTab = ({ 
  navigation, 
  onProfileEdit, 
  onSignOut, 
  profileName, 
  profileContact, 
  profileLocation,
  greetingName 
}) => {
  const { user } = useAuth();
  const userAge = user?.birthDate ? calculateAge(user.birthDate) : null;
  const profileSections = [
    {
      title: 'Personal Information',
      items: [
        {
          icon: User,
          label: 'Full Name',
          value: profileName || 'Not set',
          action: () => onProfileEdit?.()
        },
        {
          icon: Calendar,
          label: 'Age',
          value: userAge ? `${userAge} years old` : 'Not set',
          action: () => onProfileEdit?.()
        },
        {
          icon: Phone,
          label: 'Phone Number',
          value: user?.phone || 'Not set',
          action: () => onProfileEdit?.()
        },
        {
          icon: Mail,
          label: 'Email',
          value: user?.email || profileContact || 'Not set',
          action: () => onProfileEdit?.()
        },
        {
          icon: MapPin,
          label: 'Location',
          value: profileLocation || 'Not set',
          action: () => onProfileEdit?.()
        }
      ]
    },
    {
      title: 'Account Settings',
      items: [
        {
          icon: Edit2,
          label: 'Edit Profile',
          value: 'Update your information',
          action: () => onProfileEdit?.()
        },
        {
          icon: Bell,
          label: 'Notifications',
          value: 'Manage notification preferences',
          action: () => navigation?.navigate('NotificationSettings')
        },
        {
          icon: Shield,
          label: 'Privacy Settings',
          value: 'Control your data sharing',
          action: () => navigation?.navigate('PrivacySettings')
        },
        {
          icon: Settings,
          label: 'App Settings',
          value: 'General app preferences',
          action: () => navigation?.navigate('AppSettings')
        }
      ]
    }
  ];

  const renderProfileItem = (item, index) => (
    <TouchableOpacity
      key={index}
      style={profileStyles.profileItem}
      onPress={item.action}
    >
      <View style={profileStyles.itemIcon}>
        <item.icon size={20} color="#db2777" />
      </View>
      
      <View style={profileStyles.itemContent}>
        <Text style={profileStyles.itemLabel}>{item.label}</Text>
        <Text style={profileStyles.itemValue}>{item.value}</Text>
      </View>
      
      <View style={profileStyles.itemArrow}>
        <Text style={profileStyles.arrowText}>›</Text>
      </View>
    </TouchableOpacity>
  );

  const renderSection = (section, sectionIndex) => (
    <View key={sectionIndex} style={profileStyles.section}>
      <Text style={profileStyles.sectionTitle}>{section.title}</Text>
      <View style={profileStyles.sectionContent}>
        {section.items.map(renderProfileItem)}
      </View>
    </View>
  );

  return (
    <View style={styles.dashboardContent}>
      <View style={profileStyles.header}>
        <Text style={profileStyles.title}>Profile</Text>
        <Text style={profileStyles.subtitle}>
          Manage your account and preferences
        </Text>
      </View>

      <ScrollView 
        style={profileStyles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Summary Card */}
        <View style={profileStyles.summaryCard}>
          <View style={profileStyles.avatarContainer}>
            <View style={profileStyles.avatar}>
              <User size={40} color="#db2777" />
            </View>
          </View>
          
          <View style={profileStyles.summaryInfo}>
            <Text style={profileStyles.summaryName}>
              {greetingName || profileName || 'Parent User'}
            </Text>
            {userAge && (
              <Text style={profileStyles.summaryAge}>
                🎂 {userAge} years old
              </Text>
            )}
            <Text style={profileStyles.summaryEmail}>
              📧 {user?.email || profileContact || 'No email set'}
            </Text>
            {user?.phone && (
              <Text style={profileStyles.summaryPhone}>
                📱 {user.phone}
              </Text>
            )}
            <Text style={profileStyles.summaryLocation}>
              📍 {profileLocation || 'Location not set'}
            </Text>
          </View>
          
          <TouchableOpacity 
            style={profileStyles.editButton}
            onPress={onProfileEdit}
          >
            <Edit2 size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Profile Sections */}
        {profileSections.map(renderSection)}

        {/* Sign Out Button */}
        <TouchableOpacity 
          style={profileStyles.signOutButton}
          onPress={onSignOut}
        >
          <LogOut size={20} color="#ef4444" />
          <Text style={profileStyles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const profileStyles = {
  header: {
    marginBottom: Platform.select({
      web: 24,
      default: 32,
    }),
  },
  title: {
    fontSize: Platform.select({
      web: 28,
      default: 32,
    }),
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: Platform.select({
      web: 4,
      default: 8,
    }),
  },
  subtitle: {
    fontSize: Platform.select({
      web: 16,
      default: 18,
    }),
    color: '#6b7280',
  },
  content: {
    flex: 1,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: Platform.select({
      web: 16,
      default: 20,
    }),
    padding: Platform.select({
      web: 20,
      default: 24,
    }),
    marginBottom: Platform.select({
      web: 20,
      default: 24,
    }),
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: Platform.select({
        web: 2,
        default: 4,
      }),
    },
    shadowOpacity: Platform.select({
      web: 0.1,
      default: 0.15,
    }),
    shadowRadius: Platform.select({
      web: 4,
      default: 8,
    }),
    elevation: Platform.select({
      web: 2,
      default: 6,
    }),
  },
  avatarContainer: {
    marginRight: Platform.select({
      web: 16,
      default: 20,
    }),
  },
  avatar: {
    width: Platform.select({
      web: 64,
      default: 80,
    }),
    height: Platform.select({
      web: 64,
      default: 80,
    }),
    borderRadius: Platform.select({
      web: 32,
      default: 40,
    }),
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#db2777',
  },
  summaryInfo: {
    flex: 1,
  },
  summaryName: {
    fontSize: Platform.select({
      web: 20,
      default: 24,
    }),
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: Platform.select({
      web: 4,
      default: 6,
    }),
  },
  summaryAge: {
    fontSize: Platform.select({
      web: 14,
      default: 16,
    }),
    color: '#6b7280',
    marginBottom: Platform.select({
      web: 2,
      default: 4,
    }),
  },
  summaryEmail: {
    fontSize: Platform.select({
      web: 14,
      default: 16,
    }),
    color: '#6b7280',
    marginBottom: Platform.select({
      web: 2,
      default: 4,
    }),
  },
  summaryPhone: {
    fontSize: Platform.select({
      web: 14,
      default: 16,
    }),
    color: '#6b7280',
    marginBottom: Platform.select({
      web: 2,
      default: 4,
    }),
  },
  summaryLocation: {
    fontSize: Platform.select({
      web: 14,
      default: 16,
    }),
    color: '#6b7280',
  },
  editButton: {
    backgroundColor: '#db2777',
    width: Platform.select({
      web: 40,
      default: 48,
    }),
    height: Platform.select({
      web: 40,
      default: 48,
    }),
    borderRadius: Platform.select({
      web: 20,
      default: 24,
    }),
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    marginBottom: Platform.select({
      web: 24,
      default: 32,
    }),
  },
  sectionTitle: {
    fontSize: Platform.select({
      web: 18,
      default: 20,
    }),
    fontWeight: '600',
    color: '#374151',
    marginBottom: Platform.select({
      web: 12,
      default: 16,
    }),
  },
  sectionContent: {
    backgroundColor: '#fff',
    borderRadius: Platform.select({
      web: 12,
      default: 16,
    }),
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: Platform.select({
        web: 1,
        default: 2,
      }),
    },
    shadowOpacity: Platform.select({
      web: 0.05,
      default: 0.1,
    }),
    shadowRadius: Platform.select({
      web: 2,
      default: 4,
    }),
    elevation: Platform.select({
      web: 1,
      default: 3,
    }),
  },
  profileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Platform.select({
      web: 16,
      default: 20,
    }),
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  itemIcon: {
    width: Platform.select({
      web: 40,
      default: 48,
    }),
    height: Platform.select({
      web: 40,
      default: 48,
    }),
    borderRadius: Platform.select({
      web: 20,
      default: 24,
    }),
    backgroundColor: '#fef7ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Platform.select({
      web: 12,
      default: 16,
    }),
  },
  itemContent: {
    flex: 1,
  },
  itemLabel: {
    fontSize: Platform.select({
      web: 16,
      default: 18,
    }),
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  itemValue: {
    fontSize: Platform.select({
      web: 14,
      default: 16,
    }),
    color: '#6b7280',
  },
  itemArrow: {
    marginLeft: Platform.select({
      web: 8,
      default: 12,
    }),
  },
  arrowText: {
    fontSize: Platform.select({
      web: 20,
      default: 24,
    }),
    color: '#d1d5db',
    fontWeight: '300',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: Platform.select({
      web: 12,
      default: 16,
    }),
    padding: Platform.select({
      web: 16,
      default: 20,
    }),
    marginTop: Platform.select({
      web: 20,
      default: 24,
    }),
    marginBottom: Platform.select({
      web: 20,
      default: 40,
    }),
    borderWidth: 1,
    borderColor: '#fecaca',
    gap: Platform.select({
      web: 8,
      default: 12,
    }),
  },
  signOutText: {
    fontSize: Platform.select({
      web: 16,
      default: 18,
    }),
    fontWeight: '600',
    color: '#ef4444',
  },
};

export default ProfileTab;
