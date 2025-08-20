import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  FlatList, 
  RefreshControl,
  SafeAreaView,
  ActivityIndicator,
  StatusBar,
  Image,
  TextInput
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { 
  Search, 
  Bell, 
  Plus, 
  Filter,
  MessageCircle,
  Home,
  User,
  Calendar,
  Clock,
  MapPin,
  Star,
  Shield,
  CheckCircle,
  Baby,
  LogOut
} from 'lucide-react-native';

// Import components
import { 
  CaregiverCard, 
  JobCard, 
  NannyCard, 
  QuickAction, 
  ChildModal, 
  ProfileModal, 
  JobPostingModal 
} from './components';
import { BookingModal } from '../../components/BookingModal';
import { LinearGradient } from 'expo-linear-gradient';

// Import local hard-coded design tokens (no global theme)
import { colors, spacing, typography, styles } from '../styles/ParentDashboard.styles';

// Import services
import { bookingsAPI, jobsAPI, providersAPI, authAPI } from '../../config/api';
import { useAuth } from '../../contexts/AuthContext';

const ParentDashboard = () => {
  const navigation = useNavigation();
  const { signOut } = useAuth();
  // State management
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [showChildModal, setShowChildModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showJobPostingModal, setShowJobPostingModal] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [caregivers, setCaregivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);

  // Local UI state for new layout
  const [searchQuery, setSearchQuery] = useState('');
  const [children, setChildren] = useState([]);
  const [bookings, setBookings] = useState([]);

  // Child form state (for add/edit)
  const [childName, setChildName] = useState('');
  const [childAge, setChildAge] = useState('');
  const [childNotes, setChildNotes] = useState('');
  const [editingChildId, setEditingChildId] = useState(null);

  // Profile form state
  const [profileName, setProfileName] = useState('');
  const [profileContact, setProfileContact] = useState('');
  const [profileLocation, setProfileLocation] = useState('');

  // Booking modal state (merged from standalone dashboard)
  const [isBookingModalVisible, setIsBookingModalVisible] = useState(false);
  const [selectedCaregiver, setSelectedCaregiver] = useState({
    id: '1',
    name: 'Sarah Johnson',
    avatar: 'https://example.com/avatar.jpg',
    rating: 4.8,
    reviews: 124,
    rate: '$18/hr',
  });
  const SAMPLE_CHILDREN = [
    {
      id: 'child-1',
      name: 'Emma',
      age: 4,
      avatar: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=200&h=200&fit=crop',
      allergies: 'Peanuts',
    },
    {
      id: 'child-2',
      name: 'Liam',
      age: 6,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop',
      allergies: '',
    },
  ];

  // Caregivers fallback (used only if backend returns none or errors)
  const SAMPLE_CAREGIVERS = [
    {
      id: 'caregiver1',
      name: 'Sarah Johnson',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop',
      rating: 4.8,
      reviewCount: 124,
      hourlyRate: 18,
      location: 'San Francisco, CA',
      specialties: ['Infant Care', 'CPR Certified']
    },
    {
      id: 'caregiver2',
      name: 'Maria Reyes',
      avatar: 'https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?w=200&h=200&fit=crop',
      rating: 4.7,
      reviewCount: 96,
      hourlyRate: 20,
      location: 'Oakland, CA',
      specialties: ['Meal Prep', 'Homework Help']
    }
  ];

  const SAMPLE_BOOKINGS = [
    {
      id: 'b1',
      caregiver: 'Sarah Johnson',
      caregiverId: 'caregiver1',
      date: 'Today',
      time: '2:00 PM - 6:00 PM',
      children: ['Emma'],
      status: 'confirmed',
      totalCost: 100,
    },
    {
      id: 'b2',
      caregiver: 'Maria Reyes',
      caregiverId: 'caregiver2',
      date: 'Tomorrow',
      time: '9:00 AM - 5:00 PM',
      children: ['Emma', 'Liam'],
      status: 'pending',
      totalCost: 176,
    },
  ];

  // Fetch jobs data
  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await jobsAPI.getMy();
      const list = res?.jobs || res?.data?.jobs || [];
      // Normalize id field to id for UI lists
      const normalized = list.map((j) => ({
        ...j,
        id: j._id || j.id,
      }));
      setJobs(normalized);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch caregivers data via backend providers API
  const fetchCaregivers = useCallback(async () => {
    try {
      const res = await providersAPI.search();
      // Response may be an array or an object with providers list
      const list = Array.isArray(res) ? res : (res?.providers || res?.data?.providers || []);
      const normalized = list.map((p) => ({
        ...p,
        id: p._id || p.id,
      }));
      if (normalized.length > 0) {
        setCaregivers(normalized);
      } else {
        setCaregivers(SAMPLE_CAREGIVERS);
      }
    } catch (error) {
      console.error('Error fetching caregivers:', error);
      // Fallback to samples on error
      setCaregivers(SAMPLE_CAREGIVERS);
    }
  }, []);

  // Handle refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchJobs();
    fetchCaregivers();
    setTimeout(() => setRefreshing(false), 1000);
  }, [fetchJobs, fetchCaregivers]);

  // Initial data fetch
  useEffect(() => {
    fetchJobs();
    fetchCaregivers();
    fetchMyChildren();
    fetchMyBookings();
  }, [fetchJobs, fetchCaregivers]);

  // Load authenticated user's children (fallback to samples)
  const fetchMyChildren = useCallback(async () => {
    try {
      const profile = await authAPI.getProfile();
      const list = profile?.children || profile?.data?.children || [];
      // Seed profile state for ProfileModal
      const pName = profile?.name || profile?.data?.name || '';
      const pContact = profile?.contact || profile?.data?.contact || '';
      const pLocation = profile?.location || profile?.data?.location || '';
      setProfileName(String(pName || ''));
      setProfileContact(String(pContact || ''));
      setProfileLocation(String(pLocation || ''));
      if (Array.isArray(list) && list.length) {
        // Normalize to expected shape
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
      // Backend not reachable or profile missing children
      setChildren(SAMPLE_CHILDREN);
    }
  }, []);

  // Persist children array to profile (best-effort)
  const persistChildren = useCallback(async (nextChildren) => {
    try {
      const payload = {
        children: nextChildren.map((c) => ({
          id: c.id,
          name: c.name,
          age: Number(c.age || 0),
          preferences: c.preferences || c.notes || '',
        })),
      };
      await authAPI.updateProfile(payload);
    } catch (e) {
      console.warn('Unable to persist children to profile, keeping local state.', e?.message || e);
    }
  }, []);

  // Open add-child modal
  const openAddChild = useCallback(() => {
    setEditingChildId(null);
    setChildName('');
    setChildAge('');
    setChildNotes('');
    setShowChildModal(true);
  }, []);

  // Open edit-child modal
  const openEditChild = useCallback((child) => {
    setEditingChildId(child.id);
    setChildName(child.name || '');
    setChildAge(String(child.age ?? ''));
    setChildNotes(child.preferences || '');
    setShowChildModal(true);
  }, []);

  // Add or save child
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
    await persistChildren(next);
  }, [childName, childAge, childNotes, editingChildId, children, persistChildren]);

  // Delete child
  const handleDeleteChild = useCallback(async (id) => {
    const next = children.filter((c) => c.id !== id);
    setChildren(next);
    await persistChildren(next);
  }, [children, persistChildren]);

  // Load authenticated user's bookings (fallback to samples)
  const fetchMyBookings = useCallback(async () => {
    try {
      const res = await bookingsAPI.getMy();
      const list = res?.bookings || res?.data?.bookings || (Array.isArray(res) ? res : []);
      if (Array.isArray(list) && list.length) {
        const normalized = list.map((b) => ({
          id: b._id || b.id || String(Math.random()),
          caregiver: b.caregiverName || b.caregiver?.name || 'Caregiver',
          caregiverId: b.caregiverId || b.caregiver?._id || b.caregiver?.id || 'unknown',
          date: b.date || b.startDate || '',
          time: b.time || (b.startTime && b.endTime ? `${b.startTime} - ${b.endTime}` : ''),
          children: Array.isArray(b.children) ? b.children.map((c) => c.name || c) : [],
          status: b.status || 'pending',
          totalCost: b.totalCost ?? b.amount ?? 0,
        }));
        setBookings(normalized);
      } else {
        setBookings(SAMPLE_BOOKINGS);
      }
    } catch (err) {
      setBookings(SAMPLE_BOOKINGS);
    }
  }, []);

  // Quick actions data
  const quickActions = [
    { id: 'find', icon: 'search', title: 'Find Caregiver', onPress: () => setActiveTab('search') },
    { id: 'book', icon: 'calendar', title: 'Book Service', onPress: () => {
        // Use real caregiver if available, otherwise fallback to mock
        if (caregivers && caregivers.length > 0) {
          const cg = caregivers[0];
          setSelectedCaregiver({
            id: cg.id,
            name: cg.name,
            avatar: cg.avatar,
            rating: cg.rating,
            reviews: cg.reviewCount,
            rate: cg.hourlyRate ? `$${cg.hourlyRate}/hr` : undefined,
          });
        } else {
          setSelectedCaregiver({ id: '1', name: 'Sarah Johnson', avatar: 'https://example.com/avatar.jpg', rating: 4.8, reviews: 124, rate: '$18/hr' });
        }
        setIsBookingModalVisible(true);
      }
    },
    { id: 'messages', icon: 'message-circle', title: 'Messages', onPress: () => navigation.navigate('Messages') },
    { id: 'add-child', icon: 'plus', title: 'Add Child', onPress: openAddChild },
  ];

  // Booking confirmation handler (posts to backend and navigates)
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
      status: bookingData.status || 'pending_payment',
    };

    try {
      const res = await bookingsAPI.create(payload);
      const createdId = res?.booking?._id || res?.booking?.id || res?.id || null;
      navigation.navigate('Bookings', { createdBookingId: createdId });
      return res;
    } catch (err) {
      // Propagate so modal can show inline error
      throw err;
    }
  };

  // Header (brand + badge + actions)
  const renderHeader = () => (
    <View style={[styles.header]}>
      <LinearGradient
        colors={["#FDE2F3", "#E5E1FF"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12 }}
      >
        <View style={styles.headerTop}>
          <View style={styles.logoContainer}>
            {/* Replace with your brand Image if available */}
            {/* <Image source={iYayaLogoBrand} style={styles.logoImage} /> */}
            <Text style={styles.logoText}>iYaya</Text>
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>I am a Parent</Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerButton} onPress={() => navigation.navigate('Messages')}>
              <MessageCircle size={22} color={colors.textInverse} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton} onPress={() => setShowProfileModal(true)}>
              <User size={22} color={colors.textInverse} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton} onPress={signOut}>
              <LogOut size={22} color={colors.textInverse} />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </View>
  );

  // Welcome card
  const renderWelcome = () => (
    <View style={[styles.welcomeCard, { backgroundColor: colors.secondaryLight }]}> 
      <Text style={styles.welcomeTitle}>Welcome back! 👋</Text>
      <Text style={styles.welcomeSubtitle}>Let's find the perfect caregiver for your little ones.</Text>
    </View>
  );

  // Render quick actions (grid)
  const renderQuickActions = () => {
    const styleFor = (id) => {
      switch (id) {
        case 'find':
          return { bg: '#FFF1F7', border: '#FBCFE8', icon: '#EC4899' };
        case 'book':
          return { bg: '#EFF6FF', border: '#BFDBFE', icon: '#3B82F6' };
        case 'messages':
          return { bg: '#F5F3FF', border: '#DDD6FE', icon: '#8B5CF6' };
        case 'add-child':
          return { bg: '#ECFDF5', border: '#BBF7D0', icon: '#10B981' };
        default:
          return { bg: colors.surface, border: colors.border, icon: colors.primary };
      }
    };

    return (
      <View style={styles.quickActionsContainer}>
        {quickActions.map((action) => {
          const s = styleFor(action.id);
          return (
            <TouchableOpacity
              key={action.id}
              style={[
                styles.quickAction,
                { borderColor: s.border, backgroundColor: s.bg, borderWidth: 1, borderRadius: 16, paddingVertical: 20 }
              ]}
              onPress={action.onPress}
              activeOpacity={0.85}
            >
              {action.icon === 'plus' && <Plus size={28} color={s.icon} />}
              {action.icon === 'calendar' && <Calendar size={28} color={s.icon} />}
              {action.icon === 'message-circle' && <MessageCircle size={28} color={s.icon} />}
              {action.icon === 'search' && <Search size={28} color={s.icon} />}
              <Text style={[styles.quickActionText, { color: '#111827' }]}>{action.title}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  // Children section
  const renderChildrenSection = () => (
    <View style={[styles.sectionCard, { backgroundColor: colors.surface, padding: spacing.md }]}> 
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleContainer}>
          <Baby size={20} color={colors.secondary} />
          <Text style={styles.sectionTitle}>Your Children</Text>
        </View>
        <TouchableOpacity onPress={openAddChild} style={[styles.addButton, { borderColor: colors.secondary }]}>
          <Plus size={16} color={colors.secondary} />
          <Text style={[styles.addButtonText, { color: colors.secondary }]}>Add Child</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.childrenList}>
        {children.map((child) => (
          <View key={child.id} style={[styles.childCard, { backgroundColor: colors.backgroundLight }]}>
            <View style={[styles.childIcon, { backgroundColor: colors.secondaryLight }]}>
              <Baby size={24} color={colors.secondary} />
            </View>
            <View style={styles.childInfo}>
              <Text style={styles.childName}>{child.name}</Text>
              <Text style={styles.childDetails}>Age {child.age}{child.preferences ? ` • ${child.preferences}` : ''}</Text>
            </View>
            <TouchableOpacity style={styles.editButton} onPress={() => openEditChild(child)}>
              <Text style={[styles.editButtonText, { color: colors.secondary }]}>Edit</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </View>
  );

  // Upcoming bookings section
  const renderBookingsSection = () => (
    <View style={[styles.sectionCard, { backgroundColor: colors.surface, padding: spacing.md }]}> 
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleContainer}>
          <Clock size={20} color={colors.info} />
          <Text style={styles.sectionTitle}>Upcoming Bookings</Text>
        </View>
      </View>
      <View style={styles.bookingsList}>
        {bookings.map((b) => (
          <View key={b.id} style={[styles.bookingCard, { backgroundColor: colors.backgroundLight }]}>
            <View style={styles.bookingInfo}>
              <Text style={styles.bookingCaregiver}>{b.caregiver}</Text>
              <Text style={styles.bookingTime}>{b.date} • {b.time}</Text>
              <Text style={styles.bookingChildren}>Children: {b.children.join(', ')}</Text>
            </View>
            <View style={[styles.bookingStatus, { 
              backgroundColor: b.status === 'confirmed' ? '#dcfce7' : '#e0e7ff',
              borderColor: b.status === 'confirmed' ? colors.success : '#2563eb'
            }]}>
              <Text style={[styles.bookingStatusText, { color: b.status === 'confirmed' ? colors.success : '#2563eb' }]}>
                {b.status}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  // HOME tab content
  const renderHomeTab = () => (
    <View style={styles.dashboardContent}>
      {renderWelcome()}
      {renderQuickActions()}
      {renderChildrenSection()}
      {renderBookingsSection()}
    </View>
  );

  // SEARCH tab
  const renderSearchTab = () => (
    <View style={styles.caregiversContent}>
      <View style={styles.searchHeader}>
        <Text style={styles.searchTitle}>Find Caregivers</Text>
        <TouchableOpacity style={[styles.filterButton, { borderColor: colors.secondary }]}
        >
          <Filter size={16} color={colors.secondary} />
          <Text style={[styles.filterButtonText, { color: colors.secondary }]}>Filters</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.searchBar}>
        <Search size={18} color={colors.textTertiary} />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search by location, name, or specialty..."
          placeholderTextColor={colors.textTertiary}
          style={[styles.searchInput, { padding: 12 }]}
        />
      </View>
      {(() => {
        const q = (searchQuery || '').toLowerCase();
        const filtered = caregivers.filter((cg) => {
          if (!q) return true;
          const name = String(cg.name || '').toLowerCase();
          const location = String(cg.location || '').toLowerCase();
          const specialties = Array.isArray(cg.specialties) ? cg.specialties.join(' ').toLowerCase() : '';
          return name.includes(q) || location.includes(q) || specialties.includes(q);
        });
        return filtered.length > 0 ? (
        <FlatList
          data={filtered}
          renderItem={({ item }) => (
            <CaregiverCard
              caregiver={item}
              onBookPress={(cg) => {
                setSelectedCaregiver({
                  id: cg.id,
                  name: cg.name,
                  avatar: cg.avatar,
                  rating: cg.rating,
                  reviews: cg.reviewCount,
                  rate: cg.hourlyRate ? `$${cg.hourlyRate}/hr` : undefined,
                });
                setIsBookingModalVisible(true);
              }}
              onMessagePress={(cg) => navigation.navigate('Messages', { recipientId: cg.id })}
            />
          )}
          keyExtractor={(item) => String(item.id)}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        />
        ) : (
          <View style={styles.emptySection}>
            <Text style={styles.emptySectionText}>No caregivers match your search</Text>
          </View>
        );
      })()}
    </View>
  );

  // BOOKINGS tab
  const renderBookingsTab = () => (
    <View style={styles.loadingContainer}>
      <Calendar size={64} color={colors.textTertiary} />
      <Text style={[styles.emptyStateTitle, { marginTop: spacing.md }]}>Bookings Management</Text>
      <Text style={styles.emptyStateText}>Manage your upcoming and past bookings here.</Text>
    </View>
  );

  // Top navigation tabs
  const renderTopNav = () => (
    <View style={styles.navContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.navScroll}>
        {[
          { id: 'home', label: 'Home', icon: Home },
          { id: 'search', label: 'Find Caregivers', icon: Search },
          { id: 'bookings', label: 'My Bookings', icon: Calendar },
          { id: 'messages', label: 'Messages', icon: MessageCircle },
        ].map((tab) => {
          const IconComp = tab.icon;
          const active = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              onPress={() => {
                if (tab.id === 'messages') {
                  navigation.navigate('Messages');
                } else {
                  setActiveTab(tab.id);
                }
              }}
              style={[styles.navItem, active && styles.activeNavItem]}
              activeOpacity={0.8}
            >
              <IconComp size={18} color={active ? colors.secondary : colors.textSecondary} />
              <Text style={[styles.navText, active && styles.activeNavText]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* Header */}
      {renderHeader()}

      {/* Top Navigation */}
      {renderTopNav()}

      {/* Content */}
      <View style={styles.content}>
        {activeTab === 'home' && (
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
            {renderHomeTab()}
          </ScrollView>
        )}
        {activeTab === 'search' && (
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
            {renderSearchTab()}
          </ScrollView>
        )}
        {activeTab === 'bookings' && (
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
            {renderBookingsTab()}
          </ScrollView>
        )}
        {activeTab === 'messages' && (
          <View style={{ flex: 1, padding: 16 }}>
            <Text style={styles.sectionTitle}>Messages</Text>
            <Text style={styles.emptyStateText}>Messaging screen coming soon.</Text>
          </View>
        )}
      </View>

      {/* Modals */}
      <ChildModal
        visible={showChildModal}
        onDismiss={() => setShowChildModal(false)}
        childName={childName}
        setChildName={setChildName}
        childAge={childAge}
        setChildAge={setChildAge}
        childNotes={childNotes}
        setChildNotes={setChildNotes}
        handleAddChild={handleAddOrSaveChild}
        children={children}
        handleDeleteChild={handleDeleteChild}
      />
      
      <ProfileModal
        visible={showProfileModal}
        onDismiss={() => setShowProfileModal(false)}
        profileName={profileName}
        setProfileName={setProfileName}
        profileContact={profileContact}
        setProfileContact={setProfileContact}
        profileLocation={profileLocation}
        setProfileLocation={setProfileLocation}
        handleSaveProfile={async () => {
          try {
            await authAPI.updateProfile({
              name: profileName,
              contact: profileContact,
              location: profileLocation,
            });
            setShowProfileModal(false);
          } catch (e) {
            console.warn('Failed to update profile', e?.message || e);
            setShowProfileModal(false);
          }
        }}
      />
      
      <JobPostingModal 
        visible={showJobPostingModal} 
        onClose={() => setShowJobPostingModal(false)}
        onJobPosted={fetchJobs}
      />

      {/* Booking Modal (merged) */}
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
// Screen styles are now sourced from ../styles/ParentDashboard.styles

export default ParentDashboard;
