import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import ModalWrapper from './ModalWrapper';
import { formatDate } from '../utils';

const SimpleBookingModal = ({
  visible,
  booking,
  onClose,
  actions = [],
  title = 'Booking summary',
}) => {
  if (!visible || !booking) {
    return null;
  }

  const [startTime, endTime] = (() => {
    if (booking.time?.includes(' - ')) {
      const parts = booking.time.split(' - ');
      return [parts[0], parts[1] || null];
    }
    return [booking.startTime || null, booking.endTime || null];
  })();

  return (
    <ModalWrapper visible={visible} onClose={onClose} style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {booking.status ? (
          <View style={[styles.statusPill, statusStyles[booking.status?.toLowerCase()] || statusStyles.default]}>
            <Text style={styles.statusText}>{booking.status.toUpperCase()}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Family</Text>
        <Text style={styles.sectionValue}>{booking.family || booking.caregiverName || '—'}</Text>
      </View>

      <View style={styles.rowGroup}>
        <View style={styles.rowTile}>
          <Text style={styles.sectionLabel}>Date</Text>
          <Text style={styles.sectionValue}>{booking.date ? formatDate(booking.date) : '—'}</Text>
        </View>
        <View style={styles.rowTile}>
          <Text style={styles.sectionLabel}>Time</Text>
          <Text style={styles.sectionValue}>{startTime && endTime ? `${startTime} - ${endTime}` : startTime || endTime || '—'}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Location</Text>
        <Text style={styles.sectionValue}>{booking.location || '—'}</Text>
      </View>

      {booking.children !== undefined && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Children</Text>
          <Text style={styles.sectionValue}>
            {booking.children} {booking.children === 1 ? 'child' : 'children'}
          </Text>
        </View>
      )}

      {booking.notes ? (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Notes</Text>
          <Text style={styles.notes}>{booking.notes}</Text>
        </View>
      ) : null}

      {Array.isArray(actions) && actions.length > 0 ? (
        <View style={styles.actions}>
          {actions.map(({ label, onPress = () => {}, tone = 'primary' }, index) => (
            <TouchableOpacity
              key={`${label}-${index}`}
              onPress={() => onPress(booking)}
              style={[styles.actionButton, toneStyles[tone] || toneStyles.primary]}
            >
              <Text style={[styles.actionLabel, tone === 'tertiary' ? styles.actionLabelTertiary : undefined]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}

      <TouchableOpacity onPress={onClose} style={[styles.actionButton, styles.closeButton]}>
        <Text style={styles.closeLabel}>Close</Text>
      </TouchableOpacity>
    </ModalWrapper>
  );
};

const toneStyles = {
  primary: {
    backgroundColor: '#2563EB',
  },
  secondary: {
    backgroundColor: '#E5E7EB',
  },
  danger: {
    backgroundColor: '#F87171',
  },
  tertiary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
};

const statusStyles = {
  confirmed: {
    backgroundColor: '#DCFCE7',
  },
  pending: {
    backgroundColor: '#FEF3C7',
  },
  cancelled: {
    backgroundColor: '#FEE2E2',
  },
  completed: {
    backgroundColor: '#DBEAFE',
  },
  default: {
    backgroundColor: '#E5E7EB',
  },
};

const styles = StyleSheet.create({
  card: {
    width: '92%',
    maxWidth: 420,
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
  },
  section: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: '#6B7280',
    marginBottom: 4,
  },
  sectionValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  rowGroup: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  rowTile: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 12,
  },
  notes: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  actionButton: {
    flexGrow: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  actionLabelTertiary: {
    color: '#111827',
  },
  closeButton: {
    marginTop: 12,
    backgroundColor: '#F3F4F6',
  },
  closeLabel: {
    color: '#111827',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default SimpleBookingModal;
