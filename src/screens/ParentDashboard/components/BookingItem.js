import React from 'react';
import { View, Text, TouchableOpacity, Image, Alert } from 'react-native';
import { Calendar, Clock, Baby, MapPin, Star, MessageCircle, Phone, CreditCard, Eye, X } from 'lucide-react-native';
import { StatusBadge } from '../../../shared/ui';
import { styles, colors } from '../../styles/ParentDashboard.styles';
import { formatDateFriendly, formatTimeRange } from '../../../utils/dateUtils';
import { getCaregiverDisplayName, normalizeStatus, getStatusColor } from '../../../utils/caregiverUtils';
import { BOOKING_STATUSES, STATUS_LABELS } from '../../../constants/bookingStatuses';
import { getPaymentActions, calculateDeposit, calculateRemainingPayment } from '../../../utils/paymentUtils';
import { formatAddress } from '../../../utils/addressUtils';

const BookingItem = ({ 
  item, 
  onCancelBooking, 
  onUploadPayment, 
  onViewBookingDetails, 
  onWriteReview,
  onMessageCaregiver,
  onCallCaregiver 
}) => {
  const handleCancelBooking = () => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking?',
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Yes, Cancel', 
          style: 'destructive',
          onPress: () => onCancelBooking(item._id || item.id)
        }
      ]
    );
  };

  const getChildrenDisplay = () => {
    if (Array.isArray(item.children)) {
      return item.children.map(child => {
        if (typeof child === 'object' && child.name) {
          return `${child.name} (${child.age}y)`;
        }
        return child;
      }).join(', ');
    }
    if (typeof item.children === 'number') {
      return `${item.children} children`;
    }
    return 'No children specified';
  };

  const getPaymentAmount = (paymentType) => {
    const totalCost = item.totalCost || item.amount || 0;
    if (paymentType === 'deposit') {
      return calculateDeposit(totalCost);
    }
    if (paymentType === 'final_payment') {
      return calculateRemainingPayment(totalCost);
    }
    return totalCost;
  };

  const renderStatusBadge = () => {
    const status = normalizeStatus(item.status);
    const statusColor = getStatusColor(status);
    
    return (
      <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
        <Text style={styles.statusBadgeText}>
          {STATUS_LABELS[status] || status}
        </Text>
      </View>
    );
  };

  const renderActionButtons = () => {
    const status = normalizeStatus(item.status);
    
    switch (status) {
      case BOOKING_STATUSES.PENDING:
        return (
          <View style={styles.bookingActionsRow}>
            <TouchableOpacity
              style={[styles.bookingActionButton, styles.payButton]}
              onPress={() => onUploadPayment(item._id || item.id, 'deposit')}
            >
              <CreditCard size={16} color="#FFFFFF" />
              <Text style={styles.payButtonText}>
                Pay Deposit (₱{getPaymentAmount('deposit').toFixed(0)})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.bookingActionButton, styles.cancelButton]}
              onPress={handleCancelBooking}
            >
              <X size={16} color="#EF4444" />
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        );
        
      case BOOKING_STATUSES.CONFIRMED:
        return (
          <View style={styles.bookingActionsRow}>
            <TouchableOpacity
              style={[styles.bookingActionButton, styles.viewButton]}
              onPress={() => {
                Alert.alert(
                  'Booking Details',
                  `Caregiver: ${getCaregiverDisplayName(item.caregiver)}\nDate: ${formatDateFriendly(item.date)}\nTime: ${formatTimeRange(item.startTime, item.endTime)}\nLocation: ${item.address || item.location || 'Not specified'}\nTotal Cost: ₱${(item.totalCost || item.amount || 0).toFixed(0)}`,
                  [{ text: 'OK' }]
                );
              }}
            >
              <Eye size={16} color="#3B82F6" />
              <Text style={styles.viewButtonText}>View Details</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.bookingActionButton, styles.messageButton]}
              onPress={() => onMessageCaregiver && onMessageCaregiver(item.caregiver)}
            >
              <MessageCircle size={16} color="#10B981" />
              <Text style={styles.messageButtonText}>Message</Text>
            </TouchableOpacity>
          </View>
        );
        
      case BOOKING_STATUSES.IN_PROGRESS:
        return (
          <View style={styles.bookingActionsRow}>
            <TouchableOpacity
              style={[styles.bookingActionButton, styles.callButton]}
              onPress={() => onCallCaregiver && onCallCaregiver(item.caregiver)}
            >
              <Phone size={16} color="#FFFFFF" />
              <Text style={styles.callButtonText}>Call Caregiver</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.bookingActionButton, styles.messageButton]}
              onPress={() => onMessageCaregiver && onMessageCaregiver(item.caregiver)}
            >
              <MessageCircle size={16} color="#10B981" />
              <Text style={styles.messageButtonText}>Message</Text>
            </TouchableOpacity>
          </View>
        );
        
      case BOOKING_STATUSES.COMPLETED:
        return (
          <View style={styles.bookingActionsRow}>
            <TouchableOpacity
              style={[styles.bookingActionButton, styles.payButton]}
              onPress={() => onUploadPayment(item._id || item.id, 'final_payment')}
            >
              <CreditCard size={16} color="#FFFFFF" />
              <Text style={styles.payButtonText}>
                Final Payment (₱{getPaymentAmount('final_payment').toFixed(0)})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.bookingActionButton, styles.reviewButton]}
              onPress={() => onWriteReview(item._id || item.id, item.caregiverId)}
            >
              <Star size={16} color="#F59E0B" />
              <Text style={styles.reviewButtonText}>Rate & Review</Text>
            </TouchableOpacity>
          </View>
        );
        
      case BOOKING_STATUSES.PAID:
        return (
          <View style={styles.bookingActionsRow}>
            <TouchableOpacity
              style={[styles.bookingActionButton, styles.reviewButton]}
              onPress={() => onWriteReview(item._id || item.id, item.caregiverId)}
            >
              <Star size={16} color="#F59E0B" />
              <Text style={styles.reviewButtonText}>Write Review</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.bookingActionButton, styles.viewButton]}
              onPress={() => {
                Alert.alert(
                  'Payment Receipt',
                  `Booking ID: ${item._id || item.id}\nCaregiver: ${getCaregiverDisplayName(item.caregiver)}\nAmount Paid: ₱${(item.totalCost || item.amount || 0).toFixed(0)}\nStatus: Paid`,
                  [{ text: 'OK' }]
                );
              }}
            >
              <Eye size={16} color="#3B82F6" />
              <Text style={styles.viewButtonText}>View Receipt</Text>
            </TouchableOpacity>
          </View>
        );
        
      default:
        return null;
    }
  };

  // Debug logging for caregiver data
  console.log('📋 BookingItem - Full item:', item);
  console.log('📋 BookingItem - Caregiver data:', item.caregiverId);
  console.log('📋 BookingItem - Caregiver avatar sources:', {
    caregiverAvatar: item.caregiverAvatar,
    caregiverIdAvatar: item.caregiverId?.avatar,
    caregiverIdProfileImage: item.caregiverId?.profileImage,
    caregiverAvatar2: item.caregiver?.avatar,
    caregiverProfileImage2: item.caregiver?.profileImage
  });

  const getFullImageURL = (imagePath) => {
    if (!imagePath) return 'https://via.placeholder.com/50x50/E5E7EB/6B7280?text=CG';
    if (imagePath.startsWith('http')) return imagePath;
    if (imagePath.startsWith('/uploads/')) {
      return `http://192.168.1.9:5000${imagePath}`;
    }
    return imagePath;
  };

  const caregiverImageUri = getFullImageURL(
    item.caregiverId?.profileImage || 
    item.caregiverId?.avatar || 
    item.caregiverAvatar || 
    item.caregiver?.avatar || 
    item.caregiver?.profileImage
  );

  console.log('📋 BookingItem - Final image URI:', caregiverImageUri);

  return (
    <View style={styles.bookingItemCard}>
      <View style={styles.bookingItemHeader}>
        <View style={styles.bookingCaregiverInfo}>
          <Image
            source={{ uri: caregiverImageUri }}
            style={styles.bookingAvatar}
          />
          <View style={styles.bookingCaregiverDetails}>
            <Text style={styles.bookingCaregiverName}>
              {getCaregiverDisplayName(item.caregiverId || item.caregiver)}
            </Text>
            {renderStatusBadge()}
          </View>
        </View>
        <View style={styles.bookingCostContainer}>
          <Text style={styles.bookingCost}>₱{(item.totalCost || item.amount || 0).toFixed(0)}</Text>
          <Text style={styles.bookingCostLabel}>Total</Text>
        </View>
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
            {getChildrenDisplay()}
          </Text>
        </View>
        {(item.address || item.location) && (
          <View style={styles.bookingDetailRow}>
            <MapPin size={16} color={colors.textSecondary} />
            <Text style={styles.bookingDetailText} numberOfLines={1}>
              {formatAddress(item.address || item.location)}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.bookingActions}>
        {renderActionButtons()}
      </View>
    </View>
  );
};

export default BookingItem;
