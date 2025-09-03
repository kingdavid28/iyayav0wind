import React from 'react';
import { View, Text, FlatList, RefreshControl } from 'react-native';
import { styles, colors } from '../../styles/ParentDashboard.styles';
import BookingItem from './BookingItem';
import { TouchableOpacity } from 'react-native';

const BookingsTab = ({
  bookings,
  bookingsFilter,
  setBookingsFilter,
  refreshing,
  onRefresh,
  onCancelBooking,
  onUploadPayment,
  onViewBookingDetails,
  onWriteReview
}) => {
  const getFilteredBookings = () => {
    const now = new Date();
    if (bookingsFilter === 'all') return bookings;
    return bookings.filter((b) => {
      const bd = parseDate(b.date);
      if (!bd) return bookingsFilter === 'all';
      return bookingsFilter === 'upcoming' ? bd >= new Date(now.toDateString()) : bd < new Date(now.toDateString());
    });
  };

  const filteredBookings = getFilteredBookings();

  return (
    <View style={styles.bookingsContent}>
      <View style={styles.bookingsHeader}>
        <Text style={styles.bookingsTitle}>My Bookings</Text>
        <View style={styles.bookingsFilterTabs}>
          <TouchableOpacity
            style={[
              styles.filterTab,
              bookingsFilter === 'upcoming' && styles.activeFilterTab
            ]}
            onPress={() => setBookingsFilter('upcoming')}
          >
            <Text style={[
              styles.filterTabText,
              bookingsFilter === 'upcoming' && styles.activeFilterTabText
            ]}>
              Upcoming
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterTab,
              bookingsFilter === 'past' && styles.activeFilterTab
            ]}
            onPress={() => setBookingsFilter('past')}
          >
            <Text style={[
              styles.filterTabText,
              bookingsFilter === 'past' && styles.activeFilterTabText
            ]}>
              Past
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterTab,
              bookingsFilter === 'all' && styles.activeFilterTab
            ]}
            onPress={() => setBookingsFilter('all')}
          >
            <Text style={[
              styles.filterTabText,
              bookingsFilter === 'all' && styles.activeFilterTabText
            ]}>
              All
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={filteredBookings}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <BookingItem
            item={item}
            onCancelBooking={onCancelBooking}
            onUploadPayment={onUploadPayment}
            onViewBookingDetails={onViewBookingDetails}
            onWriteReview={onWriteReview}
          />
        )}
        contentContainerStyle={styles.bookingsList}
        ListEmptyComponent={
          <View style={styles.emptySection}>
            <Text style={styles.emptySectionText}>
              {bookingsFilter === 'upcoming' 
                ? 'No upcoming bookings' 
                : bookingsFilter === 'past' 
                  ? 'No past bookings' 
                  : 'No bookings found'}
            </Text>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      />
    </View>
  );
};

export default BookingsTab;