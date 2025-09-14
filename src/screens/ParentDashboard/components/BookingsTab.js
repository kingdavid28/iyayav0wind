import React, { useMemo } from 'react';
import { View, Text, FlatList, RefreshControl, TouchableOpacity, Alert, Linking } from 'react-native';
import { Calendar, Clock, DollarSign, Filter, Plus } from 'lucide-react-native';
import { styles, colors } from '../../styles/ParentDashboard.styles';
import BookingItem from './BookingItem';
import { parseDate } from '../../../utils/dateUtils';
import { formatAddress } from '../../../utils/addressUtils';
import { BOOKING_STATUSES } from '../../../constants/bookingStatuses';

const BookingsTab = ({
  bookings,
  bookingsFilter,
  setBookingsFilter,
  refreshing,
  onRefresh,
  onCancelBooking,
  onUploadPayment,
  onViewBookingDetails,
  onWriteReview,
  onCreateBooking,
  onMessageCaregiver,
  navigation
}) => {
  const getFilteredBookings = () => {
    if (!bookings || !Array.isArray(bookings)) return [];
    
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Start of today
    
    switch (bookingsFilter) {
      case 'upcoming':
        return bookings.filter((b) => {
          if (!b.date) return false;
          const bookingDate = new Date(b.date);
          bookingDate.setHours(0, 0, 0, 0);
          return bookingDate >= now;
        });
        
      case 'past':
        return bookings.filter((b) => {
          if (!b.date) return false;
          const bookingDate = new Date(b.date);
          bookingDate.setHours(0, 0, 0, 0);
          return bookingDate < now;
        });
        
      case 'pending':
        return bookings.filter(b => b.status === BOOKING_STATUSES.PENDING);
        
      case 'confirmed':
        return bookings.filter(b => 
          b.status === BOOKING_STATUSES.CONFIRMED || 
          b.status === BOOKING_STATUSES.IN_PROGRESS
        );
        
      case 'completed':
        return bookings.filter(b => 
          b.status === BOOKING_STATUSES.COMPLETED || 
          b.status === BOOKING_STATUSES.PAID
        );
        
      default:
        return bookings;
    }
  };

  const filteredBookings = getFilteredBookings();
  
  // Calculate booking statistics
  const bookingStats = useMemo(() => {
    if (!bookings || !Array.isArray(bookings)) {
      return { total: 0, pending: 0, confirmed: 0, completed: 0, totalSpent: 0 };
    }
    
    return bookings.reduce((stats, booking) => {
      stats.total += 1;
      stats.totalSpent += (booking.totalCost || booking.amount || 0);
      
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
      if (!caregiver) {
        Alert.alert('Error', 'Caregiver information not available');
        return;
      }
      
      const caregiverId = caregiver._id || caregiver.id;
      const caregiverName = caregiver.name || caregiver.firstName || 'Caregiver';
      
      if (onMessageCaregiver) {
        onMessageCaregiver(caregiver);
      } else if (navigation) {
        navigation.navigate('Messaging', {
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
      if (!caregiver || !caregiver.phone) {
        Alert.alert('No Phone Number', 'Caregiver phone number is not available');
        return;
      }
      
      const phoneNumber = caregiver.phone.replace(/[^0-9+]/g, '');
      
      Alert.alert(
        'Call Caregiver',
        `Call ${caregiver.name || 'caregiver'} at ${caregiver.phone}?`,
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
      { key: 'upcoming', label: 'Upcoming', count: null },
      { key: 'pending', label: 'Pending', count: bookingStats.pending },
      { key: 'confirmed', label: 'Active', count: bookingStats.confirmed },
      { key: 'completed', label: 'Completed', count: bookingStats.completed }
    ];

    return (
      <View style={styles.bookingsFilterTabs}>
        {filterOptions.map((option) => (
          <TouchableOpacity
            key={option.key}
            style={[
              styles.filterTab,
              bookingsFilter === option.key && styles.activeFilterTab
            ]}
            onPress={() => setBookingsFilter(option.key)}
          >
            <Text style={[
              styles.filterTabText,
              bookingsFilter === option.key && styles.activeFilterTabText
            ]}>
              {option.label}
              {option.count !== null && option.count > 0 && (
                <Text style={styles.filterTabCount}> ({option.count})</Text>
              )}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
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

    return (
      <View style={styles.emptySection}>
        <Calendar size={48} color={colors.textSecondary} style={styles.emptyIcon} />
        <Text style={styles.emptySectionTitle}>{getEmptyMessage()}</Text>
        <Text style={styles.emptySectionText}>
          {bookingsFilter === 'all' 
            ? 'Start by booking a caregiver for your children'
            : 'Check other tabs or create a new booking'
          }
        </Text>
        {onCreateBooking && (
          <TouchableOpacity
            style={styles.emptyActionButton}
            onPress={onCreateBooking}
          >
            <Plus size={20} color="#FFFFFF" />
            <Text style={styles.emptyActionButtonText}>Book a Caregiver</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.bookingsContent, { flex: 1 }]}>
      <View style={styles.bookingsHeader}>
        <View style={styles.bookingsHeaderTop}>
          <Text style={styles.bookingsTitle}>My Bookings</Text>
          {onCreateBooking && (
            <TouchableOpacity
              style={styles.createBookingButton}
              onPress={onCreateBooking}
            >
              <Plus size={20} color="#FFFFFF" />
              <Text style={styles.createBookingButtonText}>Book</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {bookingStats.total > 0 && renderStatsHeader()}
        {renderFilterTabs()}
      </View>

      <FlatList
        style={{ flex: 1 }}
        data={filteredBookings}
        keyExtractor={(item) => item._id || item.id || String(Math.random())}
        renderItem={({ item }) => (
          <BookingItem
            item={item}
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
