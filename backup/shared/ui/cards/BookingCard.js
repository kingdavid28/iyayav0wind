import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatDate, formatTimeRange } from '../../utils';
import { StatusBadge } from '../StatusBadge';

const BookingCard = ({ booking, onPress, onCancel, onComplete, showActions = true, userType = 'parent' }) => {
  const {
    caregiverName,
    parentName,
    date,
    startTime,
    endTime,
    status,
    totalAmount,
    childrenCount,
    location,
    notes,
    paymentStatus
  } = booking;

  const displayName = userType === 'parent' ? caregiverName : parentName;

  const getActionButtons = () => {
    if (!showActions) return null;

    switch (status) {
      case 'confirmed':
        return (
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.completeButton} onPress={onComplete}>
              <Text style={styles.completeText}>Complete</Text>
            </TouchableOpacity>
          </View>
        );
      case 'pending':
        return (
          <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        );
      default:
        return null;
    }
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.personInfo}>
          <Text style={styles.personName}>{displayName}</Text>
          <Text style={styles.userTypeLabel}>
            {userType === 'parent' ? 'Caregiver' : 'Parent'}
          </Text>
        </View>
        <StatusBadge status={status} />
      </View>

      <View style={styles.details}>
        <View style={styles.detailRow}>
          <Ionicons name="calendar" size={16} color="#6b7280" />
          <Text style={styles.detailText}>
            {formatDate(date)} • {formatTimeRange(startTime, endTime)}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Ionicons name="location" size={16} color="#6b7280" />
          <Text style={styles.detailText}>{location}</Text>
        </View>

        <View style={styles.detailRow}>
          <Ionicons name="people" size={16} color="#6b7280" />
          <Text style={styles.detailText}>{childrenCount} children</Text>
        </View>

        {paymentStatus && (
          <View style={styles.detailRow}>
            <Ionicons name="card" size={16} color="#6b7280" />
            <Text style={styles.detailText}>Payment: {paymentStatus}</Text>
          </View>
        )}
      </View>

      {notes && (
        <Text style={styles.notes} numberOfLines={2}>
          Note: {notes}
        </Text>
      )}

      <View style={styles.footer}>
        <Text style={styles.amount}>₱{totalAmount}</Text>
        {getActionButtons()}
      </View>
    </TouchableOpacity>
  );
};

const styles = {
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  personInfo: {
    flex: 1,
  },
  personName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  userTypeLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  details: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
  },
  notes: {
    fontSize: 14,
    color: '#374151',
    fontStyle: 'italic',
    marginBottom: 12,
    paddingLeft: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#e5e7eb',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amount: {
    fontSize: 18,
    fontWeight: '600',
    color: '#059669',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  cancelButton: {
    backgroundColor: '#fef2f2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  cancelText: {
    color: '#dc2626',
    fontSize: 12,
    fontWeight: '500',
  },
  completeButton: {
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  completeText: {
    color: '#16a34a',
    fontSize: 12,
    fontWeight: '500',
  },
};

export default BookingCard;