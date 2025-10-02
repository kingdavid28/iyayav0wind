import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Linking,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import PropTypes from 'prop-types';
import {
  Calendar,
  Clock,
  DollarSign,
  Filter,
  Plus,
  MessageCircle,
} from 'lucide-react-native';

import { styles, colors } from '../../styles/ParentDashboard.styles';
import BookingItem from './BookingItem';
import CaregiverCard from './CaregiverCard';
import { parseDate } from '../../../utils/dateUtils';
import { formatAddress } from '../../../utils/addressUtils';
import { BOOKING_STATUSES } from '../../../constants/bookingStatuses';

const BookingsTab = ({
  bookings = [],
  caregivers = [],
  bookingsFilter = 'all',
  setBookingsFilter,
  refreshing = false,
  onRefresh,
  onCancelBooking,
  onUploadPayment,
  onViewBookingDetails,
  onWriteReview,
  onCreateBooking,
  onMessageCaregiver,
  navigation,
  loading = false,
  onAcceptBooking,
  onDeclineBooking,
  onCompleteBooking,
  onPayNowBooking,
}) => {
  const defaultAcceptHandler = (booking) => {
    console.warn('[BookingsTab] Accept handler not provided', booking?._id || booking?.id);
  };

  const defaultDeclineHandler = (booking) => {
    console.warn('[BookingsTab] Decline handler not provided', booking?._id || booking?.id);
  };

  const defaultCompleteHandler = (booking) => {
    console.warn('[BookingsTab] Complete handler not provided', booking?._id || booking?.id);
  };

  const defaultPayNowHandler = (booking) => {
    console.warn('[BookingsTab] Pay-now handler not provided', booking?._id || booking?.id);
  };

  const acceptHandler = onAcceptBooking || defaultAcceptHandler;
  const declineHandler = onDeclineBooking || defaultDeclineHandler;
  const completeHandler = onCompleteBooking || defaultCompleteHandler;
  const payNowHandler = onPayNowBooking || defaultPayNowHandler;

  const filteredBookings = useMemo(() => {
    if (!Array.isArray(bookings)) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize for comparisons

    switch (bookingsFilter) {
      case 'upcoming':
        return bookings.filter((booking) => {
          if (!booking?.date) return false;
          try {
            const bookingDate = parseDate(booking.date);
            if (!bookingDate) return false;
            bookingDate.setHours(0, 0, 0, 0);
            return bookingDate >= today;
          } catch (error) {
            console.error('Error parsing booking date:', error);
            return false;
          }
        });

      case 'past':
        return bookings.filter((booking) => {
          if (!booking?.date) return false;
          try {
            const bookingDate = parseDate(booking.date);
            if (!bookingDate) return false;
            bookingDate.setHours(0, 0, 0, 0);
            return bookingDate < today;
          } catch (error) {
            console.error('Error parsing booking date:', error);
            return false;
          }
        });

      case 'pending':
        return bookings.filter(
          (booking) => booking?.status === BOOKING_STATUSES.PENDING
        );

      case 'confirmed':
        return bookings.filter(
          (booking) =>
            booking?.status === BOOKING_STATUSES.CONFIRMED ||
            booking?.status === BOOKING_STATUSES.IN_PROGRESS
        );

      case 'completed':
        return bookings.filter(
          (booking) =>
            booking?.status === BOOKING_STATUSES.COMPLETED ||
            (booking?.status === BOOKING_STATUSES.PAID && booking?.paymentProof)
        );

      default:
        return bookings;
    }
  }, [bookings, bookingsFilter]);

  // Calculate booking statistics
  const bookingStats = useMemo(() => {
    if (!Array.isArray(bookings)) {
      return {
        total: 0,
        pending: 0,
        confirmed: 0,
        completed: 0,
        totalSpent: 0,
        upcoming: 0,
        past: 0,
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return bookings.reduce(
      (stats, booking) => {
        if (!booking) return stats;

        stats.total += 1;

        const bookingDate = booking?.date ? parseDate(booking.date) : null;
        if (bookingDate) {
          const normalized = new Date(bookingDate);
          normalized.setHours(0, 0, 0, 0);
          if (normalized >= today) {
            stats.upcoming += 1;
          } else {
            stats.past += 1;
          }
        }

        // Only count money as "spent" if booking is paid or completed with payment
        const cost = booking.totalCost || booking.amount || 0;
        if (
          booking.status === BOOKING_STATUSES.PAID ||
          (booking.status === BOOKING_STATUSES.COMPLETED && booking.paymentProof)
        ) {
          stats.totalSpent += cost;
        }

        switch (booking.status) {
          case BOOKING_STATUSES.PENDING:
            stats.pending += 1;
            break;
          case BOOKING_STATUSES.CONFIRMED:
          case BOOKING_STATUSES.IN_PROGRESS:
            stats.confirmed += 1;
            break;
          case BOOKING_STATUSES.COMPLETED:
          case BOOKING_STATUSES.PAID:
            stats.completed += 1;
            break;
          default:
            break;
        }

        return stats;
      },
      {
        total: 0,
        pending: 0,
        confirmed: 0,
        completed: 0,
        totalSpent: 0,
        upcoming: 0,
        past: 0,
      }
    );
  }, [bookings]);

  const handleMessageCaregiver = async (caregiver) => {
    try {
      console.log('🔍 BookingsTab - Caregiver data for messaging:', caregiver);

      if (!caregiver) {
        Alert.alert('Error', 'Caregiver information not available');
        return;
      }

      const caregiverId = caregiver._id || caregiver.id;
      const caregiverName = caregiver.name || caregiver.firstName || 'Caregiver';

      if (!caregiverId) {
        Alert.alert('Error', 'Caregiver ID not found');
        return;
      }

      console.log('🔍 BookingsTab - Extracted caregiver info:', {
        caregiverId,
        caregiverName,
      });

      if (onMessageCaregiver) {
        await onMessageCaregiver({
          _id: caregiverId,
          name: caregiverName,
          avatar: caregiver.avatar || caregiver.profileImage,
        });
      } else {
        console.log('Starting conversation with caregiver:', {
          recipientId: caregiverId,
          recipientName: caregiverName,
          recipientAvatar: caregiver.avatar || caregiver.profileImage,
        });
      }
    } catch (error) {
      console.error('Error messaging caregiver:', error);
      Alert.alert('Error', 'Failed to open messaging. Please try again.');
    }
  };

  const handleCallCaregiver = async (caregiver) => {
    try {
      if (!caregiver?.phone) {
        Alert.alert(
          'No Phone Number',
          'Caregiver phone number is not available'
        );
        return;
      }

      const phoneNumber = caregiver.phone.replace(/[^0-9+]/g, '');

      if (!phoneNumber) {
        Alert.alert('Error', 'Invalid phone number format');
        return;
      }

      Alert.alert(
        'Call Caregiver',
        `Call ${caregiver.name || caregiver.firstName || 'caregiver'} at ${
          caregiver.phone
        }?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Call',
            onPress: () => {
              Linking.openURL(`tel:${phoneNumber}`);
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error calling caregiver:', error);
      Alert.alert('Error', 'Failed to make call. Please try again.');
    }
  };

  // Simple handler functions that don't rely on event objects
  const handleFilterPress = (filterKey) => {
    setBookingsFilter?.(filterKey);
  };

  const handleCreateBooking = () => {
    onCreateBooking?.();
  };

  const handleViewCaregiverProfile = (caregiver) => {
    if (caregiver?._id || caregiver?.id) {
      navigation?.navigate('CaregiverProfile', {
        caregiverId: caregiver._id || caregiver.id,
      });
    }
  };

  // Custom actions for CaregiverCard in bookings context
  const renderBookingCaregiverActions = ({ caregiver, messageButtonLabel }) => (
    <TouchableOpacity
      style={[styles.iconButton, { marginRight: 8 }]}
      onPress={() => handleMessageCaregiver(caregiver)}
      accessibilityLabel={messageButtonLabel}
      accessibilityRole="button"
    >
      <MessageCircle size={20} color={colors.primary} />
    </TouchableOpacity>
  );

  const renderStatsHeader = () => (
    <View style={styles.bookingStatsContainer}>
      <View style={styles.statItem}>
        <Calendar size={20} color={colors.primary} />
        <Text style={styles.statNumber}>{bookingStats.total}</Text>
        <Text style={styles.statLabel}>Total</Text>
      </View>
      <View style={styles.statItem}>
        <Clock size={20} color={colors.warning} />
        <Text style={styles.statNumber}>{bookingStats.pending}</Text>
        <Text style={styles.statLabel}>Pending</Text>
      </View>
      <View style={styles.statItem}>
        <Calendar size={20} color={colors.success} />
        <Text style={styles.statNumber}>{bookingStats.confirmed}</Text>
        <Text style={styles.statLabel}>Active</Text>
      </View>
      <View style={styles.statItem}>
        <DollarSign size={20} color={colors.primary} />
        <Text style={styles.statNumber}>₱{bookingStats.totalSpent.toFixed(0)}</Text>
        <Text style={styles.statLabel}>Spent</Text>
      </View>
    </View>
  );

  const renderFilterTabs = () => {
    const filterOptions = [
      { key: 'all', label: 'All', count: bookingStats.total },
      { key: 'upcoming', label: 'Upcoming', count: bookingStats.upcoming },
      { key: 'pending', label: 'Pending', count: bookingStats.pending },
      { key: 'confirmed', label: 'Active', count: bookingStats.confirmed },
      { key: 'completed', label: 'Done', count: bookingStats.completed },
      { key: 'past', label: 'Past', count: bookingStats.past },
    ];

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.bookingsFilterWrapper}
        contentContainerStyle={styles.bookingsFilterTabs}
      >
        {filterOptions.map((option) => {
          const isActive = bookingsFilter === option.key;
          return (
            <TouchableOpacity
              key={option.key}
              style={[
                styles.filterTab,
                isActive && styles.activeFilterTab,
              ]}
              onPress={() => handleFilterPress(option.key)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`Filter by ${option.label} bookings`}
              accessibilityState={{ selected: isActive }}
            >
              <Text
                style={[
                  styles.filterTabText,
                  isActive && styles.activeFilterTabText,
                ]}
              >
                {option.label}
                {option.count !== null && option.count > 0 && (
                  <Text
                    style={[
                      styles.filterTabCount,
                      isActive && { color: colors.textInverse },
                    ]}
                  >
                    {' '}
                    ({option.count})
                  </Text>
                )}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    );
  };

  const renderEmptyState = () => {
    const getEmptyMessage = () => {
      switch (bookingsFilter) {
        case 'upcoming':
          return 'No upcoming bookings';
        case 'past':
          return 'No past bookings';
        case 'pending':
          return 'No pending bookings';
        case 'confirmed':
          return 'No active bookings';
        case 'completed':
          return 'No completed bookings';
        default:
          return 'No bookings found';
      }
    };

    const getEmptyDescription = () => {
      switch (bookingsFilter) {
        case 'all':
          return 'Start by booking a caregiver for your children';
        case 'upcoming':
          return 'You have no upcoming bookings scheduled';
        case 'pending':
          return 'You have no pending booking requests';
        case 'confirmed':
          return 'You have no active bookings at the moment';
        case 'completed':
          return 'You have no completed bookings yet';
        default:
          return 'Check other tabs or create a new booking';
      }
    };

    return (
      <View style={styles.emptySection}>
        <Calendar
          size={48}
          color={colors.textSecondary}
          style={styles.emptyIcon}
        />
        <Text style={styles.emptySectionTitle}>{getEmptyMessage()}</Text>
        <Text style={styles.emptySectionText}>{getEmptyDescription()}</Text>
        {onCreateBooking && (
          <TouchableOpacity
            style={styles.emptyActionButton}
            onPress={handleCreateBooking}
          >
            <Plus size={20} color="#FFFFFF" />
            <Text style={styles.emptyActionButtonText}>Book a Caregiver</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const resolveIdCandidates = (entity) => {
    if (!entity) return [];

    if (typeof entity === 'string') {
      return [entity];
    }

    const candidates = [entity._id, entity.id, entity.caregiverId, entity.userId];

    if (entity.userId && typeof entity.userId === 'object') {
      candidates.push(entity.userId._id, entity.userId.id);
    }

    return candidates.filter(Boolean).map((value) => value.toString());
  };

  const findFeaturedCaregiver = (bookingCaregiverId) => {
    if (!bookingCaregiverId) return null;

    const targetId = bookingCaregiverId.toString();

    return caregivers.find((featured) => {
      const featuredIds = resolveIdCandidates(featured);
      return featuredIds.includes(targetId);
    });
  };

  const getCaregiverFromBooking = (booking = {}) => {
    if (!booking) {
      return {};
    }

    const {
      caregiver,
      caregiverProfile,
      assignedCaregiver,
      caregiverId,
      caregiverName,
      caregiverFullName,
      caregiverProfileImage,
      caregiverAvatar,
      caregiverImage,
      caregiverRating,
      caregiverReviewsCount,
      caregiverReviewCount,
    } = booking;

    const resolvedObject = [caregiver, caregiverProfile, assignedCaregiver, caregiverId].find(
      (candidate) => candidate && typeof candidate === 'object'
    );

    let resolvedId = caregiverId;

    if (resolvedObject) {
      const resolvedCandidates = resolveIdCandidates(resolvedObject);
      if (resolvedCandidates.length > 0) {
        resolvedId = resolvedCandidates[0];
      }

      const featured = findFeaturedCaregiver(resolvedId);
      if (featured) {
        return {
          ...featured,
          _id: featured._id || featured.id || resolvedId,
          id: featured.id || featured._id || resolvedId,
          profileImage: featured.profileImage || featured.avatar,
          avatar: featured.avatar || featured.profileImage,
          rating: featured.rating ?? caregiverRating,
          reviewCount: featured.reviewCount ?? caregiverReviewsCount ?? caregiverReviewCount,
        };
      }

      if (__DEV__) {
        const availableFeaturedIds = caregivers.flatMap((item) => resolveIdCandidates(item));
        console.warn(
          '[BookingsTab] Caregiver not found in featured list',
          {
            bookingId: booking?._id || booking?.id,
            resolvedId,
            availableFeaturedIds,
          }
        );
      }

      return {
        ...resolvedObject,
        _id: resolvedObject._id || resolvedObject.id || caregiverId,
        id: resolvedObject.id || resolvedObject._id || caregiverId,
        name:
          resolvedObject.name ||
          resolvedObject.displayName ||
          caregiverName ||
          caregiverFullName ||
          'Caregiver',
        profileImage:
          resolvedObject.profileImage ||
          resolvedObject.avatar ||
          caregiverProfileImage ||
          caregiverAvatar ||
          caregiverImage ||
          resolvedObject.photoURL,
        avatar:
          resolvedObject.avatar ||
          resolvedObject.profileImage ||
          caregiverAvatar ||
          caregiverProfileImage ||
          caregiverImage ||
          resolvedObject.photoURL,
        rating: resolvedObject.rating ?? caregiverRating,
        reviewCount:
          resolvedObject.reviewCount ??
          resolvedObject.reviewsCount ??
          caregiverReviewsCount ??
          caregiverReviewCount ??
          0,
      };
    }

    const fallbackId = caregiverId || (typeof caregiver === 'string' ? caregiver : undefined);
    const fallbackCandidates = [fallbackId, caregiverName, caregiverFullName]
      .filter(Boolean)
      .map((candidate) => candidate.toString());

    let featuredMatch = null;
    fallbackCandidates.some((candidate) => {
      const match = findFeaturedCaregiver(candidate);
      if (match) {
        featuredMatch = { match, candidate };
        return true;
      }
      return false;
    });

    if (featuredMatch) {
      const { match } = featuredMatch;
      return {
        ...match,
        _id: match._id || match.id || fallbackId,
        id: match.id || match._id || fallbackId,
        profileImage: match.profileImage || match.avatar,
        avatar: match.avatar || match.profileImage,
        rating: match.rating ?? caregiverRating,
        reviewCount: match.reviewCount ?? caregiverReviewsCount ?? caregiverReviewCount,
      };
    }

    if (__DEV__ && fallbackCandidates.length > 0 && caregivers.length > 0) {
      const availableFeaturedIds = caregivers.flatMap((item) => resolveIdCandidates(item));
      console.warn(
        '[BookingsTab] Caregiver fallback not found in featured list',
        {
          bookingId: booking?._id || booking?.id,
          fallbackCandidates,
          caregiverName,
          caregiverFullName,
          availableFeaturedIds,
        }
      );
    }

    const fallbackImage = caregiverProfileImage || caregiverAvatar || caregiverImage;
    const fallbackName = caregiverName || caregiverFullName || 'Caregiver';

    return {
      _id: fallbackId,
      id: fallbackId,
      name: fallbackName,
      profileImage: fallbackImage,
      avatar: fallbackImage,
      rating: caregiverRating,
      reviewCount: caregiverReviewsCount ?? caregiverReviewCount,
    };
  };

  const renderBookingItem = ({ item: booking }) => {
    const caregiver = getCaregiverFromBooking(booking);
    return (
      <BookingItem
        booking={booking}
        user={caregiver}
        onCancelBooking={onCancelBooking}
        onUploadPayment={onUploadPayment}
        onViewBookingDetails={onViewBookingDetails}
        onWriteReview={onWriteReview}
        onAccept={acceptHandler}
        onDecline={declineHandler}
        onComplete={completeHandler}
        onPayNow={payNowHandler}
      />
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading bookings...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.bookingsContent, { flex: 1 }]}>
      <View style={styles.bookingsHeader}>
        <View style={styles.bookingsHeaderTop}>
          <Text style={styles.bookingsTitle}>My Bookings</Text>
        </View>

        {bookingStats.total > 0 && renderStatsHeader()}
        {renderFilterTabs()}
      </View>

      <FlatList
        style={{ flex: 1 }}
        data={filteredBookings}
        keyExtractor={(item, index) =>
          item?._id || item?.id || `booking-${index}`
        }
        renderItem={renderBookingItem}
        contentContainerStyle={[
          styles.bookingsList,
          filteredBookings.length === 0 && { flex: 1 },
        ]}
        ListEmptyComponent={renderEmptyState()}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

BookingsTab.propTypes = {
  bookings: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string,
      id: PropTypes.string,
      date: PropTypes.string,
      status: PropTypes.string,
      totalCost: PropTypes.number,
      amount: PropTypes.number,
      paymentProof: PropTypes.string,
      caregiver: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
      caregiverProfile: PropTypes.object,
      assignedCaregiver: PropTypes.object,
      caregiverId: PropTypes.string,
      caregiverName: PropTypes.string,
      caregiverFullName: PropTypes.string,
      caregiverProfileImage: PropTypes.string,
      caregiverAvatar: PropTypes.string,
      caregiverImage: PropTypes.string,
      caregiverRating: PropTypes.number,
      caregiverReviewsCount: PropTypes.number,
      caregiverReviewCount: PropTypes.number,
    })
  ),
  caregivers: PropTypes.arrayOf(PropTypes.shape({
    _id: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    userId: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({
        _id: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
      })
    ]),
    name: PropTypes.string,
    profileImage: PropTypes.string,
    avatar: PropTypes.string,
  })),
  bookingsFilter: PropTypes.oneOf([
    'all',
    'upcoming',
    'past',
    'pending',
    'confirmed',
    'completed',
  ]),
  setBookingsFilter: PropTypes.func,
  refreshing: PropTypes.bool,
  onRefresh: PropTypes.func,
  onCancelBooking: PropTypes.func,
  onUploadPayment: PropTypes.func,
  onViewBookingDetails: PropTypes.func,
  onWriteReview: PropTypes.func,
  onCreateBooking: PropTypes.func,
  onMessageCaregiver: PropTypes.func,
  navigation: PropTypes.object,
  loading: PropTypes.bool,
};

BookingsTab.defaultProps = {
  bookings: [],
  caregivers: [],
  bookingsFilter: 'all',
  refreshing: false,
  loading: false,
};

export default BookingsTab;