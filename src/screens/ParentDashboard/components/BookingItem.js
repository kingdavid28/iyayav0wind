// src/components/bookings/BookingItem.js
import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';

// Import with proper path - adjust based on your project structure
import { getProfileImageUrl } from '../../../utils/imageUtils';

const BookingItem = ({
  booking,
  user,
  onPress,
  onAccept,
  onDecline,
  onComplete,
  showActions = true
}) => {
  // Format date and time
  const formatDate = (dateString) => {
    try {
      if (!dateString) return 'No date';
      const date = new Date(dateString);
      return format(date, 'MMM d, yyyy h:mm a');
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  // Safe image URL getter with fallback
  const getSafeImageUrl = () => {
    try {
      const imageUrl = getProfileImageUrl(user);
      if (imageUrl) {
        return { uri: imageUrl };
      }
      // Return a simple placeholder object instead of calling getPlaceholderImage()
      return {
        uri: 'data:image/svg+xml;base64,' + btoa(`
          <svg width="56" height="56" viewBox="0 0 56 56" xmlns="http://www.w3.org/2000/svg">
            <rect width="56" height="56" fill="#F3F4F6" rx="28"/>
            <circle cx="28" cy="22" r="8" fill="#9CA3AF"/>
            <path d="M16 44 C16 38, 40 38, 40 44" fill="#9CA3AF"/>
          </svg>
        `)
      };
    } catch (error) {
      console.error(' Error getting profile image:', error);
      return {
        uri: 'data:image/svg+xml;base64,' + btoa(`
          <svg width="56" height="56" viewBox="0 0 56 56" xmlns="http://www.w3.org/2000/svg">
            <rect width="56" height="56" fill="#F3F4F6" rx="28"/>
            <circle cx="28" cy="22" r="8" fill="#9CA3AF"/>
            <path d="M16 44 C16 38, 40 38, 40 44" fill="#9CA3AF"/>
          </svg>
        `)
      };
    }
  };

  const imageSource = getSafeImageUrl();
  const isImageString = typeof imageSource === 'string';

  const renderStatusBadge = () => {
    if (!booking?.status) return null;

    const statusColors = {
      pending: '#F59E0B', // amber
      confirmed: '#10B981', // green
      completed: '#3B82F6', // blue
      cancelled: '#EF4444', // red
      declined: '#9CA3AF' // gray
    };

    return (
      <View style={[styles.statusBadge, { backgroundColor: statusColors[booking.status] || '#9CA3AF' }]}>
        <Text style={styles.statusText}>
          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
        </Text>
      </View>
    );
  };

  const renderActionButtons = () => {
    if (!showActions || booking.status !== 'pending') return null;

    return (
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.declineButton]}
          onPress={onDecline}
        >
          <Ionicons name="close" size={20} color="white" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.acceptButton]}
          onPress={onAccept}
        >
          <Ionicons name="checkmark" size={20} color="white" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.imageContainer}>
        {isImageString ? (
          <Image
            source={imageSource}
            style={styles.profileImage}
            onError={() => console.log(' Image failed to load')}
          />
        ) : (
          <Image
            source={imageSource}
            style={styles.profileImage}
          />
        )}
        {renderStatusBadge()}
      </View>

      <View style={styles.details}>
        <View style={styles.header}>
          <Text style={styles.name} numberOfLines={1}>
            {user?.displayName || user?.name || 'Unknown User'}
          </Text>
          {booking?.createdAt && (
            <Text style={styles.timeAgo}>
              {formatDate(booking.createdAt)}
            </Text>
          )}
        </View>

        {booking?.serviceName && (
          <Text style={styles.service} numberOfLines={1}>
            {booking.serviceName}
          </Text>
        )}

        {booking?.dateTime && (
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={16} color="#6B7280" />
            <Text style={styles.infoText}>
              {formatDate(booking.dateTime)}
            </Text>
          </View>
        )}

        {booking?.location && (
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={16} color="#6B7280" />
            <Text style={styles.infoText} numberOfLines={1}>
              {booking.location}
            </Text>
          </View>
        )}

        {booking?.notes && (
          <Text style={styles.notes} numberOfLines={2}>
            {booking.notes}
          </Text>
        )}
      </View>

      {renderActionButtons()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginVertical: 6,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  imageContainer: {
    position: 'relative',
    marginRight: 12,
  },
  profileImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F3F4F6',
  },
  statusBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  details: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    marginRight: 8,
  },
  timeAgo: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  service: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  infoText: {
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 6,
  },
  notes: {
    fontSize: 13,
    color: '#4B5563',
    marginTop: 6,
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    marginLeft: 8,
    alignItems: 'center',
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  acceptButton: {
    backgroundColor: '#10B981', // green
  },
  declineButton: {
    backgroundColor: '#EF4444', // red
  },
});

export default BookingItem;