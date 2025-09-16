"use client"

import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect, useNavigation } from "@react-navigation/native"
import { LinearGradient } from "expo-linear-gradient"
import React, { useCallback, useEffect, useState } from "react"
import { ActivityIndicator, Alert, Dimensions, Image, Linking, Modal, Platform, Pressable, RefreshControl, ScrollView, Text, TextInput, View } from "react-native"
import { Button, Card, Chip, Searchbar } from "react-native-paper"
import Toast from "../components/ui/feedback/Toast"
import { apiService } from "../services/index"
import { getCurrentSocketURL } from '../config/api'
import { useAuth } from "../core/contexts/AuthContext"
import { useMessaging } from "../contexts/MessagingContext"
import { usePrivacy } from "../components/features/privacy/PrivacyManager"
import PrivacyNotificationModal from "../components/features/privacy/PrivacyNotificationModal"
import { SettingsModal } from "../components/ui/modals/SettingsModal"
import { RequestInfoModal } from "../components/ui/modals/RequestInfoModal"
import MessagesTab from "../components/features/messaging/MessagesTab"

import { formatAddress } from "../utils/addressUtils"
import { calculateAge } from "../utils/dateUtils"
import { __DEV__ } from "../config/constants"
import { styles } from "./styles/CaregiverDashboard.styles"
import CaregiverProfileSection from "./CaregiverDashboard/components/CaregiverProfileSection"
import { useCaregiverDashboard } from '../hooks/useCaregiverDashboard'

import { 
  EmptyState, 
  StatusBadge, 
  ModalWrapper, 
  Card as SharedCard, 
  Button as SharedButton,
  FormInput,
  QuickStat, 
  QuickAction,
  formatDate,
  useDebounce 
} from '../shared/ui';

const { width } = Dimensions.get("window")

// Component definitions
function JobCard({ job, showActions = true, onApply, hasApplied, onLearnMore, jobCardStyle, gridMode = false }) {
  const applied = typeof hasApplied === 'function' ? hasApplied(job.id) : false
  const maxRequirementChips = gridMode ? 2 : 3
  return (
    <Card style={[styles.jobCard, jobCardStyle]}>
      <View style={{ overflow: 'hidden' }}>
      <Card.Content style={{ padding: 16 }}>
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
            <Text style={styles.jobDetailText}>₱{job.hourlyRate}/hr</Text>
          </View>
        </View>

        {job.requirements && job.requirements.length > 0 && (
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
        )}

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
      </View>
    </Card>
  )
}

function ApplicationCard({ application, onViewDetails, onMessage }) {
  return (
    <Card style={styles.applicationCard}>
      <View style={{ overflow: 'hidden' }}>
      <Card.Content style={styles.applicationContent}>
        <View style={styles.applicationHeader}>
          <View>
            <Text style={styles.applicationJobTitle}>{application.jobTitle}</Text>
            <Text style={styles.applicationFamily}>{application.family}</Text>
          </View>
          <StatusBadge status={application.status} />
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
      </View>
    </Card>
  )
}

function BookingCard({ booking, onMessage, onViewDetails, onConfirmAttendance }) {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const handleLocationPress = () => {
    if (booking.location) {
      const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(booking.location)}`;
      Linking.openURL(mapsUrl).catch(err => {
        console.error('Error opening maps:', err);
        Alert.alert('Error', 'Could not open maps. Please check if you have a maps app installed.');
      });
    }
  };

  return (
    <Card style={styles.bookingCard} accessibilityLabel={`Booking with ${booking.family}`}>
      <Card.Content style={styles.bookingContent}>
        <View style={styles.bookingHeader}>
          <View style={styles.bookingTitleSection}>
            <Text style={styles.bookingFamily} numberOfLines={1}>{booking.family}</Text>
            <Text style={styles.bookingDate}>{formatDate(booking.date)}</Text>
          </View>
          <StatusBadge status={booking.status} />
        </View>

        <View style={styles.bookingDetails}>
          <View style={styles.bookingDetailRow}>
            <View style={styles.bookingDetailItem}>
              <Ionicons name="time-outline" size={18} color="#6B7280" />
              <Text style={styles.bookingDetailText}>{booking.time}</Text>
            </View>
            <View style={styles.bookingDetailItem}>
              <Ionicons name="people-outline" size={18} color="#6B7280" />
              <Text style={styles.bookingDetailText}>
                {booking.children} {booking.children === 1 ? 'child' : 'children'}
              </Text>
            </View>
          </View>
          
          <View style={styles.bookingLocationRow}>
            <Ionicons name="location-outline" size={18} color="#6B7280" />
            <Pressable 
              onPress={handleLocationPress}
              style={styles.locationButton}
              accessibilityLabel="Open location in maps"
              accessibilityHint={`Navigate to ${booking.location}`}
            >
              <Text style={styles.bookingLocationText} numberOfLines={1}>
                {booking.location}
              </Text>
              <Ionicons name="open-outline" size={14} color="#2563EB" style={styles.locationIcon} />
            </Pressable>
          </View>
        </View>

        <View style={styles.bookingActions}>
          <Button 
            mode="outlined" 
            style={styles.bookingSecondaryButton}
            labelStyle={styles.bookingSecondaryButtonText}
            onPress={() => onViewDetails && onViewDetails(booking)}
            accessibilityLabel="View booking details"
          >
            Details
          </Button>
          {booking.status === 'pending' && (
            <Button 
              mode="contained" 
              style={styles.bookingConfirmButton}
              labelStyle={styles.bookingConfirmButtonText}
              onPress={() => onConfirmAttendance && onConfirmAttendance(booking)}
              accessibilityLabel="Confirm attendance for this booking"
            >
              Confirm
            </Button>
          )}
          {booking.status === 'confirmed' && (
            <Button 
              mode="contained" 
              style={styles.bookingPrimaryButton}
              labelStyle={styles.bookingPrimaryButtonText}
              onPress={onMessage}
              accessibilityLabel="Send message to family"
            >
              Message
            </Button>
          )}
        </View>
      </Card.Content>
    </Card>
  )
}

export default function CaregiverDashboard({ onLogout, route }) {
  const navigation = useNavigation()
  const { user, signOut } = useAuth()
  const isTablet = width >= 768
  const isAndroid = Platform.OS === 'android'
  const sectionHorizontalPadding = 16
  const gridGap = 16
  const columns = isTablet ? 2 : (isAndroid ? 1 : 2)
  const containerWidth = width - sectionHorizontalPadding * 1
  const gridCardWidth = Math.floor((containerWidth - gridGap * (columns - 1)) / columns)
  const gridCardHeight = isAndroid ? undefined : 280
  
  const {
    activeTab, setActiveTab,
    profile, setProfile,
    jobs, applications, setApplications, bookings,
    jobsLoading,
    loadProfile, fetchJobs, fetchApplications, fetchBookings
  } = useCaregiverDashboard();
  
  const [searchQuery, setSearchQuery] = useState("")
  const debouncedSearch = useDebounce(searchQuery, 300)
  const [editProfileModalVisible, setEditProfileModalVisible] = useState(false)
  const [profileName, setProfileName] = useState("Ana Dela Cruz")
  const [profileHourlyRate, setProfileHourlyRate] = useState("25")
  const [profileExperience, setProfileExperience] = useState("5+ years")
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [showBookingDetails, setShowBookingDetails] = useState(false)
  const [selectedJob, setSelectedJob] = useState(null)
  const [showJobApplication, setShowJobApplication] = useState(false)
  const [showJobDetails, setShowJobDetails] = useState(false)
  const [selectedApplication, setSelectedApplication] = useState(null)
  const [showApplicationDetails, setShowApplicationDetails] = useState(false)
  const [applicationSubmitting, setApplicationSubmitting] = useState(false)
  const [applicationForm, setApplicationForm] = useState({ coverLetter: '', proposedRate: '' })

  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' })
  const showToast = (message, type = 'success') => setToast({ visible: true, message, type })
  
  const { pendingRequests, notifications } = usePrivacy();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [imageRefreshKey, setImageRefreshKey] = useState(0);

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

  // Remove duplicate focus effect since it's handled in the hook
  // useFocusEffect(
  //   useCallback(() => {
  //     console.log('🔄 CaregiverDashboard focused - loading profile');
  //     loadProfile();
  //   }, [loadProfile])
  // );

  useEffect(() => {
    if (route?.params?.refreshProfile) {
      console.log('🔄 CaregiverDashboard - Force refresh triggered by route params');
      loadProfile();
      // Clear the param without causing re-render
      setTimeout(() => {
        navigation.setParams({ refreshProfile: undefined });
      }, 100);
    }
  }, [route?.params?.refreshProfile]);

  const refreshApplications = fetchApplications;

  const handleJobApplication = (job) => {
    setSelectedJob(job)
    setApplicationForm({ coverLetter: '', proposedRate: '' })
    setShowJobApplication(true)
  }

  const handleViewJob = (job) => {
    setSelectedJob(job)
    setShowJobDetails(true)
  }

  const handleViewApplication = (application) => {
    setSelectedApplication(application)
    setShowApplicationDetails(true)
  }

  const handleMessageFamily = (application) => {
    setShowApplicationDetails(false)
    try { navigation.navigate('Messages') } catch (error) {
      console.warn('Navigation error:', error);
    }
  }

  const handleConfirmAttendance = async (booking) => {
    try {
      const response = await apiService.bookings.updateStatus(
        booking.id, 
        'confirmed', 
        'Caregiver confirmed attendance'
      );
      
      if (response.success) {
        showToast('Attendance confirmed successfully!', 'success');
        fetchBookings(); // Refresh bookings list
      } else {
        throw new Error(response.error || 'Failed to confirm attendance');
      }
    } catch (error) {
      console.error('Confirm attendance failed:', error);
      showToast('Failed to confirm attendance. Please try again.', 'error');
    }
  }

  const handleApplicationSubmit = async ({ jobId, jobTitle, family, coverLetter, proposedRate }) => {
    if (applications.some(app => app.jobId === jobId)) {
      showToast('You have already applied to this job', 'error');
      return;
    }
    
    const matchedJob = jobs.find((j) => j.id === jobId)
    
    try {
      setApplicationSubmitting(true)
      
      console.log('Submitting application with jobId:', jobId);
      const response = await apiService.applications.apply({ 
        jobId: jobId, 
        coverLetter: coverLetter || '',
        proposedRate: proposedRate ? Number(proposedRate) : undefined,
        message: coverLetter || ''
      })
      
      if (response.success) {
        const newApplication = {
          id: response.data._id || Date.now(),
          jobId,
          jobTitle,
          family,
          status: "pending",
          appliedDate: new Date().toISOString(),
          hourlyRate: proposedRate || (matchedJob ? matchedJob.hourlyRate : undefined)
        }
        
        // Add to local state immediately for instant UI update
        setApplications(prev => [newApplication, ...prev]);
        
        // Refresh from server to get latest data
        setTimeout(() => {
          fetchApplications();
        }, 500);
        

        
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

  const handleSaveProfile = async () => {
    try {
      console.log('💾 Saving profile from dashboard...');
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
      
      console.log('💾 Dashboard payload:', payload);
      
      if (isCaregiver) {
        try {
          const response = await apiService.caregivers.updateProfile(payload)
          console.log('💾 Dashboard update response:', response);
        } catch (e) {
          const status = e?.response?.status
          if (status === 404) {
            await apiService.caregivers.createProfile(payload)
          } else {
            throw e
          }
        }
      } else {
        await apiService.auth.updateProfile({ name: payload.name })
      }
      
      await loadProfile()
      
      showToast('Profile changes saved.', 'success')
      setEditProfileModalVisible(false)
    } catch (e) {
      console.error('💾 Save profile failed:', e?.message || e)
      Alert.alert('Save failed', e?.message || 'Could not save profile. Please try again.')
    }
  }

  const renderEditProfileModal = () => (
    <ModalWrapper 
      visible={editProfileModalVisible} 
      onClose={() => setEditProfileModalVisible(false)}
    >
      <SharedCard style={styles.editProfileModal}>
          <Text style={styles.editProfileTitle}>Quick Edit Profile</Text>
          <Text style={styles.editProfileSubtitle}>For full profile editing, use the Complete Profile button</Text>
          <FormInput
            label="Name"
            value={profileName}
            onChangeText={setProfileName}
          />
          <FormInput
            label="Hourly Rate (₱)"
            value={profileHourlyRate}
            onChangeText={setProfileHourlyRate}
            keyboardType="numeric"
          />
          <FormInput
            label="Experience (months)"
            value={profileExperience}
            onChangeText={setProfileExperience}
            keyboardType="numeric"
          />
          <SharedButton
            title="Save Changes"
            onPress={handleSaveProfile}
            style={{ marginBottom: 8 }}
          />
          <SharedButton
            title="Cancel"
            variant="secondary"
            onPress={() => setEditProfileModalVisible(false)}
          />
      </SharedCard>
    </ModalWrapper>
  )

  const renderToast = () => (
    <Toast
      visible={toast.visible}
      message={toast.message}
      type={toast.type}
      onHide={() => setToast((t) => ({ ...t, visible: false }))}
    />
  )

  const renderHeader = () => {
    const { unreadCount } = useMessaging();
    
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
              
              <Pressable 
                style={styles.headerButton} 
                onPress={() => {
                  try {
                    navigation.navigate('CaregiverProfileComplete', { 
                      profile: profile 
                    });
                  } catch (error) {
                    console.error('Profile navigation error:', error);
                    Alert.alert('Navigation Error', 'Failed to open profile. Please try again.');
                  }
                }}
              >
                <Ionicons name="person-outline" size={22} color="#FFFFFF" />
              </Pressable>
              
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
            if (tab.id === 'jobs') {
              fetchJobs()
            } else if (tab.id === 'applications') {
              fetchApplications()
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
  );

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
        
        {__DEV__ && debouncedSearch && (
          <Text style={{ padding: 8, fontSize: 12, color: '#666' }}>Searching: {debouncedSearch}</Text>
        )}

        {activeTab === "dashboard" && (
          <ScrollView style={styles.content}>
            <CaregiverProfileSection profile={profile} activeTab={activeTab} />

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

            <View style={styles.actionGrid}>
              <QuickAction
                icon="search"
                label="Find Jobs"
                gradientColors={["#3B82F6", "#2563EB"]}
                onPress={() => {
                  setActiveTab('jobs')
                  fetchJobs()
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
                    onPress={() => {
                      try {
                        navigation.navigate('EnhancedCaregiverProfileWizard', { isEdit: true, existingProfile: profile });
                      } catch (error) {
                        console.error('Navigation error:', error);
                        Alert.alert('Navigation Error', 'Failed to open profile wizard. Please try again.');
                      }
                    }}
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
                  contentContainerStyle={{ paddingLeft: 2, paddingRight: 2 }}
                >
                  {(jobs || []).slice(0, 3).map((job, index) => (
                    <JobCard
                      key={job.id || index}
                      job={job}
                      showActions={true}
                      onApply={handleJobApplication}
                      onLearnMore={handleViewJob}
                      hasApplied={(id) => applications.some((a) => a.jobId === id)}
                      jobCardStyle={[
                        styles.jobCardHorizontal,
                        { marginRight: index === 2 ? 0 : 26 }
                      ]}
                    />
                  ))}
                </ScrollView>
              )}
            </View>



            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Upcoming Bookings</Text>
                <Pressable onPress={() => setActiveTab('bookings')}>
                  <Text style={styles.seeAllText}>See All</Text>
                </Pressable>
              </View>
              {(bookings || []).slice(0, 2).map((booking, index) => (
                <BookingCard
                  key={booking.id || index}
                  booking={booking}
                  onMessage={() => setActiveTab("messages")}
                  onViewDetails={() => {
                    setSelectedBooking(booking)
                    setShowBookingDetails(true)
                  }}
                  onConfirmAttendance={handleConfirmAttendance}
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
              ) : (() => {
                const filteredJobs = jobs.filter(job => {
                  if (!debouncedSearch) return true;
                  const searchLower = debouncedSearch.toLowerCase();
                  return (
                    job.title?.toLowerCase().includes(searchLower) ||
                    job.family?.toLowerCase().includes(searchLower) ||
                    job.location?.toLowerCase().includes(searchLower) ||
                    job.requirements?.some(req => req.toLowerCase().includes(searchLower))
                  );
                });
                
                return filteredJobs.length > 0 ? (
                  <View style={[styles.jobsGrid, columns === 1 && { flexDirection: 'column' }]}>
                    {filteredJobs.map((job, index) => (
                      <JobCard
                        key={job.id || `job-${index}`}
                        job={job}
                        showActions={true}
                        onApply={handleJobApplication}
                        onLearnMore={handleViewJob}
                        hasApplied={(id) => applications.some((a) => a.jobId === id)}
                        jobCardStyle={columns === 1 ? { width: '100%', marginBottom: 16 } : { width: gridCardWidth, marginBottom: 16, marginRight: 8 }}
                        gridMode
                      />
                    ))}
                  </View>
                ) : (
                  <EmptyState 
                    icon="briefcase" 
                    title={debouncedSearch ? "No matching jobs" : "No jobs available"}
                    subtitle={debouncedSearch ? `No jobs found for "${debouncedSearch}"` : "Please check back later or adjust your filters"}
                  />
                );
              })()}
            </View>
          </ScrollView>
        )}

        {activeTab === "applications" && (
          <ScrollView style={styles.content}>
            <View style={styles.section}>

              {applications.length > 0 ? (
                (applications || []).map((application, index) => (
                  <ApplicationCard 
                    key={application.id || index} 
                    application={application}
                    onViewDetails={handleViewApplication}
                    onMessage={handleMessageFamily}
                  />
                ))
              ) : (
                <EmptyState 
                  icon="document-text" 
                  title="No applications yet"
                  subtitle="Apply to jobs to see them here"
                />
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
                (bookings || []).map((booking, index) => (
                  <BookingCard
                    key={booking.id || index}
                    booking={booking}
                    onMessage={() => setActiveTab("messages")}
                    onViewDetails={() => {
                      setSelectedBooking(booking)
                      setShowBookingDetails(true)
                    }}
                    onConfirmAttendance={handleConfirmAttendance}
                  />
                ))
              ) : (
                <EmptyState 
                  icon="calendar" 
                  title="No bookings yet"
                  subtitle="Your upcoming bookings will appear here"
                />
              )}
            </View>
          </ScrollView>
        )}
      </View>

      {renderEditProfileModal()}

      {showBookingDetails && selectedBooking && (
        <ModalWrapper 
          visible={showBookingDetails} 
          onClose={() => setShowBookingDetails(false)}
        >
          <SharedCard style={styles.editProfileModal}>
              <Text style={styles.editProfileTitle}>{selectedBooking.family}</Text>
              <Text style={styles.profileSectionText}>Children: {selectedBooking.children}</Text>
              <Text style={styles.profileSectionText}>Date: {formatDate(selectedBooking.date)}</Text>
              <Text style={styles.profileSectionText}>Time: {selectedBooking.time}</Text>
              <Text style={styles.profileSectionText}>Location: {selectedBooking.location}</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12 }}>
                <SharedButton title="Close" variant="secondary" onPress={() => setShowBookingDetails(false)} />
              </View>
          </SharedCard>
        </ModalWrapper>
      )}

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