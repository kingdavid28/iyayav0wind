import React, { useMemo, useState } from 'react';
import { View, FlatList, RefreshControl, ActivityIndicator } from 'react-native';
import { useTheme } from 'react-native-paper';
import { EmptyState, SectionTitle } from '../../shared/ui';
import BookingCard from '../../shared/ui/cards/BookingCard';
import BookingDetailsSheet from './components/BookingDetailsSheet';
import { styles } from '../styles/CaregiverDashboard.styles';

const FILTERS = [
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

const filterBookings = (bookings, filterKey) => {
  if (!Array.isArray(bookings)) return [];

  switch (filterKey) {
    case 'completed':
      return bookings.filter(b => ['completed', 'paid'].includes((b.status || '').toLowerCase()));
    case 'cancelled':
      return bookings.filter(b => ['cancelled'].includes((b.status || '').toLowerCase()));
      case 'upcoming':
        default:
          return bookings.filter(b =>
            ['pending', 'pending_confirmation', 'confirmed', 'in_progress']
              .includes((b.status || '').toLowerCase())
          );
  }
};

export default function BookingsTab({
  bookings = [],
  onBookingView,
  onMessageFamily,
  refreshing = false,
  onRefresh,
  loading = false,
}) {
  const { colors } = useTheme();
  const [activeFilter, setActiveFilter] = useState('upcoming');
  const [selectedBooking, setSelectedBooking] = useState(null);

  const filteredBookings = useMemo(() => filterBookings(bookings, activeFilter), [bookings, activeFilter]);

  const handleViewDetails = (booking) => {
    setSelectedBooking(booking);
  };

  const handleCloseModal = () => {
    setSelectedBooking(null);
  };

  return (
    <View style={styles.bookingsTabContainer}>
      <View style={styles.bookingsHeaderRow}>
        <SectionTitle
          title="Bookings"
          subtitle={
            filteredBookings.length
              ? `${filteredBookings.length} ${activeFilter} ${filteredBookings.length === 1 ? 'booking' : 'bookings'}`
              : 'Stay organized with your scheduled jobs'
          }
        />
      </View>

      <View style={styles.bookingsFilterRow}>
        {FILTERS.map(({ key, label }) => {
          const isActive = activeFilter === key;
          return (
            <View
              key={key}
              style={[
                styles.bookingsFilterChip,
                isActive && { backgroundColor: colors.primary },
              ]}
            >
              <SectionTitle
                asButton
                title={label}
                onPress={() => setActiveFilter(key)}
                textStyle={[
                  styles.bookingsFilterChipText,
                  isActive && { color: colors.onPrimary },
                ]}
              />
            </View>
          );
        })}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredBookings}
          keyExtractor={(item, index) => item.id || item._id || `booking-${index}`}
          renderItem={({ item }) => (
            <BookingCard
              booking={{
                caregiverName: item.family,
                parentName: item.caregiver,
                date: item.date,
                startTime: item.time?.split(' - ')[0],
                endTime: item.time?.split(' - ')[1],
                status: item.status,
                totalAmount: item.rate || item.hourlyRate,
                childrenCount: item.children,
                location: item.location,
                notes: item.notes,
                paymentStatus: item.paymentStatus,
              }}
              onPress={() => handleViewDetails(item)}
              onCancel={() => handleViewDetails(item)}
              onComplete={() => handleViewDetails(item)}
              showActions={false}
              userType="caregiver"
            />
          )}
          contentContainerStyle={filteredBookings.length === 0 && styles.bookingsEmptyList}
          ListEmptyComponent={
            <EmptyState
              icon="calendar"
              title="No bookings"
              subtitle={
                activeFilter === 'upcoming'
                  ? 'You have no upcoming jobs yet. Keep applying to build your schedule.'
                  : 'Switch filters above to explore other booking types.'
              }
            />
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
      )}

      <BookingDetailsSheet
        visible={!!selectedBooking}
        booking={selectedBooking}
        onClose={handleCloseModal}
        onMessageFamily={onMessageFamily}
        onOpenBooking={onBookingView}
      />
    </View>
  );
}