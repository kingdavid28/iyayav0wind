import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';

const INITIAL_CHILDREN = [
  { id: '1', name: 'Emma', age: 3 },
  { id: '2', name: 'Liam', age: 5 },
];

const Children = () => {
  const [children, setChildren] = useState(INITIAL_CHILDREN);
  const [name, setName] = useState('');
  const [age, setAge] = useState('');

  const addChild = () => {
    if (!name.trim() || !age) return;
    setChildren(prev => [...prev, { id: Date.now().toString(), name: name.trim(), age: Number(age) }]);
    setName('');
    setAge('');
  };

  const renderItem = ({ item }) => (
    <View style={styles.row}>
      <View>
        <Text style={styles.childName}>{item.name}</Text>
        <Text style={styles.childMeta}>Age {item.age}</Text>
      </View>
      <TouchableOpacity style={styles.editBtn} activeOpacity={0.8}>
        <Text style={styles.editText}>Edit</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Add Child</Text>
        <View style={styles.formRow}>
          <TextInput
            style={styles.input}
            placeholder="Name"
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={[styles.input, { width: 100 }]}
            placeholder="Age"
            value={age}
            onChangeText={setAge}
            keyboardType="numeric"
          />
          <TouchableOpacity onPress={addChild} style={styles.addBtn} activeOpacity={0.8}>
            <Text style={styles.addText}>+ Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.card, { marginTop: 12 }] }>
        <Text style={styles.title}>Your Children</Text>
        <FlatList
          data={children}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingTop: 8 }}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB', padding: 16 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', padding: 16 },
  title: { fontSize: 16, fontWeight: '700', color: '#111827' },
  formRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  input: { flex: 1, height: 44, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 12, backgroundColor: '#fff', marginRight: 8 },
  addBtn: { backgroundColor: '#2563EB', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10 },
  addText: { color: '#fff', fontWeight: '700' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  childName: { fontSize: 15, fontWeight: '700', color: '#111827' },
  childMeta: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  editBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, backgroundColor: '#FDE2E9' },
  editText: { color: '#DB2777', fontWeight: '700' },
});

export default Children;
