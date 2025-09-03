import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  View, 
  ScrollView,
  SafeAreaView,
  StatusBar,
  Modal,
  Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

// Import components
import Header from './components/Header';
import NavigationTabs from './components/NavigationTabs';
import HomeTab from './components/HomeTab';
import SearchTab from './components/SearchTab';
import BookingsTab from './components/BookingsTab';

// Import modals
import ChildModal from './modals/ChildModal';
import ProfileModal from './modals/ProfileModal';
import FilterModal from './modals/FilterModal';
import JobPostingModal from './modals/JobPostingModal';
import BookingModal from './modals/BookingModal';
import PaymentModal from './modals/PaymentModal';

// Import styles
import { colors, styles } from '../styles/ParentDashboard.styles';

// Import services
import { bookingsAPI, jobsAPI, caregiversAPI, authAPI } from '../../config/api';
import { userService } from '../../services/userService';
import { useApp } from '../../context/AppContext';
import useAuth from '../../contexts/useAuth';

// Import utilities
import { fetchMyBookings, getCaregiverDisplayName } from './utils/bookingUtils';
import { applyFilters, countActiveFilters } from './utils/caregiverUtils';

// Sample data
const SAMPLE_CHILDREN = [
  {
    id: 'child-1',
    name: 'Maya',
    age: 4,
    avatar: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=200&h=200&fit=crop',
    allergies: 'Peanuts',
  },
  {
    id: 'child-2',
    name: 'Miguel',
    age: 6,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop',
    allergies: '',
  },
];

const SAMPLE_CAREGIVERS = [
  {
    id: '507f1f77bcf86cd799439011',
    name: 'Ana Dela Cruz',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop',
    rating: 4.8,
    reviewCount: 124,
    hourlyRate: 350,
    location: 'Cebu City',
    specialties: ['Infant Care', 'CPR Certified'],
    skills: ['Infant Care', 'CPR Certified'],
    experience: 5,
    verified: true
  },
  // ... other sample caregivers
];

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
  const [childNotes, setChildNotes] = useState('');
  const [editingChildId, setEditingChildId] = useState(null);

  // Profile form state
  const [profileName, setProfileName] = useState('');
  const [profileContact, setProfileContact] = useState('');
  const [profileLocation, setProfileLocation] = useState('');
  
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
      onPress: () => navigation.navigate('Messages')
    },
    {
      id: 'add-child',
      icon: 'plus',
      title: 'Add Child',
      onPress: () => openAddChild()
    },
  ], [caregivers, navigation]);

  // Data loading functions
  const handleFetchBookings = useCallback(async () => {
    try {
      setRefreshing(true);
      const normalizedBookings = await fetchMyBookings(bookingsAPI);
      setBookings(normalizedBookings);
    } catch (err) {
      console.warn('[fetchMyBookings] failed:', err?.message || err);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const fetchCaregivers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await caregiversAPI.getProviders();
      const caregivers = response.data?.caregivers || [];
      
      const transformedCaregivers = caregivers.map(caregiver => ({
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
      return transformedCaregivers;
    } catch (error) {
      console.error('Error fetching caregivers:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMyChildren = useCallback(async () => {
    try {
      let profile = state?.userProfile;
      if (!profile && user?.uid) {
        profile = await userService.getProfile(user.uid);
      }

      const list = profile?.children || profile?.data?.children || [];
      const pName = profile?.name || profile?.data?.name || '';
      const pContact = profile?.contact || profile?.data?.contact || '';
      const pLocation = profile?.location || profile?.data?.location || '';
      
      setProfileName(String(pName || ''));
      setProfileContact(String(pContact || ''));
      setProfileLocation(String(pLocation || ''));

      if (Array.isArray(list) && list.length) {
        const normalized = list.map((c) => ({
          id: c._id || c.id || String(Math.random()),
          name: c.name || c.firstName || 'Child',
          age: (c.age ?? c.years) || 0,
          preferences: c.preferences || '',
        }));
        setChildren(normalized);
      } else {
        setChildren(SAMPLE_CHILDREN);
      }
    } catch (err) {
      setChildren(SAMPLE_CHILDREN);
    }
  }, [state?.userProfile, user?.uid]);

  const loadData = async () => {
    try {
      setLoading(true);
      const profile = await authAPI.getProfile();
      setUserData(profile.data);

      const jobsResponse = await jobsAPI.getMyJobs();
      setJobs(jobsResponse?.data?.jobs || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

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
    setChildNotes('');
    setShowChildModal(true);
  }, []);

  const openEditChild = useCallback((child) => {
    setEditingChildId(child.id);
    setChildName(child.name || '');
    setChildAge(String(child.age ?? ''));
    setChildNotes(child.preferences || '');
    setShowChildModal(true);
  }, []);

  const handleAddOrSaveChild = useCallback(async () => {
    const trimmedName = (childName || '').trim();
    if (!trimmedName) return;
    
    const ageNum = Number(childAge || 0);
    let next;
    
    if (editingChildId) {
      next = children.map((c) =>
        c.id === editingChildId ? { ...c, name: trimmedName, age: ageNum, preferences: childNotes } : c
      );
    } else {
      next = [
        ...children,
        { id: `child-${Date.now()}`, name: trimmedName, age: ageNum, preferences: childNotes },
      ];
    }
    
    setChildren(next);
    setShowChildModal(false);
    setEditingChildId(null);
    setChildName('');
    setChildAge('');
    setChildNotes('');
  }, [childName, childAge, childNotes, editingChildId, children]);

  // Caregiver interaction functions
  const handleViewCaregiver = (caregiver) => {
    navigation.navigate('CaregiverProfile', { caregiverId: caregiver.id });
  };

  const handleMessageCaregiver = (caregiver) => {
    navigation.navigate('Chat', { 
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
    const payload = {
      caregiverId: bookingData.caregiverId,
      date: bookingData.date,
      startTime: bookingData.startTime,
      endTime: bookingData.endTime,
      children: bookingData.selectedChildren || [],
      address: bookingData.address,
      contact: { phone: bookingData.contactPhone },
      emergencyContact: bookingData.emergencyContact || {},
      specialInstructions: bookingData.specialInstructions || '',
      hourlyRate: bookingData.hourlyRate,
      totalCost: bookingData.totalCost,
      status: bookingData.status || 'pending',
    };

    try {
      const res = await bookingsAPI.create(payload);
      setActiveTab('bookings');
      await handleFetchBookings();
      setIsBookingModalVisible(false);
      return res;
    } catch (err) {
      console.error('Booking error:', err);
      throw err;
    }
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
      setSearchResults(searchFilteredCaregivers);
    }
  };

  // Profile functions
  const handleSaveProfile = async () => {
    try {
      const updateData = {
        name: profileName.trim(),
        contact: profileContact.trim(),
        location: profileLocation.trim()
      };

      const result = await authAPI.updateProfile(updateData);
      
      if (result.success) {
        setShowProfileModal(false);
        Alert.alert('Success', 'Profile updated successfully');
      } else {
        Alert.alert('Error', result.error || 'Failed to update profile');
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
            greetingName={greetingName}
            profileName={profileName}
            profileContact={profileContact}
            profileLocation={profileLocation}
            bookings={bookings}
            children={children}
            quickActions={quickActions}
            onAddChild={openAddChild}
            onEditChild={openEditChild}
            onViewBookings={() => setActiveTab('bookings')}
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
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <Header 
        navigation={navigation} 
        onProfilePress={() => setShowProfileModal(true)} 
        onSignOut={signOut} 
      />

      <NavigationTabs 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onProfilePress={() => setShowProfileModal(true)} 
      />
      
      <View style={{ flex: 1 }}>
        {renderActiveTab()}
      </View>

      {/* Modals */}
      <ChildModal
        visible={showChildModal}
        onClose={() => setShowChildModal(false)}
        childName={childName}
        setChildName={setChildName}
        childAge={childAge}
        setChildAge={setChildAge}
        childNotes={childNotes}
        setChildNotes={setChildNotes}
        onSave={handleAddOrSaveChild}
        editing={!!editingChildId}
      />

      <ProfileModal
        visible={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        name={profileName}
        setName={setProfileName}
        contact={profileContact}
        setContact={setProfileContact}
        location={profileLocation}
        setLocation={setProfileLocation}
        onSave={handleSaveProfile}
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
        onSubmit={(jobData) => {
          console.log('Job posted:', jobData);
          setShowJobPostingModal(false);
        }}
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
        childrenList={children.length ? children : SAMPLE_CHILDREN}
        onConfirm={handleBookingConfirm}
      />
    </SafeAreaView>
  );
};

export default ParentDashboard;