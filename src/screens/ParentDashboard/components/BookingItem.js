import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Calendar, Clock, Baby, MapPin } from 'lucide-react-native';
import { StatusBadge } from '../../../shared/ui';
import { styles, colors } from '../../styles/ParentDashboard.styles';
import { formatDateFriendly, formatTimeRange } from '../../../utils/dateUtils';
import { getCaregiverDisplayName, normalizeStatus } from '../../../utils/caregiverUtils';
import { formatAddress } from '../../../utils/addressUtils';

const BookingItem = ({ 
  item, 
  onCancelBooking, 
  onUploadPayment, 
  onViewBookingDetails, 
  onWriteReview 
}) => {


  return (
    <View style={styles.bookingItemCard}>
      <View style={styles.bookingItemHeader}>
        <View style={styles.bookingCaregiverInfo}>
          <Image
            source={{ uri: item.caregiverAvatar || 'https://via.placeholder.com/40' }}
            style={styles.bookingAvatar}
          />
          <View style={styles.bookingCaregiverDetails}>
            <Text style={styles.bookingCaregiverName}>
              {getCaregiverDisplayName(item.caregiver)}
            </Text>
            <StatusBadge status={normalizeStatus(item.status)} />
          </View>
        </View>
        <Text style={styles.bookingCost}>₱{item.totalCost}</Text>
      </View>
      
      <View style={styles.bookingDetails}>
        <View style={styles.bookingDetailRow}>
          <Calendar size={16} color={colors.textSecondary} />
          <Text style={styles.bookingDetailText}>
            {formatDateFriendly(item.date)}
          </Text>
        </View>
        <View style={styles.bookingDetailRow}>
          <Clock size={16} color={colors.textSecondary} />
          <Text style={styles.bookingDetailText}>
            {formatTimeRange(item.startTime, item.endTime)}
          </Text>
        </View>
        <View style={styles.bookingDetailRow}>
          <Baby size={16} color={colors.textSecondary} />
          <Text style={styles.bookingDetailText}>
            {item.children?.join(', ') || 'No children specified'}
          </Text>
        </View>
        {item.address && (
          <View style={styles.bookingDetailRow}>
            <MapPin size={16} color={colors.textSecondary} />
            <Text style={styles.bookingDetailText} numberOfLines={1}>
              {formatAddress(item.address)}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.bookingActions}>
        {item.status === 'pending' && (
          <>
            <TouchableOpacity
              style={[styles.bookingActionButton, styles.payButton]}
              onPress={() => onUploadPayment(item.id)}
            >
              <Text style={styles.payButtonText}>Upload Payment</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.bookingActionButton, styles.cancelButton]}
              onPress={() => onCancelBooking(item.id)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </>
        )}
        {item.status === 'confirmed' && (
          <TouchableOpacity
            style={[styles.bookingActionButton, styles.viewButton]}
            onPress={() => onViewBookingDetails(item.id)}
          >
            <Text style={styles.viewButtonText}>View Details</Text>
          </TouchableOpacity>
        )}
        {item.status === 'completed' && (
          <TouchableOpacity
            style={[styles.bookingActionButton, styles.reviewButton]}
            onPress={() => onWriteReview(item.id, item.caregiverId)}
          >
            <Text style={styles.reviewButtonText}>Write Review</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default BookingItem;
