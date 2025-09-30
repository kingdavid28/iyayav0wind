import React from 'react';
import { View, Text, ScrollView, Pressable, Linking, Alert, Platform, StyleSheet, Dimensions } from 'react-native';
import { Calendar, Clock, DollarSign, MapPin, Phone, Mail, MessageCircle, Navigation, Star, Baby, AlertCircle, CheckCircle, X } from 'lucide-react-native';
import PropTypes from 'prop-types';
import { colors, spacing, typography } from '../../../screens/styles/ParentDashboard.styles';

const { height: screenHeight } = Dimensions.get('window');

// Simple i18n helper - replace with proper i18n library in production
const t = (key) => {
  const translations = {
    'booking.details': 'Booking Details',
    'booking.overview': 'Booking Overview',
    'booking.date': 'Date',
    'booking.time': 'Time',
    'booking.rate': 'Rate',
    'booking.total': 'Total',
    'location.contact': 'Location & Contact',
    'contact.phone': 'Phone',
    'contact.email': 'Email',
    'contact.hidden': 'Contact info hidden for privacy',
    'children.details': 'Children Details',
    'children.age': 'Age',
    'children.preferences': 'Preferences',
    'children.instructions': 'Special Instructions',
    'children.allergies': 'Allergies',
    'requirements': 'Requirements',
    'notes.special': 'Special Notes',
    'emergency.contact': 'Emergency Contact',
    'emergency.name': 'Name',
    'emergency.relation': 'Relation',
    'emergency.phone': 'Phone',
    'actions.message': 'Message',
    'actions.directions': 'Directions',
    'actions.complete': 'Complete',
    'actions.cancel': 'Cancel',
    'alerts.completed': 'Booking Completed',
    'alerts.completed.message': 'The booking has been marked as complete',
    'alerts.cancelled': 'Booking Cancelled',
    'alerts.cancelled.message': 'The booking has been cancelled'
  };
  return translations[key] || key;
};

/**
 * BookingDetailsModal displays detailed information about a booking, including children, contact, and actions.
 * Accessibility labels and roles are provided for all interactive elements.
 *
 * @param {Object} props
 * @param {boolean} props.visible - Whether the modal is visible
 * @param {Object} props.booking - Booking details object
 * @param {Function} props.onClose - Called when the modal is closed
 * @param {Function} props.onMessage - Called when the message button is pressed
 * @param {Function} props.onGetDirections - Called when the directions button is pressed
 * @param {Function} props.onCompleteBooking - Called to mark booking as complete
 * @param {Function} props.onCancelBooking - Called to cancel booking
 */
export function BookingDetailsModal({
  visible,
  booking,
  onClose,
  onMessage,
  onGetDirections,
  onCompleteBooking,
  onCancelBooking
}) {
  if (!visible || !booking) return null;

  const statusStyles = {
    confirmed: { backgroundColor: '#DCFCE7', borderColor: '#A7F3D0', color: '#166534' },
    pending: { backgroundColor: '#FEF3C7', borderColor: '#FDE68A', color: '#B45309' },
    pending_confirmation: { backgroundColor: '#FEF3C7', borderColor: '#FDE68A', color: '#B45309' },
    completed: { backgroundColor: '#DBEAFE', borderColor: '#BFDBFE', color: '#1D4ED8' },
    cancelled: { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5', color: '#B91C1C' },
    in_progress: { backgroundColor: '#E0F2FE', borderColor: '#BAE6FD', color: '#0C4A6E' },
    default: { backgroundColor: '#E5E7EB', borderColor: '#D1D5DB', color: '#374151' }
  };

  const statusKey = (booking.status || '').toLowerCase();
  const statusColor = statusStyles[statusKey] || statusStyles.default;

  // Calculate total amount if not provided
  const totalAmount = booking.totalAmount || (booking.hourlyRate * (booking.totalHours || 1));

  return (
    <View style={styles.overlay}>
      <View style={[styles.modalCard, styles.card]}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.headerIconWrap}>
              <Calendar size={24} color={colors.primary || '#3b82f6'} />
            </View>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>{t('booking.details')}</Text>
              {!!booking.family && (
                <Text style={styles.headerSubtitle}>{booking.family}</Text>
              )}
            </View>
          </View>
          <View style={styles.headerRight}>
            <View
              style={[styles.statusPill, {
                backgroundColor: statusColor.backgroundColor,
                borderColor: statusColor.borderColor
              }]}
            >
              <Text style={[styles.statusPillText, { color: statusColor.color }]}>
                {statusKey ? statusKey.replace('_', ' ') : 'scheduled'}
              </Text>
            </View>
            <Pressable onPress={onClose} hitSlop={12} style={styles.closeButton}>
              <X size={22} color={colors?.textSecondary || '#6B7280'} />
            </Pressable>
          </View>
        </View>

        <ScrollView 
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('booking.overview')}</Text>
            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Calendar size={18} color="#6B7280" />
                <View style={styles.infoTextWrap}>
                  <Text style={styles.infoLabel}>{t('booking.date')}</Text>
                  <Text style={styles.infoValue}>{booking.date}</Text>
                </View>
              </View>
              <View style={styles.infoItem}>
                <Clock size={18} color="#6B7280" />
                <View style={styles.infoTextWrap}>
                  <Text style={styles.infoLabel}>{t('booking.time')}</Text>
                  <Text style={styles.infoValue}>{booking.time}</Text>
                </View>
              </View>
              <View style={styles.infoItem}>
                <DollarSign size={18} color="#6B7280" />
                <View style={styles.infoTextWrap}>
                  <Text style={styles.infoLabel}>{t('booking.rate')}</Text>
                  <Text style={[styles.infoValue, styles.highlightText]}>₱{booking.hourlyRate}/hr</Text>
                </View>
              </View>
              <View style={styles.infoItem}>
                <Star size={18} color="#6B7280" />
                <View style={styles.infoTextWrap}>
                  <Text style={styles.infoLabel}>{t('booking.total')}</Text>
                  <Text style={[styles.infoValue, styles.successText]}>₱{totalAmount}</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('location.contact')}</Text>
            <View style={styles.locationContainer}>
              <View style={styles.locationRow}>
                <MapPin size={18} color="#4B5563" />
                <View style={styles.locationTextWrap}>
                  <Text style={styles.locationTitle}>{booking.location}</Text>
                  <Text style={styles.locationSubtitle}>{booking.address}</Text>
                </View>
              </View>
              <View style={styles.contactRow}>
                <Phone size={18} color="#4B5563" />
                <Text style={styles.contactLabel}>Phone</Text>
                <Text style={styles.contactValue}>
                  {booking.contactPhone || t('contact.hidden')}
                </Text>
              </View>
              <View style={styles.contactRow}>
                <Mail size={18} color="#4B5563" />
                <Text style={styles.contactLabel}>Email</Text>
                <Text style={styles.contactValue}>
                  {booking.contactEmail || t('contact.hidden')}
                </Text>
              </View>
            </View>
          </View>

          {booking.childrenDetails && booking.childrenDetails.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Baby size={18} color="#4B5563" />
                <Text style={styles.sectionTitle}>{t('children.details')}</Text>
              </View>
              <View style={styles.childrenList}>
                {booking.childrenDetails.map((child, index) => (
                  <View key={index} style={styles.childCard}>
                    <View style={styles.childHeader}>
                      <Text style={styles.childName}>{child.name}</Text>
                      <Text style={styles.childMeta}>{child.age ? `Age ${child.age}` : 'Age n/a'}</Text>
                    </View>
                    <View style={styles.childBody}>
                      <Text style={styles.childLabel}>{t('children.preferences')}</Text>
                      <Text style={styles.childValue}>{child.preferences || 'No preferences listed'}</Text>
                      <Text style={styles.childLabel}>{t('children.instructions')}</Text>
                      <Text style={styles.childValue}>{child.specialInstructions || 'None'}</Text>
                      {child.allergies && child.allergies !== 'None' && (
                        <View style={styles.childAlertRow}>
                          <AlertCircle size={16} color="#DC2626" />
                          <Text style={styles.childAlertText}>{`${t('children.allergies')}: ${child.allergies}`}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {booking.requirements && booking.requirements.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('requirements')}</Text>
              <View style={styles.chipWrap}>
                {booking.requirements.map((req, index) => (
                  <View key={index} style={styles.chip}>
                    <CheckCircle size={14} color="#15803D" />
                    <Text style={styles.chipText}>{req}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {booking.notes && (
            <View style={[styles.section, styles.notesSection]}>
              <Text style={styles.sectionTitle}>{t('notes.special')}</Text>
              <Text style={styles.notesText}>{booking.notes}</Text>
            </View>
          )}

          {booking.emergencyContact && (
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <AlertCircle size={18} color="#B91C1C" />
                <Text style={styles.sectionTitle}>{t('emergency.contact')}</Text>
              </View>
              <View style={styles.emergencyList}>
                <View style={styles.emergencyRow}>
                  <Text style={styles.emergencyLabel}>{t('emergency.name')}</Text>
                  <Text style={styles.emergencyValue}>{booking.emergencyContact.name}</Text>
                </View>
                <View style={styles.emergencyRow}>
                  <Text style={styles.emergencyLabel}>{t('emergency.relation')}</Text>
                  <Text style={styles.emergencyValue}>{booking.emergencyContact.relation}</Text>
                </View>
                <View style={styles.emergencyRow}>
                  <Text style={styles.emergencyLabel}>{t('emergency.phone')}</Text>
                  <Text style={[styles.emergencyValue, styles.emergencyHighlight]}>
                    {booking.emergencyContact.phone}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            onPress={onMessage}
            style={[styles.footerButton, styles.secondaryButton]}
            accessibilityRole="button"
          >
            <MessageCircle size={16} color="#1D4ED8" />
            <Text style={styles.secondaryButtonText}>{t('actions.message')}</Text>
          </Pressable>

          <Pressable
            onPress={() => {
              if (booking.address) {
                Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(booking.address)}`);
                onGetDirections?.();
              }
            }}
            style={[styles.footerButton, styles.secondaryButton]}
            accessibilityRole="button"
            disabled={!booking.address}
          >
            <Navigation size={16} color="#047857" />
            <Text style={styles.secondaryButtonText}>{t('actions.directions')}</Text>
          </Pressable>

          {booking.status === 'confirmed' && (
            <Pressable
              onPress={() => {
                Alert.alert(t('alerts.completed'), t('alerts.completed.message'));
                onCompleteBooking?.();
              }}
              style={[styles.footerButton, styles.primaryButton]}
              accessibilityRole="button"
            >
              <CheckCircle size={16} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>{t('actions.complete')}</Text>
            </Pressable>
          )}

          {(booking.status === 'pending_confirmation' || booking.status === 'confirmed') && (
            <Pressable
              onPress={() => {
                Alert.alert(t('alerts.cancelled'), t('alerts.cancelled.message'));
                onCancelBooking?.();
              }}
              style={[styles.footerButton, styles.destructiveButton]}
              accessibilityRole="button"
            >
              <Text style={styles.destructiveButtonText}>{t('actions.cancel')}</Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

BookingDetailsModal.propTypes = {
  visible: PropTypes.bool.isRequired,
  booking: PropTypes.shape({
    location: PropTypes.string,
    address: PropTypes.string,
    contactPhone: PropTypes.string,
    contactEmail: PropTypes.string,
    totalHours: PropTypes.number,
    totalAmount: PropTypes.number,
    hourlyRate: PropTypes.number,
    requirements: PropTypes.arrayOf(PropTypes.string),
    childrenDetails: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string,
        age: PropTypes.number,
        specialInstructions: PropTypes.string,
        allergies: PropTypes.string,
        preferences: PropTypes.string
      })
    ),
    emergencyContact: PropTypes.shape({
      name: PropTypes.string,
      phone: PropTypes.string,
      relation: PropTypes.string
    }),
    status: PropTypes.string,
    family: PropTypes.string,
    date: PropTypes.string,
    time: PropTypes.string,
    notes: PropTypes.string
  }),
  onClose: PropTypes.func.isRequired,
  onMessage: PropTypes.func,
  onGetDirections: PropTypes.func,
  onCompleteBooking: PropTypes.func,
  onCancelBooking: PropTypes.func
};

BookingDetailsModal.defaultProps = {
  booking: {}
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(17, 24, 39, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 640,
    height: Platform.OS === 'web' ? 'auto' : screenHeight * 0.5, // 50% height for mobile
    maxHeight: Platform.OS === 'web' ? '80%' : screenHeight * 0.5,
    borderRadius: 24,
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    paddingHorizontal: 15,
    overflow: 'hidden',
  },
  card: Platform.select({
    web: {
      boxShadow: '0 20px 45px rgba(15, 23, 42, 0.18)',
    },
    ios: {
      shadowColor: '#0f172a',
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: 0.2,
      shadowRadius: 24,
    },
    android: {
      elevation: 12,
    },
    default: {},
  }),
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    flex: 1,
    marginRight: spacing.md,
  },
  headerTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  headerIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.text,
    fontSize: 18,
    lineHeight: 24,
  },
  headerSubtitle: {
    ...typography.subtitle2,
    color: colors.textSecondary,
    marginTop: 2,
    fontSize: 14,
    lineHeight: 18,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    flexShrink: 0,
  },
  statusPill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  statusPillText: {
    ...typography.subtitle2,
    textTransform: 'capitalize',
    fontSize: 12,
    lineHeight: 16,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  contentContainer: {
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  section: {
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  sectionTitle: {
    ...typography.subtitle1,
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  infoItem: {
    width: '48%',
    borderRadius: 12,
    backgroundColor: colors.backgroundLight,
    padding: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  infoTextWrap: {
    flex: 1,
    gap: 2,
  },
  infoLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 12,
  },
  infoValue: {
    ...typography.subtitle2,
    color: colors.text,
    fontSize: 14,
    fontWeight: '500',
  },
  highlightText: {
    color: colors.accent,
    fontWeight: '700',
  },
  successText: {
    color: colors.success,
    fontWeight: '700',
  },
  locationContainer: {
    gap: spacing.sm,
  },
  locationRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  locationTextWrap: {
    flex: 1,
    gap: 2,
  },
  locationTitle: {
    ...typography.subtitle1,
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  locationSubtitle: {
    ...typography.body1,
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  contactLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 12,
    minWidth: 40,
  },
  contactValue: {
    ...typography.body1,
    color: colors.text,
    flexShrink: 1,
    fontSize: 13,
  },
  childrenList: {
    gap: spacing.sm,
  },
  childCard: {
    padding: spacing.sm,
    borderRadius: 12,
    backgroundColor: colors.backgroundLight,
    gap: spacing.xs,
  },
  childHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  childName: {
    ...typography.subtitle1,
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  childMeta: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 12,
  },
  childBody: {
    gap: 4,
  },
  childLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 11,
  },
  childValue: {
    ...typography.body1,
    color: colors.text,
    fontSize: 13,
    lineHeight: 16,
  },
  childAlertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: 2,
  },
  childAlertText: {
    ...typography.caption,
    color: colors.error,
    fontSize: 11,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: colors.primaryLight,
  },
  chipText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
    fontSize: 11,
  },
  notesSection: {
    backgroundColor: colors.backgroundLight,
    borderRadius: 12,
    padding: spacing.sm,
  },
  notesText: {
    ...typography.body1,
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  emergencyList: {
    gap: spacing.xs,
  },
  emergencyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  emergencyLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 12,
  },
  emergencyValue: {
    ...typography.body1,
    color: colors.text,
    fontSize: 13,
  },
  emergencyHighlight: {
    color: colors.primary,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    flexWrap: 'wrap',
  },
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: spacing.sm,
    minHeight: 40,
    flex: 1,
    minWidth: '23%',
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  primaryButtonText: {
    ...typography.button,
    color: colors.textInverse,
    fontSize: 12,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primary + '20',
  },
  secondaryButtonText: {
    ...typography.button,
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  destructiveButton: {
    backgroundColor: colors.error + '15',
    borderWidth: 1,
    borderColor: colors.error + '30',
  },
  destructiveButtonText: {
    ...typography.button,
    color: colors.error,
    fontSize: 12,
    fontWeight: '600',
  },
});

export default BookingDetailsModal;