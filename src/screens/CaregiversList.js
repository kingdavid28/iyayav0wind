import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const SAMPLE_CAREGIVERS = [
  { id: '1', name: 'Sarah Johnson', rating: 4.8, rate: '$18/hr' },
  { id: '2', name: 'Maria Reyes', rating: 4.6, rate: '$17/hr' },
];

const CaregiversList = () => {
  const navigation = useNavigation();

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.card} activeOpacity={0.8}>
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.meta}>Rating {item.rating} • {item.rate}</Text>
      </View>
      <TouchableOpacity
        onPress={() => navigation.navigate('ParentDashboard')}
        style={styles.button}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>Book</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={SAMPLE_CAREGIVERS}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16 }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: { fontSize: 16, fontWeight: '700', color: '#111827' },
  meta: { marginTop: 4, fontSize: 13, color: '#6B7280' },
  button: {
    backgroundColor: '#DB2777',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  buttonText: { color: '#fff', fontWeight: '700' },
});

export default CaregiversList;
