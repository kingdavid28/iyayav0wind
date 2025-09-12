import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { View, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system/legacy';
import { useAuth } from '../../../core/contexts/AuthContext';
import { caregiversAPI, authAPI } from '../../../app/config/api';
import { jobsAPI, bookingsAPI, childrenAPI } from '../../../app/config/api';
import { formatAddress } from '../../../utils/addressUtils';
import { styles } from '../../../screens/styles/ParentDashboard.styles';
// Privacy components
import PrivacyProvider from '../../../components/Privacy/PrivacyManager';
import ProfileDataProvider from '../../../components/Privacy/ProfileDataManager';

import Header from '../../../screens/ParentDashboard/components/Header';
import NavigationTabs from '../../../screens/ParentDashboard/components/NavigationTabs';
import HomeTab from '../../../screens/ParentDashboard/components/HomeTab';
import SearchTab from '../../../screens/ParentDashboard/components/SearchTab';
import BookingsTab from '../../../screens/ParentDashboard/components/BookingsTab';
import MessagesTab from '../../../screens/ParentDashboard/components/MessagesTab';
import JobsTab from '../../../screens/ParentDashboard/components/JobsTab';
// import ProfileTab from '../../../screens/ParentDashboard/components/ProfileTab';
import MobileProfileSection from '../../../screens/ParentDashboard/components/MobileProfileSection';
import ProfileModal from '../../../screens/ParentDashboard/modals/ProfileModal';
import FilterModal from '../../../screens/ParentDashboard/modals/FilterModal';
import JobPostingModal from '../../../screens/ParentDashboard/modals/JobPostingModal';
import BookingModal from '../../../screens/ParentDashboard/modals/BookingModal';
import PaymentModal from '../../../screens/ParentDashboard/modals/PaymentModal';
import ChildModal from '../../../screens/ParentDashboard/modals/ChildModal';


// Import services
// import { userService } from '../../../services/userService';
import { useApp } from '../../../contexts/AppContext';

// Import utilities
import { fetchAndProcessBookings } from '../../../utils/bookingUtils';
// import { getCaregiverDisplayName } from '../../../utils/caregiverUtils';
import { applyFilters, countActiveFilters } from '../../../utils/caregiverUtils';

// No sample data - all data comes from database
const SAMPLE_CHILDREN = [];
const SAMPLE_CAREGIVERS = [];

const ParentDashboard = () => {
  const navigation = useNavigation();
  const { signOut, user } = useAuth();
  const { state } = useApp();
  
  // State management
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [showChildModal, setShowChildModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showJobPostingModal, setShowJobPostingModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [caregivers, setCaregivers] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [filteredCaregivers, setFilteredCaregivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [caregiversLoading, setCaregiversLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  
  // Filter state
  const [filters, setFilters] = useState({
    availability: { availableNow: false, days: [] },
    location: { distance: 10, location: '' },
    rate: { min: 0, max: 1000 },
    experience: { min: 0, max: 30 },
    certifications: [],
    rating: 0,
  });
  const [activeFilters, setActiveFilters] = useState(0);

  // Local UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [children, setChildren] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [bookingsFilter, setBookingsFilter] = useState('upcoming');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentBookingId, setPaymentBookingId] = useState(null);
  const [paymentBase64, setPaymentBase64] = useState('');
  const [paymentMime, setPaymentMime] = useState('image/jpeg');



  // Child form state
  const [childName, setChildName] = useState('');
  const [childAge, setChildAge] = useState('');
  const [childAllergies, setChildAllergies] = useState('');
  const [childNotes, setChildNotes] = useState('');
  const [editingChildId, setEditingChildId] = useState(null);

  // Profile form state
  const [profileName, setProfileName] = useState('');
  const [profileContact, setProfileContact] = useState('');
  const [profileLocation, setProfileLocation] = useState('');
  const [profileImage, setProfileImage] = useState('');
  
  // Booking modal state
  const [isBookingModalVisible, setIsBookingModalVisible] = useState(false);
  const [selectedCaregiver, setSelectedCaregiver] = useState({
    id: '1',
    name: 'Ana Dela Cruz',
    avatar: 'https://example.com/avatar.jpg',
    rating: 4.8,
    reviews: 124,
    rate: '$18/hr',
  });

  // Derived data
  const displayName = (user?.displayName || (user?.email ? String(user.email).split('@')[0] : '') || '').trim();
  const greetingName = (profileName && String(profileName).trim()) || displayName;

  // Quick actions
  const quickActions = useMemo(() => [
    {
      id: 'find',
      icon: 'search',
      title: 'Find Caregiver',
      onPress: () => setActiveTab('search')
    },
    {
      id: 'book',
      icon: 'calendar',
      title: 'Book Service',
      onPress: () => {
        if (caregivers?.length > 0) {
          const cg = caregivers[0];
          setSelectedCaregiver({
            _id: cg._id || cg.id,
            id: cg._id || cg.id,
            userId: cg.userId || null,
            name: cg.name,
            avatar: cg.avatar || cg.profileImage,
            rating: cg.rating,
            reviews: cg.reviewCount,
            hourlyRate: cg.hourlyRate,
            rate: cg.hourlyRate ? `₱${cg.hourlyRate}/hr` : undefined,
          });
        } else {
          setSelectedCaregiver({
            _id: '1',
            id: '1',
            userId: '1',
            name: 'Ana Dela Cruz',
            avatar: 'https://example.com/avatar.jpg',
            rating: 4.8,
            reviews: 124,
            hourlyRate: 350,
            rate: '₱350/hr'
          });
        }
        setIsBookingModalVisible(true);
      }
    },
    {
      id: 'messages',
      icon: 'message-circle',
      title: 'Messages',
      onPress: () => setActiveTab('messages')
    },
    {
      id: 'add-child',
      icon: 'plus',
      title: 'Add Child',
      onPress: () => openAddChild()
    },
    // {
    //   id: 'post-job',
    //   icon: 'briefcase',
    //   title: 'Post Job',
    //   onPress: () => setActiveTab('jobs')
    // },
  ], [caregivers, navigation]);

  // Data loading functions
  const handleFetchBookings = useCallback(async () => {
    try {
      setRefreshing(true);
      console.log('🔍 Fetching bookings from backend...');
      
      const normalizedBookings = await fetchAndProcessBookings(bookingsAPI);
      setBookings(normalizedBookings);
      console.log(`✅ Loaded ${normalizedBookings.length} real bookings from backend`);
      
    } catch (error) {
      console.error('❌ Backend bookings fetch failed:', error.message);
      // Fallback to empty bookings
      console.log('🔄 Using empty bookings as fallback');
      setBookings([]);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const fetchCaregivers = useCallback(async () => {
    try {
      setCaregiversLoading(true);
      console.log('🔍 Fetching caregivers from backend...');
      
      const response = await caregiversAPI.getCaregivers();
      const caregiversList = response.data?.caregivers || response.caregivers || [];
      
      const transformedCaregivers = caregiversList.map(caregiver => ({
        ...caregiver,
        id: caregiver.id || caregiver._id,
        name: caregiver.name || 'Unnamed Caregiver',
        rating: typeof caregiver.rating === 'number' ? caregiver.rating : 0,
        reviewCount: caregiver.reviewCount || 0,
        hourlyRate: caregiver.hourlyRate || 0,
        location: caregiver.location || caregiver.address || 'Location not specified',
        skills: Array.isArray(caregiver.skills) ? caregiver.skills : [],
        experience: caregiver.experience || { years: 0, months: 0, description: 'No experience information' },
        availability: caregiver.availability || { days: [] },
        ageCareRanges: Array.isArray(caregiver.ageCareRanges) ? caregiver.ageCareRanges : []
      }));
      
      setCaregivers(transformedCaregivers);
      console.log(`✅ Loaded ${transformedCaregivers.length} real caregivers from backend`);
      return transformedCaregivers;
      
    } catch (error) {
      console.error('❌ Backend caregivers fetch failed:', error.message);
      // No fallback - show empty state when backend fails
      console.log('🔄 No caregivers available - backend unavailable');
      setCaregivers([]);
      return [];
    } finally {
      setCaregiversLoading(false);
    }
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading profile data from backend...');
      
      const profile = await authAPI.getProfile();
      console.log('📋 Backend profile response:', profile);
      setUserData(profile.data);

      // Initialize profile form data from API response
      if (profile.data) {
        setProfileName(profile.data.name || '');
        setProfileContact(profile.data.email || profile.data.contact || '');
        setProfileLocation(profile.data.location || '');
        
        const imageUrl = profile.data.profileImage || 
                        profile.data.avatar || 
                        profile.data.user?.profileImage || 
                        profile.data.user?.avatar || 
                        profile.profileImage ||
                        profile.avatar ||
                        '';
        setProfileImage(imageUrl);
        console.log('🖼️ Profile image loaded:', imageUrl);
      }

      // Load jobs from backend
      const jobsResponse = await jobsAPI.getMyJobs();
      const jobsList = jobsResponse?.data?.jobs || jobsResponse?.jobs || [];
      setJobs(jobsList);
      console.log(`✅ Loaded ${jobsList.length} real jobs from backend`);
      
    } catch (error) {
      console.error('❌ Backend profile/jobs fetch failed:', error.message);
      // Set fallback values if backend fails
      console.log('🔄 Using fallback profile data');
      setProfileName('User');
      setProfileContact('No email available');
      setProfileLocation('Location not set');
      setProfileImage('');
      setJobs([]); // Empty jobs array as fallback
    } finally {
      setLoading(false);
    }
  };

  const fetchMyChildren = useCallback(async () => {
    try {
      console.log('🔍 Fetching children from backend...');
      const response = await childrenAPI.getMyChildren();
      const childrenList = response?.data?.children || response?.children || [];
      
      console.log(`✅ Loaded ${childrenList.length} children from backend`);
      setChildren(childrenList);
    } catch (err) {
      console.error('❌ Backend children fetch failed:', err.message);
      console.log('🔄 No children available - backend unavailable');
      setChildren([]);
    }
  }, []);



  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        loadData(),
        fetchCaregivers(),
        handleFetchBookings(),
        fetchMyChildren()
      ]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  }, [loadData, fetchCaregivers, handleFetchBookings, fetchMyChildren]);



  // Initial data load
  const didInitRef = useRef(false);
  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;
    
    const loadInitialData = async () => {
      await Promise.all([
        loadData(),
        fetchCaregivers(),
        handleFetchBookings(),
        fetchMyChildren()
      ]);
    };
    
    loadInitialData();
  }, []);

  // Refetch bookings when tab becomes active
  useEffect(() => {
    if (activeTab === 'bookings') {
      handleFetchBookings();
    }
  }, [activeTab]);

  // Child management functions
  const openAddChild = useCallback(() => {
    setEditingChildId(null);
    setChildName('');
    setChildAge('');
    setChildAllergies('');
    setChildNotes('');
    setShowChildModal(true);
  }, []);

  const openEditChild = useCallback((child) => {
    setEditingChildId(child._id || child.id);
    setChildName(child.name || '');
    setChildAge(String(child.age ?? ''));
    setChildAllergies(child.allergies || '');
    setChildNotes(child.preferences || '');
    setShowChildModal(true);
  }, []);

  const handleAddOrSaveChild = useCallback(async () => {
    const trimmedName = (childName || '').trim();
    if (!trimmedName) return;
    
    const ageNum = Number(childAge || 0);
    const childData = {
      name: trimmedName,
      age: ageNum,
      allergies: childAllergies || '',
      preferences: childNotes || ''
    };
    
    try {
      if (editingChildId) {
        // Update existing child
        await childrenAPI.update(editingChildId, childData);
        console.log('✅ Child updated successfully');
      } else {
        // Create new child
        await childrenAPI.create(childData);
        console.log('✅ Child created successfully');
      }
      
      // Refresh children list
      await fetchMyChildren();
      
      // Close modal and reset form
      setShowChildModal(false);
      setEditingChildId(null);
      setChildName('');
      setChildAge('');
      setChildAllergies('');
      setChildNotes('');
    } catch (error) {
      console.error('❌ Child save failed:', error.message);
      Alert.alert('Error', 'Failed to save child. Please try again.');
    }
  }, [childName, childAge, childAllergies, childNotes, editingChildId, fetchMyChildren]);

  // Caregiver interaction functions
  const handleViewCaregiver = (caregiver) => {
    navigation.navigate('CaregiverProfile', { caregiverId: caregiver.id });
  };

  const handleMessageCaregiver = (caregiver) => {
    navigation.navigate('Messaging', { 
      recipientId: caregiver.id,
      recipientName: caregiver.name,
      recipientAvatar: caregiver.avatar
    });
  };

  const handleBookCaregiver = (caregiver) => {
    setSelectedCaregiver({
      id: caregiver.id,
      name: caregiver.name,
      avatar: caregiver.avatar,
      rating: caregiver.rating,
      reviews: caregiver.reviewCount,
      hourlyRate: caregiver.hourlyRate,
      rate: caregiver.hourlyRate ? `₱${caregiver.hourlyRate}/hr` : undefined,
    });
    setIsBookingModalVisible(true);
  };

  // Booking functions
  const handleBookingConfirm = async (bookingData) => {
    console.log('🔍 Raw booking data received:', bookingData);
    
    // Validate required fields
    if (!bookingData.caregiverId || !bookingData.date || !bookingData.startTime || !bookingData.endTime) {
      throw new Error('Missing required booking information');
    }
    
    // Transform selected children names to child objects
    const selectedChildrenObjects = (bookingData.selectedChildren || []).map(childName => {
      const childData = children.find(child => child.name === childName);
      return childData ? {
        name: childData.name,
        age: childData.age,
        preferences: childData.preferences || '',
        allergies: childData.allergies || ''
      } : {
        name: childName,
        age: 0,
        preferences: '',
        allergies: ''
      };
    });

    // Validate all required fields are present
    const requiredFields = ['caregiverId', 'date', 'startTime', 'endTime', 'address', 'hourlyRate', 'totalCost'];
    for (const field of requiredFields) {
      if (!bookingData[field]) {
        console.error(`Missing required field: ${field}`);
        throw new Error(`Missing required field: ${field}`);
      }
    }

    const payload = {
      caregiverId: bookingData.caregiverId,
      date: bookingData.date,
      startTime: bookingData.startTime,
      endTime: bookingData.endTime,
      address: bookingData.address,
      hourlyRate: Number(bookingData.hourlyRate),
      totalCost: Number(bookingData.totalCost),
      children: selectedChildrenObjects || []
    };

    console.log('📤 Sending booking payload:', JSON.stringify(payload, null, 2));

    const attemptBooking = async (retryCount = 0) => {
      try {
        const res = await bookingsAPI.create(payload);
        console.log('✅ Booking created successfully:', res);
        setActiveTab('bookings');
        await handleFetchBookings();
        setIsBookingModalVisible(false);
        Alert.alert('Success', 'Booking created successfully!');
        return res;
      } catch (err) {
        console.error('❌ Booking error:', err);
        
        if (err.response?.status === 429) {
          if (retryCount < 2) {
            const waitTime = (retryCount + 1) * 30;
            Alert.alert(
              'Rate Limit Exceeded',
              `Too many requests. Retrying in ${waitTime} seconds...`
            );
            
            await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
            return attemptBooking(retryCount + 1);
          } else {
            Alert.alert(
              'Rate Limit Exceeded',
              'Server is busy. Please try again in a few minutes.'
            );
          }
        } else {
          Alert.alert('Error', err.message || 'Failed to create booking');
        }
        throw err;
      }
    };

    return attemptBooking();
  };

  const handleCancelBooking = async (bookingId) => {
    try {
      setRefreshing(true);
      await bookingsAPI.cancel(bookingId);
    } catch (e) {
      console.warn('Failed to cancel booking:', e?.message || e);
    } finally {
      await handleFetchBookings();
    }
  };

  const openPaymentModal = (bookingId) => {
    setPaymentBookingId(bookingId);
    setPaymentBase64('');
    setPaymentMime('image/jpeg');
    setShowPaymentModal(true);
  };

  const handleUploadPayment = async () => {
    if (!paymentBookingId || !paymentBase64) return;
    
    try {
      await bookingsAPI.uploadPaymentProof(paymentBookingId, paymentBase64, paymentMime);
      setShowPaymentModal(false);
      setPaymentBookingId(null);
      setPaymentBase64('');
      await handleFetchBookings();
    } catch (e) {
      console.warn('Failed to upload payment proof:', e?.message || e);
    }
  };

  // Filter functions
  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters);
    setActiveFilters(countActiveFilters(newFilters));
    
    const currentResults = searchQuery ? searchResults : caregivers;
    const filtered = applyFilters(currentResults, newFilters);
    setFilteredCaregivers(filtered);
    
    if (searchQuery) {
      setSearchResults(filtered);
    }
  };

  // Job management functions
  const handleCreateJob = () => {
    setShowJobPostingModal(true);
  };

  const handleEditJob = (job) => {
    // Set job data for editing
    setShowJobPostingModal(true);
  };

  const handleCompleteJob = async (jobId) => {
    Alert.alert(
      'Complete Job',
      'Mark this job as completed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: async () => {
            try {
              setLoading(true);
              await jobsAPI.update(jobId, { status: 'completed' });
              
              // Update job status in local state immediately
              setJobs(prevJobs => prevJobs.map(job => 
                (job.id === jobId || job._id === jobId) 
                  ? { ...job, status: 'completed' }
                  : job
              ));
              
              Alert.alert('Success', 'Job marked as completed');
            } catch (error) {
              console.error('Error completing job:', error);
              Alert.alert('Error', 'Failed to complete job');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleDeleteJob = async (jobId) => {
    Alert.alert(
      'Delete Job',
      'Are you sure you want to delete this job posting?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await jobsAPI.delete(jobId);
              
              // Remove job from local state immediately
              setJobs(prevJobs => prevJobs.filter(job => job.id !== jobId && job._id !== jobId));
              
              Alert.alert('Success', 'Job deleted successfully');
              await loadData(); // Refresh jobs list
            } catch (error) {
              console.error('Error deleting job:', error);
              Alert.alert('Error', 'Failed to delete job');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleJobPosted = async (newJob) => {
    try {
      // Add new job to local state immediately
      setJobs(prevJobs => [newJob, ...prevJobs]);
      setShowJobPostingModal(false);
      Alert.alert('Success', 'Job posted successfully!');
      
      // Refresh data to sync with backend
      await loadData();
    } catch (error) {
      console.error('Error handling job post:', error);
    }
  };

  // Profile functions
  const handleSaveProfile = async (imageUri = null) => {
    try {
      const updateData = {
        name: profileName.trim(),
        contact: profileContact.trim(),
        location: profileLocation.trim()
      };

      console.log('Updating profile with data:', updateData);
      
      // Handle image upload if provided
      if (imageUri) {
        try {
          // Convert image to base64 using FileSystem (React Native compatible)
          const base64Image = await FileSystem.readAsStringAsync(imageUri, {
            encoding: 'base64',
          });
          
          // Upload image first
          const imageResult = await authAPI.uploadProfileImageBase64(base64Image, 'image/jpeg');
          console.log('Image upload result:', imageResult);
          
          // Handle different response structures
          const imageUrl = imageResult?.data?.url || imageResult?.url || imageResult?.data?.profileImageUrl;
          if (imageUrl) {
            updateData.profileImage = imageUrl;
            setProfileImage(imageUrl);
            console.log('✅ Profile image updated to:', imageUrl);
          } else {
            console.log('⚠️ No image URL found in response:', imageResult);
          }
        } catch (imageError) {
          console.error('Error uploading image:', imageError);
          Alert.alert('Warning', 'Profile updated but image upload failed');
        }
      }
      
      const result = await authAPI.updateProfile(updateData);
      
      console.log('Profile update result:', result);
      
      // The API returns the updated data directly, not wrapped in success property
      if (result && result.data) {
        // Update local state with new data
        setProfileName(result.data.name || profileName);
        setProfileContact(result.data.contact || result.data.email || profileContact);
        setProfileLocation(result.data.location || profileLocation);
        if (result.data.profileImage) {
          setProfileImage(result.data.profileImage);
        }
        
        setShowProfileModal(false);
        Alert.alert('Success', 'Profile updated successfully');
        
        // Reload profile data to ensure sync
        await loadData();
      } else {
        Alert.alert('Error', 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    }
  };

  // Render functions
  const renderActiveTab = () => {
    switch (activeTab) {
      case 'home':
        return (
          <HomeTab
            bookings={bookings}
            children={children}
            quickActions={quickActions}
            onAddChild={openAddChild}
            onEditChild={openEditChild}
            onDeleteChild={() => {}}
            onViewBookings={() => setActiveTab('bookings')}
            greetingName={greetingName}
            profileImage={profileImage}
            profileContact={profileContact}
            profileLocation={profileLocation}
            userData={userData}
            caregivers={[]}
            onBookCaregiver={() => {}}
            onMessageCaregiver={() => {}}
          />
        );
      case 'search':
        return (
          <SearchTab
            searchQuery={searchQuery}
            filteredCaregivers={filteredCaregivers}
            caregivers={caregivers}
            searchLoading={searchLoading}
            refreshing={refreshing}
            activeFilters={activeFilters}
            onRefresh={onRefresh}
            onBookCaregiver={handleBookCaregiver}
            onMessageCaregiver={handleMessageCaregiver}
            onViewCaregiver={handleViewCaregiver}
            onSearch={setSearchQuery}
            onOpenFilter={() => setShowFilterModal(true)}
          />
        );
      case 'bookings':
        return (
          <BookingsTab
            bookings={bookings}
            bookingsFilter={bookingsFilter}
            setBookingsFilter={setBookingsFilter}
            refreshing={refreshing}
            onRefresh={onRefresh}
            onCancelBooking={handleCancelBooking}
            onUploadPayment={openPaymentModal}
            onViewBookingDetails={(bookingId) => navigation.navigate('BookingDetails', { bookingId })}
            onWriteReview={(bookingId, caregiverId) => navigation.navigate('Review', { bookingId, caregiverId })}
          />
        );
      case 'messages':
        return (
          <MessagesTab
            navigation={navigation}
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        );
      case 'jobs':
        return (
          <JobsTab
            jobs={jobs}
            refreshing={refreshing}
            onRefresh={onRefresh}
            onCreateJob={handleCreateJob}
            onEditJob={handleEditJob}
            onDeleteJob={handleDeleteJob}
            onCompleteJob={handleCompleteJob}
          />
        );
      default:
        return null;
    }
  };

  return (
    <PrivacyProvider>
      <ProfileDataProvider>
        <View style={styles.container}>
      <Header 
        navigation={navigation} 
        onProfilePress={() => setShowProfileModal(true)} 
        onSignOut={signOut}
        greetingName={greetingName}
        onProfileEdit={() => setShowProfileModal(true)}
        profileName={profileName}
        profileImage={profileImage}
        profileContact={profileContact}
        profileLocation={profileLocation}
        setActiveTab={setActiveTab}
      />
      
      <NavigationTabs 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onProfilePress={() => setShowProfileModal(true)}
        navigation={navigation}
      />
      
      {renderActiveTab()}

      {/* Modals */}
      <ChildModal
        visible={showChildModal}
        onClose={() => setShowChildModal(false)}
        childName={childName}
        setChildName={setChildName}
        childAge={childAge}
        setChildAge={setChildAge}
        childAllergies={childAllergies}
        setChildAllergies={setChildAllergies}
        childNotes={childNotes}
        setChildNotes={setChildNotes}
        onSave={handleAddOrSaveChild}
        editing={!!editingChildId}
      />

      <ProfileModal
        visible={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        profileName={profileName}
        setProfileName={setProfileName}
        profileContact={profileContact}
        setProfileContact={setProfileContact}
        profileLocation={profileLocation}
        setProfileLocation={setProfileLocation}
        profileImage={profileImage}
        setProfileImage={setProfileImage}
        handleSaveProfile={handleSaveProfile}
      />

      <FilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        filters={filters}
        onApplyFilters={handleApplyFilters}
      />

      <JobPostingModal
        visible={showJobPostingModal}
        onClose={() => setShowJobPostingModal(false)}
        onJobPosted={handleJobPosted}
      />

      <PaymentModal
        visible={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        paymentBase64={paymentBase64}
        setPaymentBase64={setPaymentBase64}
        onUpload={handleUploadPayment}
      />

      <BookingModal
        visible={isBookingModalVisible}
        onClose={() => setIsBookingModalVisible(false)}
        caregiver={selectedCaregiver}
        childrenList={children}
        onConfirm={handleBookingConfirm}
      />
        </View>
      </ProfileDataProvider>
    </PrivacyProvider>
  );
};

export default ParentDashboard;
