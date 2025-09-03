import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Clock } from 'lucide-react-native';
import { styles, colors } from '../../styles/ParentDashboard.styles';
import { 
  parseDate, 
  formatDateFriendly, 
  formatTimeRange, 
  getCaregiverDisplayName 
} from '../utils/dateUtils';

const BookingsSection = ({ bookings, onViewBookings }) => {
  // Filter and sort upcoming bookings
  const today = new Date();
  
  const upcoming = (bookings || [])
    .filter((b) => {
      const bookingDate = parseDate(b.date);
      return bookingDate && bookingDate >= today;
    })
    .sort((a, b) => {
      const dateA = parseDate(a.date) || new Date(0);
      const dateB = parseDate(b.date) || new Date(0);
      return dateA - dateB;
    })
    .slice(0, 3); // Show only 3 upcoming bookings

  return (
    <View style={[styles.sectionCard, { backgroundColor: colors.surface }]}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleContainer}>
          <Clock size={20} color={colors.info} />
          <Text style={styles.sectionTitle}>Upcoming Bookings</Text>
        </View>
        {upcoming.length > 0 && (
          <TouchableOpacity onPress={onViewBookings}>
            <Text style={[styles.sectionActionText, { color: colors.info }]}>
              See all
            </Text>
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.bookingsList}>
        {upcoming.length === 0 ? (
          <View style={styles.emptyState}>
            <Clock size={32} color={colors.textTertiary} />
            <Text style={styles.emptyStateText}>No upcoming bookings</Text>
            <TouchableOpacity onPress={onViewBookings}>
              <Text style={[styles.emptyStateAction, { color: colors.info }]}>
                Book a caregiver
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          upcoming.map((booking) => (
            <View key={booking.id} style={[styles.bookingCard, { backgroundColor: colors.backgroundLight }]}>
              <View style={styles.bookingInfo}>
                <Text style={styles.bookingCaregiver}>
                  {getCaregiverDisplayName(booking.caregiver)}
                </Text>
                <Text style={styles.bookingTime}>
                  {formatDateFriendly(booking.date)} • {formatTimeRange(booking.startTime, booking.endTime)}
                </Text>
              </View>
              <View style={styles.bookingActions}>
                <TouchableOpacity 
                  style={[styles.viewButton, { borderColor: colors.info }]}
                  onPress={onViewBookings}
                >
                  <Text style={[styles.viewButtonText, { color: colors.info }]}>
                    View
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>
    </View>
  );
};

export default BookingsSection;