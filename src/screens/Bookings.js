import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useIsFocused, useRoute } from '@react-navigation/native';
import { Snackbar } from 'react-native-paper';
import { bookingsAPI } from '../config/api';

const SAMPLE_BOOKINGS = [
  { id: '1', caregiver: 'Jenefa Reyes', date: 'Today', time: '2:00 PM - 6:00 PM', status: 'confirmed' },
  { id: '2', caregiver: 'Maria Reyes', date: 'Tomorrow', time: '9:00 AM - 5:00 PM', status: 'pending' },
];

const StatusChip = ({ status }) => {
  const stylesMap = {
    confirmed: { bg: '#ECFDF5', border: '#86EFAC', color: '#10B981' },
    pending: { bg: '#FFFBEB', border: '#FDE68A', color: '#F59E0B' },
    cancelled: { bg: '#FEF2F2', border: '#FCA5A5', color: '#EF4444' },
  };
  const s = stylesMap[status] || stylesMap.pending;
  return (
    <View style={[styles.statusChip, { backgroundColor: s.bg, borderColor: s.border }]}>
      <Text style={[styles.statusChipText, { color: s.color }]}>{status}</Text>
    </View>
  );
};

const Bookings = () => {
  const route = useRoute();
  const isFocused = useIsFocused();
  const createdBookingId = route?.params?.createdBookingId || null;
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    if (createdBookingId) setSnackbarVisible(true);
  }, [createdBookingId]);

  const fetchBookings = useCallback(async () => {
    setLoadError('');
    try {
      const res = await bookingsAPI.getMy();
      const list = res?.bookings || [];
      setBookings(list);
      setLastUpdated(new Date());
    } catch (e) {
      setLoadError(e?.message || 'Failed to load bookings');
      setBookings([]);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      await fetchBookings();
      if (mounted) setLoading(false);
    })();
    return () => { mounted = false };
  }, [fetchBookings]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchBookings();
    setRefreshing(false);
  }, [fetchBookings]);

  useEffect(() => {
    if (!isFocused) return;
    const id = setInterval(() => {
      fetchBookings();
    }, 30000); // every 30s
    return () => clearInterval(id);
  }, [isFocused, fetchBookings]);

  const displayData = useMemo(() => {
    if (bookings && bookings.length > 0) {
      return bookings.map(b => ({
        id: b._id || b.id,
        caregiver: b.caregiverId?.name || 'Caregiver',
        date: b.date || '',
        time: b.startTime && b.endTime ? `${b.startTime} - ${b.endTime}` : '',
        status: (b.status || 'pending').replace('_', ' '),
      }));
    }
    return SAMPLE_BOOKINGS;
  }, [bookings]);

  const renderItem = ({ item }) => (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{item.caregiver}</Text>
        <Text style={styles.meta}>{item.date} · {item.time}</Text>
      </View>
      <StatusChip status={item.status} />
    </View>
  );

  return (
    <View style={styles.container}>
      {createdBookingId ? (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>Booking created successfully</Text>
          <Text style={styles.bannerSub}>ID: {createdBookingId}</Text>
        </View>
      ) : null}
      <View style={styles.card}>
        <Text style={styles.title}>Upcoming Bookings</Text>
        <Text style={styles.subtle}>Last updated: {lastUpdated ? lastUpdated.toLocaleTimeString() : '—'}</Text>
        {loading ? (
          <View style={{ paddingVertical: 24, alignItems: 'center' }}>
            <ActivityIndicator />
          </View>
        ) : (
          <FlatList
            data={displayData}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderItem}
            contentContainerStyle={{ paddingTop: 8 }}
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        )}
        {loadError ? (
          <Text style={styles.errorText}>{loadError} — showing sample data</Text>
        ) : null}
      </View>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={2500}
      >
        Booking created successfully
      </Snackbar>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB', padding: 16 },
  banner: { backgroundColor: '#ECFDF5', borderColor: '#86EFAC', borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 12 },
  bannerText: { color: '#065F46', fontWeight: '700' },
  bannerSub: { color: '#065F46', marginTop: 4, fontSize: 12 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', padding: 16 },
  title: { fontSize: 16, fontWeight: '700', color: '#111827' },
  subtle: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  name: { fontSize: 15, fontWeight: '700', color: '#111827' },
  meta: { fontSize: 13, color: '#6B7280', marginTop: 4 },
  statusChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1 },
  statusChipText: { fontSize: 12, fontWeight: '700', textTransform: 'lowercase' },
});

export default Bookings;
