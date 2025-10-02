// src/components/bookings/BookingItem.js
import { Ionicons } from '@expo/vector-icons';
import { format, formatDistanceToNow } from 'date-fns';
import React, { useMemo } from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { buildSchedule, parseDate, to12h } from '../../../utils/dateUtils';
import { getPlaceholderImage, getProfileImageUrl } from '../../../utils/imageUtils';

const DEFAULT_CURRENCY = '₱';

const BookingItem = ({
  booking,
  user,
  onPress,
  onAccept,
  onDecline,
  onComplete,
  onCancelBooking,
  onUploadPayment,
  onViewBookingDetails,
  onWriteReview,
  onViewCaregiverProfile,
  showActions = true
}) => {
  const caregiver = useMemo(() => {
    if (user && typeof user === 'object') return user;
    if (booking?.caregiver && typeof booking.caregiver === 'object') return booking.caregiver;
    if (booking?.caregiverProfile && typeof booking.caregiverProfile === 'object') return booking.caregiverProfile;
    if (booking?.assignedCaregiver && typeof booking.assignedCaregiver === 'object') return booking.assignedCaregiver;
    return null;
  }, [user, booking]);

  const bookingId =
    booking?.bookingCode ||
    booking?.reference ||
    booking?.bookingId ||
    booking?._id ||
    booking?.id ||
    'N/A';

  const bookingStatus = (booking?.status || 'pending').toLowerCase();

  const costAmount =
    [
      booking?.totalCost,
      booking?.amount,
      booking?.pricing?.total,
      booking?.rate,
      booking?.price
    ].find((value) => typeof value === 'number') || 0;

  const paymentStatusRaw = (booking?.paymentStatus || booking?.payment_state || booking?.paymentStatusLabel || '').toLowerCase();
  const hasPaymentProof = Boolean(
    booking?.paymentProof ||
    booking?.paymentProofUrl ||
    booking?.payment?.proof ||
    booking?.receiptUrl
  );
  const paymentStatus = paymentStatusRaw || (hasPaymentProof ? 'paid' : 'pending');

  const locationText =
    booking?.location ||
    booking?.address ||
    booking?.venue ||
    booking?.meetingPoint ||
    booking?.serviceLocation ||
    null;

  const childrenCount = Array.isArray(booking?.children)
    ? booking.children.length
    : Number(booking?.childrenCount || booking?.childCount || booking?.children || booking?.numberOfChildren || 0);

  const notesText =
    booking?.notes ||
    booking?.instructions ||
    booking?.additionalNotes ||
    booking?.specialInstructions ||
    null;

  const caregiverRole =
    caregiver?.role ||
    caregiver?.primaryRole ||
    booking?.caregiverRole ||
    booking?.serviceType ||
    'Caregiver';

  const caregiverDisplayName =
    caregiver?.displayName ||
    caregiver?.name ||
    [caregiver?.firstName, caregiver?.lastName].filter(Boolean).join(' ') ||
    booking?.caregiverName ||
    booking?.caregiverFullName ||
    'Caregiver';

  const rating =
    typeof caregiver?.rating === 'number'
      ? caregiver.rating
      : typeof caregiver?.averageRating === 'number'
        ? caregiver.averageRating
        : booking?.caregiverRating || booking?.rating || null;

  const reviewsCount =
    caregiver?.reviewsCount ||
    caregiver?.reviewCount ||
    caregiver?.ratingsCount ||
    booking?.caregiverReviewsCount ||
    booking?.reviewsCount ||
    null;

  const statusConfig = useMemo(() => {
    const configs = {
      pending: { color: '#F59E0B', text: 'Pending Approval' },
      pending_confirmation: { color: '#F59E0B', text: 'Awaiting Confirmation' },
      confirmed: { color: '#10B981', text: 'Confirmed' },
      in_progress: { color: '#3B82F6', text: 'In Progress' },
      completed: { color: '#6366F1', text: 'Completed' },
      paid: { color: '#14B8A6', text: 'Paid' },
      cancelled: { color: '#EF4444', text: 'Cancelled' },
      declined: { color: '#6B7280', text: 'Declined' },
    };
    return configs[bookingStatus] || configs.pending;
  }, [bookingStatus]);

  const paymentStatusConfig = useMemo(() => {
    const configs = {
      paid: { color: '#10B981', text: 'Payment Received' },
      pending: { color: '#F59E0B', text: 'Awaiting Payment' },
      awaiting_proof: { color: '#F59E0B', text: 'Awaiting Proof' },
      failed: { color: '#EF4444', text: 'Payment Failed' },
      refunded: { color: '#6B7280', text: 'Refunded' },
    };
    return configs[paymentStatus] || configs.pending;
  }, [paymentStatus]);

  const { color: statusColor, text: statusText } = statusConfig;
  const { color: paymentStatusColor, text: paymentStatusText } = paymentStatusConfig;

  // Schedule information
  const scheduleInfo = useMemo(() => {
    const dateString =
      booking?.date ||
      booking?.scheduledDate ||
      booking?.startDate ||
      booking?.dateTime;

    const rawStart =
      booking?.scheduledStart ||
      booking?.startTime ||
      booking?.start_time ||
      (typeof booking?.time === 'string' ? booking.time.split(' - ')[0] : undefined);

    const rawEnd =
      booking?.scheduledEnd ||
      booking?.endTime ||
      booking?.end_time ||
      (typeof booking?.time === 'string' ? booking.time.split(' - ')[1] : undefined);

    const friendlySchedule = buildSchedule(dateString, to12h(rawStart), to12h(rawEnd));
    const parsedStartDate = parseDate(dateString);
    const relativeTime = parsedStartDate
      ? formatDistanceToNow(parsedStartDate, { addSuffix: true })
      : '';

    return {
      friendlySchedule,
      relativeTime,
    };
  }, [
    booking?.date,
    booking?.scheduledDate,
    booking?.startDate,
    booking?.dateTime,
    booking?.scheduledStart,
    booking?.startTime,
    booking?.start_time,
    booking?.scheduledEnd,
    booking?.endTime,
    booking?.end_time,
    booking?.time,
  ]);

  const formatDate = (dateString) => {
    const parsedDate = parseDate(dateString);
    if (!parsedDate) return 'N/A';

    try {
      return format(parsedDate, 'MMM d, yyyy • h:mm a');
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Safe image source
  const getSafeImageSource = () => {
    const profileImageUrl = getProfileImageUrl(caregiver);
    if (typeof profileImageUrl === 'string' && profileImageUrl.trim()) {
      return { uri: profileImageUrl.trim() };
    }

    const fallbackImage = [
      caregiver?.profileImage,
      caregiver?.user?.profileImage,
      caregiver?.avatar,
      caregiver?.photoURL,
      caregiver?.photoUrl,
      caregiver?.image,
      booking?.caregiverProfileImage,
      booking?.caregiverImage,
      booking?.caregiverAvatar,
      booking?.caregiverPhoto,
    ].find((value) => typeof value === 'string' && value.trim());

    if (fallbackImage) {
      return { uri: fallbackImage.trim() };
    }

    const placeholder = getPlaceholderImage();
    return placeholder?.uri ? { uri: placeholder.uri } : require('../../../../assets/logo.png');
  };

  // Event handlers
  const handleViewCaregiver = () => {
    onViewCaregiverProfile?.(caregiver || booking);
  };

  const handleUploadPayment = () => {
    onUploadPayment?.(booking);
  };

  const handleViewDetails = () => {
    onViewBookingDetails?.(booking);
  };

  const handleCardPress = () => {
    onPress?.(booking);
    onViewBookingDetails?.(booking);
  };

  const handleAccept = () => {
    onAccept?.(booking);
  };

  const handleDecline = () => {
    onDecline?.(booking);
  };

  const handleComplete = () => {
    onComplete?.(booking);
  };

  const handleCancel = () => {
    onCancelBooking?.(booking);
  };

  const handlePayNow = () => {
    onUploadPayment?.(booking);
  };

  const handleAddReview = () => {
    onWriteReview?.(booking);
  };

  // Render action buttons based on status
  const renderActionButtons = () => {
    if (!showActions || !bookingStatus) return null;

    if (bookingStatus === 'pending' || bookingStatus === 'pending_confirmation') {
      return (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.acceptButton]}
            onPress={handleAccept}
            accessibilityLabel="Accept booking"
          >
            <Ionicons name="checkmark" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.declineButton]}
            onPress={handleDecline}
            accessibilityLabel="Decline booking"
          >
            <Ionicons name="close" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      );
    }

    if (bookingStatus === 'confirmed' && paymentStatus === 'pending' && (onUploadPayment || onCancelBooking)) {
      return (
        <View style={styles.actionButtons}>
          {onUploadPayment && (
            <TouchableOpacity
              style={[styles.actionButton, styles.paymentButton]}
              onPress={handlePayNow}
              accessibilityLabel="Upload payment receipt"
            >
              <Ionicons name="card-outline" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          )}
          {onCancelBooking && (
            <TouchableOpacity
              style={[styles.actionButton, styles.declineButton]}
              onPress={handleCancel}
              accessibilityLabel="Cancel booking"
            >
              <Ionicons name="trash-outline" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>
      );
    }

    if (bookingStatus === 'completed') {
      const alreadyReviewed = Boolean(booking?.hasReview || booking?.reviewSubmitted || booking?.rating);
      if (alreadyReviewed) {
        return null;
      }
      return (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.reviewButton]}
            onPress={handleAddReview}
            accessibilityLabel="Add review"
            disabled={alreadyReviewed}
          >
            <Ionicons name="star-outline" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      );
    }

    return null;
  };

  // Render complete button for in-progress bookings
  const renderCompleteButton = () => {
    if (bookingStatus === 'in_progress') {
      return (
        <TouchableOpacity
          style={styles.completeButton}
          onPress={handleComplete}
          accessibilityLabel="Mark booking as complete"
        >
          <Text style={styles.completeButtonText}>Mark Complete</Text>
        </TouchableOpacity>
      );
    }
    return null;
  };

  const imageSource = getSafeImageSource();

  return (
    <TouchableOpacity style={styles.container} onPress={handleCardPress} activeOpacity={0.85}>
      <View style={styles.headerSection}>
        <View style={styles.profileRow}>
          <View style={styles.imageSection}>
            <Image
              source={imageSource}
              style={styles.profileImage}
              accessibilityLabel="Caregiver profile image"
            />
            <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
              <Text style={styles.statusText}>{statusText}</Text>
            </View>
          </View>

          <View style={styles.profileDetails}>
            <View style={styles.nameRow}>
              <Text style={styles.name} numberOfLines={1}>
                {caregiverDisplayName || 'Unknown Caregiver'}
              </Text>
              <Text style={styles.roleBadge}>{caregiverRole || 'Unknown Role'}</Text>
            </View>

            {(rating || reviewsCount) && (
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={14} color="#FBBF24" />
                {typeof rating === 'number' && (
                  <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
                )}
                {reviewsCount && (
                  <Text style={styles.reviewsText}>
                    ({reviewsCount} review{reviewsCount === 1 ? '' : 's'})
                  </Text>
                )}
              </View>
            )}

            <View style={styles.contactRow}>
              {onViewCaregiverProfile && (
                <TouchableOpacity
                  style={styles.viewProfileButton}
                  onPress={handleViewCaregiver}
                  accessibilityLabel="View caregiver profile"
                >
                  <Ionicons name="person-circle-outline" size={20} color="#4338CA" />
                  <Text style={styles.viewProfileButtonText}>View Profile</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {renderActionButtons()}
        </View>
      </View>

      <View style={styles.bodySection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Booking Details</Text>
          {renderCompleteButton()}
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={18} color="#2563EB" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Schedule</Text>
            <Text style={styles.infoValue} numberOfLines={1}>
              {scheduleInfo.friendlySchedule || formatDate(booking?.date || booking?.dateTime || booking?.startDate) || 'Schedule pending'}
            </Text>
            {scheduleInfo.relativeTime ? (
              <Text style={styles.infoMeta}>{scheduleInfo.relativeTime}</Text>
            ) : null}
          </View>
        </View>

        {locationText && (
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={18} color="#F97316" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Location</Text>
              <Text style={styles.infoValue} numberOfLines={2}>
                {locationText}
              </Text>
            </View>
          </View>
        )}

        {childrenCount > 0 && (
          <View style={styles.infoRow}>
            <Ionicons name="people-outline" size={18} color="#059669" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Children</Text>
              <Text style={styles.infoValue}>
                {childrenCount} {childrenCount === 1 ? 'child' : 'children'}
              </Text>
            </View>
          </View>
        )}

        {notesText && (
          <View style={styles.notesContainer}>
            <Text style={styles.notesLabel}>Notes</Text>
            <Text style={styles.notes}>{notesText}</Text>
          </View>
        )}

        <View style={styles.financialSection}>
          <Text style={styles.sectionTitle}>Payment</Text>
          <View style={styles.financeRow}>
            <View style={styles.financeItem}>
              <Text style={styles.financeLabel}>Total Cost</Text>
              <Text style={styles.financeValue}>
                {DEFAULT_CURRENCY}{
                  typeof costAmount === 'number'
                    ? costAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })
                    : costAmount
                }
              </Text>
            </View>
            <View style={styles.financeItem}>
              <Text style={styles.financeLabel}>Status</Text>
              <Text style={[styles.financeValue, { color: paymentStatusColor }]}>
                {paymentStatusText}
              </Text>
            </View>
            {onUploadPayment && !hasPaymentProof && (
              <TouchableOpacity
                style={styles.financeActionButton}
                onPress={handleUploadPayment}
                accessibilityLabel="Upload payment receipt"
              >
                <Ionicons name="cloud-upload-outline" size={18} color="#FFFFFF" />
                <Text style={styles.financeActionText}>Upload Receipt</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.metadataRow}>
          <View style={styles.metadataItem}>
            <Text style={styles.metadataLabel}>Booking ID</Text>
            <Text style={styles.metadataValue}>{bookingId}</Text>
          </View>
          {booking?.createdAt && (
            <View style={styles.metadataItem}>
              <Text style={styles.metadataLabel}>Created</Text>
              <Text style={styles.metadataValue}>{formatDate(booking.createdAt)}</Text>
            </View>
          )}
          {booking?.updatedAt && (
            <View style={styles.metadataItem}>
              <Text style={styles.metadataLabel}>Updated</Text>
              <Text style={styles.metadataValue}>{formatDate(booking.updatedAt)}</Text>
            </View>
          )}
          {onViewBookingDetails && (
            <TouchableOpacity
              style={styles.detailsButton}
              onPress={handleViewDetails}
              accessibilityLabel="View booking details"
            >
              <Text style={styles.detailsButtonText}>View Details</Text>
              <Ionicons name="chevron-forward" size={16} color="#2563EB" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 'auto',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginVertical: 10,
    marginHorizontal: 16,
    padding: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerSection: {
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 16,
    paddingTop: 16,
    marginBottom: 16,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  imageSection: {
    position: 'relative',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 30,
    marginRight: 10,
  },
  profileImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#F8FAFC',
    borderWidth: 3,
    borderColor: '#F1F5F9',
  },
  statusBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  statusText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  profileDetails: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
    marginRight: 12,
  },
  roleBadge: {
    backgroundColor: '#EEF2FF',
    color: '#4338CA',
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    textTransform: 'capitalize',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 13,
    color: '#F59E0B',
    fontWeight: '600',
  },
  reviewsText: {
    fontSize: 12,
    color: '#6B7280',
  },
  contactRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  contactButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bodySection: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '600',
  },
  infoMeta: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  notesContainer: {
    marginTop: 8,
    marginBottom: 8,
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#E2E8F0',
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  notes: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    marginLeft: 12,
    marginTop: 15,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  acceptButton: {
    backgroundColor: '#10B981',
  },
  declineButton: {
    backgroundColor: '#EF4444',
  },
  paymentButton: {
    backgroundColor: '#6366F1',
  },
  reviewButton: {
    backgroundColor: '#F59E0B',
  },
  completeButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#3B82F6',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  completeButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  financialSection: {
    marginTop: 8,
  },
  financeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 16,
  },
  financeItem: {
    flexShrink: 0,
  },
  financeLabel: {
    fontSize: 12,
    color: '#64748B',
    letterSpacing: 0.5,
  },
  financeValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  financeActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#2563EB',
    borderRadius: 12,
  },
  financeActionText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  metadataRow: {
    marginTop: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 12,
  },
  metadataItem: {
    minWidth: 120,
  },
  metadataLabel: {
    fontSize: 11,
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metadataValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#2563EB',
    borderRadius: 12,
  },
  detailsButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

export default BookingItem;