import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TextInput, 
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

const CaregiverList = () => {
  const navigation = useNavigation();
  const [allCaregivers, setAllCaregivers] = useState([]);
  const [filteredCaregivers, setFilteredCaregivers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Simulate data fetching
  useEffect(() => {
    // In a real app, this would be an API call
    setTimeout(() => {
      const sampleData = [
        { 
          id: '1', 
          name: 'Ana Dela Cruz', 
          rating: 4.8, 
          rate: '$18/hr',
          email: 'ana@example.com',
          skills: ['Child Care', 'First Aid', 'Homework Help']
        },
        { 
          id: '2', 
          name: 'Maria Reyes', 
          rating: 4.6, 
          rate: '$17/hr',
          email: 'maria@example.com',
          skills: ['Elder Care', 'Meal Prep', 'Medication Management']
        },
        { 
          id: '3', 
          name: 'John Santos', 
          rating: 4.9, 
          rate: '$20/hr',
          email: 'john@example.com',
          skills: ['Special Needs', 'Physical Therapy', 'CPR Certified']
        },
      ];
      setAllCaregivers(sampleData);
      setFilteredCaregivers(sampleData);
      setLoading(false);
    }, 1000);
  }, []);

  // Filter function
  const filterCaregivers = (query) => {
    if (!query.trim()) {
      setFilteredCaregivers(allCaregivers);
      return;
    }

    const filtered = allCaregivers.filter(caregiver => 
      caregiver.name.toLowerCase().includes(query.toLowerCase()) ||
      caregiver.skills?.some(skill => 
        skill.toLowerCase().includes(query.toLowerCase())
      ) ||
      caregiver.email?.toLowerCase().includes(query.toLowerCase())
    );
    
    setFilteredCaregivers(filtered);
  };

  // Render each caregiver item
  const renderCaregiverItem = ({ item }) => (
    <TouchableOpacity style={styles.card} activeOpacity={0.8}>
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.meta}>Rating {item.rating} • {item.rate}</Text>
        {item.skills && item.skills.length > 0 && (
          <Text style={styles.skills}>Skills: {item.skills.join(', ')}</Text>
        )}
        <Text style={styles.email}>{item.email}</Text>
      </View>
      <TouchableOpacity
        onPress={() => navigation.navigate('ParentDashboard', { caregiver: item })}
        style={styles.button}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>Book</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Search Input */}
      <TextInput
        style={styles.searchInput}
        placeholder="Search by name, skills, or email..."
        value={searchQuery}
        onChangeText={(text) => {
          setSearchQuery(text);
          filterCaregivers(text);
        }}
      />

      {/* Loading State */}
      {loading && (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#DB2777" />
          <Text style={styles.loadingText}>Loading caregivers...</Text>
        </View>
      )}

      {/* Results */}
      {!loading && filteredCaregivers.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.noResults}>
            {searchQuery ? `No caregivers found for "${searchQuery}"` : 'No caregivers available'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredCaregivers}
          renderItem={renderCaregiverItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 16,
  },
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  listContent: {
    paddingBottom: 20,
  },
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
  name: { 
    fontSize: 16, 
    fontWeight: '700', 
    color: '#111827' 
  },
  meta: { 
    marginTop: 4, 
    fontSize: 13, 
    color: '#6B7280' 
  },
  skills: {
    marginTop: 4,
    color: '#4B5563',
    fontSize: 13,
    fontStyle: 'italic',
  },
  email: {
    marginTop: 4,
    color: '#6B7280',
    fontSize: 13,
  },
  button: {
    backgroundColor: '#DB2777',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  buttonText: { 
    color: '#fff', 
    fontWeight: '700' 
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#6B7280',
  },
  noResults: {
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 16,
  },
});

export default CaregiverList;