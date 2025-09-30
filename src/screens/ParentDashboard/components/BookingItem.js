// src/components/bookings/BookingItem.js
import React, { useMemo } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format, formatDistanceToNow } from 'date-fns';
import { parseDate, buildSchedule, to12h } from '../../../utils/dateUtils';
import { getProfileImageUrl } from '../../../utils/imageUtils';

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
  onMessageCaregiver,
  onCallCaregiver,
  showActions = true
}) => {
  const formatDate = (dateString) => {
    try {
      if (!dateString) return 'No date';
      const date = new Date(dateString);
      return format(date, 'MMM d, yyyy • h:mm a');
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  const caregiverRole = user?.role || booking?.caregiverRole || 'Caregiver';
  const rating = typeof user?.rating === 'number' ? user.rating : user?.averageRating;
  const reviewsCount = user?.reviewsCount || user?.reviewCount || user?.ratingsCount;
  const childrenCount = Array.isArray(booking?.children)
    ? booking.children.length
    : Number(booking?.childrenCount || booking?.childCount || booking?.children || 0);
  const costAmount = [
    booking?.totalCost,
    booking?.amount,
    booking?.pricing?.total,
    booking?.rate,
    booking?.price
  ].find((value) => typeof value === 'number') || 0;
  const paymentStatus = (booking?.paymentStatus || booking?.payment_state || booking?.paymentStatusLabel || '').toLowerCase();
  const hasPaymentProof = Boolean(booking?.paymentProof || booking?.paymentProofUrl || booking?.payment?.proof);
  const bookingId = booking?.bookingCode || booking?.reference || booking?._id || booking?.id || booking?.bookingId || 'N/A';
  const locationText = booking?.location || booking?.address || booking?.venue || booking?.meetingPoint;
  const notesText = booking?.notes || booking?.instructions || booking?.additionalNotes;

  const scheduleInfo = useMemo(() => {
    const dateString = booking?.date || booking?.startDate || booking?.scheduledDate || booking?.dateTime;
    const rawStart = booking?.startTime || booking?.start_time || booking?.time?.split(' - ')[0] || booking?.scheduledStart;
    const rawEnd = booking?.endTime || booking?.end_time || booking?.time?.split(' - ')[1] || booking?.scheduledEnd;

    const startTime = to12h(rawStart);
    const endTime = to12h(rawEnd);

    const friendlySchedule = buildSchedule(dateString, startTime, endTime);
    const parsedStartDate = parseDate(dateString);
    const relativeTime = parsedStartDate
      ? formatDistanceToNow(parsedStartDate, { addSuffix: true })
      : null;

    return {
      friendlySchedule,
      relativeTime
    };
  }, [
    booking?.date,
    booking?.dateTime,
    booking?.startDate,
    booking?.startTime,
    booking?.start_time,
    booking?.time,
    booking?.endTime,
    booking?.end_time,
    booking?.scheduledDate,
    booking?.scheduledStart,
    booking?.scheduledEnd
  ]);

  const getSafeImageUrl = () => {
    try {
      const imageUrl = getProfileImageUrl(user);
      if (imageUrl) {
        return { uri: imageUrl };
      }
    } catch (error) {
      // Fall through to default
    }
    
    // Return a simple placeholder without base64 encoding
    return require('../../../../assets/logo.png'); // Add this asset or use a different approach
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return '#0EA5E9';
      case 'pending':
      case 'awaiting proof':
        return '#F59E0B';
      default:
        return '#1F2937';
    }
  };

  const renderStatusBadge = () => {
    if (!booking?.status) return null;

    const normalizedStatus = booking.status.toLowerCase();
    const statusConfig = {
      pending: { label: 'Pending Approval', color: '#F59E0B' },
      pending_confirmation: { label: 'Awaiting Confirmation', color: '#F59E0B' },
      confirmed: { label: 'Confirmed', color: '#10B981' },
      in_progress: { label: 'In Progress', color: '#3B82F6' },
      completed: { label: 'Completed', color: '#6366F1' },
      paid: { label: 'Paid', color: '#14B8A6' },
      cancelled: { label: 'Cancelled', color: '#EF4444' },
      declined: { label: 'Declined', color: '#6B7280' }
    };

    const { label, color } = statusConfig[normalizedStatus] || { label: booking.status, color: '#6B7280' };

    return (
      <View style={[styles.statusBadge, { backgroundColor: color }]}>
        <Text style={styles.statusText}>{label}</Text>
      </View>
    );
  };

  // Safe event handlers that don't use event objects
  const handleAccept = React.useCallback(() => {
    console.log('Accept booking pressed');
    onAccept?.();
  }, [onAccept]);

  const handleDecline = React.useCallback(() => {
    console.log('Decline booking pressed');
    onDecline?.();
  }, [onDecline]);

  const handleComplete = React.useCallback(() => {
    console.log('Complete booking pressed');
    onComplete?.();
  }, [onComplete]);

  const handleCancel = React.useCallback(() => {
    console.log('Cancel booking pressed');
    onCancelBooking?.();
  }, [onCancelBooking]);

  const handleUploadPayment = React.useCallback(() => {
    console.log('Upload payment pressed');
    onUploadPayment?.();
  }, [onUploadPayment]);

  const handleViewDetails = React.useCallback(() => {
    console.log('View details pressed', booking?._id);
    onViewBookingDetails?.(booking);
  }, [booking, onViewBookingDetails]);

  const handleWriteReview = React.useCallback(() => {
    console.log('Write review pressed');
    onWriteReview?.();
  }, [onWriteReview]);

  const handleMessage = React.useCallback(() => {
    console.log('Message caregiver pressed');
    onMessageCaregiver?.(user);
  }, [onMessageCaregiver, user]);

  const handleCall = React.useCallback(() => {
    console.log('Call caregiver pressed');
    onCallCaregiver?.(user);
  }, [onCallCaregiver, user]);

  const handlePress = React.useCallback(() => {
    console.log('Booking item pressed', booking?._id);
    if (onPress) {
      onPress(booking);
    }
    if (onViewBookingDetails) {
      onViewBookingDetails(booking);
    }
  }, [booking, onPress, onViewBookingDetails]);

  const renderActionButtons = () => {
    if (!showActions || !booking?.status) return null;

    const normalizedStatus = booking.status.toLowerCase();

    switch (normalizedStatus) {
      case 'pending':
      case 'pending_confirmation':
        return (
          <View style={styles.actionButtons}>
            {onDecline && (
              <TouchableOpacity
                style={[styles.actionButton, styles.declineButton]}
                onPress={handleDecline}
                accessibilityLabel="Decline booking request"
              >
                <Ionicons name="close" size={20} color="white" />
              </TouchableOpacity>
            )}
            {onAccept && (
              <TouchableOpacity
                style={[styles.actionButton, styles.acceptButton]}
                onPress={handleAccept}
                accessibilityLabel="Accept booking request"
              >
                <Ionicons name="checkmark" size={20} color="white" />
              </TouchableOpacity>
            )}
          </View>
        );
      case 'confirmed':
      case 'in_progress':
        return (
          <View style={styles.actionButtons}>
            {onUploadPayment && (
              <TouchableOpacity
                style={[styles.actionButton, styles.paymentButton]}
                onPress={handleUploadPayment}
                accessibilityLabel="Upload payment receipt"
              >
                <Ionicons name="document-text-outline" size={18} color="white" />
              </TouchableOpacity>
            )}
            {onCancelBooking && (
              <TouchableOpacity
                style={[styles.actionButton, styles.declineButton]}
                onPress={handleCancel}
                accessibilityLabel="Cancel booking"
              >
                <Ionicons name="trash-outline" size={18} color="white" />
              </TouchableOpacity>
            )}
          </View>
        );
      case 'completed':
        return (
          <View style={styles.actionButtons}>
            {onWriteReview && (
              <TouchableOpacity
                style={[styles.actionButton, styles.reviewButton]}
                onPress={handleWriteReview}
                accessibilityLabel="Write a review"
              >
                <Ionicons name="star-outline" size={18} color="white" />
              </TouchableOpacity>
            )}
          </View>
        );
      default:
        return null;
    }
  };

  const renderCompleteButton = () => {
    if ((booking?.status === 'confirmed' || booking?.status === 'in_progress') && onComplete) {
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

  const paymentStatusText = hasPaymentProof
    ? 'Payment submitted'
    : paymentStatus
      ? paymentStatus.replace(/_/g, ' ')
      : 'Awaiting proof';

  const paymentStatusColor = getPaymentStatusColor(paymentStatus || (hasPaymentProof ? 'paid' : 'pending'));

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.85}
    >
      <View style={styles.headerSection}>
        <View style={styles.profileRow}>
          <View style={styles.imageSection}>
            <Image
              source={getSafeImageUrl()}
              style={styles.profileImage}
              onError={() => console.log('Image failed to load')}
            />
            {renderStatusBadge()}
          </View>
          <View style={styles.profileDetails}>
            <View style={styles.nameRow}>
              <Text style={styles.name} numberOfLines={1}>
                {user?.displayName || user?.name || 'Unknown Caregiver'}
              </Text>
              <Text style={styles.roleBadge}>{caregiverRole}</Text>
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
              {onMessageCaregiver && (
                <TouchableOpacity
                  style={styles.contactButton}
                  onPress={handleMessage}
                  accessibilityLabel="Message caregiver"
                >
                  <Ionicons name="chatbubble-ellipses-outline" size={18} color="#1F2937" />
                </TouchableOpacity>
              )}
              {onCallCaregiver && (
                <TouchableOpacity
                  style={styles.contactButton}
                  onPress={handleCall}
                  accessibilityLabel="Call caregiver"
                >
                  <Ionicons name="call-outline" size={18} color="#1F2937" />
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
            {scheduleInfo.relativeTime && (
              <Text style={styles.infoMeta}>{scheduleInfo.relativeTime}</Text>
            )}
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
    marginBottom: 16,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  imageSection: {
    position: 'relative',
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
    position: 'relative',
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 12,
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