import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Linking,
  Alert,
  Platform,
  StyleSheet,
  Dimensions,
} from 'react-native';
import {
  Calendar,
  Clock,
  DollarSign,
  MapPin,
  Phone,
  Mail,
  MessageCircle,
  Navigation,
  Baby,
  AlertCircle,
  CheckCircle,
  X,
  User, // new
} from 'lucide-react-native';
import PropTypes from 'prop-types';
import { colors, spacing, typography } from '../../../screens/styles/ParentDashboard.styles';
import { formatAddress } from '../../../utils/addressUtils';

const { height: screenHeight } = Dimensions.get('window');

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
    requirements: 'Requirements',
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
    'alerts.cancelled.message': 'The booking has been cancelled',
    'actions.viewProfile': 'View Profile',
    'booking.info': 'Booking Information',
    'booking.id': 'Booking ID',
    'booking.created': 'Created',
    'booking.updated': 'Updated',
  };
  return translations[key] || key;
};

export function BookingDetailsModal({
  visible,
  booking,
  onClose,
  onMessage,
  onGetDirections,
  onCompleteBooking,
  onCancelBooking,
  onViewCaregiverProfile,
}) {
  if (!visible || !booking) {
    return null;
  }
  const displayBookingId =
    booking.bookingCode ||
    booking.reference ||
    booking.bookingId ||
    booking._id ||
    booking.id ||
    null;

  const formatDateTime = (value) => {
    if (!value) return null;
    try {
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return null;
      return new Intl.DateTimeFormat('en-PH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
      }).format(date);
    } catch (error) {
      console.warn('BookingDetailsModal: unable to format date', value, error);
      return null;
    }
  };

  const createdAt = formatDateTime(booking.createdAt);
  const updatedAt = formatDateTime(booking.updatedAt);

  const renderStatus = () => {
    const statusMap = {
      pending: { label: 'Pending', color: colors.warning },
      pending_confirmation: { label: 'Awaiting Confirmation', color: colors.warning },
      confirmed: { label: 'Confirmed', color: colors.success },
      in_progress: { label: 'In Progress', color: colors.accent },
      completed: { label: 'Completed', color: colors.success },
      paid: { label: 'Paid', color: colors.success },
      cancelled: { label: 'Cancelled', color: colors.error },
      declined: { label: 'Declined', color: colors.error },
    };

    const status = statusMap[booking.status] || { label: booking.status, color: colors.text };
    return (
      <View style={[styles.statusPill, { borderColor: status.color + '40', backgroundColor: status.color + '15' }]}>
        <Text style={[styles.statusPillText, { color: status.color }]}>{status.label}</Text>
      </View>
    );
  };

  const displayRate = booking.hourlyRate != null ? `₱${booking.hourlyRate}/hr` : '—';
  const displayTotal = booking.totalAmount != null ? `₱${booking.totalAmount}` : '—';
  const displayDate = booking.date || '—';
  const displayTime = booking.time || booking.timeRange || '—';

  const normalizeFormattedAddress = (candidate) => {
    if (!candidate) {
      return null;
    }

    const formatted = formatAddress(candidate);
    if (!formatted) {
      return null;
    }

    const trimmed = formatted.trim();
    if (!trimmed) {
      return null;
    }

    const lower = trimmed.toLowerCase();
    if (lower === 'location not specified' || lower === 'location not available') {
      return null;
    }

    return trimmed;
  };

  const mergeCandidates = (...values) => values.find((value) => value != null);

  const formattedLocation = [
    booking.location?.formattedAddress,
    booking.address?.formattedAddress,
    booking.location?.fullAddress,
    booking.address?.fullAddress,
    booking.location?.address,
    booking.address?.address,
    booking.location,
    booking.address,
  ]
    .map(normalizeFormattedAddress)
    .find(Boolean) || null;

  const extractCoordinates = (candidate) => {
    if (!candidate || typeof candidate !== 'object') {
      return null;
    }

    const coordinates =
      candidate.coordinates ||
      candidate.location?.coordinates ||
      candidate.geo ||
      candidate.geoLocation ||
      candidate.position ||
      null;

    if (!Array.isArray(coordinates) || coordinates.length < 2) {
      return null;
    }

    const [lat, lng] = coordinates.map((value) => Number(value));

    if ([lat, lng].some((value) => Number.isNaN(value))) {
      return null;
    }

    return [lat, lng];
  };

  const resolvedCoordinates = [
    booking.location,
    booking.address,
    booking.location?.address,
    booking.address?.address,
  ]
    .map(extractCoordinates)
    .find(Boolean) || null;

  const directionsTarget = resolvedCoordinates
    ? `${resolvedCoordinates[0]},${resolvedCoordinates[1]}`
    : formattedLocation;

  const directionsUrl = directionsTarget
    ? resolvedCoordinates
      ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(directionsTarget)}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(directionsTarget)}`
    : null;

  const canOpenDirections = Boolean(directionsUrl);

  const locationTitle =
    mergeCandidates(
      booking.location?.label,
      booking.location?.name,
      booking.location?.title,
      booking.address?.label
    ) || 'Booking Location';

  const locationSubtitle = formattedLocation || 'Address will be shared after confirmation.';

  return (
    <View style={styles.overlay}>
      <View style={[styles.modalCard, styles.card]}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.headerIconWrap}>
              <Calendar size={20} color={colors.primary} />
            </View>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>{t('booking.details')}</Text>
              <Text style={styles.headerSubtitle}>
                {booking.family || 'Family'} · {displayDate}
              </Text>
            </View>
          </View>

          <View style={styles.headerRight}>
            {renderStatus()}
            <Pressable onPress={onClose} style={styles.closeButton} accessibilityLabel="Close booking details">
              <X size={18} color={colors.textSecondary} />
            </Pressable>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('booking.overview')}</Text>
            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Clock size={18} color={colors.primary} />
                <View style={styles.infoTextWrap}>
                  <Text style={styles.infoLabel}>{t('booking.date')}</Text>
                  <Text style={styles.infoValue}>{displayDate}</Text>
                </View>
              </View>

              <View style={styles.infoItem}>
                <Clock size={18} color={colors.primary} />
                <View style={styles.infoTextWrap}>
                  <Text style={styles.infoLabel}>{t('booking.time')}</Text>
                  <Text style={styles.infoValue}>{displayTime}</Text>
                </View>
              </View>

              <View style={styles.infoItem}>
                <DollarSign size={18} color={colors.primary} />
                <View style={styles.infoTextWrap}>
                  <Text style={styles.infoLabel}>{t('booking.rate')}</Text>
                  <Text style={[styles.infoValue, styles.highlightText]}>{displayRate}</Text>
                </View>
              </View>

              <View style={styles.infoItem}>
                <DollarSign size={18} color={colors.primary} />
                <View style={styles.infoTextWrap}>
                  <Text style={styles.infoLabel}>{t('booking.total')}</Text>
                  <Text style={[styles.infoValue, styles.highlightText]}>{displayTotal}</Text>
                </View>
              </View>
            </View>
          </View>

          {booking.location || booking.address || booking.contactPhone || booking.contactEmail ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('location.contact')}</Text>
              <View style={styles.locationContainer}>
                {(booking.location || booking.address || formattedLocation) && (
                  <View style={styles.locationRow}>
                    <MapPin size={18} color={colors.primary} />
                    <View style={styles.locationTextWrap}>
                      <Text style={styles.locationTitle}>{locationTitle}</Text>
                      <Text style={styles.locationSubtitle}>{locationSubtitle}</Text>
                    </View>
                  </View>
                )}

                <View style={styles.locationContainer}>
                  <View style={styles.contactRow}>
                    <Phone size={16} color={colors.primary} />
                    <Text style={styles.contactLabel}>{t('contact.phone')}</Text>
                    <Text style={styles.contactValue}>{booking.contactPhone || t('contact.hidden')}</Text>
                  </View>

                  <View style={styles.contactRow}>
                    <Mail size={16} color={colors.primary} />
                    <Text style={styles.contactLabel}>{t('contact.email')}</Text>
                    <Text style={styles.contactValue}>{booking.contactEmail || t('contact.hidden')}</Text>
                  </View>
                </View>
              </View>
            </View>
          ) : null}

          {Array.isArray(booking.childrenDetails) && booking.childrenDetails.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('children.details')}</Text>
              <View style={styles.childrenList}>
                {booking.childrenDetails.map((child, index) => (
                  <View key={index} style={styles.childCard}>
                    <View style={styles.childHeader}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                        <Baby size={16} color={colors.primary} />
                        <Text style={styles.childName}>{child.name || `Child #${index + 1}`}</Text>
                      </View>
                      <Text style={styles.childMeta}>
                        {t('children.age')}: {child.age ?? child.ageMonths ?? '—'}
                      </Text>
                    </View>

                    <View style={styles.childBody}>
                      {child.preferences ? (
                        <Text style={styles.childValue}>
                          <Text style={styles.childLabel}>{t('children.preferences')}: </Text>
                          {child.preferences}
                        </Text>
                      ) : null}

                      {child.specialInstructions ? (
                        <Text style={styles.childValue}>
                          <Text style={styles.childLabel}>{t('children.instructions')}: </Text>
                          {child.specialInstructions}
                        </Text>
                      ) : null}

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

          {booking.notes ? (
            <View style={[styles.section, styles.notesSection]}>
              <Text style={styles.sectionTitle}>{t('notes.special')}</Text>
              <Text style={styles.notesText}>{booking.notes}</Text>
            </View>
          ) : null}

          {booking.emergencyContact ? (
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
                  <Text style={[styles.emergencyValue, styles.emergencyHighlight]}>{booking.emergencyContact.phone}</Text>
                </View>
              </View>
            </View>
          ) : null}
                  {(displayBookingId || createdAt || updatedAt) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('booking.info')}</Text>
              <View style={styles.metadataList}>
                {displayBookingId && (
                  <View style={styles.metadataRow}>
                    <Text style={styles.metadataLabel}>{t('booking.id')}</Text>
                    <Text style={styles.metadataValue}>{displayBookingId}</Text>
                  </View>
                )}
                {createdAt && (
                  <View style={styles.metadataRow}>
                    <Text style={styles.metadataLabel}>{t('booking.created')}</Text>
                    <Text style={styles.metadataValue}>{createdAt}</Text>
                  </View>
                )}
                {updatedAt && (
                  <View style={styles.metadataRow}>
                    <Text style={styles.metadataLabel}>{t('booking.updated')}</Text>
                    <Text style={styles.metadataValue}>{updatedAt}</Text>
                  </View>
                )}
              </View>
            </View>
          )}

        </ScrollView>

        <View style={styles.footer}>
          <View style={[styles.footerRow, styles.footerRowSecondary]}>
            <Pressable
              onPress={onMessage}
              style={[styles.footerButton, styles.secondaryButton]}
              accessibilityRole="button"
            >
              <MessageCircle size={16} color="#1D4ED8" />
              <Text style={styles.secondaryButtonText}>{t('actions.message')}</Text>
            </Pressable>
            {onViewCaregiverProfile && (
              <Pressable
                onPress={() => onViewCaregiverProfile?.(booking)}
                style={[styles.footerButton, styles.secondaryButton]}
                accessibilityRole="button"
              >
                <User size={16} color="#6B21A8" />
                <Text style={styles.secondaryButtonText}>{t('actions.viewProfile')}</Text>
              </Pressable>
            )}

            <Pressable
              onPress={() => {
                if (directionsUrl) {
                  Linking.openURL(directionsUrl);
                  onGetDirections?.();
                }
              }}
              style={[
                styles.footerButton,
                styles.secondaryButton,
                !canOpenDirections && styles.disabledButton,
              ]}
              accessibilityRole="button"
              disabled={!canOpenDirections}
            >
              <Navigation size={16} color={canOpenDirections ? '#047857' : '#94A3B8'} />
              <Text
                style={[
                  styles.secondaryButtonText,
                  !canOpenDirections && styles.disabledButtonText,
                ]}
              >
                {t('actions.directions')}
              </Text>
            </Pressable>
          </View>

          {(booking.status === 'confirmed' ||
            booking.status === 'in_progress' ||
            booking.status === 'pending_confirmation') && (
            <View style={styles.footerRow}>
              {(booking.status === 'confirmed' || booking.status === 'in_progress') && (
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
        preferences: PropTypes.string,
      })
    ),
    emergencyContact: PropTypes.shape({
      name: PropTypes.string,
      phone: PropTypes.string,
      relation: PropTypes.string,
    }),
    status: PropTypes.string,
    family: PropTypes.string,
    date: PropTypes.string,
    time: PropTypes.string,
    notes: PropTypes.string,
  }),
  onClose: PropTypes.func.isRequired,
  onMessage: PropTypes.func,
  onGetDirections: PropTypes.func,
  onCompleteBooking: PropTypes.func,
  onCancelBooking: PropTypes.func,
  onViewCaregiverProfile: PropTypes.func,
};
BookingDetailsModal.defaultProps = {
  booking: {},
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
    height: Platform.OS === 'web' ? 'auto' : screenHeight * 0.5,
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
    alignItems: 'center',
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
    alignItems: 'center',
    gap: spacing.sm,
    flexShrink: 0,
  },
  statusPill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    alignSelf: 'center',
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
    gap: spacing.xs,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  footerRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  footerRowSecondary: {
    marginBottom: spacing.xs,
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
  disabledButton: {
    opacity: 0.6,
  },
  disabledButtonText: {
    color: '#94A3B8',
  },
  metadataList: {
    gap: spacing.xs,
  },
  metadataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metadataLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 12,
  },
  metadataValue: {
    ...typography.body1,
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
});

export default BookingDetailsModal;
