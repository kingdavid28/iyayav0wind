// screens/ChildrenManagementScreen.js
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Button, Text, ActivityIndicator, Card } from 'react-native-paper';
import { childService } from '../services/childService';
import { useAuth } from '../core/contexts/AuthContext';

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
      const childrenData = await childService.getChildren();
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

      const savedChild = await childService.createChild(newChild);
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
        const savedChild = await childService.createChild(dataToSend);
        setChildren(prev => prev.map(child =>
          child.id === childId ? savedChild : child
        ));
      } else {
        // Update existing child
        const updatedChild = await childService.updateChild(childId, dataToSend);
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    marginBottom: 16,
    textAlign: 'center',
  },
  addButton: {
    marginBottom: 16,
  },
  card: {
    marginBottom: 8,
  },
  input: {
    marginBottom: 8,
  },
});

export default ChildrenManagementScreen;
