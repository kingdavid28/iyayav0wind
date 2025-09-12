import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import CustomDateTimePicker from '../components/DateTimePicker';
import profileService from '../services/profileService';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../core/contexts/AuthContext';
import { styles } from './styles/ChildrenManagementScreen.styles';
import { validateForm, VALIDATION_RULES } from '../utils/validation';
import { logger } from '../utils/logger';

const ChildrenManagementScreen = ({ navigation }) => {
  const { token } = useAuth();
  const [children, setChildren] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingChild, setEditingChild] = useState(null);
  const [childForm, setChildForm] = useState({
    name: '',
    age: '',
    dateOfBirth: new Date(),
    gender: '',
    specialNeeds: '',
    notes: ''
  });
  const [errors, setErrors] = useState({});

  const {
    execute: updateChildren,
    loading: updating,
    error: updateError
  } = useApi(profileService.updateChildren);

  const {
    execute: fetchProfile,
    loading: fetching
  } = useApi(profileService.getProfile);

  useEffect(() => {
    loadChildren();
  }, []);

  const loadChildren = async () => {
    try {
      const profile = await fetchProfile(token);
      setChildren(profile.children || []);
    } catch (error) {
      logger.error('Failed to load children:', error);
      Alert.alert('Error', 'Failed to load children information');
    }
  };

  const openChildModal = (child = null) => {
    if (child) {
      setEditingChild(child);
      setChildForm({
        name: child.name || '',
        age: child.age?.toString() || '',
        gender: child.gender || '',
        specialNeeds: child.specialNeeds?.join(', ') || '',
        notes: child.notes || ''
      });
    } else {
      setEditingChild(null);
      setChildForm({
        name: '',
        age: '',
        gender: '',
        specialNeeds: '',
        notes: ''
      });
    }
    setErrors({});
    setModalVisible(true);
  };

  const saveChild = () => {
    // Validate form
    const validation = validateForm(childForm, VALIDATION_RULES.child);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    const childData = {
      name: childForm.name.trim(),
      age: parseInt(childForm.age),
      gender: childForm.gender,
      specialNeeds: childForm.specialNeeds
        .split(',')
        .map(need => need.trim())
        .filter(need => need),
      notes: childForm.notes.trim()
    };

    let updatedChildren;
    if (editingChild) {
      // Update existing child
      updatedChildren = children.map(child =>
        child === editingChild ? childData : child
      );
    } else {
      // Add new child
      updatedChildren = [...children, childData];
    }

    setChildren(updatedChildren);
    setModalVisible(false);
  };

  const deleteChild = (childToDelete) => {
    Alert.alert(
      'Delete Child',
      'Are you sure you want to remove this child from your profile?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const updatedChildren = children.filter(child => child !== childToDelete);
            setChildren(updatedChildren);
          }
        }
      ]
    );
  };

  const saveAllChildren = async () => {
    try {
      await updateChildren(children, token);
      Alert.alert('Success', 'Children information updated successfully!');
      navigation.goBack();
    } catch (error) {
      logger.error('Failed to update children:', error);
      Alert.alert('Error', error.userMessage || 'Failed to update children information');
    }
  };

  if (fetching) {
    return <LoadingSpinner message="Loading children information..." />;
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        <Text style={styles.title}>Manage Children</Text>
        <Text style={styles.subtitle}>
          Add and manage information about your children for caregivers
        </Text>

        {children.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No children added yet</Text>
            <Text style={styles.emptySubtext}>
              Add your first child to get started
            </Text>
          </View>
        ) : (
          children.map((child, index) => (
            <View key={index} style={styles.childCard}>
              <View style={styles.childHeader}>
                <Text style={styles.childName}>{child.name}</Text>
                <View style={styles.childActions}>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => openChildModal(child)}
                  >
                    <Text style={styles.editButtonText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => deleteChild(child)}
                  >
                    <Text style={styles.deleteButtonText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              <View style={styles.childDetails}>
                <Text style={styles.childDetail}>Age: {child.age} years old</Text>
                {child.gender && (
                  <Text style={styles.childDetail}>Gender: {child.gender}</Text>
                )}
                {child.specialNeeds?.length > 0 && (
                  <Text style={styles.childDetail}>
                    Special Needs: {child.specialNeeds.join(', ')}
                  </Text>
                )}
                {child.notes && (
                  <Text style={styles.childDetail}>Notes: {child.notes}</Text>
                )}
              </View>
            </View>
          ))
        )}

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => openChildModal()}
        >
          <Text style={styles.addButtonText}>+ Add Child</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={saveAllChildren}
          disabled={updating}
        >
          <Text style={styles.saveButtonText}>
            {updating ? 'Saving...' : 'Save Changes'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Child Form Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingChild ? 'Edit Child' : 'Add Child'}
            </Text>
            <TouchableOpacity
              style={styles.modalSaveButton}
              onPress={saveChild}
            >
              <Text style={styles.modalSaveText}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Name *</Text>
              <TextInput
                style={[styles.formInput, errors.name && styles.errorInput]}
                value={childForm.name}
                onChangeText={(text) => setChildForm(prev => ({ ...prev, name: text }))}
                placeholder="Child's name"
              />
              {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
            </View>

            <CustomDateTimePicker
              label="Date of Birth *"
              value={childForm.dateOfBirth}
              onDateChange={(date) => setChildForm(prev => ({ ...prev, dateOfBirth: date }))}
              maximumDate={new Date()}
              format="long"
              error={errors.dateOfBirth}
            />

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Gender</Text>
              <View style={styles.genderContainer}>
                {['Male', 'Female', 'Other'].map(gender => (
                  <TouchableOpacity
                    key={gender}
                    style={[
                      styles.genderButton,
                      childForm.gender === gender.toLowerCase() && styles.genderButtonActive
                    ]}
                    onPress={() => setChildForm(prev => ({ 
                      ...prev, 
                      gender: gender.toLowerCase() 
                    }))}
                  >
                    <Text style={[
                      styles.genderButtonText,
                      childForm.gender === gender.toLowerCase() && styles.genderButtonTextActive
                    ]}>
                      {gender}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Special Needs</Text>
              <TextInput
                style={styles.formInput}
                value={childForm.specialNeeds}
                onChangeText={(text) => setChildForm(prev => ({ ...prev, specialNeeds: text }))}
                placeholder="e.g., Allergies, Medical conditions (comma separated)"
                multiline
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Additional Notes</Text>
              <TextInput
                style={[styles.formInput, styles.notesInput]}
                value={childForm.notes}
                onChangeText={(text) => setChildForm(prev => ({ ...prev, notes: text }))}
                placeholder="Any additional information for caregivers..."
                multiline
                numberOfLines={4}
              />
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

export default ChildrenManagementScreen;
