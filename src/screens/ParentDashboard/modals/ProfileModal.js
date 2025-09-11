import * as ImagePicker from "expo-image-picker";
import { Camera, User, X } from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  TextInput as RNTextInput,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import KeyboardAvoidingWrapper from "../../../components/KeyboardAvoidingWrapper";

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

  const pickImage = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission needed",
          "Please grant camera roll permissions to upload a profile picture."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: [ImagePicker.MediaType.Images],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setTempImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission needed",
          "Please grant camera permissions to take a profile picture."
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setTempImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      Alert.alert("Error", "Failed to take photo");
    }
  };

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
      // Only dismiss if save was successful
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
    // Reset temporary image when canceling
    setTempImageUri(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
      statusBarTranslucent={true}
      presentationStyle="overFullScreen"
      hardwareAccelerated={true}
    >
      <View style={profileModalStyles.fullScreenOverlay}>
        <View style={profileModalStyles.modalContentWrapper}>
          <View style={profileModalStyles.modalHeader}>
            <Text style={profileModalStyles.modalTitle}>Edit Profile</Text>
            <TouchableOpacity
              style={profileModalStyles.closeButton}
              onPress={onClose}
            >
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <KeyboardAvoidingWrapper
            style={profileModalStyles.modalBody}
            keyboardVerticalOffset={Platform.select({
              ios: 100,
              android: 50,
              web: 0,
            })}
          >
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

            <View style={profileModalStyles.inputContainer}>
              <Text style={profileModalStyles.inputLabel}>Full Name</Text>
              <RNTextInput
                value={profileName}
                onChangeText={setProfileName}
                style={profileModalStyles.textInput}
                placeholder="Enter your full name"
                autoCapitalize="words"
              />
            </View>

            <View style={profileModalStyles.inputContainer}>
              <Text style={profileModalStyles.inputLabel}>Contact Number</Text>
              <RNTextInput
                value={profileContact}
                onChangeText={setProfileContact}
                style={profileModalStyles.textInput}
                placeholder="Enter your contact number"
                keyboardType="phone-pad"
              />
            </View>

            <View style={profileModalStyles.inputContainer}>
              <Text style={profileModalStyles.inputLabel}>Location</Text>
              <RNTextInput
                value={profileLocation}
                onChangeText={setProfileLocation}
                style={profileModalStyles.textInput}
                placeholder="Enter your location"
              />
            </View>

            <View style={profileModalStyles.modalActions}>
              <TouchableOpacity
                style={profileModalStyles.cancelButton}
                onPress={handleCancel}
                disabled={loading}
              >
                <Text style={profileModalStyles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  profileModalStyles.submitButton,
                  loading && profileModalStyles.disabledButton,
                ]}
                onPress={handleSave}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={profileModalStyles.submitButtonText}>
                    Save Changes
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingWrapper>
        </View>
      </View>
    </Modal>
  );
};

const profileModalStyles = {
  fullScreenOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999999,
    elevation: 999999,
  },
  modalContentWrapper: {
    backgroundColor: "#ffffff",
    borderRadius: Platform.select({
      web: 16,
      default: 20,
    }),
    width: Platform.select({
      web: "50%",
      default: "90%",
    }),
    height: Platform.select({
      web: "50%",
      default: "75%",
    }),
    maxWidth: Platform.select({
      web: 500,
      default: 400,
    }),
    maxHeight: Platform.select({
      web: "80%",
      default: "85%",
    }),
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 50,
  },
  closeButton: {
    padding: Platform.select({
      web: 8,
      default: 12,
    }),
    borderRadius: Platform.select({
      web: 6,
      default: 8,
    }),
    backgroundColor: "rgba(107, 114, 128, 0.1)",
  },
  imageSection: {
    alignItems: "center",
    marginBottom: Platform.select({
      web: 20,
      default: 24,
    }),
  },
  imageLabel: {
    fontSize: Platform.select({
      web: 16,
      default: 18,
    }),
    fontWeight: "600",
    color: "#374151",
    marginBottom: Platform.select({
      web: 12,
      default: 16,
    }),
  },
  imageContainer: {
    position: "relative",
    width: Platform.select({
      web: 100,
      default: 120,
    }),
    height: Platform.select({
      web: 100,
      default: 120,
    }),
    borderRadius: Platform.select({
      web: 50,
      default: 60,
    }),
    overflow: "hidden",
  },
  profileImage: {
    width: Platform.select({
      web: 100,
      default: 120,
    }),
    height: Platform.select({
      web: 100,
      default: 120,
    }),
    borderRadius: Platform.select({
      web: 50,
      default: 60,
    }),
  },
  defaultImage: {
    width: Platform.select({
      web: 100,
      default: 120,
    }),
    height: Platform.select({
      web: 100,
      default: 120,
    }),
    borderRadius: Platform.select({
      web: 50,
      default: 60,
    }),
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
    width: Platform.select({
      web: 32,
      default: 40,
    }),
    height: Platform.select({
      web: 32,
      default: 40,
    }),
    borderRadius: Platform.select({
      web: 16,
      default: 20,
    }),
    backgroundColor: "#db2777",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  inputContainer: {
    marginBottom: Platform.select({
      web: 16,
      default: 20,
    }),
  },
  inputLabel: {
    fontSize: Platform.select({
      web: 14,
      default: 16,
    }),
    fontWeight: "600",
    color: "#374151",
    marginBottom: Platform.select({
      web: 6,
      default: 8,
    }),
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: Platform.select({
      web: 8,
      default: 12,
    }),
    paddingHorizontal: Platform.select({
      web: 12,
      default: 16,
    }),
    paddingVertical: Platform.select({
      web: 10,
      default: 14,
    }),
    fontSize: Platform.select({
      web: 14,
      default: 16,
    }),
    backgroundColor: "#fff",
    color: "#1f2937",
    minHeight: Platform.select({
      web: 40,
      default: 48,
    }),
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: Platform.select({
      web: 20,
      default: 2,
    }),
    paddingVertical: Platform.select({
      web: 16,
      default: 20,
    }),
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    gap: Platform.select({
      web: 12,
      default: 16,
    }),
  },
  cancelButton: {
    //flex: 1,
    paddingVertical: Platform.select({
      web: 12,
      default: 16,
    }),
    paddingHorizontal: Platform.select({
      web: 16,
      default: 20,
    }),
    borderRadius: Platform.select({
      web: 8,
      default: 12,
    }),
    borderWidth: 1,
    borderColor: "#d1d5db",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButtonText: {
    fontSize: Platform.select({
      web: 14,
      default: 16,
    }),
    fontWeight: "600",
    color: "#6b7280",
  },
  submitButton: {
    //flex: 1,
    paddingVertical: Platform.select({
      web: 12,
      default: 16,
    }),
    paddingHorizontal: Platform.select({
      web: 16,
      default: 20,
    }),
    borderRadius: Platform.select({
      web: 8,
      default: 12,
    }),
    backgroundColor: "#db2777",
    alignItems: "center",
    justifyContent: "center",
    minHeight: Platform.select({
      web: 44,
      default: 48,
    }),
  },
  submitButtonText: {
    fontSize: Platform.select({
      web: 14,
      default: 16,
    }),
    fontWeight: "600",
    color: "#fff",
  },
  disabledButton: {
    backgroundColor: "#9ca3af",
    opacity: 0.7,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Platform.select({
      web: 20,
      default: 24,
    }),
    paddingVertical: Platform.select({
      web: 16,
      default: 20,
    }),
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  modalTitle: {
    fontSize: Platform.select({
      web: 20,
      default: 24,
    }),
    fontWeight: "700",
    color: "#1f2937",
  },
  modalBody: {
    paddingHorizontal: Platform.select({
      web: 20,
      default: 24,
    }),
    paddingVertical: Platform.select({
      web: 16,
      default: 20,
    }),
    maxHeight: Platform.select({
      web: "60vh",
      default: 400,
    }),
  },
};

export default ProfileModal;
