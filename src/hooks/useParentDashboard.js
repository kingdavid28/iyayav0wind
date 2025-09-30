import { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { apiService } from '../services';
import { useAuth } from '../contexts/AuthContext';
import { calculateAge } from '../utils/dateUtils';

export const useParentDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('home');
  const [profile, setProfile] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [caregivers, setCaregivers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load profile function
  const loadProfile = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const res = await apiService.auth.getProfile();
      console.log('👤 Profile API response:', res);

      const profileData = res?.data || res || {};
      setProfile(profileData);
    } catch (error) {
      console.error('❌ Error loading profile:', error);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Fetch jobs function
  const fetchJobs = useCallback(async () => {
    if (!user?.id || user?.role !== 'parent') return;

    try {
      setLoading(true);
      const res = await apiService.jobs.getMy();
      console.log('💼 Jobs API response:', res);

      const jobsList = res?.data?.jobs || res?.jobs || [];
      setJobs(jobsList);
    } catch (error) {
      console.error('❌ Error fetching jobs:', error);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id, user?.role]);

  // Fetch caregivers function
  const fetchCaregivers = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const res = await apiService.caregivers.getAll({ _t: Date.now(), role: 'caregiver' });
      console.log('👥 Caregivers API response:', res);

      const caregiversList = res?.data?.caregivers || res?.caregivers || [];
      setCaregivers(caregiversList);
    } catch (error) {
      console.error('❌ Error fetching caregivers:', error);
      setCaregivers([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Fetch bookings function
  const fetchBookings = useCallback(async () => {
    if (!user?.id || user?.role !== 'parent') return;

    try {
      setLoading(true);
      const res = await apiService.bookings.getMy();
      console.log('📅 Bookings API response:', res);

      const bookingsList = res?.data?.bookings || res?.bookings || [];
      setBookings(bookingsList);
    } catch (error) {
      console.error('❌ Error fetching bookings:', error);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id, user?.role]);

  // Fetch children function
  const fetchChildren = useCallback(async () => {
    if (!user?.id || user?.role !== 'parent') return;

    try {
      setLoading(true);
      const res = await apiService.children.getMy();
      console.log('👶 Children API response:', res);

      const list = res?.data?.children || res?.children || [];

      const normalized = list.map((child, idx) => {
        const birthDate = child.birthDate || child.dateOfBirth || null;
        const derivedAge = calculateAge(birthDate);
        const age = typeof child.age === 'number' && child.age > 0 ? child.age : derivedAge;

        return {
          id: child._id || child.id || idx + 1,
          _id: child._id || child.id,
          name: child.name || [child.firstName, child.lastName].filter(Boolean).join(' ') || 'Child',
          firstName: child.firstName || child.name,
          lastName: child.lastName || '',
          middleInitial: child.middleInitial || '',
          age,
          calculatedAge: derivedAge,
          birthDate,
          gender: child.gender || 'Not specified',
          specialNeeds: child.specialNeeds || [],
          allergies: child.allergies || [],
          preferences: child.preferences || child.favoriteActivities || '',
          notes: child.notes || child.specialInstructions || '',
          profileImage: child.profileImage || child.avatar,
          createdAt: child.createdAt || new Date().toISOString(),
          updatedAt: child.updatedAt || new Date().toISOString(),
          isInfant: typeof age === 'number' && age < 1,
          isToddler: typeof age === 'number' && age >= 1 && age < 3,
          isPreschooler: typeof age === 'number' && age >= 3 && age < 6,
          isSchoolAged: typeof age === 'number' && age >= 6
        };
      });
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
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

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