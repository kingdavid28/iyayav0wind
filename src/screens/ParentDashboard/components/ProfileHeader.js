import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MapPin } from 'lucide-react-native';
import { styles, colors } from '../../styles/ParentDashboard.styles';

const ProfileHeader = ({ profileName, profileContact, profileLocation, bookingsCount, childrenCount, onEditProfile }) => {
  const getInitials = (name) => {
    if (!name) return 'P';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const stats = [
    { value: bookingsCount, label: 'Total Bookings' },
    { value: childrenCount, label: 'Children' },
    { value: '4.8', label: 'Rating' },
  ];

  return (
    <>
      <View style={styles.profileHeader}>
        <View style={styles.profileAvatar}>
          <Text style={styles.profileAvatarText}>
            {getInitials(profileName)}
          </Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName} numberOfLines={1}>
            {profileName || 'Your Name'}
          </Text>
          {profileContact ? (
            <Text style={styles.profileContact} numberOfLines={1}>
              {profileContact}
            </Text>
          ) : null}
          {profileLocation ? (
            <View style={styles.profileLocation}>
              <MapPin size={14} color={colors.textTertiary} />
              <Text style={{ marginLeft: 4 }} numberOfLines={1}>
                {profileLocation}
              </Text>
            </View>
          ) : null}
        </View>
        <TouchableOpacity
          style={styles.editProfileButton}
          onPress={onEditProfile}
        >
          <Text style={{ color: colors.primary, fontWeight: '600' }}>Edit</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.profileStats}>
        {stats.map((stat, index) => (
          <View key={index} style={styles.statItem}>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>
    </>
  );
};

export default ProfileHeader;