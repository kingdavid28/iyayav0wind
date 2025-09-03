import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Alert, Modal } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { CheckCircle, Upload, XCircle, AlertCircle, Clock, X } from 'lucide-react-native';
import { bookingsAPI } from '../../../config/api';

const PaymentModal = ({ 
  visible, 
  onClose, 
  bookingId, 
  amount, 
  caregiverName, 
  bookingDate,
  onPaymentSuccess 
}) => {
  const [image, setImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [bookingStatus, setBookingStatus] = useState('pending');
  const [imageBase64, setImageBase64] = useState(null);
  const [mimeType, setMimeType] = useState('image/jpeg');

  // Safe formatting for payment data
  const formatPaymentData = () => {
    try {
      return {
        amount: (amount || 0).toFixed(2),
        caregiverName: caregiverName || 'Unknown Caregiver',
        bookingDate: bookingDate || 'Unknown Date'
      };
    } catch (error) {
      console.error('Error formatting payment data:', error);
      return {
        amount: '0.00',
        caregiverName: 'Error loading information',
        bookingDate: 'Unknown Date'
      };
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'We need access to your photos to upload the payment screenshot.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled) {
        const asset = result.assets[0];
        setImage(asset.uri);
        setImageBase64(asset.base64 || null);
        const inferred = asset.mimeType || (asset.uri?.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg');
        setMimeType(inferred);
        setUploadStatus('');
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const uploadImage = async () => {
    if (!image) {
      Alert.alert('No Image', 'Please select a payment screenshot first.');
      return;
    }
    if (!imageBase64) {
      Alert.alert('Image Error', 'Could not read image data. Please reselect the image.');
      return;
    }

    setUploading(true);
    setUploadStatus('uploading');

    try {
      const res = await bookingsAPI.uploadPaymentProof(bookingId, imageBase64, mimeType);
      setUploadStatus('pending_verification');
      setBookingStatus('pending_verification');
      
      Alert.alert('Payment Submitted', 'We received your payment proof. We will verify it shortly.');
      if (onPaymentSuccess) onPaymentSuccess();
      
    } catch (error) {
      console.error('Error uploading image:', error);
      setUploadStatus('error');
      setBookingStatus('error');
      Alert.alert('Error', 'Failed to upload payment. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const renderStatusIcon = () => {
    switch (bookingStatus) {
      case 'verified':
        return <CheckCircle size={48} color="#10B981" style={styles.statusIcon} />;
      case 'rejected':
        return <XCircle size={48} color="#EF4444" style={styles.statusIcon} />;
      case 'pending_verification':
        return <Clock size={48} color="#F59E0B" style={styles.statusIcon} />;
      case 'error':
        return <X size={48} color="#EF4444" style={styles.statusIcon} />;
      case 'uploading':
        return <ActivityIndicator size="large" color="#3B82F6" style={styles.statusIcon} />;
      default:
        return <AlertCircle size={48} color="#F59E0B" style={styles.statusIcon} />;
    }
  };

  const renderStatusText = () => {
    switch (bookingStatus) {
      case 'verified':
        return 'Payment Verified!';
      case 'rejected':
        return 'Payment Rejected';
      case 'pending_verification':
        return 'Payment Under Review';
      case 'error':
        return 'Upload failed. Please try again.';
      case 'uploading':
        return 'Uploading your payment...';
      default:
        return 'Upload payment proof';
    }
  };

  // Get formatted payment data
  const formattedData = formatPaymentData();

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Payment Confirmation</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeIcon}>×</Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.modalBody}>
            <View style={styles.paymentDetails}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Amount:</Text>
                <Text style={styles.detailValue}>₱{formattedData.amount}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Caregiver:</Text>
                <Text style={styles.detailValue}>{formattedData.caregiverName}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Booking Date:</Text>
                <Text style={styles.detailValue}>{formattedData.bookingDate}</Text>
              </View>
            </View>

            <View style={styles.uploadContainer}>
              {renderStatusIcon()}
              <Text style={styles.uploadStatusText}>{renderStatusText()}</Text>
              
              {!uploading && bookingStatus === 'pending' && (
                <>
                  <TouchableOpacity 
                    style={styles.uploadButton}
                    onPress={pickImage}
                    disabled={uploading}
                  >
                    <Upload size={20} color="#FFFFFF" style={styles.uploadIcon} />
                    <Text style={styles.uploadButtonText}>
                      {image ? 'Upload Proof' : 'Select Screenshot'}
                    </Text>
                  </TouchableOpacity>
                  
                  {image && (
                    <Image 
                      source={{ uri: image }} 
                      style={styles.imagePreview} 
                      resizeMode="contain"
                    />
                  )}
                </>
              )}
            </View>

            {image && !uploading && bookingStatus === 'pending' && (
              <TouchableOpacity 
                style={[styles.uploadButton, styles.submitButton]}
                onPress={uploadImage}
                disabled={uploading}
              >
                <Text style={styles.uploadButtonText}>
                  {uploading ? 'Uploading...' : 'Submit Payment'}
                </Text>
              </TouchableOpacity>
            )}

            {bookingStatus === 'pending_verification' && (
              <View style={styles.statusInfo}>
                <Text style={styles.statusInfoText}>
                  Payment submitted for verification. You'll be notified when verified.
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  closeIcon: {
    fontSize: 24,
    color: '#6B7280',
    fontWeight: 'bold',
  },
  modalBody: {
    padding: 20,
  },
  paymentDetails: {
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  uploadContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  statusIcon: {
    marginBottom: 12,
  },
  uploadStatusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    width: '100%',
  },
  submitButton: {
    backgroundColor: '#10B981',
    marginTop: 12,
  },
  uploadButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  uploadIcon: {
    marginRight: 8,
  },
  imagePreview: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statusInfo: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
  },
  statusInfoText: {
    fontSize: 14,
    color: '#4B5563',
    textAlign: 'center',
  },
});

export default PaymentModal;