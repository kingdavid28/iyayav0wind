import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Modal, TextInput, IconButton } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../../styles/ParentDashboard.styles';

const ProfileModal = ({
  visible,
  onClose,
  profileName,
  setProfileName,
  profileContact,
  setProfileContact,
  profileLocation,
  setProfileLocation,
  handleSaveProfile,
}) => {
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!profileName.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    setLoading(true);
    try {
      await handleSaveProfile();
      // Only dismiss if save was successful
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset form fields or keep changes based on your requirement
    onClose();
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose} // This handles backdrop taps
      contentContainerStyle={styles.modalOverlay}
      theme={{ colors: { backdrop: 'rgba(0, 0, 0, 0.5)' } }}
    >
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Edit Profile</Text>
          <IconButton
            icon={() => (<Ionicons name="close" size={25} color="#6B7280" />)}
            onPress={onClose} // This handles the close button
          />
        </View>

        <ScrollView style={styles.modalBody}>
          <TextInput
            label="Full Name"
            value={profileName}
            onChangeText={setProfileName}
            style={styles.input}
            mode="outlined"
            autoCapitalize="words"
          />

          <TextInput
            label="Contact Number"
            value={profileContact}
            onChangeText={setProfileContact}
            style={styles.input}
            mode="outlined"
            keyboardType="phone-pad"
          />

          <TextInput
            label="Location"
            value={profileLocation}
            onChangeText={setProfileLocation}
            style={styles.input}
            mode="outlined"
          />
        </ScrollView>

        <View style={styles.modalActions}>
          <TouchableOpacity
            style={[styles.modalButton, styles.cancelButton]}
            onPress={handleCancel} // Use the cancel handler
            disabled={loading} // Disable during save operation
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.modalButton, styles.submitButton, loading && styles.disabledButton]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default ProfileModal;