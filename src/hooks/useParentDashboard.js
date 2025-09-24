import { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { apiService } from '../services';
import { useAuth } from '../contexts/AuthContext';
import { formatAddress } from '../utils/addressUtils';

export const useParentDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('home');
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    children: [],
    imageUrl: null
  });
  const [jobs, setJobs] = useState([]);
  const [caregivers, setCaregivers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load profile data
  const loadProfile = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const profileResponse = await apiService.auth.getProfile();
      const profileData = profileResponse?.data || profileResponse || {};
      
      if (profileData) {
        const rawAddress = profileData.address || profileData.location || '';
        const addressString = typeof rawAddress === 'string' ? rawAddress : (rawAddress.street || rawAddress.city || '');
        
        setProfile({
          name: profileData.name || profileData.displayName || '',
          email: profileData.email || '',
          phone: profileData.phone || profileData.contact || '',
          address: addressString,
          location: addressString,
          children: profileData.children || [],
          imageUrl: profileData.profileImage || profileData.avatar || null,
          ...profileData
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  }, [user?.id]);

  // Fetch jobs
  const fetchJobs = useCallback(async () => {
    if (!user?.id || user?.role !== 'parent') return;
    
    setLoading(true);
    try {
      const res = await apiService.jobs.getMy();
      const jobsList = res?.data?.jobs || res?.jobs || [];
      
      const transformedJobs = jobsList.map(job => ({
        id: job._id || job.id,
        title: job.title || 'Childcare Position',
        description: job.description || '',
        hourlyRate: job.hourlyRate || job.rate || 300,
        location: job.location || 'Cebu City',
        startDate: job.startDate,
        endDate: job.endDate,
        startTime: job.startTime,
        endTime: job.endTime,
        status: job.status || 'open',
        applications: job.applications || [],
        createdAt: job.createdAt
      }));
      
      setJobs(transformedJobs);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id, user?.role]);

  // Fetch caregivers
  const fetchCaregivers = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      // Add cache-busting parameter to ensure fresh data
      const res = await apiService.caregivers.getAll({ _t: Date.now() });
      const caregiversList = res?.data?.caregivers || res?.caregivers || [];
      
      console.log('🔍 Raw caregivers response:', {
        total: caregiversList.length,
        sample: caregiversList.slice(0, 2).map(c => ({ 
          name: c.name, 
          role: c.role || c.user?.role, 
          userType: c.userType || c.user?.userType,
          hasProfile: c.hasProfile,
          user: c.user ? { role: c.user.role, userType: c.user.userType } : null
        }))
      });
      
      // Backend returns User IDs for messaging compatibility
      const transformedCaregivers = caregiversList.map(caregiver => {
        console.log('🔍 Processing caregiver:', { id: caregiver._id, name: caregiver.name, userId: caregiver.user?._id });
        return {
          _id: caregiver._id || caregiver.id, // This is now User ID from backend
          id: caregiver._id || caregiver.id,  // This is now User ID from backend
          name: caregiver.name || 'Caregiver',
          rating: caregiver.rating || 0,
          hourlyRate: caregiver.hourlyRate || 300,
          experience: caregiver.experience || '',
          skills: caregiver.skills || [],
          location: caregiver.location || caregiver.address || '',
          avatar: caregiver.avatar || caregiver.profileImage,
          ageCareRanges: caregiver.ageCareRanges || [],
          bio: caregiver.bio || '',
          hasProfile: caregiver.hasProfile || false,
          createdAt: caregiver.createdAt || caregiver.registeredAt || new Date().toISOString(),
          registeredAt: caregiver.registeredAt || caregiver.createdAt || new Date().toISOString()
        };
      });
      
      console.log('🎯 Transformed caregivers:', {
        total: transformedCaregivers.length,
        featured: transformedCaregivers.slice(0, 3).map(c => ({ 
          name: c.name, 
          createdAt: c.createdAt,
          hasProfile: c.hasProfile 
        }))
      });
      
      setCaregivers(transformedCaregivers);
      console.log('📊 Total caregivers set for HomeTab:', transformedCaregivers.length);
    } catch (error) {
      console.error('❌ Error fetching caregivers:', error?.message || error);
      setCaregivers([]);
    }
  }, [user?.id]);

  // Fetch bookings
  const fetchBookings = useCallback(async () => {
    if (!user?.id || user?.role !== 'parent') return;

    try {
      console.log('📅 Fetching bookings for parent:', user?.id);
      const res = await apiService.bookings.getMy();
      console.log('📅 Bookings API response:', res);

      const list = Array.isArray(res?.bookings) ? res.bookings : res?.data?.bookings || [];

      const normalized = list.map((booking, idx) => ({
        id: booking._id || booking.id || idx + 1,
        _id: booking._id || booking.id,
        caregiver: booking.caregiver || booking.caregiverId,
        caregiverName: booking.caregiver?.name || booking.caregiverName || 'Caregiver',
        date: booking.date || booking.startDate || new Date().toISOString(),
        startTime: booking.startTime,
        endTime: booking.endTime,
        time: booking.time || (booking.startTime && booking.endTime ? `${booking.startTime} - ${booking.endTime}` : ''),
        status: booking.status || 'pending',
        children: booking.children || [],
        address: booking.address || booking.location,
        location: formatAddress(booking.location || booking.address),
        totalCost: booking.totalCost || booking.amount,
        hourlyRate: booking.hourlyRate || booking.rate || 300,
        createdAt: booking.createdAt || new Date().toISOString(),
        updatedAt: booking.updatedAt || new Date().toISOString()
      }));

      console.log('📅 Normalized bookings:', normalized);
      setBookings(normalized);
    } catch (error) {
      console.error('❌ Error fetching bookings:', {
        message: error?.message,
        status: error?.status,
        statusCode: error?.statusCode,
        code: error?.code,
        originalError: error?.originalError,
        stack: error?.stack
      });
      setBookings([]);
      throw error;
    }
  }, [user?.id, user?.role]);

  // Fetch children
  const fetchChildren = useCallback(async () => {
    if (!user?.id || user?.role !== 'parent') return;

    try {
      console.log('👶 Fetching children for parent:', user?.id);
      const res = await apiService.children.getMy();
      console.log('👶 Children API response:', res);

      const list = res?.data?.children || res?.children || [];

      const normalized = list.map((child, idx) => ({
        id: child._id || child.id || idx + 1,
        _id: child._id || child.id,
        name: child.name || child.firstName || 'Child',
        firstName: child.firstName || child.name,
        lastName: child.lastName || '',
        middleInitial: child.middleInitial || '',
        age: child.age || child.birthDate ? new Date().getFullYear() - new Date(child.birthDate).getFullYear() : 0,
        birthDate: child.birthDate || child.dateOfBirth,
        gender: child.gender || 'Not specified',
        specialNeeds: child.specialNeeds || [],
        allergies: child.allergies || [],
        notes: child.notes || '',
        profileImage: child.profileImage || child.avatar,
        createdAt: child.createdAt || new Date().toISOString(),
        updatedAt: child.updatedAt || new Date().toISOString()
      }));

      console.log('👶 Normalized children:', normalized);
      setChildren(normalized);
    } catch (error) {
      console.error('❌ Error fetching children:', {
        message: error?.message,
        status: error?.status,
        statusCode: error?.statusCode,
        code: error?.code,
        originalError: error?.originalError,
        stack: error?.stack
      });
      setChildren([]);
      // Re-throw to let error handler process it
      throw error;
    }
  }, [user?.id, user?.role]);

  // Load data on focus
  useFocusEffect(
    useCallback(() => {
      loadProfile();
      fetchJobs();
      fetchCaregivers();
      fetchBookings();
      fetchChildren();
    }, [loadProfile, fetchJobs, fetchCaregivers, fetchBookings, fetchChildren])
  );

  return {
    activeTab,
    setActiveTab,
    profile,
    setProfile,
    jobs,
    caregivers,
    bookings,
    children,
    loading,
    loadProfile,
    fetchJobs,
    fetchCaregivers,
    fetchBookings,
    fetchChildren
  };
};