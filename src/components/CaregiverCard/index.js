import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Card } from 'react-native-paper';
import { 
  Star, 
  MapPin, 
  MessageCircle, 
  Clock, 
  CheckCircle
} from "lucide-react-native";
import PropTypes from "prop-types";

import { API_CONFIG } from '../../config/constants';
import { getCaregiverDisplayName } from '../../utils/caregiverUtils';
import { baseStyles, colors, dimensions } from '../../utils/commonStyles';

/**
 * Consolidated CaregiverCard Component
 * Displays a card with caregiver information and action buttons.
 * Supports both nanny and caregiver data formats for backward compatibility.
 */
const CaregiverCard = ({ 
  caregiver = {}, 
  nanny = {}, // Legacy prop for backward compatibility
  onPress, 
  onViewProfile, // Legacy prop for backward compatibility
  onMessage,
  onMessagePress, // Legacy prop for backward compatibility
  variant = 'default', // 'default', 'compact', 'detailed'
  testID 
}) => {
  // Merge caregiver and nanny props for backward compatibility
  const data = { ...nanny, ...caregiver };
  
  // State for image loading
  const [imageError, setImageError] = useState(false);

  // Get display name using centralized utility
  const displayName = getCaregiverDisplayName(data);
  
  // Format rating
  const formattedRating = data.rating ? data.rating.toFixed(1) : '4.8';
  
  // Handle experience (could be number or object)
  const experience = typeof data?.experience === 'number' 
    ? data.experience 
    : (data?.experience?.years || 0);

  // Normalize image URL
  const imageUri = useMemo(() => {
    try {
      const raw = data?.image || data?.avatar || data?.profileImage || '';
      if (!raw) return '';
      if (/^(https?:)?\//i.test(raw) || raw.startsWith('data:')) return raw;
      const host = (API_CONFIG?.BASE_URL || '').replace(/\/?api$/i, '');
      return `${host}${raw.startsWith('/') ? '' : '/'}${raw}`;
    } catch (_) {
      return data?.image || '';
    }
  }, [data?.image, data?.avatar, data?.profileImage]);

  // Get location string
  const getLocationString = (location) => {
    if (!location) return null;
    if (typeof location === "string") return location;
    if (location.formattedAddress) return location.formattedAddress;
    if (location.street && location.city) return `${location.street}, ${location.city}`;
    if (location.street) return location.street;
    if (location.city) return location.city;
    if (location.coordinates) {
      const [lat, lng] = location.coordinates;
      return `${lat?.toFixed(4)}, ${lng?.toFixed(4)}`;
    }
    return null;
  };

  const locationString = getLocationString(data.location);

  // Handle press events (support both legacy and new prop names)
  const handlePress = () => {
    if (onPress) onPress(data);
    if (onViewProfile) onViewProfile(data);
  };

  const handleMessagePress = () => {
    if (onMessage) onMessage(data);
    if (onMessagePress) onMessagePress(data);
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const renderAvatar = () => (
    <View style={styles.avatarContainer}>
      {imageUri && !imageError ? (
        <Image 
          source={{ uri: imageUri }} 
          style={styles.avatarImage}
          onError={handleImageError}
          onLoad={() => {}}
        />
      ) : (
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarText}>
            {displayName.split(' ').map(n => n[0]).join('').toUpperCase()}
          </Text>
        </View>
      )}
    </View>
  );

  const renderRating = () => (
    <View style={styles.ratingContainer}>
      <Star size={16} color={colors.warning} fill={colors.warning} />
      <Text style={styles.ratingText}>{formattedRating}</Text>
    </View>
  );

  const renderExperience = () => (
    experience > 0 && (
      <View style={styles.experienceContainer}>
        <Clock size={16} color={colors.textSecondary} />
        <Text style={styles.experienceText}>
          {experience} year{experience !== 1 ? 's' : ''}
        </Text>
      </View>
    )
  );

  const renderLocation = () => (
    locationString && (
      <View style={styles.locationContainer}>
        <MapPin size={16} color={colors.textSecondary} />
        <Text style={styles.locationText} numberOfLines={1}>
          {locationString}
        </Text>
      </View>
    )
  );

  const renderVerificationBadge = () => (
    data.verified && (
      <View style={styles.verificationBadge}>
        <CheckCircle size={16} color={colors.success} />
        <Text style={styles.verificationText}>Verified</Text>
      </View>
    )
  );

  const renderActions = () => (
    <View style={styles.actionsContainer}>
      {handleMessagePress && (
        <TouchableOpacity 
          style={styles.messageButton} 
          onPress={handleMessagePress}
          accessibilityLabel={`Message ${displayName}`}
        >
          <MessageCircle size={20} color={colors.primary} />
        </TouchableOpacity>
      )}
    </View>
  );

  if (variant === 'compact') {
    return (
      <TouchableOpacity 
        style={styles.compactCard} 
        onPress={handlePress}
        testID={testID}
        accessibilityLabel={`View ${displayName}'s profile`}
      >
        {renderAvatar()}
        <View style={styles.compactContent}>
          <Text style={styles.compactName} numberOfLines={1}>{displayName}</Text>
          {renderRating()}
        </View>
        {renderActions()}
      </TouchableOpacity>
    );
  }

  return (
    <Card style={styles.card} testID={testID}>
      <TouchableOpacity onPress={handlePress} accessibilityLabel={`View ${displayName}'s profile`}>
        <Card.Content style={styles.cardContent}>
          <View style={styles.header}>
            {renderAvatar()}
            <View style={styles.headerContent}>
              <Text style={styles.name} numberOfLines={2}>{displayName}</Text>
              <View style={styles.metaContainer}>
                {renderRating()}
                {renderExperience()}
              </View>
              {renderLocation()}
              {renderVerificationBadge()}
            </View>
            {renderActions()}
          </View>
          
          {variant === 'detailed' && data.bio && (
            <View style={styles.bioContainer}>
              <Text style={styles.bioText} numberOfLines={3}>
                {data.bio}
              </Text>
            </View>
          )}
          
          {variant === 'detailed' && data.specialties && data.specialties.length > 0 && (
            <View style={styles.specialtiesContainer}>
              {data.specialties.slice(0, 3).map((specialty, index) => (
                <View key={index} style={styles.specialtyTag}>
                  <Text style={styles.specialtyText}>{specialty}</Text>
                </View>
              ))}
            </View>
          )}
        </Card.Content>
      </TouchableOpacity>
    </Card>
  );
};

CaregiverCard.propTypes = {
  caregiver: PropTypes.object,
  nanny: PropTypes.object, // Legacy support
  onPress: PropTypes.func,
  onViewProfile: PropTypes.func, // Legacy support
  onMessage: PropTypes.func,
  onMessagePress: PropTypes.func, // Legacy support
  variant: PropTypes.oneOf(['default', 'compact', 'detailed']),
  testID: PropTypes.string,
};

const styles = StyleSheet.create({
  // Card styles
  card: {
    ...baseStyles.card,
    marginHorizontal: dimensions.margin.sm,
  },
  
  compactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: dimensions.borderRadius.md,
    padding: dimensions.padding.md,
    marginBottom: dimensions.margin.sm,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  
  cardContent: {
    padding: dimensions.padding.md,
  },
  
  compactContent: {
    flex: 1,
    marginLeft: dimensions.margin.md,
  },
  
  // Header styles
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  
  headerContent: {
    flex: 1,
    marginLeft: dimensions.margin.md,
  },
  
  // Avatar styles
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
  },
  
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
  },
  
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 30,
  },
  
  avatarText: {
    color: colors.white,
    fontSize: dimensions.fontSize.lg,
    fontWeight: 'bold',
  },
  
  // Text styles
  name: {
    ...baseStyles.subtitle,
    marginBottom: dimensions.margin.xs,
  },
  
  compactName: {
    fontSize: dimensions.fontSize.md,
    fontWeight: '600',
    color: colors.text,
    marginBottom: dimensions.margin.xs,
  },
  
  // Meta information
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: dimensions.margin.xs,
  },
  
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: dimensions.margin.md,
  },
  
  ratingText: {
    fontSize: dimensions.fontSize.sm,
    color: colors.text,
    marginLeft: dimensions.margin.xs,
    fontWeight: '600',
  },
  
  experienceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  experienceText: {
    fontSize: dimensions.fontSize.sm,
    color: colors.textSecondary,
    marginLeft: dimensions.margin.xs,
  },
  
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: dimensions.margin.xs,
  },
  
  locationText: {
    fontSize: dimensions.fontSize.sm,
    color: colors.textSecondary,
    marginLeft: dimensions.margin.xs,
    flex: 1,
  },
  
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success + '20',
    paddingHorizontal: dimensions.padding.sm,
    paddingVertical: dimensions.padding.xs,
    borderRadius: dimensions.borderRadius.sm,
    alignSelf: 'flex-start',
  },
  
  verificationText: {
    fontSize: dimensions.fontSize.xs,
    color: colors.success,
    marginLeft: dimensions.margin.xs,
    fontWeight: '600',
  },
  
  // Actions
  actionsContainer: {
    alignItems: 'center',
  },
  
  messageButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Detailed variant styles
  bioContainer: {
    marginTop: dimensions.margin.md,
    paddingTop: dimensions.padding.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  
  bioText: {
    fontSize: dimensions.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  
  specialtiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: dimensions.margin.md,
  },
  
  specialtyTag: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: dimensions.padding.sm,
    paddingVertical: dimensions.padding.xs,
    borderRadius: dimensions.borderRadius.sm,
    marginRight: dimensions.margin.sm,
    marginBottom: dimensions.margin.xs,
  },
  
  specialtyText: {
    fontSize: dimensions.fontSize.xs,
    color: colors.primary,
    fontWeight: '600',
  },
});

export default CaregiverCard;
