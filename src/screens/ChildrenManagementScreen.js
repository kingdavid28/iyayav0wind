// screens/ChildrenManagementScreen.js
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
import CustomDateTimePicker from '../shared/ui/inputs/DateTimePicker';
import { apiService } from '../services';
import { useAuth } from '../contexts/AuthContext';
import { styles } from './styles/ChildrenManagementScreen.styles';
import { validateForm, VALIDATION_RULES } from '../utils/validation';
import { logger } from '../utils/logger';

const ChildrenManagementScreen = () => {
  const { user } = useAuth();
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadChildren();
  }, []);

  const loadChildren = async () => {
    try {
      setLoading(true);
      const childrenData = await apiService.children.getMy();
      setChildren(childrenData);
    } catch (error) {
      console.error('Error loading children:', error);
      Alert.alert('Error', 'Failed to load children');
    } finally {
      setLoading(false);
    }
  };

  const handleAddChild = async () => {
    try {
      setSaving(true);

      const newChild = {
        name: 'New Child',
        dateOfBirth: new Date().toISOString().split('T')[0],
        // Don't include ID - let server generate it
      };

      const savedChild = await apiService.children.create(newChild);
      setChildren(prev => [...prev, savedChild]);

      Alert.alert('Success', 'Child added successfully');
    } catch (error) {
      console.error('Error adding child:', error);

      if (error.message?.includes('Child ID already exists')) {
        Alert.alert('Error', 'Child already exists. Please try again with a different name.');
      } else {
        Alert.alert('Error', 'Failed to add child. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSaveChild = async (childId, childData) => {
    try {
      setSaving(true);

      // Remove any client-generated IDs before sending to server
      const dataToSend = { ...childData };
      delete dataToSend.tempId;

      if (childId.startsWith('temp_')) {
        // This was a temporary ID, create new child
        const savedChild = await apiService.children.create(dataToSend);
        setChildren(prev => prev.map(child =>
          child.id === childId ? savedChild : child
        ));
      } else {
        // Update existing child
        const updatedChild = await apiService.children.update(childId, dataToSend);
        setChildren(prev => prev.map(child =>
          child.id === childId ? updatedChild : child
        ));
      }

      Alert.alert('Success', 'Child saved successfully');
    } catch (error) {
      console.error('Error saving child:', error);
      Alert.alert('Error', 'Failed to save child');
    } finally {
      setSaving(false);
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
      <Text variant="headlineMedium" style={styles.title}>
        Manage Children
      </Text>

      <Button
        mode="contained"
        onPress={handleAddChild}
        loading={saving}
        disabled={saving}
        style={styles.addButton}
      >
        Add Child
      </Button>

      {children.map(child => (
        <ChildCard
          key={child.id || child.tempId}
          child={child}
          onSave={handleSaveChild}
        />
      ))}
    </View>
  );
};

const ChildCard = ({ child, onSave }) => {
  const [name, setName] = useState(child.name);
  const [dateOfBirth, setDateOfBirth] = useState(child.dateOfBirth);

  const handleSave = () => {
    onSave(child.id || child.tempId, { name, dateOfBirth });
  };

  return (
    <Card style={styles.card}>
      <Card.Content>
        <TextInput
          label="Child Name"
          value={name}
          onChangeText={setName}
          style={styles.input}
        />
        <TextInput
          label="Date of Birth"
          value={dateOfBirth}
          onChangeText={setDateOfBirth}
          style={styles.input}
        />
        <Button mode="contained" onPress={handleSave}>
          Save
        </Button>
      </Card.Content>
    </Card>
  );
};

export default ChildrenManagementScreen;
