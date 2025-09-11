import React from 'react';
import { ScrollView, View, Text } from 'react-native';
import { Chip } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles/CaregiverDashboard.styles';

export default function BookingsTab({ 
  bookings, 
  onBookingView, 
  onMessageFamily 
}) {
  return (
    <ScrollView style={styles.content}>
      <View style={styles.section}>
        <View style={styles.bookingFilters}>
          <Chip
            style={[styles.bookingFilterChip, styles.bookingFilterChipActive]}
            textStyle={styles.bookingFilterChipText}
          >
            Upcoming
          </Chip>
          <Chip
            style={styles.bookingFilterChip}
            textStyle={styles.bookingFilterChipText}
          >
            Past
          </Chip>
          <Chip
            style={styles.bookingFilterChip}
            textStyle={styles.bookingFilterChipText}
          >
            Cancelled
          </Chip>
        </View>

        {bookings.length > 0 ? (
          bookings.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              onMessage={() => onMessageFamily(booking)}
              onViewDetails={() => onBookingView(booking)}
            />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="calendar" size={48} color="#9CA3AF" />
            <Text style={styles.emptyStateText}>No bookings yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Your upcoming bookings will appear here
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}