import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { uploadBytes, ref as storageRef, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db, storage } from '../config/firebase';
import { CheckCircle, Upload, XCircle, AlertCircle, Clock, X, Check } from 'lucide-react-native';
import { sendPaymentConfirmationEmail } from '../services/emailService';

const PaymentConfirmationScreen = () => {
  const [image, setImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [bookingStatus, setBookingStatus] = useState('pending');
  const [bookingData, setBookingData] = useState(null);
  const navigation = useNavigation();
  const route = useRoute();
  
  const { bookingId, amount, caregiverName, bookingDate, bookingData: initialBookingData } = route.params;
  
  // Set up real-time listener for booking status updates
  useEffect(() => {
    if (!bookingId) return;
    
    const bookingRef = doc(db, 'bookings', bookingId);
    const unsubscribe = onSnapshot(bookingRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setBookingData(data);
        
        // Update UI based on payment status
        if (data.paymentStatus === 'verified') {
          setUploadStatus('verified');
          setBookingStatus('verified');
        } else if (data.paymentStatus === 'rejected') {
          setUploadStatus('rejected');
          setBookingStatus('rejected');
        }
      }
    });
    
    return () => unsubscribe();
  }, [bookingId]);
  
  // Set initial booking data if provided
  useEffect(() => {
    if (initialBookingData) {
      setBookingData(initialBookingData);
    }
  }, [initialBookingData]);

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
      });

      if (!result.canceled) {
        setImage(result.assets[0].uri);
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

    setUploading(true);
    setUploadStatus('uploading');

    try {
      // Convert image URI to blob
      const response = await fetch(image);
      const blob = await response.blob();
      
      // Create a reference to the storage location
      const fileRef = storageRef(storage, `payments/${bookingId}_${Date.now()}.jpg`);
      
      // Upload the file
      const uploadTask = await uploadBytes(fileRef, blob);
      
      // Get the download URL
      const downloadURL = await getDownloadURL(uploadTask.ref);
      
      // Update the booking document with payment details
      const bookingRef = doc(db, 'bookings', bookingId);
      const updateData = {
        paymentStatus: 'pending_verification',
        paymentScreenshot: downloadURL,
        paymentDate: new Date().toISOString(),
        status: 'payment_pending',
        updatedAt: new Date().toISOString()
      };
      
      // Add user info if available
      if (bookingData?.userEmail) {
        updateData.userEmail = bookingData.userEmail;
        updateData.userName = bookingData.userName || 'User';
      }
      
      await updateDoc(bookingRef, updateData);
      
      // Send payment confirmation email if user email is available
      if (bookingData?.userEmail) {
        try {
          await sendPaymentConfirmationEmail({
            bookingId,
            amount,
            caregiverName,
            bookingDate: bookingData.bookingDate || bookingDate,
            paymentScreenshot: downloadURL,
            userEmail: bookingData.userEmail,
            userName: bookingData.userName || 'User'
          });
        } catch (emailError) {
          console.error('Error sending confirmation email:', emailError);
          // Don't fail the whole process if email fails
        }
      }
      
      setUploadStatus('pending_verification');
      setBookingStatus('pending_verification');
      
      Alert.alert(
        'Payment Submitted',
        'Your payment screenshot has been submitted successfully. We will verify your payment and confirm your booking shortly.',
        [{ text: 'OK' }]
      );
      
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
        return <CheckCircle size={64} color="#10B981" style={styles.statusIcon} />;
      case 'rejected':
        return <XCircle size={64} color="#EF4444" style={styles.statusIcon} />;
      case 'pending_verification':
        return <Clock size={64} color="#F59E0B" style={styles.statusIcon} />;
      case 'error':
        return <X size={64} color="#EF4444" style={styles.statusIcon} />;
      case 'uploading':
        return <ActivityIndicator size="large" color="#3B82F6" style={styles.statusIcon} />;
      default:
        return <AlertCircle size={64} color="#F59E0B" style={styles.statusIcon} />;
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
        return 'Please upload a screenshot of your QR code payment.';
    }
  };
  
  const renderStatusDescription = () => {
    switch (bookingStatus) {
      case 'verified':
        return 'Your payment has been verified. Your booking is now confirmed!';
      case 'rejected':
        return 'Your payment was not accepted. Please try again or contact support.';
      case 'pending_verification':
        return 'We have received your payment screenshot and our team is verifying it. You will be notified once verified.';
      case 'error':
        return 'There was an error processing your payment. Please try again or contact support if the issue persists.';
      default:
        return 'Upload a clear screenshot of your QR code payment confirmation for verification.';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Payment Confirmation</Text>
        <Text style={styles.subtitle}>Complete your booking by uploading payment proof</Text>
      </View>

      <View style={styles.paymentDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Amount to Pay:</Text>
          <Text style={styles.detailValue}>₱{amount.toFixed(2)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Caregiver:</Text>
          <Text style={styles.detailValue}>{caregiverName}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Booking Date:</Text>
          <Text style={styles.detailValue}>
            {new Date(bookingDate).toLocaleDateString('en-PH', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </Text>
        </View>
      </View>

      <View style={styles.uploadContainer}>
        {renderStatusIcon()}
        <Text style={styles.uploadStatusText}>{renderStatusText()}</Text>
        <Text style={styles.uploadStatusDescription}>{renderStatusDescription()}</Text>
        
        {!uploading && bookingStatus === 'pending' && (
          <>
            <TouchableOpacity 
              style={styles.uploadButton}
              onPress={pickImage}
              disabled={uploading}
            >
              <Upload size={20} color="#FFFFFF" style={styles.uploadIcon} />
              <Text style={styles.uploadButtonText}>
                {image ? 'Upload Payment Proof' : 'Select Payment Screenshot'}
              </Text>
            </TouchableOpacity>
            
            {image && (
              <TouchableOpacity 
                style={[styles.uploadButton, styles.changeButton]}
                onPress={pickImage}
                disabled={uploading}
              >
                <Text style={[styles.uploadButtonText, { color: '#3B82F6' }]}>
                  Change Screenshot
                </Text>
              </TouchableOpacity>
            )}
          </>
        )}
        
        {bookingStatus === 'pending_verification' && (
          <View style={styles.statusInfo}>
            <Text style={styles.statusInfoText}>
              We'll notify you once your payment is verified. This usually takes 1-2 business hours.
            </Text>
          </View>
        )}
        
        {bookingStatus === 'verified' && (
          <TouchableOpacity 
            style={[styles.uploadButton, { backgroundColor: '#10B981' }]}
            onPress={() => navigation.navigate('Bookings')}
          >
            <Text style={styles.uploadButtonText}>View My Bookings</Text>
          </TouchableOpacity>
        )}
        
        {bookingStatus === 'rejected' && (
          <TouchableOpacity 
            style={[styles.uploadButton, { backgroundColor: '#EF4444' }]}
            onPress={pickImage}
          >
            <Upload size={20} color="#FFFFFF" style={styles.uploadIcon} />
            <Text style={styles.uploadButtonText}>Upload New Payment Proof</Text>
          </TouchableOpacity>
        )}

        {image && !uploading && (
          <View style={styles.imagePreviewContainer}>
            <Image 
              source={{ uri: image }} 
              style={styles.imagePreview} 
              resizeMode="contain"
            />
            <TouchableOpacity 
              style={styles.uploadButton}
              onPress={uploadImage}
              disabled={uploading}
            >
              <Text style={styles.uploadButtonText}>
                {uploading ? 'Uploading...' : 'Submit Payment'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.instructions}>
        <Text style={styles.instructionsTitle}>How to Pay:</Text>
        <View style={styles.instructionStep}>
          <Text style={styles.instructionNumber}>1</Text>
          <Text style={styles.instructionText}>
            Open your mobile banking app or e-wallet
          </Text>
        </View>
        <View style={styles.instructionStep}>
          <Text style={styles.instructionNumber}>2</Text>
          <Text style={styles.instructionText}>
            Scan the QR code or enter the payment details manually
          </Text>
        </View>
        <View style={styles.instructionStep}>
          <Text style={styles.instructionNumber}>3</Text>
          <Text style={styles.instructionText}>
            Take a screenshot of the successful payment confirmation
          </Text>
        </View>
        <View style={styles.instructionStep}>
          <Text style={styles.instructionNumber}>4</Text>
          <Text style={styles.instructionText}>
            Upload the screenshot using the button above
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 12,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 20,
  },
  bookingInfo: {
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  infoLabel: {
    fontSize: 15,
    color: '#6B7280',
    flex: 1,
  },
  infoValue: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '500',
    textAlign: 'right',
    flex: 1,
    paddingLeft: 10,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 20,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  totalLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111827',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  uploadContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#E5E7EB',
    borderRadius: 16,
    marginBottom: 24,
    backgroundColor: '#FFFFFF',
  },
  statusIcon: {
    marginBottom: 20,
  },
  uploadStatusText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
    lineHeight: 28,
  },
  uploadStatusDescription: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 8,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 20,
    width: '100%',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  changeButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginTop: 12,
  },
  uploadButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  uploadIcon: {
    marginRight: 8,
  },
  previewImage: {
    width: '100%',
    height: 240,
    borderRadius: 12,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statusInfo: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    width: '100%',
  },
  statusInfoText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    textAlign: 'center',
  },
  instructions: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  instructionStep: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  instructionNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#3B82F6',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 24,
    marginRight: 12,
    fontWeight: '600',
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
});

export default PaymentConfirmationScreen;
