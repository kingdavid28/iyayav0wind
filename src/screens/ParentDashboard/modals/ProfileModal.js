import * as ImagePicker from "expo-image-picker";
import { Camera, User, X } from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
} from "react-native";
import { ModalWrapper, FormInput, Button } from '../../../shared/ui';

const ProfileModal = ({
  visible,
  onClose,
  profileName,
  setProfileName,
  profileContact,
  setProfileContact,
  profileLocation,
  setProfileLocation,
  profileImage,
  setProfileImage,
  handleSaveProfile,
}) => {
  const [loading, setLoading] = useState(false);
  const [tempImageUri, setTempImageUri] = useState(null);

  const handleImageSelection = async (type) => {
    try {
      const isCamera = type === 'camera';
      const { status } = isCamera 
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== "granted") {
        Alert.alert(
          "Permission needed",
          `Please grant ${isCamera ? 'camera' : 'camera roll'} permissions to ${isCamera ? 'take' : 'upload'} a profile picture.`
        );
        return;
      }

      const options = {
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      };

      const result = isCamera 
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);

      if (!result.canceled && result.assets[0]) {
        setTempImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error(`Error ${type === 'camera' ? 'taking photo' : 'picking image'}:`, error);
      Alert.alert("Error", `Failed to ${type === 'camera' ? 'take photo' : 'pick image'}`);
    }
  };

  const pickImage = () => handleImageSelection('gallery');
  const takePhoto = () => handleImageSelection('camera');

  const showImageOptions = () => {
    Alert.alert("Profile Picture", "Choose an option", [
      { text: "Camera", onPress: takePhoto },
      { text: "Gallery", onPress: pickImage },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const handleSave = async () => {
    if (!profileName.trim()) {
      Alert.alert("Error", "Please enter your name");
      return;
    }

    setLoading(true);
    try {
      await handleSaveProfile(tempImageUri);
      setTempImageUri(null);
      onClose();
    } catch (error) {
      console.error("ProfileModal save error:", error);
      Alert.alert("Error", "Failed to save profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setTempImageUri(null);
    onClose();
  };

  return (
    <ModalWrapper
      visible={visible}
      onClose={onClose}
      animationType="slide"
      style={profileModalStyles.modalContentWrapper}
    >
          <View style={profileModalStyles.modalHeader}>
            <Text style={profileModalStyles.modalTitle}>Edit Profile</Text>
            <TouchableOpacity
              style={profileModalStyles.closeButton}
              onPress={handleCancel}
            >
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={profileModalStyles.modalBody}>
            {/* Profile Image Section */}
            <View style={profileModalStyles.imageSection}>
              <Text style={profileModalStyles.imageLabel}>Profile Picture</Text>
              <TouchableOpacity
                style={profileModalStyles.imageContainer}
                onPress={showImageOptions}
              >
                {tempImageUri || profileImage ? (
                  <Image
                    source={{ uri: tempImageUri || profileImage }}
                    style={profileModalStyles.profileImage}
                  />
                ) : (
                  <View style={profileModalStyles.defaultImage}>
                    <User size={40} color="#db2777" />
                  </View>
                )}
                <View style={profileModalStyles.cameraIcon}>
                  <Camera size={16} color="#fff" />
                </View>
              </TouchableOpacity>
            </View>

            <FormInput
              label="Full Name"
              value={profileName}
              onChangeText={setProfileName}
              placeholder="Enter your full name"
              autoCapitalize="words"
            />

            <FormInput
              label="Contact Number"
              value={profileContact}
              onChangeText={setProfileContact}
              placeholder="Enter your contact number"
              keyboardType="phone-pad"
            />

            <FormInput
  label="Location"
  value={profileLocation}
  onChangeText={setProfileLocation}
  placeholder="Enter your location"
  
/>
          </ScrollView>

          <View style={profileModalStyles.modalActions}>
            <Button
              title="Cancel"
              variant="secondary"
              onPress={handleCancel}
              disabled={loading}
              style={{ width: 100 }}
            />
            <Button
              title="Save"
              variant="primary"
              onPress={handleSave}
              loading={loading}
              style={{ width: 100 }}
            />
          </View>
    </ModalWrapper>
  );
};

const profileModalStyles = {
  fullScreenOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalContentWrapper: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    width: "100%",
    maxWidth: 500,
    maxHeight: "85%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 50,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 2,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1f2937",
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "rgba(107, 114, 128, 0.1)",
  },
  modalBody: {
    padding: 2,
    maxHeight: 400,
  },
  imageSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  imageLabel: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 16,
  },
  imageContainer: {
    position: "relative",
    width: 100,
    height: 100,
    borderRadius: 60,
    overflow: "hidden",
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 60,
  },
  defaultImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(219, 39, 119, 0.1)",
    borderWidth: 2,
    borderColor: "#db2777",
    alignItems: "center",
    justifyContent: "center",
  },
  cameraIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#db2777",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: "#fff",
    color: "#1f2937",
    minHeight: 48,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 20,
    height: 90,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    gap: 16,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#d1d5db",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6b7280",
  },
  submitButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: "#db2777",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 20,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  disabledButton: {
    backgroundColor: "#9ca3af",
    opacity: 0.7,
  },
};

export default ProfileModal;