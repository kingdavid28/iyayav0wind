import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { JobCard, CaregiverCard, BookingCard, ApplicationCard, ConfirmationModal } from '../shared/ui';
import DocumentManager from '../components/DocumentManager';
import NetworkStatus from '../components/NetworkStatus';
import { useAnalytics } from '../hooks/useAnalytics';
import { useSecurity } from '../hooks/useSecurity';
// AuthForm component removed - using direct auth screens instead

const DemoScreen = () => {
  const [showModal, setShowModal] = useState(false);
  const { trackEvent, trackScreen } = useAnalytics();
  const { sanitizeInput, validateFileUpload } = useSecurity();

  React.useEffect(() => {
    trackScreen('DemoScreen');
  }, [trackScreen]);

  const handleCardPress = (type) => {
    trackEvent('demo_card_pressed', { cardType: type });
    Alert.alert('Demo', `${type} card pressed!`);
  };

  const handleSecurityTest = () => {
    const testInput = '<script>alert("test")</script>';
    const sanitized = sanitizeInput(testInput);
    Alert.alert('Security Test', `Original: ${testInput}\nSanitized: ${sanitized}`);
  };

  // Sample data for cards
  const sampleJob = {
    id: '1',
    title: 'Babysitter Needed for Weekend',
    description: 'Looking for a reliable babysitter for our 2 children during weekend evenings.',
    date: '2024-01-15',
    startTime: '18:00',
    endTime: '23:00',
    hourlyRate: 250,
    location: 'Makati City',
    status: 'active',
    childrenCount: 2,
    urgency: true
  };

  const sampleCaregiver = {
    id: '1',
    name: 'Maria Santos',
    profileImage: null,
    hourlyRate: 200,
    rating: 4.8,
    reviewCount: 24,
    experience: 5,
    location: 'Quezon City',
    availability: 'Available weekends',
    skills: ['Infant Care', 'Cooking', 'Homework Help'],
    verified: true,
    distance: 2.5
  };

  const sampleBooking = {
    id: '1',
    caregiverName: 'Maria Santos',
    parentName: 'John Doe',
    date: '2024-01-15',
    startTime: '18:00',
    endTime: '23:00',
    status: 'confirmed',
    totalAmount: 1250,
    childrenCount: 2,
    location: 'Makati City',
    notes: 'Please prepare dinner for the children',
    paymentStatus: 'pending'
  };

  const sampleApplication = {
    id: '1',
    jobTitle: 'Weekend Babysitter',
    employerName: 'John Doe',
    appliedDate: '2024-01-10',
    status: 'pending',
    message: 'I have 5 years of experience with children and am available on weekends.',
    hourlyRate: 250,
    jobDate: '2024-01-15',
    location: 'Makati City'
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      <View style={{ padding: 16 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' }}>
          Iyaya Components Demo
        </Text>

        {/* Network Status */}
        <NetworkStatus />

        {/* Card Components */}
        <Text style={{ fontSize: 18, fontWeight: '600', marginVertical: 16 }}>Card Components</Text>
        
        <JobCard 
          job={sampleJob}
          onPress={() => handleCardPress('Job')}
          onApply={() => handleCardPress('Job Apply')}
        />

        <CaregiverCard 
          caregiver={sampleCaregiver}
          onPress={() => handleCardPress('Caregiver')}
          onMessage={() => handleCardPress('Caregiver Message')}
          onBook={() => handleCardPress('Caregiver Book')}
        />

        <BookingCard 
          booking={sampleBooking}
          onPress={() => handleCardPress('Booking')}
          onCancel={() => handleCardPress('Booking Cancel')}
          onComplete={() => handleCardPress('Booking Complete')}
          userType="parent"
        />

        <ApplicationCard 
          application={sampleApplication}
          onPress={() => handleCardPress('Application')}
          onWithdraw={() => handleCardPress('Application Withdraw')}
        />

        {/* Auth Form - Removed, using dedicated auth screens */}

        {/* Document Manager */}
        <Text style={{ fontSize: 18, fontWeight: '600', marginVertical: 16 }}>Document Manager</Text>
        <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <DocumentManager 
            category="certificates"
            onDocumentUploaded={(doc) => Alert.alert('Success', `Document uploaded: ${doc.name}`)}
          />
        </View>

        {/* Security Test */}
        <TouchableOpacity 
          style={{ 
            backgroundColor: '#3b82f6', 
            padding: 16, 
            borderRadius: 8, 
            marginVertical: 8,
            alignItems: 'center'
          }}
          onPress={handleSecurityTest}
        >
          <Text style={{ color: '#fff', fontWeight: '600' }}>Test Security Sanitization</Text>
        </TouchableOpacity>

        {/* Modal Test */}
        <TouchableOpacity 
          style={{ 
            backgroundColor: '#ef4444', 
            padding: 16, 
            borderRadius: 8, 
            marginVertical: 8,
            alignItems: 'center'
          }}
          onPress={() => setShowModal(true)}
        >
          <Text style={{ color: '#fff', fontWeight: '600' }}>Test Confirmation Modal</Text>
        </TouchableOpacity>

        <ConfirmationModal
          visible={showModal}
          onClose={() => setShowModal(false)}
          onConfirm={() => {
            setShowModal(false);
            Alert.alert('Confirmed', 'Action confirmed!');
          }}
          title="Delete Item"
          message="Are you sure you want to delete this item? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          type="danger"
        />
      </View>
    </ScrollView>
  );
};

export default DemoScreen;