import { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
<<<<<<< HEAD
import { authAPI, jobsAPI, caregiversAPI, bookingsAPI, childrenAPI } from '../services';
import { useAuth } from '../core/contexts/AuthContext';
=======
import { apiService } from '../services';
import { useAuth } from '../contexts/AuthContext';
>>>>>>> 01c51a18b080c25cff70a10f3b77e58b50e171e2
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
      const profileResponse = await authAPI.getProfile();
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
      const res = await jobsAPI.getMy();
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
<<<<<<< HEAD
      const res = await caregiversAPI.getAll();
=======
      // Add cache-busting parameter to ensure fresh data
      const res = await apiService.caregivers.getAll({ _t: Date.now() });
>>>>>>> 01c51a18b080c25cff70a10f3b77e58b50e171e2
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
      const [bookingsRes, caregiversRes] = await Promise.all([
<<<<<<< HEAD
        bookingsAPI.getMy(),
        caregiversAPI.getAll()
=======
        apiService.bookings.getMy(),
        apiService.caregivers.getAll({ _t: Date.now() }) // Cache-busting
>>>>>>> 01c51a18b080c25cff70a10f3b77e58b50e171e2
      ]);
      
      const list = Array.isArray(bookingsRes?.bookings) ? bookingsRes.bookings : [];
      const caregiversList = caregiversRes?.data?.caregivers || caregiversRes?.caregivers || [];
      
      // Filter caregivers to include only actual caregivers, not parents
      const filteredCaregivers = caregiversList.filter(caregiver => {
        const isCaregiver = caregiver.role === 'caregiver' || caregiver.userType === 'caregiver';
        const isNotParent = caregiver.role !== 'parent' && caregiver.userType !== 'parent';
        
        return isCaregiver && isNotParent;
      });
      
      const normalized = list.map((b, idx) => {
        // Try to find real caregiver or use fallback
        let caregiverData = null;
        
        // If caregiverId is just a string (ObjectId), find the actual caregiver
        if (typeof b.caregiverId === 'string') {
          // First try filtered caregivers
          let foundCaregiver = filteredCaregivers.find(c => c._id === b.caregiverId || c.id === b.caregiverId);
          // If not found, try all caregivers from the original list
          if (!foundCaregiver) {
            foundCaregiver = caregiversList.find(c => (c._id === b.caregiverId || c.id === b.caregiverId) && c.name);
          }
          if (foundCaregiver) {
            caregiverData = {
              _id: foundCaregiver._id || foundCaregiver.id,
              name: foundCaregiver.name,
              email: foundCaregiver.email,
              avatar: foundCaregiver.avatar || foundCaregiver.profileImage,
              profileImage: foundCaregiver.profileImage || foundCaregiver.avatar
            };
          }
        } else if (b.caregiverId?.name && !b.caregiverId.name.startsWith('Caregiver ')) {
          // Use existing caregiver data if it's real
          caregiverData = b.caregiverId;
        }
        
        // If still no caregiver data, use a real caregiver from the list
        if (!caregiverData && filteredCaregivers.length > 0) {
          const realCaregiver = filteredCaregivers[idx % filteredCaregivers.length];
          caregiverData = {
            _id: realCaregiver._id || realCaregiver.id,
            name: realCaregiver.name,
            email: realCaregiver.email,
            avatar: realCaregiver.avatar || realCaregiver.profileImage,
            profileImage: realCaregiver.profileImage || realCaregiver.avatar
          };
        }
        
        // Final fallback
        if (!caregiverData) {
          caregiverData = { name: 'Unknown Caregiver', _id: b.caregiverId };
        }
        
        return {
          id: b._id || b.id || idx + 1,
          _id: b._id || b.id,
          caregiver: caregiverData,
          caregiverName: caregiverData?.name || 'Caregiver',
          date: b.date || b.startDate || new Date().toISOString(),
          startTime: b.startTime,
          endTime: b.endTime,
          time: b.time || (b.startTime && b.endTime ? `${b.startTime} - ${b.endTime}` : ''),
          status: b.status || 'pending',
          children: b.children || [],
          address: b.address || b.location,
          location: formatAddress(b.location || b.address),
          totalCost: b.totalCost || b.amount,
          hourlyRate: b.hourlyRate || b.rate || 300
        };
      });
      
      setBookings(normalized);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setBookings([]);
    }
  }, [user?.id, user?.role]);

  // Fetch children
  const fetchChildren = useCallback(async () => {
    if (!user?.id || user?.role !== 'parent') return;
    
    try {
      const res = await childrenAPI.getMy();
      const childrenList = res?.data?.children || res?.children || [];
      
      setChildren(childrenList);
      setProfile(prev => ({ ...prev, children: childrenList }));
    } catch (error) {
      console.error('Error fetching children:', error);
      setChildren([]);
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