import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatDate } from '../../utils';
import { StatusBadge } from '../StatusBadge';

const ApplicationCard = ({ application, onPress, onWithdraw, showActions = true }) => {
  const {
    jobTitle,
    employerName,
    appliedDate,
    status,
    message,
    hourlyRate,
    jobDate,
    location
  } = application;

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'accepted': return '#10b981';
      case 'rejected': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.jobInfo}>
          <Text style={styles.jobTitle} numberOfLines={1}>{jobTitle}</Text>
          <Text style={styles.employerName}>{employerName}</Text>
        </View>
        <StatusBadge status={status} color={getStatusColor(status)} />
      </View>

      {message && (
        <Text style={styles.message} numberOfLines={2}>
          "{message}"
        </Text>
      )}

      <View style={styles.details}>
        <View style={styles.detailRow}>
          <Ionicons name="calendar" size={16} color="#6b7280" />
          <Text style={styles.detailText}>Job: {formatDate(jobDate)}</Text>
        </View>

        <View style={styles.detailRow}>
          <Ionicons name="location" size={16} color="#6b7280" />
          <Text style={styles.detailText}>{location}</Text>
        </View>

        <View style={styles.detailRow}>
          <Ionicons name="cash" size={16} color="#6b7280" />
          <Text style={styles.detailText}>₱{hourlyRate}/hour</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.appliedDate}>
          Applied {formatDate(appliedDate)}
        </Text>
        {showActions && status === 'pending' && (
          <TouchableOpacity style={styles.withdrawButton} onPress={onWithdraw}>
            <Text style={styles.withdrawText}>Withdraw</Text>
          </TouchableOpacity>
        )}
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
  jobInfo: {
    flex: 1,
    marginRight: 8,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  employerName: {
    fontSize: 14,
    color: '#6b7280',
  },
  message: {
    fontSize: 14,
    color: '#374151',
    fontStyle: 'italic',
    marginBottom: 12,
    paddingLeft: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#e5e7eb',
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
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  appliedDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  withdrawButton: {
    backgroundColor: '#fef2f2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  withdrawText: {
    color: '#dc2626',
    fontSize: 12,
    fontWeight: '500',
  },
};

export default ApplicationCard;