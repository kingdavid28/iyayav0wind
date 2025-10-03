// screens/ChildrenManagementScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services';
import { styles } from './styles/ChildrenManagementScreen.styles';
import ChildModal from './ParentDashboard/modals/ChildModal';

const ChildrenManagementScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingChild, setEditingChild] = useState(null);
  const [childForm, setChildForm] = useState({
    name: '',
    age: '5',
    allergies: '',
    preferences: '',
  });

  const extractChildId = useCallback((child) => (
    child?._id || child?.id || child?.childId || null
  ), []);

  const normalizeChildResponse = useCallback((payload) => (
    payload?.data?.child || payload?.child || payload
  ), []);

  const normalizeChildrenList = useCallback((payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data?.children)) return payload.data.children;
    if (Array.isArray(payload?.children)) return payload.children;
    if (Array.isArray(payload?.data)) return payload.data;
    return [];
  }, []);

  const loadChildren = useCallback(async (showSpinner = true) => {
    try {
      if (showSpinner) {
        setLoading(true);
      }
      const response = await apiService.children.getMy();
      const childrenData = normalizeChildrenList(response);
      setChildren(childrenData);
    } catch (error) {
      console.error('Error loading children:', error);
      Alert.alert('Error', 'Failed to load children');
    } finally {
      if (showSpinner) {
        setLoading(false);
      }
    }
  }, [normalizeChildrenList]);

  useEffect(() => {
    loadChildren();
  }, [loadChildren]);

  const openAddModal = () => {
    setEditingChild(null);
    setChildForm({
      name: '',
      age: '5',
      allergies: '',
      preferences: '',
    });
    setModalVisible(true);
  };

  const openEditModal = (child) => {
    setEditingChild(child);
    setChildForm({
      name: child?.name || '',
      age: child?.age != null ? String(child.age) : '5',
      allergies: child?.allergies || '',
      preferences: child?.preferences || '',
    });
    setModalVisible(true);
  };

  const handleSaveChild = async () => {
    if (!childForm.name.trim()) {
      Alert.alert('Error', 'Please enter a child name');
      return;
    }

    try {
      setSaving(true);

      const cleanChildData = {
        name: childForm.name.trim(),
        age: parseInt(childForm.age, 10) || 5,
        allergies: childForm.allergies.trim(),
        preferences: childForm.preferences.trim(),
      };

      if (editingChild) {
        const updateData = {
          ...cleanChildData,
          id: extractChildId(editingChild),
        };

        const updatedChildResponse = await apiService.children.update(updateData.id, updateData);
        const updatedChild = normalizeChildResponse(updatedChildResponse);

        if (!updatedChild) {
          throw new Error('Child update failed: empty response.');
        }

        Alert.alert('Success', 'Child updated successfully');
      } else {
        const savedChildResponse = await apiService.children.create(cleanChildData);
        const savedChild = normalizeChildResponse(savedChildResponse);

        if (!savedChild) {
          throw new Error('Child creation failed: empty response.');
        }
        Alert.alert('Success', 'Child added successfully');
      }

      await loadChildren(false);
      setChildForm({
        name: '',
        age: '5',
        allergies: '',
        preferences: '',
      });
      setModalVisible(false);
    } catch (error) {
      console.error('Error saving child:', error);

      if (error.message?.includes('Child ID already exists') || error.code === 11000) {
        Alert.alert('Error', 'A child with this name already exists. Please choose a different name.');
      } else {
        Alert.alert('Error', error?.message || 'Failed to save child. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteChild = async (child) => {
    try {
      const idToDelete = extractChildId(child);
      if (!idToDelete) {
        Alert.alert('Error', 'Unable to determine which child to delete.');
        return;
      }

      Alert.alert(
        'Delete Child',
        'Are you sure you want to delete this child?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              await apiService.children.delete(idToDelete);
              setChildren((prev) => prev.filter((existingChild) => extractChildId(existingChild) !== idToDelete));
              Alert.alert('Success', 'Child deleted successfully');
            },
          },
        ],
      );
    } catch (error) {
      console.error('Error deleting child:', error);
      Alert.alert('Error', 'Failed to delete child');
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>Loading children...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Manage Children</Text>

      <TouchableOpacity
        style={styles.addButton}
        onPress={openAddModal}
        disabled={saving}
      >
        <Ionicons name="add" size={24} color="white" />
        <Text style={styles.addButtonText}>Add Child</Text>
      </TouchableOpacity>

      <ScrollView style={styles.childrenList}>
        {children.map((child) => {
          const childId = extractChildId(child);
          return (
            <ChildCard
              key={childId || JSON.stringify(child)}
              child={child}
              onEdit={() => openEditModal(child)}
              onDelete={() => handleDeleteChild(child)}
            />
          );
        })}
      </ScrollView>

      <ChildModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        childName={childForm.name}
        setChildName={(name) => setChildForm((prev) => ({ ...prev, name }))}
        childAge={childForm.age}
        setChildAge={(age) => setChildForm((prev) => ({ ...prev, age }))}
        childAllergies={childForm.allergies}
        setChildAllergies={(allergies) => setChildForm((prev) => ({ ...prev, allergies }))}
        childNotes={childForm.preferences}
        setChildNotes={(notes) => setChildForm((prev) => ({ ...prev, preferences: notes }))}
        onSave={handleSaveChild}
        editing={!!editingChild}
      />
    </View>
  );
};

const ChildCard = ({ child, onEdit, onDelete }) => {
  return (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <Text style={styles.childName}>{child.name}</Text>
        <Text style={styles.childInfo}>Age: {child.age}</Text>
        {child.allergies && (
          <Text style={styles.childInfo}>Allergies: {child.allergies}</Text>
        )}
        {child.preferences && (
          <Text style={styles.childInfo}>Preferences: {child.preferences}</Text>
        )}
      </View>
      
      <View style={styles.cardActions}>
        <TouchableOpacity 
          style={styles.editButton} 
          onPress={onEdit}
        >
          <Ionicons name="pencil" size={16} color="#007AFF" />
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.deleteButton} 
          onPress={onDelete}
        >
          <Ionicons name="trash" size={16} color="#FF3B30" />
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ChildrenManagementScreen;