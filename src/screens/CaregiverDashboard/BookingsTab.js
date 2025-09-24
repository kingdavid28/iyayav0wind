import React from 'react';
import { ScrollView, View, Text, RefreshControl, ActivityIndicator } from 'react-native';
import { Chip } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { EmptyState } from '../../shared/ui';
import { styles } from '../styles/CaregiverDashboard.styles';

export default function BookingsTab({ 
  bookings, 
  onBookingView, 
  onMessageFamily,
  refreshing = false,
  onRefresh,
  loading = false
}) {
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading bookings...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#3B82F6']}
          tintColor="#3B82F6"
        />
      }
    >
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
          <EmptyState 
            icon="calendar" 
            title="No bookings yet"
            subtitle="Your upcoming bookings will appear here"
          />
        )}
      </View>
    </ScrollView>
  );
}