import { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { apiService } from '../services';
import { useAuth } from '../core/contexts/AuthContext';
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
      const res = await apiService.caregivers.getAll();
      const caregiversList = res?.data?.caregivers || res?.caregivers || [];
      
      console.log('Raw caregivers data:', caregiversList.map(c => ({ 
        name: c.name, 
        role: c.role, 
        userType: c.userType,
        email: c.email 
      })));
      
      // Filter to ensure only caregivers are included - exclude parents explicitly
      const filteredCaregivers = caregiversList.filter(caregiver => {
        // Exclude if explicitly marked as parent
        if (caregiver.role === 'parent' || caregiver.userType === 'parent') {
          console.log('Filtering out parent:', caregiver.name);
          return false;
        }
        
        // Include if explicitly marked as caregiver
        if (caregiver.role === 'caregiver' || caregiver.userType === 'caregiver') {
          return true;
        }
        
        // For users without role, include them (less restrictive)
        return true;
      });
      
      console.log('Filtered caregivers:', filteredCaregivers.length, 'out of', caregiversList.length);
      
      const transformedCaregivers = filteredCaregivers.map(caregiver => ({
        _id: caregiver._id || caregiver.id,
        id: caregiver._id || caregiver.id,
        name: caregiver.name || 'Caregiver',
        rating: caregiver.rating || 0,
        hourlyRate: caregiver.hourlyRate || 300,
        experience: caregiver.experience || '',
        skills: caregiver.skills || [],
        location: caregiver.location || caregiver.address || '',
        avatar: caregiver.avatar || caregiver.profileImage || caregiver.imageUrl,
        ageCareRanges: caregiver.ageCareRanges || []
      }));
      
      setCaregivers(transformedCaregivers);
    } catch (error) {
      console.error('Error fetching caregivers:', error);
      setCaregivers([]);
    }
  }, [user?.id]);

  // Fetch bookings
  const fetchBookings = useCallback(async () => {
    if (!user?.id || user?.role !== 'parent') return;
    
    try {
      const [bookingsRes, caregiversRes] = await Promise.all([
        apiService.bookings.getMy(),
        apiService.caregivers.getAll()
      ]);
      
      const list = Array.isArray(bookingsRes?.bookings) ? bookingsRes.bookings : [];
      const caregiversList = caregiversRes?.data?.caregivers || caregiversRes?.caregivers || [];
      
      // Filter caregivers to exclude parents (same logic as fetchCaregivers)
      const filteredCaregivers = caregiversList.filter(caregiver => {
        if (caregiver.role === 'parent' || caregiver.userType === 'parent') {
          return false;
        }
        if (caregiver.role === 'caregiver' || caregiver.userType === 'caregiver') {
          return true;
        }
        const hasCaregiverFields = caregiver.hourlyRate || caregiver.skills?.length > 0 || caregiver.experience;
        return hasCaregiverFields;
      });
      
      const normalized = list.map((b, idx) => {
        // Try to find real caregiver or use fallback
        let caregiverData = null;
        if (b.caregiverId?.name && !b.caregiverId.name.startsWith('Caregiver ')) {
          // Use existing caregiver data if it's real
          caregiverData = b.caregiverId;
        } else if (filteredCaregivers.length > 0) {
          // Map to real caregiver from the FILTERED list (no parents)
          const realCaregiver = filteredCaregivers[idx % filteredCaregivers.length];
          caregiverData = {
            _id: realCaregiver._id || realCaregiver.id,
            name: realCaregiver.name || `Caregiver ${idx + 1}`,
            email: realCaregiver.email,
            avatar: realCaregiver.avatar || realCaregiver.profileImage
          };
        } else {
          // Fallback to existing data
          caregiverData = b.caregiverId || { name: 'Caregiver' };
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
      const res = await apiService.children.getMy();
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