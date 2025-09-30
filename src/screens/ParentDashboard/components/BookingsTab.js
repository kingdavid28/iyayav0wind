import React, { useMemo } from 'react';
import { View, Text, FlatList, RefreshControl, TouchableOpacity, Alert, Linking, ActivityIndicator, ScrollView } from 'react-native';
import { Calendar, Clock, DollarSign, Filter, Plus } from 'lucide-react-native';
import { styles, colors } from '../../styles/ParentDashboard.styles';
import BookingItem from './BookingItem';
import { parseDate } from '../../../utils/dateUtils';
import { formatAddress } from '../../../utils/addressUtils';
import { BOOKING_STATUSES } from '../../../constants/bookingStatuses';

const BookingsTab = ({
  bookings = [],
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
  loading = false
}) => {
  const filteredBookings = useMemo(() => {
    if (!Array.isArray(bookings)) return [];
    
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Start of today
    
    switch (bookingsFilter) {
      case 'upcoming':
        return bookings.filter((booking) => {
          if (!booking?.date) return false;
          try {
            const bookingDate = new Date(booking.date);
            bookingDate.setHours(0, 0, 0, 0);
            return bookingDate >= now;
          } catch (error) {
            console.error('Error parsing booking date:', error);
            return false;
          }
        });
        
      case 'past':
        return bookings.filter((booking) => {
          if (!booking?.date) return false;
          try {
            const bookingDate = new Date(booking.date);
            bookingDate.setHours(0, 0, 0, 0);
            return bookingDate < now;
          } catch (error) {
            console.error('Error parsing booking date:', error);
            return false;
          }
        });
        
      case 'pending':
        return bookings.filter(booking => booking?.status === BOOKING_STATUSES.PENDING);
        
      case 'confirmed':
        return bookings.filter(booking => 
          booking?.status === BOOKING_STATUSES.CONFIRMED || 
          booking?.status === BOOKING_STATUSES.IN_PROGRESS
        );
        
      case 'completed':
        return bookings.filter(booking => 
          booking?.status === BOOKING_STATUSES.COMPLETED || 
          booking?.status === BOOKING_STATUSES.PAID
        );
        
      default:
        return bookings;
    }
  }, [bookings, bookingsFilter]);
  
  // Calculate booking statistics
  const bookingStats = useMemo(() => {
    if (!Array.isArray(bookings)) {
      return { total: 0, pending: 0, confirmed: 0, completed: 0, totalSpent: 0 };
    }
    
    return bookings.reduce((stats, booking) => {
      if (!booking) return stats;
      
      stats.total += 1;
      
      // Only count money as "spent" if booking is paid or completed with payment
      const cost = booking.totalCost || booking.amount || 0;
      if (booking.status === BOOKING_STATUSES.PAID || 
          (booking.status === BOOKING_STATUSES.COMPLETED && booking.paymentProof)) {
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
      }
      
      return stats;
    }, { total: 0, pending: 0, confirmed: 0, completed: 0, totalSpent: 0 });
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
      
      console.log('🔍 BookingsTab - Extracted caregiver info:', { caregiverId, caregiverName });
      
      if (onMessageCaregiver) {
        await onMessageCaregiver({
          _id: caregiverId,
          name: caregiverName,
          avatar: caregiver.avatar || caregiver.profileImage
        });
      } else {
        console.log('Starting conversation with caregiver:', {
          recipientId: caregiverId,
          recipientName: caregiverName,
          recipientAvatar: caregiver.avatar || caregiver.profileImage
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
        Alert.alert('No Phone Number', 'Caregiver phone number is not available');
        return;
      }
      
      const phoneNumber = caregiver.phone.replace(/[^0-9+]/g, '');
      
      if (!phoneNumber) {
        Alert.alert('Error', 'Invalid phone number format');
        return;
      }
      
      Alert.alert(
        'Call Caregiver',
        `Call ${caregiver.name || caregiver.firstName || 'caregiver'} at ${caregiver.phone}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Call',
            onPress: () => {
              Linking.openURL(`tel:${phoneNumber}`);
            }
          }
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
      { key: 'upcoming', label: 'Upcoming', count: filteredBookings.length },
      { key: 'pending', label: 'Pending', count: bookingStats.pending },
      { key: 'confirmed', label: 'Active', count: bookingStats.confirmed },
      { key: 'completed', label: 'Done', count: bookingStats.completed }
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
                isActive && styles.activeFilterTab
              ]}
              onPress={() => handleFilterPress(option.key)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`Filter by ${option.label} bookings`}
              accessibilityState={{ selected: isActive }}
            >
              <Text style={[
                styles.filterTabText,
                isActive && styles.activeFilterTabText
              ]}>
                {option.label}
                {option.count !== null && option.count > 0 && (
                  <Text style={[
                    styles.filterTabCount,
                    isActive && { color: colors.textInverse }
                  ]}> ({option.count})</Text>
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
        <Calendar size={48} color={colors.textSecondary} style={styles.emptyIcon} />
        <Text style={styles.emptySectionTitle}>{getEmptyMessage()}</Text>
        <Text style={styles.emptySectionText}>
          {getEmptyDescription()}
        </Text>
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading bookings...</Text>
      </View>
    );
  }

  const getCaregiverFromBooking = (booking) => {
    return booking?.caregiverId || 
           booking?.caregiver || 
           booking?.caregiverProfile || 
           booking?.assignedCaregiver || 
           {};
  };

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
        keyExtractor={(item, index) => item?._id || item?.id || `booking-${index}`}
        renderItem={({ item }) => (
          <BookingItem
            booking={item}
            user={getCaregiverFromBooking(item)}
            onCancelBooking={onCancelBooking}
            onUploadPayment={onUploadPayment}
            onViewBookingDetails={onViewBookingDetails}
            onWriteReview={onWriteReview}
            onMessageCaregiver={handleMessageCaregiver}
            onCallCaregiver={handleCallCaregiver}
          />
        )}
        contentContainerStyle={[
          styles.bookingsList,
          filteredBookings.length === 0 && { flex: 1 }
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

export default BookingsTab;