import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { 
  X, 
  Clock, 
  MapPin, 
  DollarSign, 
  Calendar, 
  User, 
  Check,
  AlertCircle,
  Plus
} from 'lucide-react-native';
import jobService from '../../../services/jobService';
import { useAuth } from '../../../contexts/AuthContext';
import KeyboardAvoidingWrapper from '../../../shared/ui/layout/KeyboardAvoidingWrapper';
import { Button } from 'react-native-paper';
import {
  getCurrentDeviceLocation,
  searchLocation,
  formatLocationForDisplay,
} from '../../../utils/locationUtils';

import CustomDateTimePicker from '../../../shared/ui/inputs/DateTimePicker';
import TimePicker from '../../../shared/ui/inputs/TimePicker';

// Try to load DateTimePicker if available. Falls back gracefully if not installed.
let DateTimePicker = null;
try {
   
  DateTimePicker = require('@react-native-community/datetimepicker').default;
} catch (e) {
  DateTimePicker = null;
}

const JobPostingModal = ({ visible, onClose, onJobPosted }) => {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [jobData, setJobData] = useState({
    title: '',
    description: '',
    location: null,
    locationText: '',
    rate: '',
    startDate: '',
    endDate: '',
    workingHours: '',
    requirements: [],
    children: [],
    status: 'open',
    parentId: '',
    createdAt: null,
    updatedAt: null,
    applicants: [],
  });
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationSearchVisible, setLocationSearchVisible] = useState(false);
  const [locationSearchText, setLocationSearchText] = useState('');
  const [locationSearchResults, setLocationSearchResults] = useState([]);
  const [locationSearchLoading, setLocationSearchLoading] = useState(false);
  useEffect(() => {
    const userId = user?.uid || user?.id;
    if (userId) {
      setJobData(prev => ({
        ...prev,
        parentId: userId,
        parentName: user.displayName || user.name || 'Parent',
        parentPhoto: user.photoURL || user.profileImage || null
      }));
    }
  }, [user]);

  useEffect(() => {
    if (!visible) {
      setStep(1);
      setErrors({});
      setLocationLoading(false);
      setLocationSearchVisible(false);
      setLocationSearchText('');
      setLocationSearchResults([]);
    }
  }, [visible]);

  const formatDate = (date) => {
    if (!date) return '';
    try {
      const d = new Date(date);
      if (Number.isNaN(d.getTime())) return '';
      // YYYY-MM-DD
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    } catch (_) {
      return '';
    }
  };

  const validateStep = () => {
    const newErrors = {};
    
    if (step === 1) {
      if (!jobData.title.trim()) newErrors.title = 'Job title is required';
      if (!jobData.description.trim()) newErrors.description = 'Description is required';
      if (!jobData.locationText.trim()) newErrors.location = 'Location is required';
      if (!jobData.rate) newErrors.rate = 'Hourly rate is required';
      if (isNaN(jobData.rate)) newErrors.rate = 'Rate must be a number';
    } 
    else if (step === 2) {
      if (!jobData.startDate) newErrors.startDate = 'Start date is required';
      if (!jobData.workingHours) newErrors.workingHours = 'Working hours are required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    
    if (step < 3) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    setErrors({});
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleAddRequirement = () => {
    if (jobData.requirementsInput && jobData.requirementsInput.trim() !== '') {
      setJobData(prev => ({
        ...prev,
        requirements: [...prev.requirements, prev.requirementsInput.trim()],
        requirementsInput: ''
      }));
    }
  };

  const handleRemoveRequirement = (index) => {
    setJobData(prev => ({
      ...prev,
      requirements: prev.requirements.filter((_, i) => i !== index)
    }));
  };

  const handleLocationSearch = async () => {
    if (!locationSearchText.trim()) {
      return;
    }

    try {
      setLocationSearchLoading(true);
      const result = await searchLocation(locationSearchText.trim());
      const resultsArray = Array.isArray(result) ? result : [result].filter(Boolean);
      if (resultsArray.length === 0) {
        Alert.alert('Search Failed', 'No results found for that query.');
      }
      setLocationSearchResults(resultsArray);
    } catch (error) {
      console.error('Location search error:', error);
      Alert.alert('Search Failed', error?.message || 'Failed to search location.');
    } finally {
      setLocationSearchLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      
      // Prepare payload for backend
      const payload = {
        title: jobData.title.trim(),
        description: jobData.description.trim(),
        location: jobData.locationText.trim(),
        locationDetails: jobData.location,
        salary: Number(jobData.rate), // Backend expects 'salary' not 'rate'
        rate: Number(jobData.rate), // Keep both for compatibility
        startDate: jobData.startDate,
        endDate: jobData.endDate || undefined,
        workingHours: jobData.workingHours,
        requirements: jobData.requirements || [],
        children: jobData.children || [],
        parentId: user?.uid || user?.id,
        status: 'open'
      };
      
      console.log('📱 [MOBILE] Job payload:', payload);

      // Use jobService.createJobPost directly for reliability
      const response = await jobService.createJobPost(payload);
      console.log('📱 [MOBILE] Job creation response:', response);

      setLoading(false);
      
      // Pass the created job data back to parent
      const createdJob = response?.data?.job || { ...payload, id: Date.now(), _id: Date.now() };
      if (onJobPosted) onJobPosted(createdJob);
      
      onClose();
      
      // Show success message
      Alert.alert('Success', 'Job posted successfully!');
      
      // Reset form
      setJobData({
        title: '',
        description: '',
        location: null,
        locationText: '',
        rate: '',
        startDate: '',
        endDate: '',
        workingHours: '',
        requirements: [],
        children: [],
      });
      setStep(1);
      
    } catch (error) {
      console.error('Error posting job:', error);
      setLoading(false);
      const msg = error?.response?.data?.message || error.message || 'Failed to post job. Please try again.';
      Alert.alert('Error', msg);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Job Details</Text>
            
            <View>
              <Text style={styles.label}>Job Title *</Text>
              <TextInput
                style={[styles.input, errors.title && styles.inputError]}
                placeholder="e.g., Full-time Nanny Needed"
                value={jobData.title}
                onChangeText={(text) => setJobData({ ...jobData, title: text })}
              />
              {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
            </View>
            
            <View>
              <Text style={styles.label}>Description *</Text>
              <TextInput
                style={[styles.input, styles.textArea, errors.description && styles.inputError]}
                placeholder="Describe the job responsibilities and expectations..."
                multiline
                numberOfLines={4}
                value={jobData.description}
                onChangeText={(text) => setJobData({ ...jobData, description: text })}
              />
              {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
            </View>
            
            <View>
              <Text style={styles.label}>Location *</Text>
              <View style={styles.locationActions}>
                <Button
                  mode="outlined"
                  onPress={async () => {
                    try {
                      setLocationLoading(true);
                      const deviceLocation = await getCurrentDeviceLocation();
                      const formatted = deviceLocation?.address?.formatted || formatLocationForDisplay(deviceLocation?.address);
                      setJobData(prev => ({
                        ...prev,
                        location: deviceLocation,
                        locationText: formatted?.trim() || prev.locationText,
                      }));
                    } catch (error) {
                      Alert.alert('Location Error', error?.message || 'Failed to get current location.');
                    } finally {
                      setLocationLoading(false);
                    }
                  }}
                  style={styles.gpsButton}
                  loading={locationLoading}
                  disabled={locationLoading}
                  icon="map-marker-outline"
                >
                  {locationLoading ? 'Locating…' : 'Use Current Location'}
                </Button>
                <Button
                  mode="outlined"
                  onPress={() => {
                    setLocationSearchVisible(true);
                    setLocationSearchText('');
                    setLocationSearchResults([]);
                  }}
                  style={styles.searchButton}
                  icon="magnify"
                >
                  Search Location
                </Button>
              </View>
              <View style={[styles.inputGroup, errors.location && styles.inputError]}>
                <MapPin size={20} color="#6B7280" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, styles.inputWithIcon]}
                  placeholder="e.g., 123 Main St, City"
                  value={jobData.locationText}
                  onChangeText={(text) => setJobData({ ...jobData, locationText: text, location: null })}
                />
              </View>
              {errors.location && <Text style={styles.errorText}>{errors.location}</Text>}
            </View>
            
            <View>
              <Text style={styles.label}>Hourly Rate (₱) *</Text>
              <View style={[styles.inputGroup, errors.rate && styles.inputError]}>
                <Text style={styles.pesoSign}>₱</Text>
                <TextInput
                  style={[styles.input, styles.inputWithIcon]}
                  placeholder="e.g., 150"
                  keyboardType="numeric"
                  value={jobData.rate}
                  onChangeText={(text) => setJobData({ ...jobData, rate: text.replace(/[^0-9]/g, '') })}
                />
              </View>
              {errors.rate && <Text style={styles.errorText}>{errors.rate}</Text>}
            </View>
          </View>
        );
        
      case 2:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Schedule</Text>
            
            <CustomDateTimePicker
              label="Start Date *"
              value={jobData.startDate ? new Date(jobData.startDate) : new Date()}
              onDateChange={(date) => setJobData({ ...jobData, startDate: date.toISOString().split('T')[0] })}
              minimumDate={new Date()}
              format="long"
              error={errors.startDate}
            />
            
            <CustomDateTimePicker
              label="End Date (Optional)"
              value={jobData.endDate ? new Date(jobData.endDate) : new Date()}
              onDateChange={(date) => setJobData({ ...jobData, endDate: date.toISOString().split('T')[0] })}
              minimumDate={jobData.startDate ? new Date(jobData.startDate) : new Date()}
              format="long"
            />
            
            <View>
              <Text style={styles.label}>Working Hours *</Text>
              <View style={[styles.inputGroup, errors.workingHours && styles.inputError]}>
                <Clock size={20} color="#6B7280" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, styles.inputWithIcon]}
                  placeholder="e.g., 9:00 AM - 5:00 PM, Monday to Friday"
                  value={jobData.workingHours}
                  onChangeText={(text) => setJobData({ ...jobData, workingHours: text })}
                />
              </View>
              {errors.workingHours && <Text style={styles.errorText}>{errors.workingHours}</Text>}
            </View>
          </View>
        );
        
      case 3: {
        const suggestedSkills = [
          'CPR Certified',
          'First Aid Training',
          'Experience with Infants',
          'Meal Preparation',
          'Light Housekeeping'
        ];
        
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Skills</Text>
            
            <View>
              <Text style={styles.label}>Suggested Skills</Text>
              <View style={styles.suggestedSkillsContainer}>
                {suggestedSkills.map((skill, index) => {
                  const isSelected = jobData.requirements.includes(skill);
                  return (
                    <TouchableOpacity
                      key={index}
                      style={[styles.skillChip, isSelected && styles.skillChipSelected]}
                      onPress={() => {
                        if (isSelected) {
                          setJobData(prev => ({
                            ...prev,
                            requirements: prev.requirements.filter(req => req !== skill)
                          }));
                        } else {
                          setJobData(prev => ({
                            ...prev,
                            requirements: [...prev.requirements, skill]
                          }));
                        }
                      }}
                    >
                      <Text style={[styles.skillChipText, isSelected && styles.skillChipTextSelected]}>
                        {skill}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              
              <Text style={[styles.label, { marginTop: 16 }]}>Add Custom Skill</Text>
              <View style={styles.requirementInputContainer}>
                <TextInput
                  style={[styles.input, styles.requirementInput]}
                  placeholder="e.g., Tutoring Experience"
                  value={jobData.requirementsInput || ''}
                  onChangeText={(text) => setJobData({ ...jobData, requirementsInput: text })}
                  onSubmitEditing={handleAddRequirement}
                />
                <TouchableOpacity 
                  style={styles.addButton}
                  onPress={handleAddRequirement}
                >
                  <Plus size={20} color="#fff" />
                </TouchableOpacity>
              </View>
              
              {jobData.requirements.length > 0 && (
                <View style={styles.requirementsList}>
                  {jobData.requirements.map((req, index) => (
                    <View key={index} style={styles.requirementItem}>
                      <Check size={16} color="#10B981" style={styles.requirementIcon} />
                      <Text style={styles.requirementText}>{req}</Text>
                      <TouchableOpacity 
                        style={styles.removeButton}
                        onPress={() => handleRemoveRequirement(index)}
                      >
                        <X size={16} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>
            
            <View style={styles.noteContainer}>
              <AlertCircle size={16} color="#6B7280" style={styles.noteIcon} />
              <Text style={styles.noteText}>
                Adding clear skills helps you find the best match for your family's needs.
              </Text>
            </View>
          </View>
        );
      }
        
      default:
        return null;
    }
  };

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        transparent={true}
        onRequestClose={onClose}
      >
        <KeyboardAvoidingWrapper
          scrollEnabled={false}
          keyboardVerticalOffset={Platform.select({ ios: 100, android: 0 })}
          style={styles.keyboardAvoiding}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {step === 1 ? 'Job Details' : step === 2 ? 'Schedule' : 'Review & Post'}
                </Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <X size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalContent}>
                <View style={styles.stepIndicatorContainer}>
                  {[1, 2, 3].map((stepNum) => (
                    <React.Fragment key={stepNum}>
                      <View
                        style={[
                          styles.stepIndicator,
                          step === stepNum && styles.stepIndicatorActive,
                          step > stepNum && styles.stepIndicatorCompleted,
                        ]}
                      >
                        {step > stepNum ? (
                          <Check size={16} color="#fff" />
                        ) : (
                          <Text
                            style={[
                              styles.stepText,
                              (step === stepNum || step < stepNum) && styles.stepTextActive,
                            ]}
                          >
                            {stepNum}
                          </Text>
                        )}
                      </View>
                      {stepNum < 3 && <View style={styles.stepLine} />}
                    </React.Fragment>
                  ))}
                </View>

                {renderStep()}
              </ScrollView>

              <View style={styles.modalFooter}>
                <View style={styles.footerContent}>
                  {step > 1 && (
                    <TouchableOpacity
                      style={[styles.button, styles.secondaryButton]}
                      onPress={handleBack}
                      disabled={loading}
                    >
                      <Text style={styles.secondaryButtonText}>Back</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={[styles.button, styles.primaryButton, loading && styles.buttonDisabled]}
                    onPress={handleNext}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.primaryButtonText}>
                        {step === 3 ? 'Post Job' : 'Continue'}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </KeyboardAvoidingWrapper>
      </Modal>

      <Modal
        visible={locationSearchVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setLocationSearchVisible(false)}
      >
        <View style={styles.searchOverlay}>
          <View style={styles.searchContainer}>
            <View style={styles.searchHeader}>
              <Text style={styles.searchTitle}>Search Location</Text>
              <TouchableOpacity onPress={() => setLocationSearchVisible(false)} style={styles.closeButton}>
                <X size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <TextInput
              style={[styles.input, styles.searchInput]}
              placeholder="Enter address or place"
              value={locationSearchText}
              onChangeText={(text) => setLocationSearchText(text)}
              returnKeyType="search"
              onSubmitEditing={() => {
                if (!locationSearchText.trim()) return;
                handleLocationSearch();
              }}
            />
            <Button
              mode="contained"
              onPress={handleLocationSearch}
              style={styles.searchActionButton}
              loading={locationSearchLoading}
              disabled={locationSearchLoading || !locationSearchText.trim()}
            >
              Search
            </Button>
            <ScrollView style={styles.searchResults}>
              {locationSearchResults.length === 0 && !locationSearchLoading ? (
                <Text style={styles.searchPlaceholder}>No results yet. Try searching for a city, street, or landmark.</Text>
              ) : (
                locationSearchResults.map((result, index) => {
                  const formatted = result?.address?.formatted || formatLocationForDisplay(result?.address);
                  return (
                    <TouchableOpacity
                      key={`${formatted}-${index}`}
                      style={styles.searchResultItem}
                      onPress={() => {
                        setJobData(prev => ({
                          ...prev,
                          location: result,
                          locationText: formatted || prev.locationText,
                        }));
                        setLocationSearchVisible(false);
                        setLocationSearchText('');
                        setLocationSearchResults([]);
                      }}
                    >
                      <MapPin size={18} color="#4F46E5" style={styles.searchResultIcon} />
                      <Text style={styles.searchResultText}>{formatted}</Text>
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  keyboardAvoiding: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    marginHorizontal: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    padding: 16,
    paddingBottom: 32,
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  footerContent: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
  },
  primaryButton: {
    backgroundColor: '#4F46E5',
  },
  secondaryButton: {
    backgroundColor: '#F3F4F6',
    marginRight: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  secondaryButtonText: {
    color: '#374151',
    fontWeight: '600',
    fontSize: 16,
  },
  stepIndicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  stepIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepIndicatorActive: {
    backgroundColor: '#4F46E5',
  },
  stepIndicatorCompleted: {
    backgroundColor: '#10B981',
  },
  stepText: {
    color: '#6B7280',
    fontWeight: '600',
  },
  stepTextActive: {
    color: '#fff',
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: '#E5E7EB',
  },
  stepContainer: {
    marginBottom: 16,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 2,
    marginBottom: 8,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 16,
  },
  locationActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    gap: 8,
  },
  gpsButton: {
    flexGrow: 1,
  },
  searchButton: {
    flexGrow: 1,
  },
  inputIcon: {
    marginLeft: 12,
  },
  pesoSign: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginLeft: 12,
  },
  inputWithIcon: {
    flex: 1,
    borderWidth: 0,
    marginBottom: 0,
    marginLeft: 8,
  },
  requirementInputContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  requirementInput: {
    flex: 1,
    marginRight: 8,
    marginBottom: 0,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  requirementsList: {
    marginBottom: 16,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 6,
    padding: 12,
    marginBottom: 8,
  },
  requirementIcon: {
    marginRight: 8,
  },
  requirementText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
  },
  removeButton: {
    padding: 4,
  },
  noteContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  noteIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  noteText: {
    flex: 1,
    fontSize: 12,
    color: '#4B5563',
    lineHeight: 16,
  },
  suggestedSkillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  skillChip: {
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  skillChipSelected: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  skillChipText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  skillChipTextSelected: {
    color: '#fff',
  },
  searchOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  searchContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    maxHeight: '80%',
  },
  searchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  searchTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  searchInput: {
    marginBottom: 12,
  },
  searchActionButton: {
    marginBottom: 16,
  },
  searchResults: {
    maxHeight: 280,
  },
  searchPlaceholder: {
    color: '#6B7280',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 16,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  searchResultIcon: {
    marginRight: 12,
  },
  searchResultText: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
  },
});

export default JobPostingModal;
