import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const DashboardDemo = () => {
  const navigation = useNavigation();

  const handleDemoPress = () => {
    Alert.alert(
      'Component Demo',
      'Navigate to the demo screen to see all implemented components in action.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Go to Demo', onPress: () => navigation.navigate('Demo') }
      ]
    );
  };

  return (
    <TouchableOpacity 
      style={styles.demoButton}
      onPress={handleDemoPress}
    >
      <Ionicons name="flask" size={20} color="#3b82f6" />
      <Text style={styles.demoText}>View Component Demo</Text>
    </TouchableOpacity>
  );
};

const styles = {
  demoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    padding: 12,
    borderRadius: 8,
    margin: 16,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  demoText: {
    marginLeft: 8,
    color: '#3b82f6',
    fontWeight: '500',
  },
};

export default DashboardDemo;