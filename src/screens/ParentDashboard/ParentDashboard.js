import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { View, Alert, Linking, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system/legacy';

// Core imports
import { useAuth } from '../../contexts/AuthContext';
import { useParentDashboard } from '../../hooks/useParentDashboard';
import { useNotifications } from '../../contexts/NotificationContext';

// API imports
import { childrenAPI, authAPI, bookingsAPI, jobsAPI } from '../../services/index';
import ratingService from '../../services/ratingService';

// Utility imports
import { applyFilters, countActiveFilters } from '../../utils/caregiverUtils';
import { parseDate } from '../../utils/dateUtils';
import { BOOKING_STATUSES } from '../../constants/bookingStatuses';
import { styles } from '../styles/ParentDashboard.styles';

// Privacy components
import PrivacyProvider from '../../components/features/privacy/PrivacyManager';
import ProfileDataProvider from '../../components/features/privacy/ProfileDataManager';

// Component imports
import Header from './components/Header';
import NavigationTabs from './components/NavigationTabs';
import HomeTab from './components/HomeTab';
import SearchTab from './components/SearchTab';
import BookingsTab from './components/BookingsTab';
import JobsTab from './components/JobsTab';
import MyJobsTab from './components/MyJobsTab';
import MessagesTab from './components/MessagesTab';
import ReviewsTab from '../CaregiverDashboard/components/ReviewsTab';
import { useReview } from '../../contexts/ReviewContext';
import ReviewForm from '../../components/forms/ReviewForm';

// Modal imports
import ProfileModal from './modals/ProfileModal';
import FilterModal from './modals/FilterModal';
import JobPostingModal from './modals/JobPostingModal';
import BookingModal from './modals/BookingModal';
import PaymentModal from './modals/PaymentModal';
import ChildModal from './modals/ChildModal';
import { BookingDetailsModal } from '../../components';
import { Calendar, Clock, DollarSign, Hourglass, CheckCircle2 } from 'lucide-react-native';
import { notificationEvents } from '../../utils/notificationEvents';

// Constants
const DEFAULT_FILTERS = {
  availability: { availableNow: false, days: [] },
  location: { distance: 10, location: '' },
  rate: { min: 0, max: 1000 },
  experience: { min: 0, max: 30 },
  certifications: [],
  rating: 0,
};

const DEFAULT_CAREGIVER = {
  _id: 'default-caregiver',
  userId: null,
  name: 'Caregiver',
  avatar: null,
  profileImage: null,
  rating: 0,
  reviews: 0,
  hourlyRate: 0,
  rate: '₱0/hr',
};

const ParentDashboardInner = () => {
  const navigation = useNavigation();
  const { signOut, user } = useAuth();
  const { enqueueToast } = useNotifications();
  
  const {
    activeTab,
    setActiveTab,
    profile,
    jobs,
    caregivers,
    bookings,
    children,
    loading,
    loadProfile,
    fetchJobs,
    fetchCaregivers,
    fetchBookings,
    fetchChildren,
  } = useParentDashboard();

  const [refreshing, setRefreshing] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showAllChildren, setShowAllChildren] = useState(false);

  const [modals, setModals] = useState({
    child: false,
    profile: false,
    jobPosting: false,
    filter: false,
    payment: false,
    booking: false,
    bookingDetails: false,
    review: false,
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [filteredCaregivers, setFilteredCaregivers] = useState([]);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [activeFilters, setActiveFilters] = useState(0);

  const [childForm, setChildForm] = useState({
    name: '',
    age: '',
    allergies: '',
    notes: '',
    editingId: null,
  });

  // Use ref for profile data to avoid re-renders
  const profileRef = useRef({
    name: '',
    contact: '',
    location: '',
    image: '',
    initialized: false
  });

  const [profileForm, setProfileForm] = useState({
    name: '',
    contact: '',
    location: '',
    image: '',
  });

  const [bookingsFilter, setBookingsFilter] = useState('upcoming');
  const [selectedCaregiver, setSelectedCaregiver] = useState(DEFAULT_CAREGIVER);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [reviewModalData, setReviewModalData] = useState({ booking: null, caregiverId: null, caregiverName: '' });
  const { reviews, status: reviewsStatus, error: reviewsError, fetchReviews } = useReview();
  const [paymentData, setPaymentData] = useState({
    bookingId: null,
    base64: '',
    mimeType: 'image/jpeg'
  });

  // FIXED: Improved profile initialization with better dependency handling
  useEffect(() => {
    if (!profile || profileRef.current.initialized) return;

    const initialProfileForm = {
      name: profile.name || '',
      contact: profile.email || profile.contact || '',
      location: profile.location || profile.address || '',
      image: profile.profileImage || profile.avatar || ''
    };

    profileRef.current = { ...initialProfileForm, initialized: true };
    setProfileForm(initialProfileForm);
  }, [profile?.name, profile?.email, profile?.contact, profile?.location, profile?.address, profile?.profileImage, profile?.avatar]);

  // Derived data - use useMemo to prevent unnecessary recalculations
  const displayName = useMemo(() => {
    return (user?.displayName || (user?.email ? String(user.email).split('@')[0] : '') || '').trim();
  }, [user?.displayName, user?.email]);

  const greetingName = useMemo(() => {
    return (profileForm.name && String(profileForm.name).trim()) || displayName;
  }, [profileForm.name, displayName]);

  const resolvedProfileImage = useMemo(() => {
    return (
      profileForm.image ||
      profile?.profileImage ||
      profile?.avatar ||
      profile?.photoURL ||
      profile?.photoUrl ||
      null
    );
  }, [profileForm.image, profile?.profileImage, profile?.avatar, profile?.photoURL, profile?.photoUrl]);

  const bookingFilterStats = useMemo(() => {
    const initial = {
      total: 0,
      upcoming: 0,
      pending: 0,
      confirmed: 0,
      completed: 0,
      past: 0
    };

    if (!Array.isArray(bookings) || bookings.length === 0) {
      return initial;
    }

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    return bookings.reduce((acc, booking) => {
      acc.total += 1;

      const bookingDate = parseDate(booking?.date);
      if (bookingDate) {
        bookingDate.setHours(0, 0, 0, 0);
        if (bookingDate >= now) {
          acc.upcoming += 1;
        } else {
          acc.past += 1;
        }
      }

      switch (booking?.status) {
        case BOOKING_STATUSES.PENDING:
          acc.pending += 1;
          break;
        case BOOKING_STATUSES.CONFIRMED:
        case BOOKING_STATUSES.IN_PROGRESS:
          acc.confirmed += 1;
          break;
        case BOOKING_STATUSES.COMPLETED:
        case BOOKING_STATUSES.PAID:
          acc.completed += 1;
          break;
        default:
          break;
      }

      return acc;
    }, { ...initial });
  }, [bookings]);

  const bookingFilterOptions = useMemo(() => ([
    { key: 'all', label: 'All', count: bookingFilterStats.total, icon: Calendar },
    { key: 'upcoming', label: 'Upcoming', count: bookingFilterStats.upcoming, icon: Clock },
    { key: 'pending', label: 'Pending', count: bookingFilterStats.pending, icon: Hourglass },
    { key: 'confirmed', label: 'Active', count: bookingFilterStats.confirmed, icon: CheckCircle2 },
    { key: 'completed', label: 'Done', count: bookingFilterStats.completed, icon: DollarSign },
    { key: 'past', label: 'Past', count: bookingFilterStats.past, icon: Calendar }
  ]), [bookingFilterStats]);

  // Modal handlers - use useCallback with proper dependencies
  const toggleModal = useCallback((modalName, isOpen = null) => {
    if (typeof modalName === 'object' && modalName !== null) {
      setModals(prev => ({ ...prev, ...modalName }));
      return;
    }

    setModals(prev => ({
      ...prev,
      [modalName]: isOpen !== null ? isOpen : !prev[modalName]
    }));
  }, []);

  const closeReviewModal = useCallback(() => {
    setReviewModalData({ booking: null, caregiverId: null, caregiverName: '' });
    toggleModal('review', false);
  }, [toggleModal]);

  const extractBookingId = useCallback((booking) => {
    if (!booking) return null;
    return (
      booking?._id ||
      booking?.id ||
      booking?.bookingId ||
      booking?.bookingCode ||
      booking?.reference ||
      null
    );
  }, []);

  const extractCaregiverInfo = useCallback((booking) => {
    if (!booking) {
      return { caregiverId: null, caregiverName: '' };
    }

    const candidates = [
      booking.caregiver,
      booking.caregiverProfile,
      booking.assignedCaregiver,
    ].filter(Boolean);

    let caregiverId = booking.caregiverId || null;
    let caregiverName = booking.caregiverName || booking.caregiverFullName || '';

    for (const candidate of candidates) {
      if (typeof candidate === 'string') {
        caregiverId = caregiverId || candidate;
        continue;
      }

      caregiverId = caregiverId || candidate?._id || candidate?.id || candidate?.userId;
      caregiverName = caregiverName || candidate?.name || candidate?.displayName;
    }

    if (!caregiverId && typeof booking.caregiver === 'string') {
      caregiverId = booking.caregiver;
    }

    return { caregiverId, caregiverName: caregiverName || 'Caregiver' };
  }, []);

  const handleOpenReviewModal = useCallback(
    async (booking) => {
      const bookingId = extractBookingId(booking);
      if (!bookingId) {
        enqueueToast({ message: 'Booking details unavailable for review.', type: 'error' });
        return;
      }

      const { caregiverId, caregiverName } = extractCaregiverInfo(booking);
      if (!caregiverId) {
        enqueueToast({ message: 'Caregiver information is missing.', type: 'error' });
        return;
      }

      try {
        const [canRate, existingRating] = await Promise.all([
          ratingService.canRate(bookingId),
          ratingService.getBookingRating?.(bookingId) ?? null,
        ]);

        if (!canRate || existingRating) {
          enqueueToast({
            message: 'A review for this booking already exists.',
            type: 'info',
          });
          return;
        }

        setReviewModalData({ booking, caregiverId, caregiverName });
        toggleModal('review', true);
      } catch (error) {
        console.error('Unable to verify review eligibility:', error);
        enqueueToast({ message: 'Unable to start review at the moment.', type: 'error' });
      }
    },
    [enqueueToast, extractBookingId, extractCaregiverInfo, toggleModal]
  );

  const handleSubmitReview = useCallback(
    async ({ rating, comment }) => {
      if (!reviewModalData.booking || !reviewModalData.caregiverId) {
        return;
      }

      const bookingId = extractBookingId(reviewModalData.booking);
      if (!bookingId) {
        enqueueToast({ message: 'Invalid booking reference.', type: 'error' });
        return;
      }

      try {
        await ratingService.rateCaregiver(
          reviewModalData.caregiverId,
          bookingId,
          rating,
          comment || ''
        );

        notificationEvents.publish('review', {
          category: 'review',
          entityId: bookingId,
          data: {
            caregiverId: reviewModalData.caregiverId,
            bookingId,
            rating,
            comment,
            reviewerId: user?.id || user?.uid,
            createdAt: Date.now(),
          },
        });

        enqueueToast({ message: 'Review submitted successfully.', type: 'success' });

        await Promise.all([
          fetchBookings(),
          fetchReviews({ userId: user?.id || user?.uid, role: 'parent' }),
        ]);

        closeReviewModal();
      } catch (error) {
        console.error('Failed to submit review:', error);
        enqueueToast({ message: 'Failed to submit review.', type: 'error' });
      }
    },
    [closeReviewModal, enqueueToast, extractBookingId, fetchBookings, fetchReviews, reviewModalData, user?.id, user?.uid]
  );

  // Helper function to create caregiver object
  const createCaregiverObject = useCallback((caregiverData = null) => {
    const caregiver = caregiverData || (caregivers?.length > 0 ? caregivers[0] : null);
    return caregiver ? {
      _id: caregiver._id || caregiver.id,
      id: caregiver.id || caregiver._id,
      userId: caregiver.userId || null,
      name: caregiver.name,
      avatar: caregiver.avatar || caregiver.profileImage,
      profileImage: caregiver.profileImage || caregiver.avatar,
      rating: caregiver.rating,
      reviews: caregiver.reviewCount,
      hourlyRate: caregiver.hourlyRate,
      rate: caregiver.hourlyRate ? `₱${caregiver.hourlyRate}/hr` : undefined,
    } : DEFAULT_CAREGIVER;
  }, [caregivers]);

  const switchTabSafely = useCallback((tab) => {
    if (typeof setActiveTab === 'function') {
      setActiveTab(tab);
    } else {
      console.warn('ParentDashboard: setActiveTab is not available', { tab });
    }
  }, [setActiveTab]);

  // FIXED: Memoize quickActions to prevent unnecessary re-renders
  const quickActions = useMemo(() => [
    {
      id: 'find',
      icon: 'search',
      title: 'Find Caregiver',
      onPress: () => switchTabSafely('search')
    },
    {
      id: 'book',
      icon: 'calendar',
      title: 'Book Service',
      onPress: () => {
        setSelectedCaregiver(createCaregiverObject());
        toggleModal('booking', true);
      }
    },
    {
      id: 'messages',
      icon: 'chatbubble-ellipses',
      title: 'Messages',
      onPress: () => switchTabSafely('messages')
    },
    {
      id: 'add-child',
      icon: 'person-add',
      title: 'Add Child',
      onPress: () => {
        setChildForm({
          name: '',
          age: '',
          allergies: '',
          notes: '',
          editingId: null
        });
        toggleModal('child', true);
      }
    }
  ], [createCaregiverObject, switchTabSafely, toggleModal]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        loadProfile(),
        fetchJobs(),
        fetchCaregivers(),
        fetchBookings(),
        fetchChildren()
      ]);
    } catch (error) {
      console.error('Error refreshing data:', error);
      Alert.alert('Error', 'Failed to refresh data');
    } finally {
      setRefreshing(false);
    }
  }, [loadProfile, fetchJobs, fetchCaregivers, fetchBookings, fetchChildren]);

  // Child management functions
  const openEditChild = useCallback((child) => {
    setChildForm({
      name: child.name || '',
      age: String(child.age ?? ''),
      allergies: child.allergies || '',
      notes: child.preferences || '',
      editingId: child._id || child.id
    });
    toggleModal('child', true);
  }, [toggleModal]);

  const handleDeleteChild = useCallback(async (child) => {
    Alert.alert(
      'Delete Child',
      `Are you sure you want to delete ${child.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await childrenAPI.delete(child._id || child.id);
              await fetchChildren();
              Alert.alert('Success', 'Child deleted successfully!');
            } catch (error) {
              console.error('Child delete failed:', error);
              Alert.alert('Error', 'Failed to delete child. Please try again.');
            }
          }
        }
      ]
    );
  }, [fetchChildren]);

  const handleAddOrSaveChild = useCallback(async () => {
    const trimmedName = childForm.name.trim();
    if (!trimmedName) {
      Alert.alert('Error', 'Please enter a name for the child');
      return;
    }

    const childData = {
      name: trimmedName,
      age: Number(childForm.age || 0),
      allergies: childForm.allergies || '',
      preferences: childForm.notes || ''
    };

    try {
      if (childForm.editingId) {
        await childrenAPI.update(childForm.editingId, childData);
      } else {
        // Check if child already exists before creating
        const existingChild = children?.find(child =>
          child.name.toLowerCase() === trimmedName.toLowerCase()
        );

        if (existingChild) {
          Alert.alert(
            'Child Already Exists',
            `${trimmedName} already exists in your children list. Would you like to update the existing child instead?`,
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Update',
                onPress: async () => {
                  try {
                    await childrenAPI.update(existingChild._id || existingChild.id, childData);
                    await fetchChildren();
                    toggleModal('child', false);
                    setChildForm({ name: '', age: '', allergies: '', notes: '', editingId: null });
                    Alert.alert('Success', 'Child updated successfully!');
                  } catch (updateError) {
                    console.error('Child update failed:', updateError);
                    Alert.alert('Error', 'Failed to update child. Please try again.');
                  }
                }
              }
            ]
          );
          return;
        }

        await childrenAPI.create(childData);
      }

      await fetchChildren();
      toggleModal('child', false);
      setChildForm({ name: '', age: '', allergies: '', notes: '', editingId: null });
      Alert.alert('Success', childForm.editingId ? 'Child updated successfully!' : 'Child added successfully!');
    } catch (error) {
      console.error('Child save failed:', error);
      Alert.alert('Error', 'Failed to save child. Please try again.');
    }
  }, [childForm, children, fetchChildren, toggleModal]);

  // Caregiver interaction functions
  const handleViewCaregiver = useCallback((caregiver) => {
    navigation.navigate('CaregiverProfile', { caregiverId: caregiver._id });
  }, [navigation]);

  const handleMessageCaregiver = useCallback(async (caregiver) => {
    console.log('💬 handleMessageCaregiver called for:', caregiver?.name, caregiver?._id);

    if (!user?.firebaseUid) {
      console.error('❌ No Firebase UID available for messaging');
      Alert.alert('Error', 'User not found');
      return;
    }

    if (!caregiver?._id) {
      console.error('❌ No caregiver ID available for messaging');
      Alert.alert('Error', 'Caregiver information is missing');
      return;
    }

    try {
      console.log('🔗 Setting up connection and navigating to chat...');
      const firebaseMessagingService = (await import('../../services/firebaseMessagingService')).default;

      const connectionResult = await firebaseMessagingService.createConnection(user.firebaseUid, caregiver._id);
      console.log('🔗 Connection result:', connectionResult);

      navigation.navigate('CaregiverChat', {
        userId: user.firebaseUid,
        caregiverId: caregiver._id,
        caregiverName: caregiver.name
      });

      console.log('✅ Successfully navigated to chat');
    } catch (error) {
      console.error('❌ Error in handleMessageCaregiver:', error);
      Alert.alert('Error', 'Failed to open chat. Please try again.');
    }
  }, [navigation, user]);

  const handleViewReviews = useCallback((caregiver) => {
    if (!user?.firebaseUid) {
      Alert.alert('Error', 'User not found');
      return;
    }

    navigation.navigate('CaregiverReviews', {
      userId: user.firebaseUid,
      caregiverId: caregiver._id || caregiver.id
    });
  }, [navigation, user]);

  const handleBookCaregiver = useCallback((caregiver) => {
    setSelectedCaregiver({
      _id: caregiver._id || caregiver.id,
      id: caregiver.id || caregiver._id,
      name: caregiver.name,
      avatar: caregiver.avatar || caregiver.profileImage,
      profileImage: caregiver.profileImage || caregiver.avatar,
      rating: caregiver.rating,
      reviews: caregiver.reviewCount,
      hourlyRate: caregiver.hourlyRate,
      rate: caregiver.hourlyRate ? `₱${caregiver.hourlyRate}/hr` : undefined,
    });
    toggleModal('booking', true);
  }, [toggleModal]);

  const resolveCaregiverFromEntity = useCallback((entity) => {
    if (!entity) {
      return null;
    }

    const candidateObjects = [];
    const candidateIds = new Set();

    const addObjectCandidate = (value) => {
      if (!value || typeof value !== 'object') {
        return;
      }

      const isBookingLike = Boolean(
        value.status &&
        (value.date || value.bookingCode || value.bookingId || value.reference)
      );

      if (isBookingLike) {
        return;
      }

      const ids = [
        value._id,
        value.id,
        value.caregiverId,
        value.userId,
        value.userId?._id,
        value.userId?.id,
      ].filter(Boolean);

      ids.forEach((id) => candidateIds.add(id.toString()));
      candidateObjects.push(value);
    };

    const addIdCandidate = (id) => {
      if (!id) {
        return;
      }
      candidateIds.add(id.toString());
    };

    addObjectCandidate(entity.caregiver);
    addObjectCandidate(entity.caregiverProfile);
    addObjectCandidate(entity.assignedCaregiver);
    addObjectCandidate(entity.provider);
    addObjectCandidate(entity.profile);

    addIdCandidate(
      typeof entity.caregiver === 'string' ? entity.caregiver : entity.caregiverId
    );
    addIdCandidate(entity.assignedCaregiverId);

    if (candidateObjects.length > 0) {
      return candidateObjects[0];
    }

    if (candidateIds.size > 0 && Array.isArray(caregivers) && caregivers.length > 0) {
      const caregiversMatch = caregivers.find((caregiverItem) => {
        const ids = [
          caregiverItem?._id,
          caregiverItem?.id,
          caregiverItem?.userId,
          caregiverItem?.userId?._id,
          caregiverItem?.userId?.id,
        ]
          .filter(Boolean)
          .map((value) => value.toString());

        return ids.some((id) => candidateIds.has(id));
      });

      if (caregiversMatch) {
        return caregiversMatch;
      }

      const [firstId] = Array.from(candidateIds);
      if (firstId) {
        return { _id: firstId };
      }
    }

    return null;
  }, [caregivers]);

  const handleViewCaregiverProfile = useCallback((entity) => {
    if (!entity) {
      return;
    }

    const caregiverEntity = resolveCaregiverFromEntity(entity);

    if (caregiverEntity?._id || caregiverEntity?.id) {
      handleViewCaregiver(caregiverEntity);
    } else if (__DEV__) {
      console.warn('ParentDashboard: Unable to resolve caregiver for profile view', entity);
    }
  }, [handleViewCaregiver, resolveCaregiverFromEntity]);

  // Booking functions
  const handleBookingConfirm = useCallback(async (bookingData) => {
    if (!bookingData.caregiverId || !bookingData.date || !bookingData.startTime || !bookingData.endTime) {
      throw new Error('Missing required booking information');
    }

    const selectedChildrenObjects = (bookingData.selectedChildren || []).map(childName => {
      const childData = children?.find(child => child.name === childName);
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

    try {
      const booking = await bookingsAPI.create(payload);
      setActiveTab('bookings');
      await fetchBookings();
      toggleModal('booking', false);
      Alert.alert('Success', 'Booking created successfully!');
      return booking;
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to create booking');
      throw error;
    }
  }, [children, fetchBookings, setActiveTab, toggleModal]);

  const handleCancelBooking = useCallback(async (bookingId) => {
    try {
      setRefreshing(true);
      await bookingsAPI.cancel(bookingId);
      Alert.alert('Success', 'Booking cancelled successfully');
    } catch (error) {
      console.warn('Failed to cancel booking:', error?.message || error);
      Alert.alert('Error', 'Failed to cancel booking');
    } finally {
      await fetchBookings();
      setRefreshing(false);
    }
  }, [fetchBookings]);

  const handleBookingStatusChange = useCallback(async (bookingId, status, feedback = null) => {
    if (!bookingId || !status) return;

    try {
      setRefreshing(true);
      await bookingsAPI.updateStatus(bookingId, status, feedback);
      Alert.alert('Success', `Booking ${status} successfully`);
    } catch (error) {
      console.warn('Failed to update booking status:', error?.message || error);
      Alert.alert('Error', `Failed to update booking status to ${status}`);
    } finally {
      await fetchBookings();
      setRefreshing(false);
    }
  }, [fetchBookings]);

  const openPaymentModal = useCallback((bookingId, paymentType = 'deposit') => {
    setPaymentData({
      bookingId,
      base64: '',
      mimeType: 'image/jpeg'
    });
    toggleModal('payment', true);
  }, [toggleModal]);

  // Search function
  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
    setSearchLoading(true);

    setTimeout(() => {
      if (!query.trim()) {
        setFilteredCaregivers([]);
        setSearchResults([]);
      } else {
        const searchResults = caregivers?.filter(caregiver =>
          caregiver.name?.toLowerCase().includes(query.toLowerCase()) ||
          caregiver.location?.toLowerCase().includes(query.toLowerCase()) ||
          caregiver.bio?.toLowerCase().includes(query.toLowerCase()) ||
          caregiver.skills?.some(skill => skill.toLowerCase().includes(query.toLowerCase()))
        ) || [];
        setSearchResults(searchResults);
        setFilteredCaregivers(applyFilters(searchResults, filters));
      }
      setSearchLoading(false);
    }, 300);
  }, [caregivers, filters]);

  // Filter functions
  const handleApplyFilters = useCallback((newFilters) => {
    setFilters(newFilters);
    setActiveFilters(countActiveFilters(newFilters));

    const currentResults = searchQuery ? searchResults : (caregivers || []);
    const filtered = applyFilters(currentResults, newFilters);
    setFilteredCaregivers(filtered);
  }, [searchQuery, searchResults, caregivers]);

  // Job management functions
  const handleCreateJob = useCallback(() => {
    toggleModal('jobPosting', true);
  }, [toggleModal]);

  const handleEditJob = useCallback((job) => {
    // TODO: Implement job editing logic
    toggleModal('jobPosting', true);
  }, [toggleModal]);

  const handleCompleteJob = useCallback(async (jobId) => {
    Alert.alert(
      'Complete Job',
      'Mark this job as completed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: async () => {
            try {
              await jobsAPI.update(jobId, { status: 'completed' });
              await fetchJobs();
              Alert.alert('Success', 'Job marked as completed');
            } catch (error) {
              console.error('Error completing job:', error);
              Alert.alert('Error', 'Failed to complete job');
            }
          }
        }
      ]
    );
  }, [fetchJobs]);

  const handleDeleteJob = useCallback(async (jobId) => {
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
              await jobsAPI.delete(jobId);
              Alert.alert('Success', 'Job deleted successfully');
              await fetchJobs();
            } catch (error) {
              console.error('Error deleting job:', error);
              Alert.alert('Error', 'Failed to delete job');
            }
          }
        }
      ]
    );
  }, [fetchJobs]);

  const handleJobPosted = useCallback(async (newJob) => {
    try {
      toggleModal('jobPosting', false);
      Alert.alert('Success', 'Job posted successfully!');
      await fetchJobs();
    } catch (error) {
      console.error('Error handling job post:', error);
      Alert.alert('Error', 'Failed to post job');
    }
  }, [toggleModal, fetchJobs]);

  const handleViewAllChildren = useCallback(() => {
    setShowAllChildren(prev => !prev);
  }, []);

  // Profile functions
  const handleSaveProfile = useCallback(async (imageUri = null) => {
    try {
      const updateData = {
        name: profileForm.name.trim(),
        phone: profileForm.contact.trim(),
        address: profileForm.location.trim(),
        location: profileForm.location.trim()
      };

      if (imageUri) {
        try {
          const base64Image = await FileSystem.readAsStringAsync(imageUri, {
            encoding: 'base64',
          });

          const imageResult = await authAPI.uploadProfileImage(base64Image, 'image/jpeg');
          const imageUrl = imageResult?.data?.url || imageResult?.url || imageResult?.data?.profileImageUrl;

          if (imageUrl) {
            profileRef.current.image = imageUrl;
            setProfileForm(prev => ({ ...prev, image: imageUrl }));
          }
        } catch (imageError) {
          console.error('Error uploading image:', imageError);
        }
      }

      const result = await authAPI.updateProfile(updateData);

      if (result?.data) {
        profileRef.current = {
          ...profileRef.current,
          name: result.data.name || profileForm.name,
          contact: result.data.contact || result.data.email || profileForm.contact,
          location: profileForm.location,
          image: result.data.profileImage || profileForm.image
        };

        setProfileForm(profileRef.current);
        toggleModal('profile', false);
        Alert.alert('Success', 'Profile updated successfully');
        await loadProfile();
      } else {
        Alert.alert('Error', 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    }
  }, [profileForm, toggleModal, loadProfile]);

  // Reviews function
  const fetchParentReviews = useCallback(async () => {
    try {
      await fetchReviews();
    } catch (error) {
      console.error('Error fetching parent reviews:', error);
      Alert.alert('Error', 'Failed to fetch reviews');
    }
  }, [fetchReviews]);

  // FIXED: Simplified render function with proper error handling
  const renderActiveTab = () => {
    const commonProps = {
      navigation,
      refreshing,
      onRefresh,
    };

    switch (activeTab) {
      case 'home':
        return (
          <HomeTab
            children={children || []}
            quickActions={quickActions}
            onAddChild={() => {
              setChildForm({
                name: '',
                age: '',
                allergies: '',
                notes: '',
                editingId: null
              });
              toggleModal('child', true);
            }}
            onEditChild={openEditChild}
            onDeleteChild={handleDeleteChild}
            onViewBookings={() => setActiveTab('bookings')}
            onViewAllChildren={handleViewAllChildren}
            showAllChildren={showAllChildren}
            greetingName={greetingName}
            profileImage={resolvedProfileImage}
            profileContact={profileForm.contact}
            profileLocation={profile?.location || profile?.address || profileForm.location}
            caregivers={caregivers || []}
            onBookCaregiver={handleBookCaregiver}
            onMessageCaregiver={handleMessageCaregiver}
            onViewReviews={handleViewReviews}
            setActiveTab={setActiveTab}
            {...commonProps}
          />
        );
      case 'search':
        return (
          <SearchTab
            caregivers={caregivers || []}
            filteredCaregivers={filteredCaregivers}
            onViewCaregiver={handleViewCaregiver}
            onMessageCaregiver={handleMessageCaregiver}
            onViewReviews={handleViewReviews}
            onBookCaregiver={handleBookCaregiver}
            searchQuery={searchQuery}
            onSearch={handleSearch}
            onOpenFilter={() => toggleModal('filter', true)}
            activeFilters={activeFilters}
            loading={searchLoading}
            {...commonProps}
          />
        );
      case 'bookings':
        return (
          <BookingsTab
            bookings={bookings || []}
            caregivers={caregivers || []}
            bookingsFilter={bookingsFilter}
            setBookingsFilter={setBookingsFilter}
            onAcceptBooking={(booking) => {
              const id = booking?._id || booking?.id;
              if (!id) return;
              handleBookingStatusChange(id, 'confirmed');
            }}
            onDeclineBooking={(booking) => {
              const id = booking?._id || booking?.id;
              if (!id) return;
              handleBookingStatusChange(id, 'declined');
            }}
            onCompleteBooking={(booking) => {
              const id = booking?._id || booking?.id;
              if (!id) return;
              handleBookingStatusChange(id, 'completed');
            }}
            onPayNowBooking={(booking) => {
              const id = booking?._id || booking?.id;
              if (!id) return;
              openPaymentModal(id);
            }}
            onCancelBooking={async (bookingId) => {
              try {
                const id = typeof bookingId === 'string' ? bookingId : bookingId?._id || bookingId?.id;
                if (!id) return;
                await bookingsAPI.cancel(id);
                await fetchBookings();
                Alert.alert('Success', 'Booking cancelled successfully');
              } catch (error) {
                console.error('Error cancelling booking:', error);
                Alert.alert('Error', 'Failed to cancel booking. Please try again.');
              }
            }}
            onUploadPayment={openPaymentModal}
            onViewBookingDetails={(booking) => {
              setSelectedBooking(booking);
              toggleModal('bookingDetails', true);
            }}
            onWriteReview={handleOpenReviewModal}
            onCreateBooking={() => {
              setSelectedCaregiver(createCaregiverObject());
              toggleModal('booking', true);
            }}
            loading={loading}
            {...commonProps}
          />
        );
      case 'messages':
        return <MessagesTab {...commonProps} />;
      case 'jobs':
        return (
          <JobsTab
            jobs={jobs || []}
            onCreateJob={handleCreateJob}
            onEditJob={handleEditJob}
            onDeleteJob={handleDeleteJob}
            onCompleteJob={handleCompleteJob}
            onJobPosted={handleJobPosted}
            {...commonProps}
          />
        );
      case 'job-management':
        return (
          <MyJobsTab
            jobs={jobs || []}
            onCreateJob={handleCreateJob}
            onEditJob={handleEditJob}
            onDeleteJob={handleDeleteJob}
            onCompleteJob={handleCompleteJob}
            {...commonProps}
          />
        );
      case 'reviews':
        return (
          <ReviewsTab
            role="parent"
            userId={user?.id || user?.uid}
            onRefresh={fetchParentReviews}
            status={reviewsStatus}
            error={reviewsError}
          />
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <Header
        navigation={navigation}
        onProfilePress={() => toggleModal('profile', true)}
        onSignOut={signOut}
        greetingName={greetingName}
        onProfileEdit={() => toggleModal('profile', true)}
        profileName={profileForm.name}
        profileImage={resolvedProfileImage}
        profileContact={profileForm.contact}
        profileLocation={profile?.location || profile?.address || profileForm.location}
        setActiveTab={switchTabSafely}
      />

      <NavigationTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onProfilePress={() => toggleModal('profile', true)}
        navigation={navigation}
      />

      {renderActiveTab()}
      
      {/* Modals */}
      <ChildModal
        visible={modals.child}
        onClose={() => toggleModal('child', false)}
        childName={childForm.name}
        setChildName={(name) => setChildForm(prev => ({ ...prev, name }))}
        childAge={childForm.age}
        setChildAge={(age) => setChildForm(prev => ({ ...prev, age }))}
        childAllergies={childForm.allergies}
        setChildAllergies={(allergies) => setChildForm(prev => ({ ...prev, allergies }))}
        childNotes={childForm.notes}
        setChildNotes={(notes) => setChildForm(prev => ({ ...prev, notes }))}
        onSave={handleAddOrSaveChild}
        editing={!!childForm.editingId}
      />

      <ProfileModal
        visible={modals.profile}
        onClose={() => toggleModal('profile', false)}
        profileName={profileForm.name}
        setProfileName={(name) => setProfileForm(prev => ({ ...prev, name }))}
        profileContact={profileForm.contact}
        setProfileContact={(contact) => setProfileForm(prev => ({ ...prev, contact }))}
        profileLocation={profileForm.location}
        setProfileLocation={(location) => setProfileForm(prev => ({ ...prev, location }))}
        profileImage={profileForm.image}
        setProfileImage={(image) => setProfileForm(prev => ({ ...prev, image }))}
        handleSaveProfile={handleSaveProfile}
      />

      <FilterModal
        visible={modals.filter}
        onClose={() => toggleModal('filter', false)}
        filters={filters}
        onApplyFilters={handleApplyFilters}
      />

      <JobPostingModal
        visible={modals.jobPosting}
        onClose={() => toggleModal('jobPosting', false)}
        onJobPosted={handleJobPosted}
      />

      <PaymentModal
        visible={modals.payment}
        onClose={() => toggleModal('payment', false)}
        bookingId={paymentData.bookingId}
        amount={bookings?.find(b => b._id === paymentData.bookingId)?.totalCost}
        caregiverName={bookings?.find(b => b._id === paymentData.bookingId)?.caregiver?.name}
        bookingDate={bookings?.find(b => b._id === paymentData.bookingId)?.date}
        paymentType={bookings?.find(b => b._id === paymentData.bookingId)?.status === 'completed' ? 'final_payment' : 'deposit'}
        onPaymentSuccess={() => {
          toggleModal('payment', false);
          fetchBookings();
        }}
      />

      <BookingModal
        visible={modals.booking}
        onClose={() => toggleModal('booking', false)}
        caregiver={selectedCaregiver}
        childrenList={children || []}
        onConfirm={handleBookingConfirm}
      />

      <Modal
        visible={modals.review}
        animationType="slide"
        onRequestClose={closeReviewModal}
        transparent
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.45)',
            justifyContent: 'center',
            paddingHorizontal: 16,
          }}
        >
          <View
            style={{
              backgroundColor: '#fff',
              borderRadius: 16,
              paddingVertical: 16,
              maxHeight: '85%',
            }}
          >
            <ReviewForm
              onSubmit={handleSubmitReview}
              onCancel={closeReviewModal}
              initialRating={0}
            />
          </View>
        </View>
      </Modal>

      {modals.bookingDetails && (
        <BookingDetailsModal
          visible={modals.bookingDetails}
          booking={selectedBooking}
          onClose={() => toggleModal('bookingDetails', false)}
          onMessage={() => {
            if (!selectedBooking) return;
            const caregiver = selectedBooking.caregiver || selectedBooking.caregiverId;
            if (caregiver) {
              handleMessageCaregiver(
                typeof caregiver === 'object'
                  ? caregiver
                  : { _id: caregiver, id: caregiver }
              );
            }
          }}
          onGetDirections={() => {
            if (selectedBooking?.address) {
              const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(selectedBooking.address)}`;
              try {
                Linking.openURL(url);
              } catch (error) {
                console.error('Failed to open maps:', error);
                Alert.alert('Error', 'Failed to open maps application');
              }
            }
          }}
          onCompleteBooking={() => {
            if (!selectedBooking?._id) return;
            toggleModal('bookingDetails', false);
            handleBookingStatusChange(selectedBooking._id, 'completed');
          }}
          onCancelBooking={() => {
            if (!selectedBooking?._id) return;
            toggleModal('bookingDetails', false);
            handleCancelBooking(selectedBooking._id);
          }}
          onViewCaregiverProfile={handleViewCaregiverProfile}
        />
      )}
    </View>
  );
};

// FIXED: Simplified wrapper components to prevent provider nesting issues
const ParentDashboard = () => {
  return (
    <PrivacyProvider>
      <ProfileDataProvider>
        <ParentDashboardInner />
      </ProfileDataProvider>
    </PrivacyProvider>
  );
};

export default ParentDashboard;