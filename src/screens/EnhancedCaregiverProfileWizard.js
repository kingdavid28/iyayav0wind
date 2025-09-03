import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Image,
  StyleSheet,
} from 'react-native';
import {
  TextInput,
  Button,
  Chip,
  Card,
  ProgressBar,
  Snackbar,
  Portal,
  Dialog,
  Avatar,
  HelperText,
  Divider,
  Badge,
  IconButton,
  Switch,
  List,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CustomDateTimePicker from '../components/DateTimePicker';
import TimePicker from '../components/TimePicker';
import { useAuth } from '../contexts/AuthContext';
import { jobsAPI, applicationsAPI, bookingsAPI, caregiversAPI, authAPI, uploadsAPI } from "../config/api";
import { API_CONFIG, VALIDATION, CURRENCY, FEATURES } from '../config/constants';
import { styles } from './styles/CaregiverProfileWizard.styles';
import { getCurrentDeviceLocation, searchLocation, validateLocation, formatLocationForDisplay } from '../utils/locationUtils';

const { width } = Dimensions.get('window');

const ENHANCED_STEPS = [
  { id: 'basic', title: 'Basic Information', icon: 'person-outline' },
  { id: 'location', title: 'Address & Location', icon: 'map-marker-outline' },
  { id: 'professional', title: 'Professional Details', icon: 'briefcase-outline' },
  { id: 'skills', title: 'Skills & Certifications', icon: 'school-outline' },
  { id: 'documents', title: 'Legal Documents', icon: 'document-text-outline' },
  { id: 'ageCare', title: 'Age Care Specialization', icon: 'heart-outline' },
  { id: 'portfolio', title: 'Portfolio & Gallery', icon: 'images-outline' },
  { id: 'availability', title: 'Availability Calendar', icon: 'calendar-outline' },
  { id: 'emergency', title: 'Emergency Contacts', icon: 'call-outline' },
  { id: 'verification', title: 'Background Check', icon: 'shield-checkmark-outline' },
  { id: 'review', title: 'Review & Submit', icon: 'checkmark-circle-outline' },
];

const SUGGESTED_SKILLS = [
  'Infant Care', 'Toddler Care', 'School Age Care', 'Special Needs Care',
  'Meal Preparation', 'Light Housekeeping', 'Homework Help', 'Transportation',
  'First Aid Certified', 'CPR Certified', 'Early Childhood Education',
  'Bilingual', 'Pet Care', 'Overnight Care', 'Emergency Care', 'Newborn Care',
  'Potty Training', 'Sleep Training', 'Behavioral Management', 'Arts & Crafts'
];

const DOCUMENT_TYPES = [
  { key: 'government_id', label: 'Government ID', required: true, description: 'Driver\'s License, Passport, or National ID' },
  { key: 'birth_certificate', label: 'Birth Certificate', required: false, description: 'Official birth certificate' },
  { key: 'first_aid_cert', label: 'First Aid Certificate', required: false, description: 'Valid first aid certification' },
  { key: 'cpr_cert', label: 'CPR Certificate', required: false, description: 'Valid CPR certification' },
  { key: 'childcare_cert', label: 'Childcare Certificate', required: false, description: 'Early childhood education or childcare certification' },
  { key: 'medical_clearance', label: 'Medical Clearance', required: false, description: 'Health certificate or medical clearance' },
  { key: 'police_clearance', label: 'Police Clearance', required: false, description: 'Background check or police clearance' },
  { key: 'other', label: 'Other Documents', required: false, description: 'Any other relevant documents' }
];

// Map frontend document keys to backend enum values expected by Mongoose schema
// Backend enums: ['id', 'certification', 'reference', 'medical', 'insurance', 'other']
const DOCUMENT_TYPE_MAP = {
  government_id: 'id',
  birth_certificate: 'id',
  first_aid_cert: 'certification',
  cpr_cert: 'certification',
  childcare_cert: 'certification',
  medical_clearance: 'medical',
  police_clearance: 'reference',
  other: 'other',
};

// Allowed age care enums as per backend schema
const ALLOWED_AGE_CARE_ENUMS = ['INFANT', 'TODDLER', 'PRESCHOOL', 'SCHOOL_AGE', 'TEEN'];

const AGE_CARE_RANGES = [
  { key: 'INFANT', label: 'Infants (0-12 months)', description: 'Newborn care, feeding, diaper changes' },
  { key: 'TODDLER', label: 'Toddlers (1-3 years)', description: 'Active supervision, potty training' },
  { key: 'PRESCHOOL', label: 'Preschoolers (3-5 years)', description: 'Educational activities, social skills' },
  { key: 'SCHOOL_AGE', label: 'School Age (5-12 years)', description: 'Homework help, after-school care' },
  { key: 'TEEN', label: 'Teenagers (12-18 years)', description: 'Mentoring, transportation, supervision' },
];

const PORTFOLIO_CATEGORIES = [
  { key: 'activity', label: 'Activities', icon: 'game-controller-outline' },
  { key: 'meal_prep', label: 'Meal Prep', icon: 'restaurant-outline' },
  { key: 'educational', label: 'Educational', icon: 'book-outline' },
  { key: 'outdoor', label: 'Outdoor', icon: 'leaf-outline' },
  { key: 'craft', label: 'Arts & Crafts', icon: 'brush-outline' },
  { key: 'other', label: 'Other', icon: 'ellipsis-horizontal-outline' },
];

const DAYS_OF_WEEK = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
];

const EnhancedCaregiverProfileWizard = ({ navigation, route }) => {
  const { user } = useAuth();
  const { isEdit = false, existingProfile = null } = route.params || {};
  
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  
  // Location search state
  const [locationSearchVisible, setLocationSearchVisible] = useState(false);
  const [locationSearchText, setLocationSearchText] = useState('');
  const [locationSearchResults, setLocationSearchResults] = useState([]);
  const [locationSearchLoading, setLocationSearchLoading] = useState(false);
  
  const autoSaveTimer = useRef(null);
  const scrollRef = useRef(null);

  // Enhanced form state
  const [formData, setFormData] = useState({
    // Basic Information
    name: existingProfile?.name || '',
    email: existingProfile?.email || user?.email || '',
    phone: existingProfile?.phone || '',
    bio: existingProfile?.bio || '',
    profileImage: existingProfile?.profileImage || '',
    
    // Professional Details
    experience: {
      years: existingProfile?.experience?.years || 0,
      months: existingProfile?.experience?.months || 0,
      description: existingProfile?.experience?.description || '',
    },
    hourlyRate: existingProfile?.hourlyRate?.toString() || '',
    education: existingProfile?.education || '',
    languages: existingProfile?.languages || [],
    
    // Skills & Certifications
    skills: existingProfile?.skills || [],
    certifications: existingProfile?.certifications || [],
    
    // Age Care Specialization
    ageCareRanges: existingProfile?.ageCareRanges || [],
    
    // Portfolio
    portfolio: {
      images: existingProfile?.portfolio?.images || [],
      videos: existingProfile?.portfolio?.videos || [],
    },
    
    // Enhanced Availability
    availability: {
      days: existingProfile?.availability?.days || [],
      hours: existingProfile?.availability?.hours || { start: '08:00', end: '18:00' },
      flexible: existingProfile?.availability?.flexible || false,
      weeklySchedule: existingProfile?.availability?.weeklySchedule || {},
      notes: existingProfile?.availability?.notes || '',
    },
    
    // Emergency Contacts
    emergencyContacts: existingProfile?.emergencyContacts || [],
    
    // Address & Location
    address: {
      street: existingProfile?.address?.street || '',
      city: existingProfile?.address?.city || '',
      province: existingProfile?.address?.province || '',
      zipCode: existingProfile?.address?.zipCode || '',
      country: existingProfile?.address?.country || 'Philippines',
      coordinates: existingProfile?.address?.coordinates || null,
      useCurrentLocation: false,
    },

    // Legal Documents
    documents: existingProfile?.documents || [],

    // Background Check
    backgroundCheck: {
      requestBackgroundCheck: false,
      agreeToTerms: false,
    },
  });

  const [tempInputs, setTempInputs] = useState({
    newSkill: '',
    newCertification: '',
    newLanguage: '',
    portfolioCaption: '',
    emergencyContactForm: {
      name: '',
      relationship: '',
      phone: '',
      email: '',
      address: '',
      isPrimary: false,
    },
    certificateFile: null,
    certIssueDate: null,
    certExpiryDate: null,
  });

  const [locationLoading, setLocationLoading] = useState(false);
  const [documentUploading, setDocumentUploading] = useState(false);
  const [profileImageError, setProfileImageError] = useState(false);

  // Enhanced validation with childcare-specific rules
  const validateField = (field, value) => {
    const newErrors = { ...errors };
    
    switch (field) {
      case 'name':
        if (!value || value.length < VALIDATION.NAME_MIN_LENGTH) {
          newErrors.name = `Name must be at least ${VALIDATION.NAME_MIN_LENGTH} characters`;
        } else {
          delete newErrors.name;
        }
        break;
        
      case 'experience.years':
        const years = parseInt(value);
        if (isNaN(years) || years < 0 || years > VALIDATION.EXPERIENCE_MAX_YEARS) {
          newErrors.experienceYears = `Experience must be between 0 and ${VALIDATION.EXPERIENCE_MAX_YEARS} years`;
        } else {
          delete newErrors.experienceYears;
        }
        break;
        
      case 'experience.description':
        if (!value || value.length < 50) {
          newErrors.experienceDescription = 'Please provide at least 50 characters describing your experience';
        } else {
          delete newErrors.experienceDescription;
        }
        break;
        
      case 'ageCareRanges':
        if (!value || value.length === 0) {
          newErrors.ageCareRanges = 'Please select at least one age range you can care for';
        } else {
          delete newErrors.ageCareRanges;
        }
        break;
        
      case 'emergencyContacts':
        if (!value || value.length < VALIDATION.EMERGENCY_CONTACTS_MIN) {
          newErrors.emergencyContacts = `Please add at least ${VALIDATION.EMERGENCY_CONTACTS_MIN} emergency contact`;
        } else {
          delete newErrors.emergencyContacts;
        }
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const updateFormData = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
    setTouched(prev => ({ ...prev, [field]: true }));
    validateField(field, value);
  };

  // Portfolio image upload
  const handlePortfolioImageUpload = async () => {
    try {
      if (formData.portfolio.images.length >= VALIDATION.PORTFOLIO_MAX_IMAGES) {
        Alert.alert('Limit Reached', `You can only upload up to ${VALIDATION.PORTFOLIO_MAX_IMAGES} images`);
        return;
      }

      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera roll permissions to upload photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        setUploading(true);
        const asset = result.assets[0];
        
        // Skip image manipulation on Android due to compatibility issues
        const mimeType = asset.mimeType || 'image/jpeg';
        const dataUrl = `data:${mimeType};base64,${asset.base64}`;
        
        const response = await authAPI.uploadProfileImageBase64(dataUrl, mimeType);
        const imageUrl = response?.data?.url || response?.url;
        
        if (imageUrl) {
          const absoluteUrl = imageUrl.startsWith('/') 
            ? `${API_CONFIG.BASE_URL.replace('/api', '')}${imageUrl}` 
            : imageUrl;
            
          const newImage = {
            url: absoluteUrl,
            caption: tempInputs.portfolioCaption || '',
            category: 'other',
            uploadedAt: new Date(),
          };
          
          updateFormData('portfolio', {
            ...formData.portfolio,
            images: [...formData.portfolio.images, newImage]
          });
          
          setTempInputs(prev => ({ ...prev, portfolioCaption: '' }));
          showSnackbar('Portfolio image added successfully');
        }
      }
    } catch (error) {
      console.error('Portfolio image upload failed:', error);
      Alert.alert('Upload Failed', 'Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // Emergency contact management
  const addEmergencyContact = () => {
    const contact = tempInputs.emergencyContactForm;
    if (!contact.name || !contact.relationship || !contact.phone) {
      Alert.alert('Missing Information', 'Please fill in name, relationship, and phone number');
      return;
    }

    if (formData.emergencyContacts.length >= VALIDATION.EMERGENCY_CONTACTS_MAX) {
      Alert.alert('Limit Reached', `You can only add up to ${VALIDATION.EMERGENCY_CONTACTS_MAX} emergency contacts`);
      return;
    }

    const newContact = { ...contact, id: Date.now().toString() };
    updateFormData('emergencyContacts', [...formData.emergencyContacts, newContact]);
    
    setTempInputs(prev => ({
      ...prev,
      emergencyContactForm: {
        name: '',
        relationship: '',
        phone: '',
        email: '',
        address: '',
        isPrimary: false,
      }
    }));
  };

  const removeEmergencyContact = (contactId) => {
    updateFormData('emergencyContacts', 
      formData.emergencyContacts.filter(contact => contact.id !== contactId)
    );
  };

  // GPS Location functionality
  const getCurrentLocation = async () => {
    try {
      setLocationLoading(true);
      
      const locationData = await getCurrentDeviceLocation();
      
      if (locationData && locationData.address) {
        updateFormData('address', {
          ...formData.address,
          street: locationData.address.street || '',
          city: locationData.address.city || '',
          province: locationData.address.province || '',
          country: locationData.address.country || 'Philippines',
          zipCode: locationData.address.postalCode || '',
          coordinates: locationData.coordinates,
        });
        showSnackbar('Location updated successfully');
      }
    } catch (error) {
      console.error('Location fetch failed:', error);
      Alert.alert('Location Error', error.message || 'Failed to get current location. Please try again.');
    } finally {
      setLocationLoading(false);
    }
  };

  // Location search functionality
  const handleLocationSearch = async () => {
    if (!locationSearchText.trim()) return;
    
    try {
      setLocationSearchLoading(true);
      const result = await searchLocation(locationSearchText);
      setLocationSearchResults([result]); // Convert to array for consistency
    } catch (error) {
      console.error('Location search failed:', error);
      Alert.alert('Search Failed', error.message || 'Failed to search location. Please try again.');
    } finally {
      setLocationSearchLoading(false);
    }
  };

  const selectLocationFromSearch = (location) => {
    if (location && location.address) {
      updateFormData('address', {
        ...formData.address,
        street: location.address.street || '',
        city: location.address.city || '',
        province: location.address.province || '',
        country: location.address.country || 'Philippines',
        zipCode: location.address.postalCode || '',
        coordinates: location.coordinates,
      });
      setLocationSearchVisible(false);
      setLocationSearchText('');
      setLocationSearchResults([]);
      showSnackbar('Location selected successfully');
    }
  };

  // Document upload functionality
  const handleDocumentUpload = async (documentType) => {
    try {
      setDocumentUploading(true);
      
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        
        // Check file size (max 10MB)
        if (asset.size > 10 * 1024 * 1024) {
          Alert.alert('File Too Large', 'Please select a file smaller than 10MB.');
          return;
        }

        // Convert document to base64 for upload
        const base64 = await FileSystem.readAsStringAsync(asset.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        console.log('📄 Uploading document:', documentType.label);
        const response = await uploadsAPI.uploadDocument({
          documentBase64: base64,
          mimeType: asset.mimeType,
          documentType: documentType.key,
          folder: 'documents',
          fileName: asset.name
        });
        console.log('📄 Upload response:', response);
        const documentUrl = response?.url;
        
        if (documentUrl) {
          const newDocument = {
            id: Date.now().toString(),
            type: documentType.key,
            label: documentType.label,
            url: documentUrl,
            fileName: asset.name,
            uploadedAt: new Date(),
            verified: false,
          };
          
          const updatedDocuments = [...formData.documents, newDocument];
          updateFormData('documents', updatedDocuments);
          showSnackbar(`${documentType.label} uploaded successfully`);
        }
      }
    } catch (error) {
      console.error('Document upload failed:', error);
      Alert.alert('Upload Failed', 'Failed to upload document. Please try again.');
    } finally {
      setDocumentUploading(false);
    }
  };

  // Certificate upload with file attachment
  const addCertificationWithFile = async () => {
    const certName = tempInputs.newCertification.trim();
    if (!certName) {
      Alert.alert('Missing Information', 'Please enter a certification name.');
      return;
    }

    try {
      let certificateUrl = null;
      
      if (tempInputs.certificateFile) {
        setUploading(true);
        const formData = new FormData();
        formData.append('certificate', tempInputs.certificateFile);
        formData.append('folder', 'certificates');
        
        const response = await uploadsAPI.uploadDocument(formData);
        certificateUrl = response?.url;
      }

      const newCertification = {
        id: Date.now().toString(),
        name: certName,
        fileUrl: certificateUrl,
        uploadedAt: new Date(),
        verified: false,
      };

      updateFormData('certifications', [...formData.certifications, newCertification]);
      setTempInputs(prev => ({ 
        ...prev, 
        newCertification: '', 
        certificateFile: null 
      }));
      showSnackbar('Certification added successfully');
    } catch (error) {
      console.error('Certificate upload failed:', error);
      Alert.alert('Upload Failed', 'Failed to upload certificate. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // Background check request
  const requestBackgroundCheck = async () => {
    try {
      setLoading(true);
      await caregiversAPI.requestBackgroundCheck();
      showSnackbar('Background check requested successfully');
      updateFormData('backgroundCheck', {
        ...formData.backgroundCheck,
        requestBackgroundCheck: true
      });
    } catch (error) {
      console.error('Background check request failed:', error);
      Alert.alert('Request Failed', 'Failed to request background check. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    const step = ENHANCED_STEPS[currentStep];
    
    switch (step.id) {
      case 'basic':
        return renderBasicInformation();
      case 'location':
        return renderAddressLocation();
      case 'professional':
        return renderProfessionalDetails();
      case 'skills':
        return renderSkillsAndCertifications();
      case 'documents':
        return renderLegalDocuments();
      case 'ageCare':
        return renderAgeCareSpecialization();
      case 'portfolio':
        return renderPortfolioGallery();
      case 'availability':
        return renderAvailabilityCalendar();
      case 'emergency':
        return renderEmergencyContacts();
      case 'verification':
        return renderBackgroundCheck();
      case 'review':
        return renderReview();
      default:
        return null;
    }
  };

  const renderAgeCareSpecialization = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Age Care Specialization</Text>
      <Text style={styles.stepDescription}>
        Select the age ranges you're comfortable caring for. This helps parents find the right caregiver for their children.
      </Text>

      <View style={styles.ageCareContainer}>
        {AGE_CARE_RANGES.map((range) => (
          <TouchableOpacity
            key={range.key}
            style={[
              styles.ageCareCard,
              formData.ageCareRanges.includes(range.key) && styles.ageCareCardSelected
            ]}
            onPress={() => {
              const ranges = formData.ageCareRanges.includes(range.key)
                ? formData.ageCareRanges.filter(r => r !== range.key)
                : [...formData.ageCareRanges, range.key];
              updateFormData('ageCareRanges', ranges);
            }}
          >
            <View style={styles.ageCareHeader}>
              <Text style={[
                styles.ageCareLabel,
                formData.ageCareRanges.includes(range.key) && styles.ageCareSelectedText
              ]}>
                {range.label}
              </Text>
              {formData.ageCareRanges.includes(range.key) && (
                <Ionicons name="checkmark-circle" size={24} color="#6366f1" />
              )}
            </View>
            <Text style={styles.ageCareDescription}>{range.description}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <HelperText type="error" visible={!!errors.ageCareRanges}>
        {errors.ageCareRanges}
      </HelperText>
    </View>
  );

  const renderPortfolioGallery = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Portfolio & Gallery</Text>
      <Text style={styles.stepDescription}>
        Showcase your childcare experience with photos of activities, meals, and educational moments.
      </Text>

      <View style={styles.portfolioUploadSection}>
        <TextInput
          label="Photo Caption (Optional)"
          value={tempInputs.portfolioCaption}
          onChangeText={(text) => setTempInputs(prev => ({ ...prev, portfolioCaption: text }))}
          mode="outlined"
          style={styles.input}
          placeholder="Describe this photo..."
        />
        
        <Button
          mode="contained"
          onPress={handlePortfolioImageUpload}
          loading={uploading}
          disabled={uploading || formData.portfolio.images.length >= VALIDATION.PORTFOLIO_MAX_IMAGES}
          style={styles.uploadButton}
          icon="camera"
        >
          Add Portfolio Photo ({formData.portfolio.images.length}/{VALIDATION.PORTFOLIO_MAX_IMAGES})
        </Button>
      </View>

      <View style={styles.portfolioGrid}>
        {formData.portfolio.images.map((image, index) => (
          <View key={index} style={styles.portfolioItem}>
            <Image source={{ uri: image.url }} style={styles.portfolioImage} />
            <Text style={styles.portfolioCaption} numberOfLines={2}>
              {image.caption || 'No caption'}
            </Text>
            <IconButton
              icon="close"
              size={20}
              onPress={() => {
                const updatedImages = formData.portfolio.images.filter((_, i) => i !== index);
                updateFormData('portfolio', { ...formData.portfolio, images: updatedImages });
              }}
              style={styles.portfolioRemoveButton}
            />
          </View>
        ))}
      </View>
    </View>
  );

  const renderEmergencyContacts = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Emergency Contacts</Text>
      <Text style={styles.stepDescription}>
        Provide emergency contact information for safety and trust.
      </Text>

      <Card style={styles.emergencyContactForm}>
        <Card.Content>
          <Text style={styles.formSectionTitle}>Add Emergency Contact</Text>
          
          <TextInput
            label="Full Name *"
            value={tempInputs.emergencyContactForm.name}
            onChangeText={(text) => setTempInputs(prev => ({
              ...prev,
              emergencyContactForm: { ...prev.emergencyContactForm, name: text }
            }))}
            mode="outlined"
            style={styles.input}
          />
          
          <TextInput
            label="Relationship *"
            value={tempInputs.emergencyContactForm.relationship}
            onChangeText={(text) => setTempInputs(prev => ({
              ...prev,
              emergencyContactForm: { ...prev.emergencyContactForm, relationship: text }
            }))}
            mode="outlined"
            style={styles.input}
            placeholder="e.g., Mother, Father, Spouse, Friend"
          />
          
          <TextInput
            label="Phone Number *"
            value={tempInputs.emergencyContactForm.phone}
            onChangeText={(text) => setTempInputs(prev => ({
              ...prev,
              emergencyContactForm: { ...prev.emergencyContactForm, phone: text }
            }))}
            mode="outlined"
            style={styles.input}
            keyboardType="phone-pad"
          />
          
          <Button
            mode="contained"
            onPress={addEmergencyContact}
            style={styles.addButton}
            disabled={formData.emergencyContacts.length >= VALIDATION.EMERGENCY_CONTACTS_MAX}
          >
            Add Contact
          </Button>
        </Card.Content>
      </Card>

      <View style={styles.emergencyContactsList}>
        <Text style={styles.formSectionTitle}>
          Emergency Contacts ({formData.emergencyContacts.length})
        </Text>
        
        {formData.emergencyContacts.map((contact, index) => (
          <Card key={contact.id || index} style={styles.emergencyContactCard}>
            <Card.Content>
              <View style={styles.emergencyContactHeader}>
                <Text style={styles.emergencyContactName}>{contact.name}</Text>
                <IconButton
                  icon="close"
                  size={20}
                  onPress={() => removeEmergencyContact(contact.id)}
                />
              </View>
              <Text style={styles.emergencyContactDetail}>
                {contact.relationship} • {contact.phone}
              </Text>
              {contact.email && (
                <Text style={styles.emergencyContactDetail}>{contact.email}</Text>
              )}
            </Card.Content>
          </Card>
        ))}
      </View>

      <HelperText type="error" visible={!!errors.emergencyContacts}>
        {errors.emergencyContacts}
      </HelperText>
    </View>
  );

  const renderBackgroundCheck = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Background Check & Verification</Text>
      <Text style={styles.stepDescription}>
        Complete your background check to build trust with parents and increase your bookings.
      </Text>

      <Card style={styles.backgroundCheckCard}>
        <Card.Content>
          <View style={styles.backgroundCheckHeader}>
            <Ionicons name="shield-checkmark" size={48} color="#6366f1" />
            <Text style={styles.backgroundCheckTitle}>Professional Background Check</Text>
          </View>
          
          <Text style={styles.backgroundCheckDescription}>
            Our background check includes:
          </Text>
          
          <View style={styles.backgroundCheckFeatures}>
            <Text style={styles.backgroundCheckFeature}>• Criminal history verification</Text>
            <Text style={styles.backgroundCheckFeature}>• Identity verification</Text>
            <Text style={styles.backgroundCheckFeature}>• Employment history check</Text>
            <Text style={styles.backgroundCheckFeature}>• Reference verification</Text>
          </View>
          
          <View style={styles.backgroundCheckActions}>
            <View style={styles.checkboxContainer}>
              <Switch
                value={formData.backgroundCheck.agreeToTerms}
                onValueChange={(value) => updateFormData('backgroundCheck', {
                  ...formData.backgroundCheck,
                  agreeToTerms: value
                })}
              />
              <Text style={styles.checkboxLabel}>
                I agree to the background check terms and conditions
              </Text>
            </View>
            
            <Button
              mode="contained"
              onPress={requestBackgroundCheck}
              disabled={!formData.backgroundCheck.agreeToTerms || formData.backgroundCheck.requestBackgroundCheck}
              loading={loading}
              style={styles.backgroundCheckButton}
            >
              {formData.backgroundCheck.requestBackgroundCheck ? 'Background Check Requested' : 'Request Background Check'}
            </Button>
          </View>
        </Card.Content>
      </Card>
    </View>
  );

  // Auto-save functionality
  useEffect(() => {
    const saveToStorage = async () => {
      try {
        await AsyncStorage.setItem(
          `@enhanced_caregiver_profile_draft_${user?.id}`,
          JSON.stringify({ formData, currentStep, timestamp: Date.now() })
        );
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    };

    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current);
    }

    autoSaveTimer.current = setTimeout(() => {
      if (Object.keys(touched).length > 0) {
        setAutoSaving(true);
        saveToStorage().finally(() => {
          setAutoSaving(false);
        });
      }
    }, 2000);

    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
    };
  }, [formData, currentStep, touched, user?.id]);

  // Reset profile image error when image URL changes
  useEffect(() => {
    setProfileImageError(false);
  }, [formData.profileImage]);

  const showSnackbar = (message) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  const validateCurrentStep = () => {
    const step = ENHANCED_STEPS[currentStep];
    let isValid = true;
    
    switch (step.id) {
      case 'basic':
        isValid = validateField('name', formData.name) && 
                 validateField('phone', formData.phone) &&
                 validateField('bio', formData.bio);
        break;
      case 'location':
        // Enhanced location validation
        isValid = validateLocation(formData.address);
        if (!isValid) {
          setErrors(prev => ({
            ...prev,
            location: 'Please provide at least city and province information'
          }));
        } else {
          setErrors(prev => ({ ...prev, location: undefined }));
        }
        break;
      case 'ageCare':
        isValid = validateField('ageCareRanges', formData.ageCareRanges);
        break;
      case 'emergency':
        isValid = validateField('emergencyContacts', formData.emergencyContacts);
        break;
      case 'professional':
        isValid = validateField('experience.description', formData.experience.description);
        break;
    }
    
    return isValid;
  };

  const nextStep = () => {
    if (validateCurrentStep()) {
      if (currentStep < ENHANCED_STEPS.length - 1) {
        setCurrentStep(currentStep + 1);
        scrollRef.current?.scrollTo({ y: 0, animated: true });
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    }
  };

  const submitProfile = async () => {
    if (!validateCurrentStep()) return;
    
    try {
      setLoading(true);
      
      // Validate location
      if (!validateLocation(formData.address)) {
        Alert.alert('Location Error', 'Please provide a valid location with at least city and province information.');
        setLoading(false);
        return;
      }
      
      // Normalize enums and required fields to match backend expectations
      const normalizedAgeCareRanges = (formData.ageCareRanges || [])
        .map(v => (typeof v === 'string' ? v.trim().toUpperCase() : ''))
        .filter(v => ALLOWED_AGE_CARE_ENUMS.includes(v));

      const normalizedDocuments = (formData.documents || []).map(doc => {
        const frontendType = typeof doc.type === 'string' ? doc.type : '';
        const mappedType = DOCUMENT_TYPE_MAP[frontendType] || 'other';
        return {
          ...doc,
          type: mappedType,
          name: doc.name || doc.label || doc.fileName || 'Document',
        };
      });

      const profileData = {
        name: formData.name,
        phone: formData.phone || '+63', // Provide default phone if empty
        bio: formData.bio,
        experience: formData.experience,
        hourlyRate: parseFloat(formData.hourlyRate),
        education: formData.education,
        languages: formData.languages,
        skills: formData.skills,
        certifications: formData.certifications,
        ageCareRanges: normalizedAgeCareRanges,
        portfolio: formData.portfolio,
        availability: formData.availability,
        emergencyContacts: formData.emergencyContacts,
        profileImage: formData.profileImage,
        address: {
          street: formData.address.street,
          city: formData.address.city,
          province: formData.address.province,
          zipCode: formData.address.zipCode,
          country: formData.address.country,
          coordinates: formData.address.coordinates
        },
        documents: normalizedDocuments,
      };

      if (isEdit) {
        await caregiversAPI.updateMyProfile(profileData);
        showSnackbar('Profile updated successfully');
      } else {
        await caregiversAPI.createProfile(profileData);
        showSnackbar('Profile created successfully');
        await AsyncStorage.removeItem(`@enhanced_caregiver_profile_draft_${user?.id}`);
      }
      
      navigation.goBack();
    } catch (error) {
      console.error('Profile submission failed:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: error.config
      });
      Alert.alert('Submission Failed', error.response?.data?.message || error.message || 'Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderProgressIndicator = () => (
    <View style={styles.progressContainer}>
      <View style={styles.progressHeader}>
        <Text style={styles.progressTitle}>
          Step {currentStep + 1} of {ENHANCED_STEPS.length}
        </Text>
        <Text style={styles.progressSubtitle}>
          {ENHANCED_STEPS[currentStep].title}
        </Text>
        {autoSaving && (
          <View style={styles.autoSaveIndicator}>
            <ActivityIndicator size="small" color="#6366f1" />
            <Text style={styles.autoSaveText}>Auto-saving...</Text>
          </View>
        )}
      </View>
      <ProgressBar 
        progress={(currentStep + 1) / ENHANCED_STEPS.length} 
        color="#6366f1"
        style={styles.progressBar}
      />
    </View>
  );

  // Profile image upload for basic information
  const handleProfileImageUpload = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera roll permissions to upload photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        setUploading(true);
        const asset = result.assets[0];
        
        // Skip image manipulation on Android due to compatibility issues
        const mimeType = asset.mimeType || 'image/jpeg';
        
        try {
          const response = await uploadsAPI.base64Upload({
            imageBase64: `data:${mimeType};base64,${asset.base64}`,
            mimeType,
            folder: 'profiles',
            name: `profile_${user?.id}_${Date.now()}`
          });
          
          const imageUrl = response?.url;
          if (imageUrl) {
            const absoluteUrl = imageUrl.startsWith('/') 
              ? `${API_CONFIG.BASE_URL.replace('/api', '')}${imageUrl}` 
              : imageUrl;
            setProfileImageError(false);
            updateFormData('profileImage', absoluteUrl);
            showSnackbar('Profile image updated successfully');
          } else {
            throw new Error('No URL returned from upload');
          }
        } catch (uploadError) {
          console.error('Upload API failed, trying auth API:', uploadError);
          const dataUrl = `data:${mimeType};base64,${asset.base64}`;
          try {
            const response = await authAPI.uploadProfileImageBase64(dataUrl, mimeType);
            const imageUrl = response?.data?.url || response?.url;
            
            if (imageUrl) {
              const absoluteUrl = imageUrl.startsWith('/') 
                ? `${API_CONFIG.BASE_URL.replace('/api', '')}${imageUrl}` 
                : imageUrl;
              setProfileImageError(false);
              updateFormData('profileImage', absoluteUrl);
              showSnackbar('Profile image updated successfully');
            }
          } catch (error) {
            console.error('Profile image upload failed:', error);
            Alert.alert('Upload Failed', 'Failed to upload image. Please try again.');
          }
        }
      }
    } catch (error) {
      console.error('Profile image upload failed:', error);
      Alert.alert('Upload Failed', 'Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const renderBasicInformation = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Basic Information</Text>
      <Text style={styles.stepDescription}>
        Let's start with your basic information to create your caregiver profile.
      </Text>

      <View style={styles.photoSection}>
        <TouchableOpacity onPress={handleProfileImageUpload} disabled={uploading}>
          {uploading ? (
            <View style={styles.uploadingContainer}>
              <ActivityIndicator size="large" color="#6366f1" />
              <Text style={styles.uploadingText}>Uploading...</Text>
            </View>
          ) : formData.profileImage && !profileImageError ? (
            <View style={styles.profileImageContainer}>
              <Image 
                source={{ 
                  uri: formData.profileImage.startsWith('/') 
                    ? `${API_CONFIG.BASE_URL.replace('/api', '')}${formData.profileImage}` 
                    : formData.profileImage,
                  cache: 'reload'
                }}
                style={styles.profileImageDirect}
                onError={(error) => {
                  console.log('Profile image load error:', error);
                  console.log('Image URI:', formData.profileImage);
                  setProfileImageError(true);
                }}
                onLoad={() => {
                  setProfileImageError(false);
                  console.log('Profile image loaded successfully:', formData.profileImage);
                }}
                resizeMode="cover"
              />
            </View>
          ) : (
            <Avatar.Icon 
              size={120} 
              icon="camera" 
              style={styles.profileImagePlaceholder}
            />
          )}
        </TouchableOpacity>
        <Text style={styles.photoHint}>Tap to add profile photo</Text>
      </View>

      <TextInput
        label="Full Name *"
        value={formData.name}
        onChangeText={(text) => updateFormData('name', text)}
        mode="outlined"
        style={styles.input}
        error={!!errors.name}
        left={<TextInput.Icon icon="account" />}
      />
      <HelperText type="error" visible={!!errors.name}>
        {errors.name}
      </HelperText>

      <TextInput
        label="Email Address *"
        value={formData.email}
        onChangeText={(text) => updateFormData('email', text)}
        mode="outlined"
        style={styles.input}
        keyboardType="email-address"
        autoCapitalize="none"
        error={!!errors.email}
        left={<TextInput.Icon icon="email" />}
      />
      <HelperText type="error" visible={!!errors.email}>
        {errors.email}
      </HelperText>

      <TextInput
        label="Phone Number *"
        value={formData.phone}
        onChangeText={(text) => updateFormData('phone', text)}
        mode="outlined"
        style={styles.input}
        keyboardType="phone-pad"
        error={!!errors.phone}
        left={<TextInput.Icon icon="phone" />}
      />
      <HelperText type="error" visible={!!errors.phone}>
        {errors.phone}
      </HelperText>

      <TextInput
        label="Bio / About Me"
        value={formData.bio}
        onChangeText={(text) => updateFormData('bio', text)}
        mode="outlined"
        style={styles.input}
        multiline
        numberOfLines={4}
        placeholder="Tell parents about yourself, your experience, and what makes you special..."
        error={!!errors.bio}
        left={<TextInput.Icon icon="text" />}
      />
      <HelperText type="info" visible={!errors.bio}>
        {formData.bio.length}/{VALIDATION.BIO_MAX_LENGTH} characters
      </HelperText>
      <HelperText type="error" visible={!!errors.bio}>
        {errors.bio}
      </HelperText>
    </View>
  );

  const renderProfessionalDetails = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Professional Details</Text>
      <Text style={styles.stepDescription}>
        Share your professional background and experience with childcare.
      </Text>

      <View style={styles.experienceSection}>
        <Text style={styles.sectionTitle}>Experience *</Text>
        <View style={styles.experienceRow}>
          <TextInput
            label="Years"
            value={formData.experience.years.toString()}
            onChangeText={(text) => updateFormData('experience.years', parseInt(text) || 0)}
            mode="outlined"
            style={[styles.input, { flex: 1, marginRight: 8 }]}
            keyboardType="numeric"
            error={!!errors.experienceYears}
          />
          <TextInput
            label="Months"
            value={formData.experience.months.toString()}
            onChangeText={(text) => updateFormData('experience.months', parseInt(text) || 0)}
            mode="outlined"
            style={[styles.input, { flex: 1, marginLeft: 8 }]}
            keyboardType="numeric"
          />
        </View>
        <HelperText type="error" visible={!!errors.experienceYears}>
          {errors.experienceYears}
        </HelperText>
      </View>

      <TextInput
        label="Experience Description *"
        value={formData.experience.description}
        onChangeText={(text) => updateFormData('experience.description', text)}
        mode="outlined"
        style={styles.input}
        multiline
        numberOfLines={4}
        placeholder="Describe your childcare experience in detail (minimum 50 characters)..."
        error={!!errors.experienceDescription}
        left={<TextInput.Icon icon="briefcase" />}
      />
      <HelperText type="error" visible={!!errors.experienceDescription}>
        {errors.experienceDescription}
      </HelperText>

      <TextInput
        label={`Hourly Rate (${CURRENCY.SYMBOL}) *`}
        value={formData.hourlyRate}
        onChangeText={(text) => updateFormData('hourlyRate', text)}
        mode="outlined"
        style={styles.input}
        keyboardType="numeric"
        placeholder={`${VALIDATION.HOURLY_RATE_MIN} - ${VALIDATION.HOURLY_RATE_MAX}`}
        error={!!errors.hourlyRate}
        left={<TextInput.Icon icon="currency-php" />}
      />
      <HelperText type="error" visible={!!errors.hourlyRate}>
        {errors.hourlyRate}
      </HelperText>

      <TextInput
        label="Education Background"
        value={formData.education}
        onChangeText={(text) => updateFormData('education', text)}
        mode="outlined"
        style={styles.input}
        placeholder="e.g., Bachelor's in Early Childhood Education"
        left={<TextInput.Icon icon="school" />}
      />
    </View>
  );

  const renderSkillsAndCertifications = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Skills & Certifications</Text>
      <Text style={styles.stepDescription}>
        Highlight your skills and certifications to stand out to parents.
      </Text>

      <View style={styles.skillsSection}>
        <Text style={styles.sectionTitle}>Skills *</Text>
        <View style={styles.suggestedSkills}>
          <Text style={styles.suggestedTitle}>Suggested Skills:</Text>
          <View style={styles.chipContainer}>
            {SUGGESTED_SKILLS.map((skill) => (
              <Chip
                key={skill}
                mode={formData.skills.includes(skill) ? 'flat' : 'outlined'}
                selected={formData.skills.includes(skill)}
                onPress={() => {
                  if (formData.skills.includes(skill)) {
                    updateFormData('skills', formData.skills.filter(s => s !== skill));
                  } else {
                    updateFormData('skills', [...formData.skills, skill]);
                  }
                }}
                style={styles.chip}
              >
                {skill}
              </Chip>
            ))}
          </View>
        </View>

        <View style={styles.addSkillContainer}>
          <TextInput
            label="Add Custom Skill"
            value={tempInputs.newSkill}
            onChangeText={(text) => setTempInputs(prev => ({ ...prev, newSkill: text }))}
            mode="outlined"
            style={styles.addInput}
            onSubmitEditing={() => {
              const skill = tempInputs.newSkill.trim();
              if (skill && !formData.skills.includes(skill)) {
                updateFormData('skills', [...formData.skills, skill]);
                setTempInputs(prev => ({ ...prev, newSkill: '' }));
              }
            }}
            returnKeyType="done"
          />
          <Button
            mode="contained"
            onPress={() => {
              const skill = tempInputs.newSkill.trim();
              if (skill && !formData.skills.includes(skill)) {
                updateFormData('skills', [...formData.skills, skill]);
                setTempInputs(prev => ({ ...prev, newSkill: '' }));
              }
            }}
            disabled={!tempInputs.newSkill.trim()}
            style={styles.addButton}
          >
            Add
          </Button>
        </View>

        <View style={styles.selectedSkills}>
          <Text style={styles.selectedTitle}>Your Skills ({formData.skills.length}):</Text>
          <View style={styles.chipContainer}>
            {formData.skills.map((skill) => (
              <Chip
                key={skill}
                mode="flat"
                onClose={() => updateFormData('skills', formData.skills.filter(s => s !== skill))}
                style={styles.selectedChip}
              >
                {skill}
              </Chip>
            ))}
          </View>
        </View>
      </View>

      <Divider style={styles.divider} />

      <View style={styles.certificationsSection}>
        <Text style={styles.sectionTitle}>Certifications</Text>
        <View style={styles.addSkillContainer}>
          <TextInput
            label="Add Certification"
            value={tempInputs.newCertification}
            onChangeText={(text) => setTempInputs(prev => ({ ...prev, newCertification: text }))}
            mode="outlined"
            style={styles.addInput}
            onSubmitEditing={() => {
              const cert = tempInputs.newCertification.trim();
              if (cert && !formData.certifications.includes(cert)) {
                updateFormData('certifications', [...formData.certifications, cert]);
                setTempInputs(prev => ({ ...prev, newCertification: '' }));
              }
            }}
            returnKeyType="done"
            placeholder="e.g., CPR Certified, First Aid"
          />
          
          <View style={styles.datePickerRow}>
            <CustomDateTimePicker
              label="Issue Date"
              value={tempInputs.certIssueDate}
              onDateChange={(date) => setTempInputs(prev => ({ ...prev, certIssueDate: date }))}
              mode="date"
              format="short"
              style={[styles.dateInput, { flex: 1, marginRight: 8 }]}
              maximumDate={new Date()}
              placeholder="Select issue date"
            />
            <CustomDateTimePicker
              label="Expiry Date"
              value={tempInputs.certExpiryDate}
              onDateChange={(date) => setTempInputs(prev => ({ ...prev, certExpiryDate: date }))}
              mode="date"
              format="short"
              style={[styles.dateInput, { flex: 1, marginLeft: 8 }]}
              minimumDate={new Date()}
              placeholder="Select expiry date"
            />
          </View>
          <Button
            mode="outlined"
            onPress={async () => {
              const result = await DocumentPicker.getDocumentAsync({
                type: ['application/pdf', 'image/*'],
                copyToCacheDirectory: true,
              });
              if (!result.canceled && result.assets[0]) {
                setTempInputs(prev => ({ ...prev, certificateFile: result.assets[0] }));
              }
            }}
            style={[styles.addButton, { marginRight: 8 }]}
            icon="attachment"
          >
            Attach File
          </Button>
          <Button
            mode="contained"
            onPress={() => {
              const cert = tempInputs.newCertification.trim();
              if (cert) {
                const newCert = {
                  id: Date.now().toString(),
                  name: cert,
                  verified: false,
                  issuedDate: tempInputs.certIssueDate,
                  expiryDate: tempInputs.certExpiryDate,
                  fileUrl: tempInputs.certificateFile?.uri || null
                };
                updateFormData('certifications', [...formData.certifications, newCert]);
                setTempInputs(prev => ({ 
                  ...prev, 
                  newCertification: '', 
                  certificateFile: null,
                  certIssueDate: null,
                  certExpiryDate: null
                }));
              }
            }}
            disabled={!tempInputs.newCertification.trim()}
            style={styles.addButton}
            loading={uploading}
          >
            Add Certificate
          </Button>
        </View>

        {tempInputs.certificateFile && (
          <View style={styles.filePreview}>
            <Text style={styles.filePreviewText}>Selected: {tempInputs.certificateFile.name}</Text>
            <IconButton
              icon="close"
              size={16}
              onPress={() => setTempInputs(prev => ({ ...prev, certificateFile: null }))}
            />
          </View>
        )}

        <View style={styles.selectedSkills}>
          <Text style={styles.selectedTitle}>Your Certifications ({formData.certifications.length}):</Text>
          <View style={styles.certificationsContainer}>
            {formData.certifications.map((cert) => (
              <Card key={cert.id || cert} style={styles.certificationCard}>
                <Card.Content>
                  <View style={styles.certificationHeader}>
                    <Text style={styles.certificationName}>
                      {typeof cert === 'string' ? cert : cert.name}
                    </Text>
                    <IconButton
                      icon="close"
                      size={20}
                      onPress={() => {
                        const updatedCerts = formData.certifications.filter(c => 
                          (typeof c === 'string' ? c : c.id) !== (typeof cert === 'string' ? cert : cert.id)
                        );
                        updateFormData('certifications', updatedCerts);
                      }}
                    />
                  </View>
                  {cert.fileUrl && (
                    <View style={styles.certificationFile}>
                      <Ionicons name="document-attach" size={16} color="#6366f1" />
                      <Text style={styles.certificationFileText}>Certificate attached</Text>
                    </View>
                  )}
                  {cert.verified && (
                    <Badge style={styles.verifiedBadge}>Verified</Badge>
                  )}
                </Card.Content>
              </Card>
            ))}
          </View>
        </View>
      </View>
    </View>
  );

  // Address & Location render function
  const renderAddressLocation = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Address & Location</Text>
      <Text style={styles.stepDescription}>
        Provide your address information to help parents find caregivers in their area.
      </Text>

      <View style={styles.locationSection}>
        <Button
          mode="outlined"
          onPress={getCurrentLocation}
          loading={locationLoading}
          disabled={locationLoading}
          style={styles.gpsButton}
          icon="map-marker-outline"
        >
          {locationLoading ? 'Getting Location...' : 'Use Current Location (GPS)'}
        </Button>
        
        <Button
          mode="outlined"
          onPress={() => setLocationSearchVisible(true)}
          style={styles.searchButton}
          icon="magnify"
        >
          Search Location
        </Button>
      </View>

      {/* Location Search Dialog */}
      <Portal>
        <Dialog 
          visible={locationSearchVisible} 
          onDismiss={() => setLocationSearchVisible(false)}
          style={styles.locationDialog}
        >
          <Dialog.Title>Search Location</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Enter address or location"
              value={locationSearchText}
              onChangeText={setLocationSearchText}
              mode="outlined"
              style={styles.input}
              onSubmitEditing={handleLocationSearch}
              returnKeyType="search"
            />
            
            {locationSearchLoading && (
              <View style={styles.searchLoading}>
                <ActivityIndicator size="small" color="#6366f1" />
                <Text style={styles.searchLoadingText}>Searching...</Text>
              </View>
            )}
            
            {locationSearchResults.length > 0 && (
              <View style={styles.searchResults}>
                {locationSearchResults.map((result, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.searchResultItem}
                    onPress={() => selectLocationFromSearch(result)}
                  >
                    <Ionicons name="location-outline" size={20} color="#6366f1" />
                    <Text style={styles.searchResultText}>
                      {result.address.formatted}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setLocationSearchVisible(false)}>Cancel</Button>
            <Button onPress={handleLocationSearch} loading={locationSearchLoading}>
              Search
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <TextInput
        label="Street Address"
        value={formData.address.street}
        onChangeText={(text) => updateFormData('address', { ...formData.address, street: text })}
        mode="outlined"
        style={styles.input}
        placeholder="123 Main Street, Barangay Name"
        left={<TextInput.Icon icon="home" />}
      />

      <View style={styles.addressRow}>
        <TextInput
          label="City *"
          value={formData.address.city}
          onChangeText={(text) => updateFormData('address', { ...formData.address, city: text })}
          mode="outlined"
          style={[styles.input, { flex: 1, marginRight: 8 }]}
          placeholder="Cebu City"
          error={!!errors.location}
        />
        <TextInput
          label="Province *"
          value={formData.address.province}
          onChangeText={(text) => updateFormData('address', { ...formData.address, province: text })}
          mode="outlined"
          style={[styles.input, { flex: 1, marginLeft: 8 }]}
          placeholder="Cebu"
          error={!!errors.location}
        />
      </View>

      <HelperText type="error" visible={!!errors.location}>
        {errors.location}
      </HelperText>

      <View style={styles.addressRow}>
        <TextInput
          label="ZIP Code"
          value={formData.address.zipCode}
          onChangeText={(text) => updateFormData('address', { ...formData.address, zipCode: text })}
          mode="outlined"
          style={[styles.input, { flex: 1, marginRight: 8 }]}
          keyboardType="numeric"
          placeholder="6000"
        />
        <TextInput
          label="Country"
          value={formData.address.country}
          onChangeText={(text) => updateFormData('address', { ...formData.address, country: text })}
          mode="outlined"
          style={[styles.input, { flex: 1, marginLeft: 8 }]}
          placeholder="Philippines"
        />
      </View>

      {formData.address.coordinates && (
        <View style={styles.coordinatesDisplay}>
          <Ionicons name="location" size={16} color="#6366f1" />
          <Text style={styles.coordinatesText}>
            GPS: {formData.address.coordinates.latitude.toFixed(6)}, {formData.address.coordinates.longitude.toFixed(6)}
          </Text>
        </View>
      )}
    </View>
  );

  // Legal Documents render function
  const renderLegalDocuments = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Legal Documents</Text>
      <Text style={styles.stepDescription}>
        Upload your legal documents to build trust with parents and verify your identity.
      </Text>

      <View style={styles.documentsGrid}>
        {DOCUMENT_TYPES.map((docType) => {
          const existingDoc = formData.documents.find(doc => doc.type === docType.key);
          
          return (
            <Card key={docType.key} style={styles.documentCard}>
              <Card.Content>
                <View style={styles.documentHeader}>
                  <Text style={styles.documentTitle}>
                    {docType.label}
                    {docType.required && <Text style={styles.requiredText}> *</Text>}
                  </Text>
                  {existingDoc && (
                    <Badge style={styles.uploadedBadge}>Uploaded</Badge>
                  )}
                </View>
                
                <Text style={styles.documentDescription}>{docType.description}</Text>
                
                {existingDoc ? (
                  <View style={styles.uploadedDocument}>
                    <View style={styles.documentInfo}>
                      <Ionicons name="document-text" size={20} color="#6366f1" />
                      <Text style={styles.documentFileName}>{existingDoc.fileName}</Text>
                    </View>
                    <View style={styles.documentActions}>
                      {existingDoc.verified && (
                        <Badge style={styles.verifiedBadge}>Verified</Badge>
                      )}
                      <IconButton
                        icon="close"
                        size={16}
                        onPress={() => {
                          const updatedDocs = formData.documents.filter(doc => doc.id !== existingDoc.id);
                          updateFormData('documents', updatedDocs);
                        }}
                      />
                    </View>
                  </View>
                ) : (
                  <Button
                    mode="outlined"
                    onPress={() => handleDocumentUpload(docType)}
                    loading={documentUploading}
                    disabled={documentUploading}
                    style={styles.uploadButton}
                    icon="upload"
                  >
                    Upload {docType.label}
                  </Button>
                )}
              </Card.Content>
            </Card>
          );
        })}
      </View>

      <View style={styles.documentsSummary}>
        <Text style={styles.summaryTitle}>Upload Summary</Text>
        <Text style={styles.summaryText}>
          {formData.documents.length} of {DOCUMENT_TYPES.length} document types uploaded
        </Text>
        <Text style={styles.summarySubtext}>
          Required documents: {DOCUMENT_TYPES.filter(dt => dt.required).length}
        </Text>
      </View>
    </View>
  );

  const renderAvailabilityCalendar = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Availability Calendar</Text>
      <Text style={styles.stepDescription}>
        Let parents know when you're available to provide childcare services.
      </Text>

      <View style={styles.availabilitySection}>
        <Text style={styles.sectionTitle}>Available Days *</Text>
        <View style={styles.daysContainer}>
          {DAYS_OF_WEEK.map((day) => (
            <TouchableOpacity
              key={day}
              style={[
                styles.dayButton,
                formData.availability.days.includes(day) && styles.dayButtonSelected
              ]}
              onPress={() => {
                const days = formData.availability.days.includes(day)
                  ? formData.availability.days.filter(d => d !== day)
                  : [...formData.availability.days, day];
                updateFormData('availability', { ...formData.availability, days });
              }}
            >
              <Text style={[
                styles.dayButtonText,
                formData.availability.days.includes(day) && styles.dayButtonTextSelected
              ]}>
                {day.substring(0, 3)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.hoursSection}>
          <Text style={styles.sectionTitle}>Available Hours *</Text>
          <View style={styles.hoursContainer}>
            <TimePicker
              label="Start Time"
              value={formData.availability.hours.start}
              onTimeChange={(time) => updateFormData('availability', {
                ...formData.availability,
                hours: { ...formData.availability.hours, start: time }
              })}
              style={styles.timeInput}
              placeholder="08:00"
              minuteInterval={30}
            />
            <Text style={styles.timeSeparator}>to</Text>
            <TimePicker
              label="End Time"
              value={formData.availability.hours.end}
              onTimeChange={(time) => updateFormData('availability', {
                ...formData.availability,
                hours: { ...formData.availability.hours, end: time }
              })}
              style={styles.timeInput}
              placeholder="18:00"
              minuteInterval={30}
            />
          </View>
        </View>

        <View style={styles.flexibilitySection}>
          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => updateFormData('availability', {
              ...formData.availability,
              flexible: !formData.availability.flexible
            })}
          >
            <Ionicons
              name={formData.availability.flexible ? 'checkbox' : 'checkbox-outline'}
              size={24}
              color="#6366f1"
            />
            <Text style={styles.checkboxLabel}>
              I'm flexible with my schedule
            </Text>
          </TouchableOpacity>
        </View>

        <TextInput
          label="Availability Notes"
          value={formData.availability.notes}
          onChangeText={(text) => updateFormData('availability', {
            ...formData.availability,
            notes: text
          })}
          mode="outlined"
          style={styles.input}
          multiline
          numberOfLines={3}
          placeholder="Any additional notes about your availability..."
        />
      </View>
    </View>
  );

  const renderReview = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Review & Submit</Text>
      <Text style={styles.stepDescription}>
        Please review your information before submitting your profile.
      </Text>

      <Card style={styles.reviewCard}>
        <Card.Content>
          <Text style={styles.reviewSectionTitle}>Profile Summary</Text>
          
          <View style={styles.reviewImageContainer}>
            {formData.profileImage && !profileImageError ? (
              <Image 
                source={{ 
                  uri: formData.profileImage.startsWith('/') 
                    ? `${API_CONFIG.BASE_URL.replace('/api', '')}${formData.profileImage}` 
                    : formData.profileImage,
                  cache: 'reload'
                }}
                style={styles.reviewImage}
                onError={(error) => {
                  console.log('Profile image load error (review):', error);
                  setProfileImageError(true);
                }}
                onLoad={() => setProfileImageError(false)}
              />
            ) : (
              <Avatar.Icon size={80} icon="account" style={styles.reviewPlaceholderImage} />
            )}
          </View>
          
          <View style={styles.reviewItem}>
            <Text style={styles.reviewLabel}>Name:</Text>
            <Text style={styles.reviewValue}>{formData.name}</Text>
          </View>
          <View style={styles.reviewItem}>
            <Text style={styles.reviewLabel}>Email:</Text>
            <Text style={styles.reviewValue}>{formData.email}</Text>
          </View>
          <View style={styles.reviewItem}>
            <Text style={styles.reviewLabel}>Phone:</Text>
            <Text style={styles.reviewValue}>{formData.phone}</Text>
          </View>
          <View style={styles.reviewItem}>
            <Text style={styles.reviewLabel}>Experience:</Text>
            <Text style={styles.reviewValue}>
              {formData.experience.years} years, {formData.experience.months} months
            </Text>
          </View>
          <View style={styles.reviewItem}>
            <Text style={styles.reviewLabel}>Hourly Rate:</Text>
            <Text style={styles.reviewValue}>{CURRENCY.SYMBOL}{formData.hourlyRate}</Text>
          </View>
          <View style={styles.reviewItem}>
            <Text style={styles.reviewLabel}>Location:</Text>
            <Text style={styles.reviewValue}>
              {formatLocationForDisplay(formData.address)}
            </Text>
          </View>
          <View style={styles.reviewItem}>
            <Text style={styles.reviewLabel}>Skills:</Text>
            <Text style={styles.reviewValue}>{formData.skills.join(', ')}</Text>
          </View>
          <View style={styles.reviewItem}>
            <Text style={styles.reviewLabel}>Age Care Ranges:</Text>
            <Text style={styles.reviewValue}>
              {formData.ageCareRanges.map(range => 
                AGE_CARE_RANGES.find(r => r.key === range)?.label
              ).filter(Boolean).join(', ')}
            </Text>
          </View>
          <View style={styles.reviewItem}>
            <Text style={styles.reviewLabel}>Available Days:</Text>
            <Text style={styles.reviewValue}>{formData.availability.days.join(', ')}</Text>
          </View>
          <View style={styles.reviewItem}>
            <Text style={styles.reviewLabel}>Emergency Contacts:</Text>
            <Text style={styles.reviewValue}>{formData.emergencyContacts.length} contacts</Text>
          </View>
        </Card.Content>
      </Card>

      <View style={styles.finalChecks}>
        <Text style={styles.finalChecksTitle}>Before you submit:</Text>
        <View style={styles.checklistItem}>
          <Ionicons 
            name={formData.profileImage ? 'checkmark-circle' : 'ellipse-outline'} 
            size={20} 
            color={formData.profileImage ? '#10b981' : '#9ca3af'} 
          />
          <Text style={styles.checklistText}>Profile photo uploaded</Text>
        </View>
        <View style={styles.checklistItem}>
          <Ionicons 
            name={formData.skills.length > 0 ? 'checkmark-circle' : 'ellipse-outline'} 
            size={20} 
            color={formData.skills.length > 0 ? '#10b981' : '#9ca3af'} 
          />
          <Text style={styles.checklistText}>Skills added</Text>
        </View>
        <View style={styles.checklistItem}>
          <Ionicons 
            name={formData.ageCareRanges.length > 0 ? 'checkmark-circle' : 'ellipse-outline'} 
            size={20} 
            color={formData.ageCareRanges.length > 0 ? '#10b981' : '#9ca3af'} 
          />
          <Text style={styles.checklistText}>Age care ranges selected</Text>
        </View>
        <View style={styles.checklistItem}>
          <Ionicons 
            name={validateLocation(formData.address) ? 'checkmark-circle' : 'ellipse-outline'} 
            size={20} 
            color={validateLocation(formData.address) ? '#10b981' : '#9ca3af'} 
          />
          <Text style={styles.checklistText}>Location provided</Text>
        </View>
        <View style={styles.checklistItem}>
          <Ionicons 
            name={formData.emergencyContacts.length > 0 ? 'checkmark-circle' : 'ellipse-outline'} 
            size={20} 
            color={formData.emergencyContacts.length > 0 ? '#10b981' : '#9ca3af'} 
          />
          <Text style={styles.checklistText}>Emergency contacts added</Text>
        </View>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        ref={scrollRef}
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {renderProgressIndicator()}
        {renderStepContent()}
      </ScrollView>

      <View style={styles.navigationContainer}>
        <Button
          mode="outlined"
          onPress={prevStep}
          disabled={currentStep === 0}
          style={styles.navButton}
        >
          Previous
        </Button>
        
        {currentStep === ENHANCED_STEPS.length - 1 ? (
          <Button
            mode="contained"
            onPress={submitProfile}
            loading={loading}
            disabled={loading}
            style={styles.navButton}
          >
            {isEdit ? 'Update Profile' : 'Create Profile'}
          </Button>
        ) : (
          <Button
            mode="contained"
            onPress={nextStep}
            style={styles.navButton}
          >
            Next
          </Button>
        )}
      </View>

      <Portal>
        <Snackbar
          visible={snackbarVisible}
          onDismiss={() => setSnackbarVisible(false)}
          duration={3000}
        >
          {snackbarMessage}
        </Snackbar>
      </Portal>
    </KeyboardAvoidingView>
  );
};

export default EnhancedCaregiverProfileWizard;