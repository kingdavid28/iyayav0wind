import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  Image, 
  StyleSheet,
  Modal,
  FlatList,
  ActivityIndicator
} from 'react-native';
import { 
  X, 
  Calendar, 
  Clock, 
  DollarSign, 
  MapPin, 
  Users, 
  Phone, 
  Mail, 
  MessageCircle, 
  Navigation, 
  Star, 
  Baby, 
  AlertCircle, 
  CheckCircle, 
  User 
} from 'lucide-react-native';

export const BookingModal = ({ caregiver, childrenList = [], onConfirm, onClose, visible }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [bookingData, setBookingData] = useState({
    date: '',
    startTime: '',
    endTime: '',
    selectedChildren: [],
    specialInstructions: '',
    address: '',
    contactPhone: '',
    emergencyContact: {
      name: '',
      phone: '',
      relation: ''
    }
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const resolveHourlyRate = () => {
    if (typeof caregiver?.hourlyRate === 'number') return caregiver.hourlyRate;
    if (typeof caregiver?.rate === 'string') {
      const n = parseFloat(caregiver.rate.replace(/[^0-9.]/g, ''));
      return isNaN(n) ? 0 : n;
    }
    return 0;
  };

  const calculateTotalCost = () => {
    if (!bookingData.startTime || !bookingData.endTime) return 0;
    
    const start = new Date(`2024-01-01T${bookingData.startTime}`);
    const end = new Date(`2024-01-01T${bookingData.endTime}`);
    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    
    return Math.max(0, hours * resolveHourlyRate());
  };

  const handleNextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setSubmitError('');
    setSubmitting(true);
    const finalBookingData = {
      ...bookingData,
      caregiver: caregiver.name,
      caregiverId: caregiver.id,
      hourlyRate: resolveHourlyRate(),
      totalCost: calculateTotalCost(),
      time: `${bookingData.startTime} - ${bookingData.endTime}`,
      status: 'pending_payment',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      if (typeof onConfirm === 'function') {
        await onConfirm(finalBookingData);
      }
      onClose && onClose();
    } catch (e) {
      setSubmitError(e?.message || 'Failed to submit booking.');
    } finally {
      setSubmitting(false);
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return bookingData.date && bookingData.startTime && bookingData.endTime;
      case 2:
        return bookingData.selectedChildren.length > 0;
      case 3:
        return bookingData.address && bookingData.contactPhone;
      case 4:
        return true;
      default:
        return false;
    }
  };

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.sectionTitle}>Schedule Details</Text>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Date</Text>
        <TextInput
          value={bookingData.date}
          onChangeText={(text) => setBookingData({ ...bookingData, date: text })}
          style={styles.input}
          placeholder="YYYY-MM-DD"
        />
      </View>

      <View style={styles.timeContainer}>
        <View style={styles.timeInputContainer}>
          <Text style={styles.label}>Start Time</Text>
          <TextInput
            value={bookingData.startTime}
            onChangeText={(text) => setBookingData({ ...bookingData, startTime: text })}
            style={styles.input}
            placeholder="HH:MM"
          />
        </View>
        <View style={styles.timeInputContainer}>
          <Text style={styles.label}>End Time</Text>
          <TextInput
            value={bookingData.endTime}
            onChangeText={(text) => setBookingData({ ...bookingData, endTime: text })}
            style={styles.input}
            placeholder="HH:MM"
          />
        </View>
      </View>

      {bookingData.startTime && bookingData.endTime && (
        <View style={styles.costContainer}>
          <View style={styles.costRow}>
            <Text style={styles.costLabel}>Estimated Cost:</Text>
            <Text style={styles.costValue}>${calculateTotalCost()}</Text>
          </View>
          <Text style={styles.costDetail}>
            ${caregiver.hourlyRate}/hour × {Math.max(0, (new Date(`2024-01-01T${bookingData.endTime}`).getTime() - new Date(`2024-01-01T${bookingData.startTime}`).getTime()) / (1000 * 60 * 60))} hours
          </Text>
        </View>
      )}
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.sectionTitle}>Select Children</Text>
      
      <View style={styles.childrenList}>
        {childrenList.map((child, index) => (
          <View key={index} style={styles.childItem}>
            <TouchableOpacity
              onPress={() => {
                if (bookingData.selectedChildren.includes(child.name)) {
                  setBookingData({
                    ...bookingData,
                    selectedChildren: bookingData.selectedChildren.filter(name => name !== child.name)
                  });
                } else {
                  setBookingData({
                    ...bookingData,
                    selectedChildren: [...bookingData.selectedChildren, child.name]
                  });
                }
              }}
              style={styles.checkboxContainer}
            >
              <View style={[
                styles.checkbox,
                bookingData.selectedChildren.includes(child.name) && styles.checkboxSelected
              ]}>
                {bookingData.selectedChildren.includes(child.name) && (
                  <CheckCircle size={16} color="white" />
                )}
              </View>
            </TouchableOpacity>
            <View style={styles.childInfo}>
              <Text style={styles.childName}>{child.name}</Text>
              <Text style={styles.childDetails}>Age {child.age} • {child.preferences}</Text>
              {child.allergies && child.allergies !== 'None' && (
                <Text style={styles.allergyWarning}>⚠️ Allergies: {child.allergies}</Text>
              )}
            </View>
          </View>
        ))}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Special Instructions</Text>
        <TextInput
          value={bookingData.specialInstructions}
          onChangeText={(text) => setBookingData({ ...bookingData, specialInstructions: text })}
          style={[styles.input, styles.multilineInput]}
          multiline
          placeholder="Any special instructions for the caregiver..."
        />
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.sectionTitle}>Contact & Location</Text>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Address</Text>
        <TextInput
          value={bookingData.address}
          onChangeText={(text) => setBookingData({ ...bookingData, address: text })}
          style={[styles.input, styles.multilineInput]}
          multiline
          placeholder="Full address where care will be provided"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Contact Phone</Text>
        <TextInput
          value={bookingData.contactPhone}
          onChangeText={(text) => setBookingData({ ...bookingData, contactPhone: text })}
          style={styles.input}
          placeholder="Your phone number"
          keyboardType="phone-pad"
        />
      </View>

      <View>
        <Text style={styles.subsectionTitle}>Emergency Contact</Text>
        <View style={styles.emergencyContactContainer}>
          <TextInput
            value={bookingData.emergencyContact.name}
            onChangeText={(text) => setBookingData({
              ...bookingData,
              emergencyContact: { ...bookingData.emergencyContact, name: text }
            })}
            style={styles.input}
            placeholder="Emergency contact name"
          />
          <TextInput
            value={bookingData.emergencyContact.phone}
            onChangeText={(text) => setBookingData({
              ...bookingData,
              emergencyContact: { ...bookingData.emergencyContact, phone: text }
            })}
            style={styles.input}
            placeholder="Emergency contact phone"
            keyboardType="phone-pad"
          />
          <TextInput
            value={bookingData.emergencyContact.relation}
            onChangeText={(text) => setBookingData({
              ...bookingData,
              emergencyContact: { ...bookingData.emergencyContact, relation: text }
            })}
            style={styles.input}
            placeholder="Relationship (e.g., Spouse, Parent, Friend)"
          />
        </View>
      </View>
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.sectionTitle}>Booking Summary</Text>
      
      {/* Caregiver Info */}
      <View style={styles.caregiverSummary}>
        <View style={styles.caregiverHeader}>
          <Image 
            source={{ uri: caregiver.avatar }} 
            style={styles.avatar}
          />
          <View>
            <Text style={styles.caregiverName}>{caregiver.name}</Text>
            <View style={styles.ratingContainer}>
              <Star size={16} color="#f59e0b" />
              <Text style={styles.ratingText}>{caregiver.rating} ({caregiver.reviewCount ?? caregiver.reviews ?? 0} reviews)</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Booking Details */}
      <View style={styles.summaryDetails}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Date:</Text>
          <Text style={styles.summaryValue}>{bookingData.date}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Time:</Text>
          <Text style={styles.summaryValue}>{bookingData.startTime} - {bookingData.endTime}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Children:</Text>
          <Text style={styles.summaryValue}>{bookingData.selectedChildren.join(', ')}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Hourly Rate:</Text>
          <Text style={styles.summaryValue}>${resolveHourlyRate()}/hour</Text>
        </View>
        <View style={[styles.summaryRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total Cost:</Text>
          <Text style={styles.totalValue}>${calculateTotalCost()}</Text>
        </View>
      </View>
    </View>
  );

  return (
  <Modal
    visible={visible}
    transparent
    animationType="fade"
    onRequestClose={onClose}
  >
    <View style={styles.modalOverlay}>
      <View style={styles.modalContainer}>
        {/* Header - Fixed whitespace and dynamic text */}
        <View style={styles.modalHeader}>
          <View>
            <Text style={styles.modalTitle}>Book {caregiver?.name || ""}</Text>
            <Text style={styles.stepIndicator}>Step {currentStep} of 4</Text>
          </View>
          <TouchableOpacity onPress={onClose}><X size={24} color="#6b7280" /></TouchableOpacity>
        </View>

        {/* Progress Bar - Fixed whitespace */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            {[1, 2, 3, 4].map((step) => (
              <View key={step} style={styles.progressStep}>
                <View style={[
                  styles.progressCircle,
                  step <= currentStep && styles.progressCircleActive
                ]}>
                  <Text style={[
                    styles.progressText,
                    step <= currentStep && styles.progressTextActive
                  ]}>
                    {step}
                  </Text>
                </View>
                {step < 4 && (
                  <View style={[
                    styles.progressLine,
                    step < currentStep && styles.progressLineActive
                  ]}/>
                )}
              </View>
            ))}
          </View>
          <View style={styles.progressLabels}>
            <Text style={styles.progressLabel}>Schedule</Text>
            <Text style={styles.progressLabel}>Children</Text>
            <Text style={styles.progressLabel}>Contact</Text>
            <Text style={styles.progressLabel}>Review</Text>
          </View>
        </View>

        {/* Content */}
        <ScrollView style={styles.contentContainer}>
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
        </ScrollView>

        {submitError ? (
          <Text style={styles.errorText}>{submitError}</Text>
        ) : null}

        {/* Footer - Fixed whitespace */}
        <View style={styles.modalFooter}>
          <TouchableOpacity
            onPress={handlePrevStep}
            disabled={currentStep === 1 || submitting}
            style={[styles.footerButton, styles.secondaryButton, (currentStep === 1 || submitting) && styles.disabledButton]}
          ><Text style={styles.secondaryButtonText}>Previous</Text></TouchableOpacity>
          
          {currentStep < 4 ? (
            <TouchableOpacity
              onPress={handleNextStep}
              disabled={!isStepValid() || submitting}
              style={[styles.footerButton, styles.primaryButton, (!isStepValid() || submitting) && styles.disabledButton]}
            ><Text style={styles.primaryButtonText}>Next</Text></TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={submitting}
              style={[styles.footerButton, styles.successButton, submitting && styles.disabledButton]}
            >
              <Text style={styles.primaryButtonText}>{submitting ? 'Submitting…' : 'Confirm Booking'}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  </Modal>
);
}

export const BookingDetailsModal = ({ 
  booking, 
  onClose, 
  onMessage, 
  onGetDirections, 
  onCompleteBooking,
  onCancelBooking,
  visible
}) => {
  
  // Enhanced booking data with defaults
  const enhancedBooking = {
    ...booking,
    location: booking.location || "Manhattan, NY",
    address: booking.address || "123 Park Avenue, New York, NY 10016",
    contactPhone: booking.contactPhone || "(555) 123-4567",
    contactEmail: booking.contactEmail || "johnson.family@email.com",
    totalHours: booking.totalHours || 4,
    totalAmount: booking.totalAmount || (booking.hourlyRate * 4),
    requirements: booking.requirements || ["CPR Certified", "Background Check", "Non-smoker"],
    childrenDetails: booking.childrenDetails || [
      {
        name: "Emma",
        age: 3,
        specialInstructions: "Loves puzzles and quiet activities",
        allergies: "None",
        preferences: "Story time before nap"
      },
      {
        name: "Jack", 
        age: 5,
        specialInstructions: "Needs help with homework",
        allergies: "Peanuts",
        preferences: "Outdoor play, building blocks"
      }
    ],
    emergencyContact: booking.emergencyContact || {
      name: "Dr. Sarah Johnson",
      phone: "(555) 987-6543",
      relation: "Mother"
    }
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return { bg: '#e8f5e9', border: '#c8e6c9', text: '#2e7d32' };
      case 'pending':
        return { bg: '#fff8e1', border: '#ffecb3', text: '#ff8f00' };
      case 'completed':
        return { bg: '#e3f2fd', border: '#bbdefb', text: '#1976d2' };
      case 'cancelled':
        return { bg: '#ffebee', border: '#ffcdd2', text: '#d32f2f' };
      default:
        return { bg: '#f5f5f5', border: '#e0e0e0', text: '#616161' };
    }
  };

  const statusColors = getStatusColor(enhancedBooking.status);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, styles.detailsModalContainer]}>
          {/* Header */}
          <View style={[styles.modalHeader, styles.detailsHeader]}>
            <View style={styles.detailsHeaderContent}>
              <View style={styles.calendarIcon}>
                <Calendar size={24} color="#3b82f6" />
              </View>
              <View>
                <Text style={styles.modalTitle}>Booking Details</Text>
                <Text style={styles.stepIndicator}>{enhancedBooking.family}</Text>
              </View>
            </View>
            
            <View style={styles.headerRight}>
              <View 
                style={[
                  styles.statusBadge,
                  { 
                    backgroundColor: statusColors.bg,
                    borderColor: statusColors.border
                  }
                ]}
              >
                <Text style={[styles.statusText, { color: statusColors.text }]}>
                  {enhancedBooking.status.charAt(0).toUpperCase() + enhancedBooking.status.slice(1)}
                </Text>
              </View>
              
              <TouchableOpacity onPress={onClose}>
                <X size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={styles.detailsContent}>
            {/* Booking Overview */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Booking Overview</Text>
              <View style={styles.overviewGrid}>
                <View style={styles.overviewItem}>
                  <Calendar size={20} color="#6b7280" />
                  <View>
                    <Text style={styles.overviewLabel}>Date</Text>
                    <Text style={styles.overviewValue}>{enhancedBooking.date}</Text>
                  </View>
                </View>
                <View style={styles.overviewItem}>
                  <Clock size={20} color="#6b7280" />
                  <View>
                    <Text style={styles.overviewLabel}>Time</Text>
                    <Text style={styles.overviewValue}>{enhancedBooking.time}</Text>
                  </View>
                </View>
                <View style={styles.overviewItem}>
                  <DollarSign size={20} color="#6b7280" />
                  <View>
                    <Text style={styles.overviewLabel}>Rate</Text>
                    <Text style={[styles.overviewValue, styles.rateValue]}>${enhancedBooking.hourlyRate}/hr</Text>
                  </View>
                </View>
                <View style={styles.overviewItem}>
                  <Star size={20} color="#6b7280" />
                  <View>
                    <Text style={styles.overviewLabel}>Total</Text>
                    <Text style={[styles.overviewValue, styles.totalValue]}>${enhancedBooking.totalAmount}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Location & Contact */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Location & Contact</Text>
              <View style={styles.contactSection}>
                <View style={styles.contactItem}>
                  <MapPin size={20} color="#6b7280" />
                  <View>
                    <Text style={styles.contactTitle}>{enhancedBooking.location}</Text>
                    <Text style={styles.contactDetail}>{enhancedBooking.address}</Text>
                  </View>
                </View>
                <View style={styles.contactItem}>
                  <Phone size={20} color="#6b7280" />
                  <View>
                    <Text style={styles.contactLabel}>Phone</Text>
                    <Text style={styles.contactValue}>{enhancedBooking.contactPhone}</Text>
                  </View>
                </View>
                <View style={styles.contactItem}>
                  <Mail size={20} color="#6b7280" />
                  <View>
                    <Text style={styles.contactLabel}>Email</Text>
                    <Text style={styles.contactValue}>{enhancedBooking.contactEmail}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Children Details */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Baby size={20} color="#6b7280" />
                <Text style={styles.sectionTitle}>Children Details</Text>
              </View>
              <View style={styles.childrenSection}>
                {enhancedBooking.childrenDetails.map((child, index) => (
                  <View key={index} style={styles.childCard}>
                    <View style={styles.childHeader}>
                      <Text style={styles.childName}>{child.name}</Text>
                      <Text style={styles.childAge}>Age {child.age}</Text>
                    </View>
                    
                    <View style={styles.childDetails}>
                      <Text style={styles.childDetail}>
                        <Text style={styles.detailLabel}>Preferences: </Text>
                        {child.preferences}
                      </Text>
                      <Text style={styles.childDetail}>
                        <Text style={styles.detailLabel}>Special Instructions: </Text>
                        {child.specialInstructions}
                      </Text>
                      {child.allergies && child.allergies !== 'None' && (
                        <View style={styles.allergyContainer}>
                          <AlertCircle size={16} color="#ef4444" />
                          <Text style={styles.allergyText}>
                            <Text style={styles.allergyLabel}>Allergies: </Text>
                            {child.allergies}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Requirements */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Requirements</Text>
              <View style={styles.requirementsContainer}>
                {enhancedBooking.requirements.map((req, index) => (
                  <View key={index} style={styles.requirementTag}>
                    <CheckCircle size={12} color="#10b981" />
                    <Text style={styles.requirementText}>{req}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Special Notes */}
            {enhancedBooking.notes && (
              <View style={styles.notesCard}>
                <Text style={styles.sectionTitle}>Special Notes</Text>
                <Text style={styles.notesText}>{enhancedBooking.notes}</Text>
              </View>
            )}

            {/* Emergency Contact */}
            <View style={styles.emergencyCard}>
              <View style={styles.sectionHeader}>
                <AlertCircle size={20} color="#ef4444" />
                <Text style={styles.sectionTitle}>Emergency Contact</Text>
              </View>
              <View style={styles.emergencyDetails}>
                <Text style={styles.emergencyDetail}>
                  <Text style={styles.detailLabel}>Name: </Text>
                  {enhancedBooking.emergencyContact.name}
                </Text>
                <Text style={styles.emergencyDetail}>
                  <Text style={styles.detailLabel}>Relation: </Text>
                  {enhancedBooking.emergencyContact.relation}
                </Text>
                <Text style={styles.emergencyDetail}>
                  <Text style={styles.detailLabel}>Phone: </Text>
                  {enhancedBooking.emergencyContact.phone}
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.detailsFooter}>
            <TouchableOpacity
              onPress={onMessage}
              style={[styles.actionButton, styles.messageButton]}
            >
              <MessageCircle size={16} color="#3b82f6" />
              <Text style={styles.actionButtonText}>Message Family</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={onGetDirections}
              style={[styles.actionButton, styles.directionsButton]}
            >
              <Navigation size={16} color="#10b981" />
              <Text style={styles.actionButtonText}>Get Directions</Text>
            </TouchableOpacity>

            {enhancedBooking.status === 'confirmed' && (
              <TouchableOpacity
                onPress={onCompleteBooking}
                style={[styles.actionButton, styles.completeButton]}
              >
                <CheckCircle size={16} color="#ffffff" />
                <Text style={[styles.actionButtonText, styles.completeButtonText]}>Mark Complete</Text>
              </TouchableOpacity>
            )}

            {(enhancedBooking.status === 'pending' || enhancedBooking.status === 'confirmed') && (
              <TouchableOpacity
                onPress={onCancelBooking}
                style={[styles.actionButton, styles.cancelButton]}
              >
                <Text style={styles.cancelButtonText}>Cancel Booking</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  // Common styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: '100%',
    maxHeight: '90%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  stepIndicator: {
    fontSize: 14,
    color: '#6b7280',
  },
  
  // BookingModal specific styles
  progressContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f9fafb',
  },
  progressBar: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressStep: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  progressCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressCircleActive: {
    backgroundColor: '#ec4899',
  },
  progressText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  progressTextActive: {
    color: 'white',
  },
  progressLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 4,
  },
  progressLineActive: {
    backgroundColor: '#ec4899',
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingHorizontal: 8,
  },
  progressLabel: {
    fontSize: 12,
    color: '#6b7280',
    width: 64,
    textAlign: 'center',
  },
  
  contentContainer: {
    padding: 16,
    maxHeight: '70%',
  },
  stepContainer: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  inputContainer: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    color: '#374151',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  timeContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  timeInputContainer: {
    flex: 1,
    gap: 8,
  },
  costContainer: {
    backgroundColor: '#eff6ff',
    padding: 16,
    borderRadius: 8,
    gap: 4,
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  costLabel: {
    color: '#374151',
  },
  costValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  costDetail: {
    fontSize: 14,
    color: '#4b5563',
  },
  
  childrenList: {
    gap: 12,
  },
  childItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
  },
  checkboxContainer: {
    marginRight: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#ec4899',
    borderColor: '#ec4899',
  },
  childInfo: {
    flex: 1,
  },
  childName: {
    fontWeight: '600',
    color: '#111827',
  },
  childDetails: {
    fontSize: 14,
    color: '#6b7280',
  },
  allergyWarning: {
    fontSize: 14,
    color: '#ef4444',
  },
  
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  emergencyContactContainer: {
    gap: 12,
  },
  
  caregiverSummary: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 8,
  },
  caregiverHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  caregiverName: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#111827',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    color: '#6b7280',
  },
  
  summaryDetails: {
    gap: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    color: '#6b7280',
  },
  summaryValue: {
    fontWeight: '500',
    color: '#111827',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 12,
    marginTop: 4,
  },
  totalLabel: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#111827',
  },
  totalValue: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#10b981',
  },
  
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  errorText: {
    color: '#ef4444',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  footerButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: 'white',
  },
  secondaryButtonText: {
    color: '#374151',
    fontWeight: '500',
  },
  primaryButton: {
    backgroundColor: '#ec4899',
  },
  disabledButton: {
    opacity: 0.5,
  },
  primaryButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  successButton: {
    backgroundColor: '#10b981',
  },
  
  // BookingDetailsModal specific styles
  detailsModalContainer: {
    maxWidth: 500,
  },
  detailsHeader: {
    backgroundColor: '#eff6ff',
  },
  detailsHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  calendarIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusText: {
    fontWeight: '500',
    fontSize: 14,
  },
  
  detailsContent: {
    padding: 16,
  },
  sectionCard: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  overviewItem: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  overviewLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  overviewValue: {
    fontWeight: '500',
    color: '#111827',
  },
  rateValue: {
    color: '#3b82f6',
  },
  totalValue: {
    color: '#10b981',
  },
  
  contactSection: {
    gap: 16,
  },
  contactItem: {
    flexDirection: 'row',
    gap: 12,
  },
  contactTitle: {
    fontWeight: '600',
    color: '#111827',
  },
  contactDetail: {
    fontSize: 14,
    color: '#6b7280',
  },
  contactLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  contactValue: {
    fontWeight: '500',
    color: '#111827',
  },
  
  childrenSection: {
    gap: 12,
  },
  childCard: {
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    padding: 12,
  },
  childHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  childName: {
    fontWeight: '600',
    color: '#111827',
  },
  childAge: {
    fontSize: 14,
    color: '#6b7280',
  },
  childDetails: {
    gap: 4,
  },
  childDetail: {
    fontSize: 14,
    color: '#374151',
  },
  detailLabel: {
    fontWeight: '500',
  },
  allergyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  allergyText: {
    fontSize: 14,
    color: '#ef4444',
  },
  allergyLabel: {
    fontWeight: '500',
  },
  
  requirementsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  requirementTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#d1fae5',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  requirementText: {
    fontSize: 14,
    color: '#065f46',
  },
  
  notesCard: {
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fcd34d',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  notesText: {
    color: '#92400e',
  },
  
  emergencyCard: {
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  emergencyDetails: {
    gap: 8,
  },
  emergencyDetail: {
    fontSize: 14,
    color: '#991b1b',
  },
  
  detailsFooter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  actionButtonText: {
    fontWeight: '500',
  },
  messageButton: {
    backgroundColor: '#dbeafe',
  },
  directionsButton: {
    backgroundColor: '#d1fae5',
  },
  completeButton: {
    backgroundColor: '#3b82f6',
  },
  completeButtonText: {
    color: 'white',
  },
  cancelButton: {
    backgroundColor: '#fee2e2',
  },
  cancelButtonText: {
    color: '#ef4444',
    fontWeight: '500',
  },
});