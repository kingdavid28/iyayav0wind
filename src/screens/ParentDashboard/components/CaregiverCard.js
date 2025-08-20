import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Star, MapPin, Clock, MessageCircle, Calendar, CheckCircle } from 'lucide-react-native';
import { styles, colors, spacing, typography } from '../../styles/ParentDashboard.styles';

/**
 * CaregiverCard Component
 * Displays a card with caregiver information and action buttons.
 * 
 * @param {Object} props - Component props
 * @param {Object} props.caregiver - Caregiver data object
 * @param {Function} props.onBookPress - Callback when book button is pressed
 * @param {Function} props.onMessagePress - Callback when message button is pressed
 * @param {string} [props.testID] - Test ID for testing frameworks
 * @returns {JSX.Element} Rendered CaregiverCard component
 */
const CaregiverCard = ({ 
  caregiver, 
  onBookPress, 
  onMessagePress,
  testID 
}) => {
  const accessibilityLabel = `${caregiver.name}, ${caregiver.specialty}, ${caregiver.rating} star rating`;
  const bookButtonLabel = `Book ${caregiver.name} for a session`;
  const messageButtonLabel = `Message ${caregiver.name}`;
  
  return (
    <View 
      style={[styles.card, styles.shadowSm, { marginBottom: spacing.md }]}
      accessible={true}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="article"
      testID={testID}
    >
      <View style={[styles.flexRow, styles.itemsCenter, { marginBottom: spacing.sm }]}>
        <Image 
          source={{ uri: caregiver.avatar }} 
          style={[styles.avatarLg, { marginRight: spacing.md }]}
          accessibilityIgnoresInvertColors={true}
          accessible={false}
        />
        <View style={{ flex: 1 }}>
          <View style={[styles.flexRow, styles.itemsCenter, { marginBottom: spacing.xs }]}>
            <Text style={[typography.subtitle1, { marginRight: spacing.xs }]}>
              {caregiver.name}
            </Text>
            {caregiver.verified && <CheckCircle size={20} color={colors.success} />}
          </View>
          <View style={[styles.flexRow, styles.itemsCenter, { marginBottom: spacing.xxs }]}>
            <Star size={16} color={colors.warning} fill={colors.warning} />
            <Text style={[typography.caption, { color: colors.textSecondary, marginLeft: spacing.xxs }]}>
              {caregiver.rating} ({caregiver.reviewCount} reviews)
            </Text>
          </View>
          <View style={[styles.flexRow, styles.itemsCenter, { marginBottom: spacing.xxs }]}>
            <MapPin size={14} color={colors.textSecondary} />
            <Text style={[typography.caption, { color: colors.textSecondary, marginLeft: spacing.xxs }]}>
              {caregiver.location}
            </Text>
          </View>
          <View style={[styles.flexRow, styles.itemsCenter]}>
            <Clock size={14} color={colors.textSecondary} />
            <Text style={[typography.caption, { color: colors.textSecondary, marginLeft: spacing.xxs }]}>
              {caregiver.experience} years experience
            </Text>
          </View>
        </View>
      </View>
      
      {caregiver.specialties && caregiver.specialties.length > 0 && (
        <View style={[styles.flexRow, styles.flexWrap, { marginBottom: spacing.sm }]}>
          {caregiver.specialties.map((specialty, index) => (
            <View 
              key={index} 
              style={[
                styles.tag, 
                { 
                  backgroundColor: `${colors.primary}15`,
                  borderColor: colors.primary,
                  marginRight: spacing.xs,
                  marginBottom: spacing.xs
                }
              ]}
            >
              <Text style={[typography.caption, { color: colors.primary }]}>
                {specialty}
              </Text>
            </View>
          ))}
        </View>
      )}
      
      <View style={[styles.flexRow, styles.justifyBetween, styles.itemsCenter, { marginTop: spacing.sm }]}>
        <Text style={[typography.subtitle2, { color: colors.primary }]}>
          ${caregiver.hourlyRate}/hr
        </Text>
        <View style={styles.flexRow}>
          <TouchableOpacity 
            style={[styles.iconButton, { marginRight: spacing.sm }]}
            onPress={() => onMessagePress(caregiver)}
            accessibilityLabel={messageButtonLabel}
            accessibilityRole="button"
          >
            <MessageCircle size={20} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.button, { flexDirection: 'row', alignItems: 'center' }]}
            onPress={() => onBookPress(caregiver)}
            accessibilityLabel={bookButtonLabel}
            accessibilityRole="button"
          >
            <Calendar size={16} color={colors.white} style={{ marginRight: spacing.xs }} />
            <Text style={[typography.button, { color: colors.white }]}>
              Book Now
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default CaregiverCard;
