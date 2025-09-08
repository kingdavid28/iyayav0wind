import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { settingsService } from '../services/settingsService';

export function DataManagement({ user, userType, colors }) {
  const [activeSection, setActiveSection] = useState('profile');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const sections = [
    { id: 'profile', label: 'Profile Data', icon: 'person-outline' },
    { id: 'jobs', label: 'Jobs', icon: 'briefcase-outline' },
    { id: 'bookings', label: 'Bookings', icon: 'calendar-outline' },
    { id: 'applications', label: 'Applications', icon: 'document-text-outline' },
  ];

  const loadData = async (section) => {
    setLoading(true);
    try {
      let result;
      switch (section) {
        case 'profile':
          result = await settingsService.getProfile();
          setData([result]);
          break;
        case 'jobs':
        case 'bookings':
        case 'applications':
          result = await settingsService.getDataUsage();
          setData(result[section] || []);
          break;
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load data');
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (item, section) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this item?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Implement delete logic based on section
              await loadData(section);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete item');
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }) => (
    <View style={styles.dataItem}>
      <View style={styles.itemContent}>
        <Text style={styles.itemTitle}>
          {item.name || item.title || item.family || 'Unnamed Item'}
        </Text>
        <Text style={styles.itemSubtitle}>
          {item.email || item.location || item.status || 'No details'}
        </Text>
      </View>
      <View style={styles.itemActions}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.primary }]}
          onPress={() => {/* Edit logic */}}
        >
          <Ionicons name="create-outline" size={16} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDelete(item, activeSection)}
        >
          <Ionicons name="trash-outline" size={16} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Data Management</Text>
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sectionTabs}>
        {sections.map((section) => (
          <TouchableOpacity
            key={section.id}
            style={[
              styles.sectionTab,
              activeSection === section.id && [styles.activeSectionTab, { borderBottomColor: colors.primary }]
            ]}
            onPress={() => {
              setActiveSection(section.id);
              loadData(section.id);
            }}
          >
            <Ionicons
              name={section.icon}
              size={18}
              color={activeSection === section.id ? colors.primary : '#6B7280'}
            />
            <Text
              style={[
                styles.sectionTabText,
                activeSection === section.id && { color: colors.primary }
              ]}
            >
              {section.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.dataContainer}>
        {loading ? (
          <Text style={styles.loadingText}>Loading...</Text>
        ) : data.length > 0 ? (
          data.map((item, index) => (
            <View key={item.id || item._id || index}>
              {renderItem({ item, index })}
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No data available</Text>
        )}
        
        <View style={styles.exportSection}>
          <TouchableOpacity
            style={[styles.exportButton, { backgroundColor: colors.primary }]}
            onPress={async () => {
              try {
                await settingsService.exportUserData();
                Alert.alert('Success', 'Data export initiated. You will receive an email with your data.');
              } catch (error) {
                Alert.alert('Error', 'Failed to export data');
              }
            }}
          >
            <Ionicons name="download-outline" size={20} color="#FFFFFF" />
            <Text style={styles.exportButtonText}>Export All Data</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.exportButton, styles.deleteAllButton]}
            onPress={() => {
              Alert.alert(
                'Delete All Data',
                'This will permanently delete all your data. This action cannot be undone.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Delete All',
                    style: 'destructive',
                    onPress: async () => {
                      try {
                        await settingsService.deleteUserData();
                        Alert.alert('Success', 'All data has been deleted.');
                      } catch (error) {
                        Alert.alert('Error', 'Failed to delete data');
                      }
                    },
                  },
                ]
              );
            }}
          >
            <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
            <Text style={styles.exportButtonText}>Delete All Data</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 24,
  },
  sectionTabs: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  sectionTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeSectionTab: {
    borderBottomWidth: 2,
  },
  sectionTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginLeft: 8,
  },
  dataContainer: {
    flex: 1,
  },
  dataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  itemSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  itemActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 6,
  },
  deleteButton: {
    backgroundColor: '#EF4444',
  },
  loadingText: {
    textAlign: 'center',
    color: '#6B7280',
    marginTop: 32,
  },
  emptyText: {
    textAlign: 'center',
    color: '#6B7280',
    marginTop: 32,
  },
  exportSection: {
    marginTop: 32,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  deleteAllButton: {
    backgroundColor: '#EF4444',
  },
  exportButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
