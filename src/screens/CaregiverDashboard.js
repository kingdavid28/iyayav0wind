"use client"

import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect, useNavigation } from "@react-navigation/native"
import { LinearGradient } from "expo-linear-gradient"
import React, { useCallback, useEffect, useState } from "react"
import { ActivityIndicator, Alert, Dimensions, Image, Linking, Modal, Platform, Pressable, RefreshControl, ScrollView, Text, TextInput, View } from "react-native"
import { Button, Card, Chip, Searchbar } from "react-native-paper"
import Toast from "../components/Toast"
import { applicationsAPI, authAPI, bookingsAPI, caregiversAPI, jobsAPI, uploadsAPI } from "../config/api"
import { getCurrentSocketURL } from '../config/api'
import { useAuth } from "../core/contexts/AuthContext"
import { useMessaging } from "../contexts/MessagingContext"
import { usePrivacy } from "../components/Privacy/PrivacyManager"
import PrivacyNotificationModal from "../components/Privacy/PrivacyNotificationModal"
import { SettingsModal } from "../components/SettingsModal"
import { RequestInfoModal } from "../components/RequestInfoModal"
import MessagesTab from "../components/MessagesTab"

import { formatAddress } from "../utils/addressUtils"
import { calculateAge } from "../utils/dateUtils"
import { __DEV__ } from "../config/constants"
import { styles } from "./styles/CaregiverDashboard.styles"
import CaregiverProfileSection from "./CaregiverDashboard/components/CaregiverProfileSection"

import { QuickStat, QuickAction } from '../shared/ui';

const { width } = Dimensions.get("window")

export default function CaregiverDashboard({ onLogout, route }) {
  const navigation = useNavigation()
  const { user, signOut } = useAuth()
  const isTablet = width >= 768
  const isAndroid = Platform.OS === 'android'
  // Grid layout sizing for Jobs tab (keeps cards same width with gap & padding)
  const sectionHorizontalPadding = 16
  const gridGap = 16
  // On Android, prefer a single-column layout for larger cards
  const columns = isTablet ? 2 : (isAndroid ? 1 : 2)
  const containerWidth = width - sectionHorizontalPadding * 1
  const gridCardWidth = Math.floor((containerWidth - gridGap * (columns - 1)) / columns)
  // On Android single-column, let cards auto-size by content for better look
  const gridCardHeight = isAndroid ? undefined : 280
  const [activeTab, setActiveTab] = useState("dashboard")
  const [searchQuery, setSearchQuery] = useState("")
  const [editProfileModalVisible, setEditProfileModalVisible] = useState(false)
  const [profileName, setProfileName] = useState("Ana Dela Cruz")
  const [profileHourlyRate, setProfileHourlyRate] = useState("25")
  const [profileExperience, setProfileExperience] = useState("5+ years")
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [showBookingDetails, setShowBookingDetails] = useState(false)
  const [selectedJob, setSelectedJob] = useState(null)
  const [showJobApplication, setShowJobApplication] = useState(false)
  const [applications, setApplications] = useState([])
  const [showJobDetails, setShowJobDetails] = useState(false)
  const [selectedApplication, setSelectedApplication] = useState(null)
  const [showApplicationDetails, setShowApplicationDetails] = useState(false)
  const [applicationSubmitting, setApplicationSubmitting] = useState(false)
  const [applicationForm, setApplicationForm] = useState({ coverLetter: '', proposedRate: '' })

  // Toast state
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' })
  const showToast = (message, type = 'success') => setToast({ visible: true, message, type })
  
  // Privacy state
  const { pendingRequests, notifications } = usePrivacy();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [imageRefreshKey, setImageRefreshKey] = useState(0);


  // Default empty profile - all data comes from database
  const defaultProfile = {
    name: "",
    rating: 0,
    reviews: 0,
    hourlyRate: 0,
    experience: "",
    specialties: [],
    skills: [],
    certifications: [],
    backgroundCheck: "Not Started",
    completedJobs: 0,
    responseRate: "0%",
    ageCareRanges: [],
    languages: [],
    emergencyContacts: [],
    verification: {
      profileComplete: false,
      identityVerified: false,
      certificationsVerified: false,
      referencesVerified: false,
      trustScore: 0,
      badges: []
    },
    availability: {
      flexible: false,
      days: [],
      weeklySchedule: {
        Monday: { available: false, timeSlots: [] },
        Tuesday: { available: false, timeSlots: [] },
        Wednesday: { available: false, timeSlots: [] },
        Thursday: { available: false, timeSlots: [] },
        Friday: { available: false, timeSlots: [] },
        Saturday: { available: false, timeSlots: [] },
        Sunday: { available: false, timeSlots: [] }
      }
    },
    bio: "",
    location: ""
  }

  // Open edit modal with current profile values
  const openEditProfileModal = () => {
    try {
      setProfileName(profile?.name || '')
      setProfileHourlyRate(String(profile?.hourlyRate ?? ''))
      setProfileExperience(profile?.experience || '')
    } catch (error) {
      console.warn('Profile modal error:', error);
    }
    setEditProfileModalVisible(true)
  }

  const [profile, setProfile] = useState(defaultProfile)

  // No mock jobs - all jobs come from database

  // No mock applications - all applications come from database
  const initialApplications = []

  // State for jobs and bookings - all data from database
  const [jobs, setJobs] = useState([])
  const [jobsLoading, setJobsLoading] = useState(false)
  const [bookings, setBookings] = useState([])

  // Debug function to test profile image loading
  const debugProfileImage = () => {
    console.log('🔍 CaregiverDashboard Debug Info:');
    console.log('- Current profile imageUrl:', profile.imageUrl);
    console.log('- User ID:', user?.id);
    console.log('- User role:', user?.role);
    console.log('- Current socket URL:', getCurrentSocketURL());
    console.log('- Full profile object:', JSON.stringify(profile, null, 2));
    console.log('- User object:', JSON.stringify(user, null, 2));
    
    // Force refresh profile
    console.log('🔄 Forcing profile refresh...');
    loadProfile();
  };

  // Load profile data function
  const loadProfile = async () => {
    try {
      // Check if user is authenticated before making API calls
      if (!user?.id) {
        console.log('[INFO] No user ID, skipping profile load');
        return;
      }
      
      const isCaregiver = (user?.role === 'caregiver');
      
      // Get both caregiver and user profiles to check for image
      let caregiverProfile = null;
      let userProfile = null;
      
      if (isCaregiver) {
        try {
          const caregiverResponse = await caregiversAPI.getMyProfile();
          caregiverProfile = caregiverResponse?.caregiver || caregiverResponse?.data?.caregiver || caregiverResponse || {};
        } catch (error) {
          console.log('No caregiver profile found:', error.message);
        }
      }
      
      try {
        const userResponse = await authAPI.getProfile();
        userProfile = userResponse?.data || userResponse || {};
      } catch (error) {
        console.log('Failed to get user profile:', error.message);
      }
      
      console.log('📋 Caregiver profile:', caregiverProfile);
      console.log('👤 User profile:', userProfile);
      
      // Merge profiles, prioritizing caregiver profile data
      const p = { ...userProfile, ...caregiverProfile };
      console.log('📊 Profile data extracted:', p);
      
      if (p && (p.name || p.hourlyRate || p.experience || caregiverProfile || userProfile)) {
        // Check for profile image in both profiles with extensive debugging
        const imageFields = {
          'caregiverProfile?.profileImage': caregiverProfile?.profileImage,
          'caregiverProfile?.imageUrl': caregiverProfile?.imageUrl,
          'caregiverProfile?.image': caregiverProfile?.image,
          'userProfile?.profileImage': userProfile?.profileImage,
          'userProfile?.imageUrl': userProfile?.imageUrl,
          'userProfile?.image': userProfile?.image,
          'p.profileImage': p.profileImage,
          'p.imageUrl': p.imageUrl,
          'p.avatarUrl': p.avatarUrl,
          'p.image': p.image,
          'p.photoUrl': p.photoUrl,
          'p.userId?.profileImage': p.userId?.profileImage
        };
        
        console.log('🖼️ CaregiverDashboard - All image fields:', imageFields);
        
        const rawImageUrl = caregiverProfile?.profileImage || caregiverProfile?.imageUrl || caregiverProfile?.image || 
                           userProfile?.profileImage || userProfile?.imageUrl || userProfile?.image ||
                           p.profileImage || p.imageUrl || p.avatarUrl || p.image || p.photoUrl || p.userId?.profileImage;
        console.log('🖼️ CaregiverDashboard - Selected raw image URL:', rawImageUrl);
        
        let processedImageUrl = null;
        if (rawImageUrl) {
          const baseUrl = getCurrentSocketURL();
          
          if (rawImageUrl.startsWith('http')) {
            // Already absolute URL
            processedImageUrl = rawImageUrl;
          } else if (rawImageUrl.startsWith('/')) {
            // Relative URL - convert to absolute
            processedImageUrl = `${baseUrl}${rawImageUrl}`;
          } else {
            // Filename only - add uploads path
            processedImageUrl = `${baseUrl}/uploads/${rawImageUrl}`;
          }
          
          // Add cache-busting timestamp for fresh load
          const timestamp = Date.now();
          processedImageUrl = processedImageUrl.includes('?') 
            ? `${processedImageUrl}&t=${timestamp}` 
            : `${processedImageUrl}?t=${timestamp}`;
            
          console.log('✅ CaregiverDashboard - Final image URL:', processedImageUrl);
        }
        
        // Force refresh if image URL changed
        if (processedImageUrl !== profile.imageUrl) {
          console.log('🔄 Profile image URL changed, forcing refresh');
          setImageRefreshKey(prev => prev + 1);
        }
        
        setProfile((prev) => ({
          ...prev,
          name: p.name || p.userId?.name || prev.name,
          hourlyRate: p.hourlyRate || p.rate || prev.hourlyRate,
          experience: typeof p.experience?.years === 'number' ? `${p.experience.years}+ years` : 
                     (typeof p.experience === 'number' ? `${p.experience}+ years` : 
                     (p.experience || prev.experience)),
          skills: p.skills || prev.skills || prev.specialties,
          bio: p.bio || prev.bio,
          rating: p.rating || prev.rating,
          reviews: p.reviewCount || p.reviews || prev.reviews,
          imageUrl: processedImageUrl,
        }));
        console.log('✅ Profile updated in dashboard');
        console.log('- Final profile object:', {
          name: p.name || p.userId?.name || prev.name,
          imageUrl: processedImageUrl,
          hourlyRate: p.hourlyRate || p.rate || prev.hourlyRate
        });
      }
    } catch (e) {
      console.error('❌ Error loading profile in dashboard:', e);
      // keep default profile
    }
  }

  useFocusEffect(
    useCallback(() => {
      console.log('🔄 CaregiverDashboard focused - loading profile');
      loadProfile();
    }, [user?.id])
  );



  // Listen for route params to force refresh
  useEffect(() => {
    if (route?.params?.refreshProfile) {
      console.log('🔄 CaregiverDashboard - Force refresh triggered by route params');
      loadProfile();
      // Clear the param to prevent repeated refreshes
      navigation.setParams({ refreshProfile: undefined });
    }
  }, [route?.params?.refreshProfile]);



  // Initial data load
  useEffect(() => {
    setApplications(initialApplications);
  }, []);

  // Fetch jobs from backend
  const fetchJobs = async () => {
    const isCaregiver = (user?.role === 'caregiver');
    if (!isCaregiver) return;
    
    if (!user?.id) {
      console.log('[INFO] No user authentication, skipping jobs fetch');
      return;
    }
    
    setJobsLoading(true);
    try {
      console.log('🔍 Fetching available jobs for caregiver...');
      const res = await jobsAPI.getAvailableJobs();
      const jobsList = res?.data?.jobs || res?.jobs || [];
      
      console.log(`📋 Backend jobs response:`, res);
      console.log(`📋 Jobs count: ${jobsList.length}`);
      
      // Transform backend jobs to match frontend format
      const transformedJobs = jobsList.map((job) => {
        const getPostedDate = (createdAt) => {
          if (!createdAt) return 'Recently posted';
          const now = new Date();
          const posted = new Date(createdAt);
          const diffTime = Math.abs(now - posted);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays === 1) return '1 day ago';
          if (diffDays < 7) return `${diffDays} days ago`;
          if (diffDays < 14) return '1 week ago';
          return `${Math.floor(diffDays / 7)} weeks ago`;
        };
        
        return {
          id: job._id || job.id,
          title: job.title || 'Childcare Position',
          family: job.clientName || job.employerName || job.parentId?.name || 'Family',
          location: job.location || 'Cebu City',
          distance: '2-5 km away',
          hourlyRate: job.hourlyRate || job.rate || 300,
          schedule: job.startTime && job.endTime ? `${job.startTime} - ${job.endTime}` : 'Flexible hours',
          requirements: Array.isArray(job.requirements) ? job.requirements : ['Experience with children'],
          postedDate: getPostedDate(job.createdAt),
          urgent: job.urgent || false,
          children: job.numberOfChildren || job.childrenCount || 1,
          ages: job.childrenAges || job.ages || 'Various ages',
          description: job.description || ''
        };
      });
      
      setJobs(transformedJobs);
      console.log(`✅ Loaded ${transformedJobs.length} real jobs from backend`);
      
    } catch (error) {
      console.error('❌ Backend jobs fetch failed:', error.message);
      // No fallback - show empty state when backend fails
      console.log('🔄 No jobs available - backend unavailable');
      setJobs([]);
    } finally {
      setJobsLoading(false);
    }
  };

  // Fetch applications and bookings when component mounts or user role changes
  useEffect(() => {
    // Fetch applications (caregiver-only)
    const fetchApplications = async () => {
      const isCaregiver = (user?.role === 'caregiver');
      if (!isCaregiver || !user?.id) return;
      
      try {
        const res = await applicationsAPI.getMyApplications();
        const list = res?.data?.applications || res?.applications || [];
        
        const normalized = list.map((a) => ({
          id: a._id || a.id || Date.now(),
          jobId: a.jobId?._id || a.jobId || a.job?._id || a.job?.id,
          jobTitle: a.jobId?.title || a.job?.title || "Job Application",
          family: a.jobId?.parentId?.name || a.job?.employerName || "Family",
          status: a.status || "pending",
          appliedDate: a.createdAt || a.appliedDate || new Date().toISOString(),
          hourlyRate: a.proposedRate || a.jobId?.rate || a.expectedRate || undefined,
        }));
        
        setApplications(normalized);
        console.log(`✅ Loaded ${normalized.length} real applications from backend`);
        
      } catch (error) {
        console.error('❌ Backend applications fetch failed:', error.message);
        // No fallback - show empty state when backend fails
        console.log('🔄 No applications available - backend unavailable');
        setApplications([]);
      }
    };

    // Fetch bookings (caregiver-only)
    const fetchBookings = async () => {
      const isCaregiver = (user?.role === 'caregiver');
      if (!isCaregiver || !user?.id) return;
      
      try {
        const res = await bookingsAPI.getMy();
        const list = Array.isArray(res?.bookings) ? res.bookings : Array.isArray(res) ? res : [];
        
        const normalized = list.map((b, idx) => ({
          id: b._id || b.id || idx + 1,
          family: b.family || b.customerName || "Family",
          date: b.date || b.startDate || new Date().toISOString(),
          time: b.time || (b.startTime && b.endTime ? `${b.startTime} - ${b.endTime}` : ""),
          status: b.status || "pending",
          children: Array.isArray(b.children) ? b.children.length : (b.children || 0),
          location: formatAddress(b.location || b.address),
        }));
        
        setBookings(normalized);
        console.log(`✅ Loaded ${normalized.length} real bookings from backend`);
        
      } catch (error) {
        console.error('❌ Backend bookings fetch failed:', error.message);
        // No fallback - show empty state when backend fails
        console.log('🔄 No bookings available - backend unavailable');
        setBookings([]);
      }
    };

    // Execute all fetches
    fetchJobs();
    fetchApplications();
    fetchBookings();
  }, [user?.role, user?.id]);

  // Refresh applications after successful submission
  const refreshApplications = async () => {
    const isCaregiver = (user?.role === 'caregiver');
    if (!isCaregiver || !user?.id) return;
    
    try {
      const res = await applicationsAPI.getMyApplications();
      const list = res?.data?.applications || res?.applications || [];
      if (list.length) {
        const normalized = list.map((a) => ({
          id: a._id || a.id || Date.now(),
          jobId: a.jobId?._id || a.jobId || a.job?._id || a.job?.id,
          jobTitle: a.jobId?.title || a.job?.title || "Job Application",
          family: a.jobId?.parentId?.name || a.job?.employerName || "Family",
          status: a.status || "pending",
          appliedDate: a.createdAt || a.appliedDate || new Date().toISOString(),
          hourlyRate: a.proposedRate || a.jobId?.rate || a.expectedRate || undefined,
        }));
        setApplications(normalized);
      }
    } catch (e) {
      console.error('Error refreshing applications:', e);
    }
  };

  // Open application modal for a selected job
  const handleJobApplication = (job) => {
    setSelectedJob(job)
    setApplicationForm({ coverLetter: '', proposedRate: '' })
    setShowJobApplication(true)
  }

  // Open details modal for a selected job
  const handleViewJob = (job) => {
    setSelectedJob(job)
    setShowJobDetails(true)
  }

  // Open details modal for a selected application
  const handleViewApplication = (application) => {
    setSelectedApplication(application)
    setShowApplicationDetails(true)
  }

  // Placeholder message handler (could navigate to Messages screen in full app)
  const handleMessageFamily = (application) => {
    setShowApplicationDetails(false)
    // Navigate to Messages screen
    try { navigation.navigate('Messages') } catch (error) {
      console.warn('Navigation error:', error);
    }
  }

  // Submit application: real API call with proper error handling
  const handleApplicationSubmit = async ({ jobId, jobTitle, family, coverLetter, proposedRate }) => {
    // Check for duplicate application
    if (applications.some(app => app.jobId === jobId)) {
      showToast('You have already applied to this job', 'error');
      return;
    }
    
    const matchedJob = jobs.find((j) => j.id === jobId)
    
    try {
      setApplicationSubmitting(true)
      
      // Real API call to backend
      console.log('Submitting application with jobId:', jobId);
      const response = await applicationsAPI.apply({ 
        jobId: jobId, 
        coverLetter: coverLetter || '',
        proposedRate: proposedRate ? Number(proposedRate) : undefined,
        message: coverLetter || ''
      })
      
      if (response.success) {
        // Add to local state for immediate UI update
        const newApplication = {
          id: response.data._id || Date.now(),
          jobId,
          jobTitle,
          family,
          status: "pending",
          appliedDate: new Date().toISOString(),
          hourlyRate: proposedRate || (matchedJob ? matchedJob.hourlyRate : undefined)
        }
        
        // Refresh applications from backend to get the latest data
        await refreshApplications()
        showToast('Application submitted successfully!', 'success')
        setShowJobApplication(false)
        setSelectedJob(null)
        setApplicationForm({ coverLetter: '', proposedRate: '' })
        setActiveTab("applications")
      } else {
        throw new Error(response.error || 'Application submission failed')
      }
    } catch (error) {
      console.error('Application submission failed:', error)
      let errorMessage = 'Failed to submit application. Please try again.';
      
      // Handle validation errors
      if (error.message?.includes('Validation failed')) {
        errorMessage = 'Invalid job ID. Please try refreshing the jobs list.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      showToast(errorMessage, 'error')
    } finally {
      setApplicationSubmitting(false)
    }
  }

  // No mock applications - all data from database

  // Note: bookings now come from state with mock fallback



  const handleSaveProfile = async () => {
    try {
      console.log(' Saving profile from dashboard...');
      const isCaregiver = ['caregiver'].includes(String(user?.role || '').toLowerCase())
      const numericRate = Number(profileHourlyRate)
      const payload = {
        name: profileName,
        hourlyRate: Number.isFinite(numericRate) ? numericRate : undefined,
        rate: Number.isFinite(numericRate) ? numericRate : undefined,
        experience: profileExperience,
        previousVersion: {
          name: profile.name,
          hourlyRate: profile.hourlyRate,
          experience: profile.experience,
          updatedAt: new Date().toISOString()
        }
      }
      
      console.log(' Dashboard payload:', payload);
      
      if (isCaregiver) {
        try {
          const response = await caregiversAPI.updateMyProfile(payload)
          console.log(' Dashboard update response:', response);
        } catch (e) {
          const status = e?.response?.status
          if (status === 404) {
            // Profile doesn't exist; create it
            await caregiversAPI.createProfile(payload)
          } else {
            throw e
          }
        }
      } else {
        // Auth profile likely only accepts basic fields
        await authAPI.updateProfile({ name: payload.name })
      }
      
      // Reload profile to ensure UI shows latest data
      await loadProfile()
      
      showToast('Profile changes saved.', 'success')
      setEditProfileModalVisible(false)
    } catch (e) {
      console.error(' Save profile failed:', e?.message || e)
      Alert.alert('Save failed', e?.message || 'Could not save profile. Please try again.')
    }
  }

  const renderEditProfileModal = () => (
    <Modal
      visible={editProfileModalVisible}
      onDismiss={() => setEditProfileModalVisible(false)}
      transparent
      animationType="slide"
    >
      <View style={styles.modalOverlay}>
        <Card style={styles.editProfileModal}>
          <Card.Content>
            <Text style={styles.editProfileTitle}>Edit Profile</Text>
            <TextInput
              label="Name"
              value={profileName}
              onChangeText={setProfileName}
              style={styles.editProfileInput}
            />
            <TextInput
              label="Hourly Rate"
              value={profileHourlyRate}
              onChangeText={setProfileHourlyRate}
              style={styles.editProfileInput}
              keyboardType="numeric"
            />
            <TextInput
              label="Experience"
              value={profileExperience}
              onChangeText={setProfileExperience}
              style={styles.editProfileInput}
            />
            <Button
              mode="contained"
              style={styles.editProfileSaveButton}
              labelStyle={styles.editProfileSaveButtonText}
              onPress={handleSaveProfile}
            >
              Save Changes
            </Button>
            <Button
              mode="text"
              onPress={() => setEditProfileModalVisible(false)}
            >
              Cancel
            </Button>
          </Card.Content>
        </Card>
      </View>
    </Modal>
  )

  // Render Toast
  const renderToast = () => (
    <Toast
      visible={toast.visible}
      message={toast.message}
      type={toast.type}
      onHide={() => setToast((t) => ({ ...t, visible: false }))}
    />
  )

  // Parent-style header with logout and actions
  const renderHeader = () => {
    const { unreadCount } = useMessaging();
    
    // Calculate privacy notification counts
    const unreadNotifications = notifications?.filter(n => !n.read)?.length || 0;
    const pendingRequestsCount = pendingRequests?.length || 0;
    const totalPrivacyNotifications = unreadNotifications + pendingRequestsCount;
    
    return (
      <View style={styles.parentLikeHeaderContainer}>
        <LinearGradient
          colors={["#5bbafa", "#b672ff"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.parentLikeHeaderGradient}
        >
          <View style={styles.headerTop}>
            <View style={[styles.logoContainer, { flexDirection: 'column', alignItems: 'center' }]}>
              <Image source={require('../../assets/icon.png')} style={[styles.logoImage, { marginBottom: 6 }]} />
              
              <View style={styles.headerBadge}>
                <Text style={styles.headerBadgeText}>I am a Caregiver</Text>
              </View>
            </View>
            <View style={styles.headerActions}>
              <Pressable 
                style={[styles.headerButton, { position: 'relative' }]} 
                onPress={() => setActiveTab('messages')}
              >
                <Ionicons name="chatbubble-ellipses-outline" size={22} color="#FFFFFF" />
                {unreadCount > 0 && (
                  <View style={{
                    position: 'absolute',
                    top: -4,
                    right: -4,
                    backgroundColor: '#ef4444',
                    borderRadius: 10,
                    minWidth: 20,
                    height: 20,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 2,
                    borderColor: '#fff',
                  }}>
                    <Text style={{
                      color: '#fff',
                      fontSize: 10,
                      fontWeight: '600',
                    }}>
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </Text>
                  </View>
                )}
              </Pressable>
              
              <Pressable 
                style={[styles.headerButton, { position: 'relative' }]} 
                onPress={() => setShowNotifications(true)}
              >
                <Ionicons name="shield-outline" size={22} color="#FFFFFF" />
                {totalPrivacyNotifications > 0 && (
                  <View style={{
                    position: 'absolute',
                    top: -4,
                    right: -4,
                    backgroundColor: '#ef4444',
                    borderRadius: 10,
                    minWidth: 20,
                    height: 20,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 2,
                    borderColor: '#fff',
                  }}>
                    <Text style={{
                      color: '#fff',
                      fontSize: 10,
                      fontWeight: '600',
                    }}>
                      {totalPrivacyNotifications > 99 ? '99+' : totalPrivacyNotifications}
                    </Text>
                  </View>
                )}
              </Pressable>
              
              <Pressable 
                style={styles.headerButton} 
                onPress={() => setShowRequestModal(true)}
              >
                <Ionicons name="mail-outline" size={22} color="#FFFFFF" />
              </Pressable>
              
              <Pressable 
                style={styles.headerButton} 
                onPress={() => setShowSettings(true)}
              >
                <Ionicons name="settings-outline" size={22} color="#FFFFFF" />
              </Pressable>
              
              <Pressable style={styles.headerButton} onPress={() => navigation.navigate('EnhancedCaregiverProfileWizard', { isEdit: true, existingProfile: profile })}>
                <Ionicons name="person-outline" size={22} color="#FFFFFF" />
              </Pressable>
              
              {/* Debug button - only show in development */}
              {__DEV__ && (
                <Pressable style={styles.headerButton} onPress={debugProfileImage}>
                  <Ionicons name="bug-outline" size={22} color="#FFFFFF" />
                </Pressable>
              )}
              

              <Pressable 
                style={styles.headerButton} 
                onPress={async () => {
                  try {
                    console.log('🚪 Caregiver logout initiated...');
                    if (onLogout) {
                      console.log('Using onLogout prop');
                      await onLogout();
                    } else {
                      console.log('Using signOut from AuthContext');
                      await signOut();
                    }
                    console.log('✅ Logout completed');
                  } catch (error) {
                    console.error('❌ Logout error:', error);
                    Alert.alert('Logout Error', 'Failed to logout. Please try again.');
                  }
                }}
              >
                <Ionicons name="log-out-outline" size={22} color="#FFFFFF" />
              </Pressable>
            </View>
          </View>
        </LinearGradient>
      </View>
    )
  }

  // Parent-style horizontal top navigation for caregiver tabs
  const renderTopNav = () => (
    <View style={styles.navContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.navScroll}>
        {[
          { id: 'dashboard', label: 'Dashboard', icon: 'grid' },
          { id: 'jobs', label: 'Jobs', icon: 'briefcase' },
          { id: 'applications', label: 'Applications', icon: 'document-text' },
          { id: 'bookings', label: 'Bookings', icon: 'calendar' },
          { id: 'messages', label: 'Messages', icon: 'chatbubble-ellipses' },
        ].map((tab) => {
          const active = activeTab === tab.id
          const onPress = () => {
            setActiveTab(tab.id)
            // Refresh jobs when jobs tab is selected
            if (tab.id === 'jobs') {
              fetchJobs()
            }
          }
          const iconColor = active ? '#3b83f5' : '#6B7280'
          return (
            <Pressable
              key={tab.id}
              onPress={onPress}
              style={[
                styles.navTab,
                active ? styles.navTabActive : null,
              ]}
            >
              <Ionicons name={tab.icon} size={18} color={iconColor} />
              <Text style={[styles.navTabText, active ? styles.navTabTextActive : null]}>
                {tab.label}
              </Text>
            </Pressable>
          )
        })}
      </ScrollView>
    </View>
  )

  return (
    <View style={styles.container}>
      {renderHeader()}
      {renderTopNav()}
      
      <View style={{ flex: 1 }}>
        {activeTab !== "messages" && (
          <Searchbar
            placeholder="Search jobs, families..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchBar}
            iconColor="#9CA3AF"
            placeholderTextColor="#9CA3AF"
            inputStyle={styles.searchInput}
          />
        )}

        {activeTab === "dashboard" && (
          <ScrollView style={styles.content}>
            <CaregiverProfileSection 
              profile={profile}
              activeTab={activeTab}
            />
            
            {/* Debug section - only show in development */}
            {__DEV__ && (
              <View style={{
                backgroundColor: '#fff3cd',
                padding: 12,
                margin: 16,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: '#ffeaa7'
              }}>
                <Text style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 8, color: '#856404' }}>
                  🐛 Debug Info (Development Only)
                </Text>
                <Text style={{ fontSize: 12, color: '#856404', marginBottom: 4 }}>
                  Profile Image URL: {profile?.imageUrl || 'Not set'}
                </Text>
                <Text style={{ fontSize: 12, color: '#856404', marginBottom: 4 }}>
                  User ID: {user?.id || 'Not set'}
                </Text>
                <Text style={{ fontSize: 12, color: '#856404', marginBottom: 4 }}>
                  Socket URL: {getCurrentSocketURL()}
                </Text>
                <Pressable 
                  onPress={debugProfileImage}
                  style={{
                    backgroundColor: '#ffc107',
                    padding: 8,
                    borderRadius: 4,
                    marginTop: 8,
                    alignItems: 'center'
                  }}
                >
                  <Text style={{ color: '#212529', fontWeight: 'bold', fontSize: 12 }}>
                    Refresh Profile Data
                  </Text>
                </Pressable>
              </View>
            )}
            {/* Quick stats grid */}
            <View style={styles.statsGrid}>
              <QuickStat
                icon="star"
                value={profile?.rating?.toFixed(1) || "0.0"}
                label="Rating"
                color="#F59E0B"
                bgColor="#FEF3C7"
                styles={styles}
              />
              <QuickStat
                icon="briefcase"
                value={profile?.completedJobs || "0"}
                label="Jobs Done"
                color="#10B981"
                bgColor="#D1FAE5"
                styles={styles}
              />
              <QuickStat
                icon="chatbubble"
                value={profile?.responseRate || "0%"}
                label="Response Rate"
                color="#3B82F6"
                bgColor="#DBEAFE"
                styles={styles}
              />
              <QuickStat
                icon="checkmark-circle"
                value={profile?.verification?.trustScore || "0"}
                label="Trust Score"
                color="#8B5CF6"
                bgColor="#EDE9FE"
                styles={styles}
              />
            </View>

            {/* Quick actions 2x2 grid */}
            <View style={styles.actionGrid}>
              <QuickAction
                icon="search"
                label="Find Jobs"
                gradientColors={["#3B82F6", "#2563EB"]}
                onPress={() => {
                  setActiveTab('jobs')
                  fetchJobs() // Refresh jobs when navigating to jobs tab
                }}
                styles={styles}
              />
              <QuickAction
                icon="calendar"
                label="Bookings"
                gradientColors={["#22C55E", "#16A34A"]}
                onPress={() => setActiveTab('bookings')}
                styles={styles}
              />
              <QuickAction
                icon="chatbubble-ellipses"
                label="Messages"
                gradientColors={["#A78BFA", "#8B5CF6"]}
                onPress={() => setActiveTab('messages')}
                styles={styles}
              />
              <QuickAction
                icon="document-text"
                label="Applications"
                gradientColors={["#fb7185", "#ef4444"]}
                onPress={() => setActiveTab('applications')}
                styles={styles}
              />
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recommended Jobs</Text>
                <Pressable onPress={() => setActiveTab('jobs')}>
                  <Text style={styles.seeAllText}>See All</Text>
                </Pressable>
              </View>
              {jobsLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#3B82F6" />
                  <Text style={styles.loadingText}>Loading jobs...</Text>
                </View>
              ) : (
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false} 
                  style={styles.horizontalScroll}
                  contentContainerStyle={{ paddingRight: 16 }}
                >
                  {(jobs || []).slice(0, 3).map((job, index) => (
                    <JobCard
                      key={job.id}
                      job={job}
                      showActions={true}
                      onApply={handleJobApplication}
                      onLearnMore={handleViewJob}
                      hasApplied={(id) => applications.some((a) => a.jobId === id)}
                      jobCardStyle={[
                        styles.jobCardHorizontal,
                        { marginRight: index === 2 ? 0 : 16 }
                      ]}
                    />
                  ))}
                </ScrollView>
              )}
            </View>

            {/* Enhanced Profile Wizard Promotion Card */}
            <View style={styles.section}>
              <Card style={[styles.promotionCard, { backgroundColor: '#f0f9ff', borderColor: '#3b82f6' }]}>
                <Card.Content>
                  <View style={styles.promotionHeader}>
                    <View style={styles.promotionIcon}>
                      <Ionicons name="star" size={20} color="#3b82f6" />
                    </View>
                    <View style={styles.promotionContent}>
                      <Text style={styles.promotionTitle}>Complete Your Enhanced Profile</Text>
                      <Text style={styles.promotionDescription}>
                        Add documents, certifications, and portfolio to get more bookings
                      </Text>
                    </View>
                  </View>
                  <Button
                    mode="contained"
                    onPress={() => navigation.navigate('EnhancedCaregiverProfileWizard', { isEdit: true, existingProfile: profile })}
                    style={[styles.promotionButton, { backgroundColor: '#3b82f6' }]}
                    labelStyle={{ color: '#ffffff' }}
                    icon="arrow-right"
                  >
                    Complete Profile
                  </Button>
                </Card.Content>
              </Card>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent Applications</Text>
                <Pressable onPress={() => setActiveTab("applications")}>
                  <Text style={styles.seeAllText}>View All</Text>
                </Pressable>
              </View>
              {applications.slice(0, 2).map((application) => (
                <ApplicationCard 
                  key={application.id} 
                  application={application}
                  onViewDetails={handleViewApplication}
                  onMessage={handleMessageFamily}
                />
              ))}
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Upcoming Bookings</Text>
                <Pressable onPress={() => setActiveTab('bookings')}>
                  <Text style={styles.seeAllText}>See All</Text>
                </Pressable>
              </View>
              {bookings.slice(0, 2).map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  onMessage={() => setActiveTab("dashboard")}
                  onViewDetails={() => {
                    setSelectedBooking(booking)
                    setShowBookingDetails(true)
                  }}
                />
              ))}
            </View>
          </ScrollView>
        )}

        {activeTab === "jobs" && (
          <ScrollView 
            style={styles.content}
            refreshControl={
              <RefreshControl
                refreshing={jobsLoading}
                onRefresh={fetchJobs}
                colors={['#3B82F6']}
                tintColor="#3B82F6"
              />
            }
          >
            <View style={styles.section}>
              <View style={styles.filters}>
                <Chip style={styles.filterChip} textStyle={styles.filterChipText}>
                  All Jobs
                </Chip>
                <Chip
                  style={[styles.filterChip, styles.filterChipActive]}
                  textStyle={[styles.filterChipText, styles.filterChipTextActive]}
                >
                  Nearby
                </Chip>
                <Chip style={styles.filterChip} textStyle={styles.filterChipText}>
                  High Pay
                </Chip>
                <Chip style={styles.filterChip} textStyle={styles.filterChipText}>
                  Urgent
                </Chip>
              </View>

              {jobsLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#3B82F6" />
                  <Text style={styles.loadingText}>Loading jobs...</Text>
                </View>
              ) : jobs && jobs.length > 0 ? (
                <View style={[styles.jobsGrid, columns === 1 && { flexDirection: 'column' }]}>
                  {jobs.map((job) => (
                    <JobCard
                      key={job.id}
                      job={job}
                      showActions={true}
                      onApply={handleJobApplication}
                      onLearnMore={handleViewJob}
                      hasApplied={(id) => applications.some((a) => a.jobId === id)}
                      jobCardStyle={columns === 1 ? { width: '100%', ...(gridCardHeight ? { height: gridCardHeight } : {}) } : { width: gridCardWidth, height: gridCardHeight }}
                      gridMode
                    />
                  ))}
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="briefcase" size={48} color="#9CA3AF" />
                  <Text style={styles.emptyStateText}>No jobs available</Text>
                  <Text style={styles.emptyStateSubtext}>
                    Please check back later or adjust your filters
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>
        )}

        {activeTab === "applications" && (
          <ScrollView style={styles.content}>
            <View style={styles.section}>
              {applications.length > 0 ? (
                applications.map((application) => (
                  <ApplicationCard 
                    key={application.id} 
                    application={application}
                    onViewDetails={handleViewApplication}
                    onMessage={handleMessageFamily}
                  />
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="document-text" size={48} color="#9CA3AF" />
                  <Text style={styles.emptyStateText}>No applications yet</Text>
                  <Text style={styles.emptyStateSubtext}>
                    Apply to jobs to see them here
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>
        )}

        {activeTab === "messages" && (
          <MessagesTab navigation={navigation} />
        )}

        {activeTab === "bookings" && (
          <ScrollView style={styles.content}>
            <View style={styles.section}>
              <View style={styles.bookingFilters}>
                <Chip
                  style={[styles.bookingFilterChip, styles.bookingFilterChipActive]}
                  textStyle={styles.bookingFilterChipText}
                >
                  Upcoming
                </Chip>
                <Chip
                  style={styles.bookingFilterChip}
                  textStyle={styles.bookingFilterChipText}
                >
                  Past
                </Chip>
                <Chip
                  style={styles.bookingFilterChip}
                  textStyle={styles.bookingFilterChipText}
                >
                  Cancelled
                </Chip>
              </View>

              {bookings.length > 0 ? (
                bookings.map((booking) => (
                  <BookingCard
                    key={booking.id}
                    booking={booking}
                    onMessage={() => setActiveTab("dashboard")}
                    onViewDetails={() => {
                      setSelectedBooking(booking)
                      setShowBookingDetails(true)
                    }}
                  />
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="calendar" size={48} color="#9CA3AF" />
                  <Text style={styles.emptyStateText}>No bookings yet</Text>
                  <Text style={styles.emptyStateSubtext}>
                    Your upcoming bookings will appear here
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>
        )}
      </View>

      {/* Logout button moved to header actions */}

      {renderEditProfileModal()}

      {/* Booking Details Modal */}
      {showBookingDetails && selectedBooking && (
        <Modal
          visible={showBookingDetails}
          onRequestClose={() => setShowBookingDetails(false)}
          transparent
          animationType="slide"
        >
          <View style={styles.modalOverlay}>
            <Card style={styles.editProfileModal}>
              <Card.Content>
                <Text style={styles.editProfileTitle}>{selectedBooking.family}</Text>
                <Text style={styles.profileSectionText}>Children: {selectedBooking.children}</Text>
                <Text style={styles.profileSectionText}>Date: {selectedBooking.date}</Text>
                <Text style={styles.profileSectionText}>Time: {selectedBooking.time}</Text>
                <Text style={styles.profileSectionText}>Location: {selectedBooking.location}</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12 }}>
                  <Button mode="text" onPress={() => setShowBookingDetails(false)}>Close</Button>
                </View>
              </Card.Content>
            </Card>
          </View>
        </Modal>
      )}

      {/* Job Application Modal */}
      {showJobApplication && selectedJob && (
        <Modal
          visible={showJobApplication}
          onRequestClose={() => {
            if (!applicationSubmitting) {
              setShowJobApplication(false)
              setSelectedJob(null)
              setApplicationForm({ coverLetter: '', proposedRate: '' })
            }
          }}
          transparent
          animationType="slide"
        >
          <View style={styles.modalOverlay}>
            <View style={styles.applicationModal}>
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.applicationModalHeader}>
                  <Text style={styles.applicationModalTitle}>Apply to Job</Text>
                  <Pressable 
                    onPress={() => {
                      if (!applicationSubmitting) {
                        setShowJobApplication(false)
                        setSelectedJob(null)
                        setApplicationForm({ coverLetter: '', proposedRate: '' })
                      }
                    }}
                    style={styles.modalCloseButton}
                  >
                    <Ionicons name="close" size={24} color="#6B7280" />
                  </Pressable>
                </View>
                
                <View style={styles.jobSummary}>
                  <Text style={styles.jobSummaryTitle}>{selectedJob.title}</Text>
                  <Text style={styles.jobSummaryFamily}>{selectedJob.family}</Text>
                  <Text style={styles.jobSummaryRate}>₱{selectedJob.hourlyRate}/hour</Text>
                </View>
                
                <View style={styles.applicationFormContainer}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Proposed Rate (Optional)</Text>
                    <TextInput
                      style={styles.applicationInput}
                      placeholder={`₱${selectedJob.hourlyRate}`}
                      value={applicationForm.proposedRate}
                      onChangeText={(text) => setApplicationForm(prev => ({ ...prev, proposedRate: text }))}
                      keyboardType="numeric"
                      editable={!applicationSubmitting}
                    />
                  </View>
                  
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Cover Letter (Optional)</Text>
                    <TextInput
                      style={[styles.applicationInput, styles.applicationTextArea]}
                      placeholder="Tell the family why you're the perfect fit for this job..."
                      value={applicationForm.coverLetter}
                      onChangeText={(text) => setApplicationForm(prev => ({ ...prev, coverLetter: text }))}
                      multiline
                      numberOfLines={4}
                      textAlignVertical="top"
                      editable={!applicationSubmitting}
                    />
                  </View>
                </View>
                
                <View style={styles.applicationModalActions}>
                  <Button 
                    mode="outlined" 
                    onPress={() => {
                      if (!applicationSubmitting) {
                        setShowJobApplication(false)
                        setSelectedJob(null)
                        setApplicationForm({ coverLetter: '', proposedRate: '' })
                      }
                    }}
                    style={styles.cancelButton}
                    disabled={applicationSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    mode="contained"
                    onPress={() => handleApplicationSubmit({
                      jobId: selectedJob.id,
                      jobTitle: selectedJob.title,
                      family: selectedJob.family,
                      coverLetter: applicationForm.coverLetter,
                      proposedRate: applicationForm.proposedRate
                    })}
                    style={styles.submitButton}
                    loading={applicationSubmitting}
                    disabled={applicationSubmitting}
                  >
                    {applicationSubmitting ? 'Submitting...' : 'Submit Application'}
                  </Button>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      {/* Application Details Modal */}
      {showApplicationDetails && selectedApplication && (
        <Modal
          visible={showApplicationDetails}
          onRequestClose={() => setShowApplicationDetails(false)}
          transparent
          animationType="slide"
        >
          <View style={styles.modalOverlay}>
            <Card style={styles.editProfileModal}>
              <Card.Content>
                <Text style={styles.editProfileTitle}>{selectedApplication.jobTitle}</Text>
                <Text style={styles.profileSectionText}>{selectedApplication.family}</Text>
                <View style={{ marginTop: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                    <Ionicons name="calendar" size={16} color="#6B7280" style={{ marginRight: 6 }} />
                    <Text style={styles.profileSectionText}>Applied: {new Date(selectedApplication.appliedDate).toLocaleDateString()}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                    <Ionicons name="cash" size={16} color="#6B7280" style={{ marginRight: 6 }} />
                    <Text style={styles.profileSectionText}>${selectedApplication.hourlyRate}/hr</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                    <Ionicons name="information-circle" size={16} color="#6B7280" style={{ marginRight: 6 }} />
                    <Text style={styles.profileSectionText}>Status: {selectedApplication.status}</Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12 }}>
                  <Button mode="text" onPress={() => setShowApplicationDetails(false)}>Close</Button>
                  {selectedApplication.status === 'accepted' && (
                    <Button 
                      mode="contained" 
                      style={{ marginLeft: 8 }}
                      onPress={() => handleMessageFamily(selectedApplication)}
                    >
                      Message Family
                    </Button>
                  )}
                </View>
              </Card.Content>
            </Card>
          </View>
        </Modal>
      )}

      {/* Job Details Modal */}
      {showJobDetails && selectedJob && (
        <Modal
          visible={showJobDetails}
          onRequestClose={() => {
            setShowJobDetails(false)
            setSelectedJob(null)
          }}
          transparent
          animationType="slide"
        >
          <View style={styles.modalOverlay}>
            <Card style={styles.editProfileModal}>
              <Card.Content>
                <Text style={styles.editProfileTitle}>{selectedJob.title}</Text>
                <View style={{ marginTop: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                    <Ionicons name="home" size={16} color="#6B7280" style={{ marginRight: 6 }} />
                    <Text style={styles.profileSectionText}>{selectedJob.family}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                    <Ionicons name="location" size={16} color="#6B7280" style={{ marginRight: 6 }} />
                    <Text style={styles.profileSectionText}>{selectedJob.location} • {selectedJob.distance}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                    <Ionicons name="time" size={16} color="#6B7280" style={{ marginRight: 6 }} />
                    <Text style={styles.profileSectionText}>{selectedJob.schedule}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                    <Ionicons name="cash" size={16} color="#6B7280" style={{ marginRight: 6 }} />
                    <Text style={styles.profileSectionText}>${selectedJob.hourlyRate}/hr</Text>
                  </View>
                  {Array.isArray(selectedJob.requirements) && selectedJob.requirements.length > 0 && (
                    <View style={{ marginTop: 8 }}>
                      <Text style={[styles.sectionSubtitle, { marginBottom: 6 }]}>Requirements</Text>
                      {selectedJob.requirements.map((req, idx) => (
                        <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                          <Ionicons name="checkmark-circle" size={16} color="#10B981" style={{ marginRight: 6 }} />
                          <Text style={styles.profileSectionText}>{req}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12 }}>
                  <Button mode="text" onPress={() => { setShowJobDetails(false); setSelectedJob(null) }}>Close</Button>
                  <Button
                    mode="contained"
                    style={{ marginLeft: 8 }}
                    onPress={() => {
                      setShowJobDetails(false)
                      handleJobApplication(selectedJob)
                    }}
                  >
                    Apply Now
                  </Button>
                </View>
              </Card.Content>
            </Card>
          </View>
        </Modal>
      )}

      {renderToast()}
      
      {/* Privacy Modals */}
      <PrivacyNotificationModal
        visible={showNotifications}
        onClose={() => setShowNotifications(false)}
        requests={pendingRequests}
      />
      
      <SettingsModal
        visible={showSettings}
        onClose={() => setShowSettings(false)}
        user={user}
        userType={user?.role || 'caregiver'}
        colors={{ primary: '#3B82F6' }}
      />
      
      <RequestInfoModal
        visible={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        targetUser={{ id: 'sample', name: 'Parent' }}
        colors={{ primary: '#3B82F6' }}
      />
    </View>
  )
}

function StatCard({ icon, value, label, color, bgColor }) {
  return (
    <View style={[styles.statCard, { backgroundColor: bgColor }]}>
      <View style={[styles.statIcon, { backgroundColor: `${color}20` }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  )
}

function JobCard({ job, showActions = true, onApply, hasApplied, onLearnMore, jobCardStyle, gridMode = false }) {
  // Determine if already applied
  const applied = typeof hasApplied === 'function' ? hasApplied(job.id) : false
  // Limit content when in grid mode to maintain consistent card height
  const maxRequirementChips = gridMode ? 2 : 3
  return (
    <Card style={[styles.jobCard, jobCardStyle]}>
      <Card.Content>
        <View style={styles.jobHeader}>
          <View>
            <Text style={styles.jobTitle} numberOfLines={gridMode ? 2 : undefined}>{job.title}</Text>
            <View style={styles.jobMeta}>
              <Ionicons name="people" size={16} color="#6B7280" />
              <Text style={styles.jobMetaText}>
                {job.children} {job.children === 1 ? 'child' : 'children'} • {job.ages}
              </Text>
              <Ionicons name="location" size={16} color="#6B7280" style={styles.jobMetaIcon} />
              <Text style={styles.jobMetaText}>{job.distance}</Text>
            </View>
          </View>
          {job.urgent && (
            <View style={styles.urgentBadge}>
              <Text style={styles.urgentBadgeText}>Urgent</Text>
            </View>
          )}
        </View>

        <View style={styles.jobDetails}>
          <View style={styles.jobDetailRow}>
            <Ionicons name="time" size={16} color="#6B7280" />
            <Text style={styles.jobDetailText}>{job.schedule}</Text>
          </View>
          <View style={styles.jobDetailRow}>
            <Ionicons name="cash" size={16} color="#6B7280" />
            <Text style={styles.jobDetailText}>${job.hourlyRate}/hr</Text>
          </View>
        </View>

        <View style={styles.requirementsContainer}>
          {job.requirements.slice(0, maxRequirementChips).map((req, index) => (
            <View key={index} style={styles.requirementTag}>
              <Text style={styles.requirementText}>{req}</Text>
            </View>
          ))}
          {job.requirements.length > maxRequirementChips && (
            <Text style={styles.moreRequirementsText}>
              +{job.requirements.length - maxRequirementChips} more
            </Text>
          )}
        </View>

        {showActions && (
          <View style={styles.jobFooter}>
            <Text style={styles.postedDate}>Posted {job.postedDate}</Text>
            <View style={styles.jobActionButtons}>
              <Button 
                mode="outlined" 
                style={styles.secondaryButton}
                labelStyle={styles.secondaryButtonText}
                onPress={() => onLearnMore && onLearnMore(job)}
              >
                Learn More
              </Button>
              {applied ? (
                <View style={[styles.appliedBadge]}>
                  <View style={styles.appliedBadgeContent}>
                    <Ionicons name="checkmark-circle" size={16} color="#4CAF50" style={{ marginRight: 6 }} />
                    <Text style={styles.appliedBadgeText}>Applied</Text>
                  </View>
                </View>
              ) : (
                <Button 
                  mode="contained" 
                  style={styles.primaryButton}
                  labelStyle={styles.primaryButtonText}
                  onPress={() => onApply && onApply(job)}
                >
                  Apply Now
                </Button>
              )}
            </View>
          </View>
        )}
      </Card.Content>
    </Card>
  )
}

function ApplicationCard({ application, onViewDetails, onMessage }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'accepted':
        return '#4CAF50' // Green
      case 'rejected':
        return '#F44336' // Red
      case 'pending':
      default:
        return '#FF9800' // Orange
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'accepted':
        return 'checkmark-circle'
      case 'rejected':
        return 'close-circle'
      case 'pending':
      default:
        return 'time'
    }
  }

  return (
    <Card style={styles.applicationCard}>
      <Card.Content style={styles.applicationContent}>
        <View style={styles.applicationHeader}>
          <View>
            <Text style={styles.applicationJobTitle}>{application.jobTitle}</Text>
            <Text style={styles.applicationFamily}>{application.family}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(application.status)}15` }]}>
            <Ionicons 
              name={getStatusIcon(application.status)} 
              size={16} 
              color={getStatusColor(application.status)} 
              style={styles.statusIcon} 
            />
            <Text style={[styles.statusText, { color: getStatusColor(application.status) }]}>
              {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
            </Text>
          </View>
        </View>

        <View style={styles.applicationDetails}>
          <View style={styles.applicationDetailRow}>
            <Ionicons name="calendar" size={16} color="#6B7280" />
            <Text style={styles.applicationDetailText}>
              Applied on {new Date(application.appliedDate).toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.applicationDetailRow}>
            <Ionicons name="cash" size={16} color="#6B7280" />
            <Text style={styles.applicationDetailText}>
              ${application.hourlyRate}/hr
            </Text>
          </View>
        </View>

        <View style={styles.applicationActions}>
          <Button 
            mode="outlined" 
            style={styles.applicationButton}
            labelStyle={styles.applicationButtonText}
            onPress={() => onViewDetails && onViewDetails(application)}
          >
            View Details
          </Button>
          {application.status === 'accepted' && (
            <Button 
              mode="contained" 
              style={[styles.applicationButton, { marginLeft: 8 }]}
              labelStyle={styles.applicationButtonText}
              onPress={() => onMessage && onMessage(application)}
            >
              Message Family
            </Button>
          )}
        </View>
      </Card.Content>
    </Card>
  )
}

function BookingCard({ booking, onMessage, onViewDetails }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return '#4CAF50' // Green
      case 'cancelled':
        return '#F44336' // Red
      case 'pending':
      default:
        return '#FF9800' // Orange
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmed'
      case 'cancelled':
        return 'Cancelled'
      case 'pending':
      default:
        return 'Pending Confirmation'
    }
  }

  return (
    <Card style={styles.bookingCard}>
      <Card.Content>
        <View style={styles.bookingHeader}>
          <Text style={styles.bookingFamily}>{booking.family}</Text>
          <View style={[styles.bookingStatus, { backgroundColor: `${getStatusColor(booking.status)}15` }]}>
            <Text style={[styles.bookingStatusText, { color: getStatusColor(booking.status) }]}>
              {getStatusText(booking.status)}
            </Text>
          </View>
        </View>

        <View style={styles.bookingDetails}>
          <View style={styles.bookingDetailRow}>
            <Ionicons name="calendar" size={16} color="#6B7280" />
            <Text style={styles.bookingDetailText}>
              {new Date(booking.date).toLocaleDateString('en-US', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric' 
              })}
            </Text>
            <Ionicons name="time" size={16} color="#6B7280" style={styles.bookingDetailIcon} />
            <Text style={styles.bookingDetailText}>{booking.time}</Text>
          </View>
          <View style={styles.bookingDetailRow}>
            <Ionicons name="people" size={16} color="#6B7280" />
            <Text style={styles.bookingDetailText}>
              {booking.children} {booking.children === 1 ? 'child' : 'children'}
            </Text>
            <Ionicons name="location" size={16} color="#6B7280" style={styles.bookingDetailIcon} />
            <Pressable 
              onPress={() => {
                if (booking.location) {
                  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(booking.location)}`;
                  Linking.openURL(mapsUrl).catch(err => {
                    console.error('Error opening maps:', err);
                    Alert.alert('Error', 'Could not open maps. Please check if you have a maps app installed.');
                  });
                }
              }}
            >
              <Text style={[styles.bookingDetailText, { textDecorationLine: 'underline', color: '#2563EB' }]}>{booking.location}</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.bookingActions}>
          <Button 
            mode="outlined" 
            style={styles.bookingButton}
            labelStyle={styles.bookingButtonText}
            onPress={onViewDetails}
          >
            View Details
          </Button>
          <Button 
            mode="contained" 
            style={[styles.bookingButton, { marginLeft: 8 }]}
            labelStyle={styles.bookingButtonText}
            onPress={onMessage}
          >
            Message
          </Button>
        </View>
      </Card.Content>
    </Card>
  )
}

function ProfileSection() {
  const profile = {
    name: "Sarah Johnson",
    rating: 4.9,
    reviews: 127,
    hourlyRate: 25,
    experience: "5+ years",
    specialties: ["Toddlers", "Meal Prep", "Light Housekeeping"],
    certifications: ["CPR Certified", "First Aid", "Child Development"],
    backgroundCheck: "Verified",
    completedJobs: 234,
    responseRate: "98%"
  }

  return (
    <Card style={styles.profileSection}>
      <Card.Content>
        <View style={styles.profileSectionHeader}>
          <Text style={styles.sectionTitle}>Profile</Text>
          <Ionicons name="create-outline" size={20} color="#4B5563" />
        </View>

        <View style={styles.profileSectionContent}>
          <View style={styles.profileSectionRow}>
            <Ionicons name="person" size={20} color="#6B7280" style={styles.profileSectionIcon} />
            <Text style={styles.profileSectionText}>{profile.name}</Text>
          </View>
          <View style={styles.profileSectionRow}>
            <Ionicons name="cash" size={20} color="#6B7280" style={styles.profileSectionIcon} />
            <Text style={styles.profileSectionText}>${profile.hourlyRate}/hr</Text>
          </View>
          <View style={styles.profileSectionRow}>
            <Ionicons name="briefcase" size={20} color="#6B7280" style={styles.profileSectionIcon} />
            <Text style={styles.profileSectionText}>{profile.experience} experience</Text>
          </View>
          <View style={styles.profileSectionRow}>
            <Ionicons name="checkmark-circle" size={20} color="#6B7280" style={styles.profileSectionIcon} />
            <Text style={styles.profileSectionText}>{profile.backgroundCheck}</Text>
          </View>
        </View>

        <View style={styles.sectionDivider} />

        <View style={styles.skillsSection}>
          <Text style={styles.sectionSubtitle}>Specialties</Text>
          <View style={styles.skillsContainer}>
            {profile.specialties.map((skill, index) => (
              <View key={index} style={styles.skillTag}>
                <Text style={styles.skillText}>{skill}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.sectionDivider} />

        <View>
          <Text style={styles.sectionSubtitle}>Certifications</Text>
          <View style={styles.certificationsContainer}>
            {profile.certifications.map((cert, index) => (
              <View key={index} style={styles.certificationItem}>
                <Ionicons name="checkmark-circle" size={16} color="#10B981" style={styles.certificationIcon} />
                <Text style={styles.certificationText}>{cert}</Text>
              </View>
            ))}
          </View>
        </View>
      </Card.Content>
    </Card>
  )
}

// Styles will be added in the next part
