
import React from 'react';
import { View, Text } from 'react-native';
import { Modal, TextInput, Button } from 'react-native-paper';
import { styles } from '../../styles/ParentDashboard.styles';
import { Ionicons } from '@expo/vector-icons';

const ProfileModal = ({
  visible,
  onDismiss,
  profileName,
  setProfileName,
  profileContact,
  setProfileContact,
  profileLocation,
  setProfileLocation,
  handleSaveProfile,
}) => {
  return (
    <Modal
      visible={visible}
      onDismiss={onDismiss}
      contentContainerStyle={styles.modalOverlay}
      theme={{ colors: { backdrop: 'rgba(0, 0, 0, 0.5)' } }}
    >
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Edit Profile</Text>
          <Button onPress={onDismiss}>
            <Ionicons name="close" size={24} color="#6B7280" />
          </Button>
        </View>
        
        <TextInput
          label="Full Name"
          value={profileName}
          onChangeText={setProfileName}
          style={styles.input}
          mode="outlined"
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
        
        <View style={styles.modalActions}>
          <Button 
            mode="outlined" 
            style={styles.cancelButton}
            onPress={onDismiss}
          >
            Cancel
          </Button>
          <Button 
            mode="contained" 
            style={styles.saveButton}
            onPress={handleSaveProfile}
          >
            Save Changes
          </Button>
        </View>
      </View>
    </Modal>
  );
};

export default ProfileModal;
