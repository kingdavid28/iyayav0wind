import { useState, useEffect, useCallback, useRef } from 'react';
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

  const renderCountRef = useRef(0);
  renderCountRef.current += 1;
  console.log('[useParentDashboard] render count:', renderCountRef.current);

  const loadingRef = useRef(false);
  const profileSignatureRef = useRef(null);
  const jobsSignatureRef = useRef(null);
  const caregiversSignatureRef = useRef(null);
  const bookingsSignatureRef = useRef(null);
  const childrenSignatureRef = useRef(null);

  const setLoadingSafe = useCallback((nextValue) => {
    if (loadingRef.current === nextValue) {
      console.log('[useParentDashboard] loading unchanged, skipping update:', nextValue);
      return;
    }
    loadingRef.current = nextValue;
    console.log('[useParentDashboard] loading set to:', nextValue);
    setLoading(nextValue);
  }, [setLoading]);

  const safeSetProfile = useCallback((nextProfile) => {
    const signature = JSON.stringify(nextProfile ?? null);
    if (profileSignatureRef.current === signature) {
      console.log('[useParentDashboard] profile unchanged, skipping state update');
      return;
    }
    profileSignatureRef.current = signature;
    console.log('[useParentDashboard] profile updated');
    setProfile(nextProfile);
  }, [setProfile]);

  const safeSetJobs = useCallback((nextJobs) => {
    const signature = JSON.stringify(nextJobs ?? []);
    if (jobsSignatureRef.current === signature) {
      console.log('[useParentDashboard] jobs unchanged, skipping state update');
      return;
    }
    jobsSignatureRef.current = signature;
    console.log('[useParentDashboard] jobs updated, length:', Array.isArray(nextJobs) ? nextJobs.length : 0);
    setJobs(nextJobs);
  }, [setJobs]);

  const safeSetCaregivers = useCallback((nextCaregivers) => {
    const signature = JSON.stringify(nextCaregivers ?? []);
    if (caregiversSignatureRef.current === signature) {
      console.log('[useParentDashboard] caregivers unchanged, skipping state update');
      return;
    }
    caregiversSignatureRef.current = signature;
    console.log('[useParentDashboard] caregivers updated, length:', Array.isArray(nextCaregivers) ? nextCaregivers.length : 0);
    setCaregivers(nextCaregivers);
  }, [setCaregivers]);

  const safeSetBookings = useCallback((nextBookings) => {
    const signature = JSON.stringify(nextBookings ?? []);
    if (bookingsSignatureRef.current === signature) {
      console.log('[useParentDashboard] bookings unchanged, skipping state update');
      return;
    }
    bookingsSignatureRef.current = signature;
    console.log('[useParentDashboard] bookings updated, length:', Array.isArray(nextBookings) ? nextBookings.length : 0);
    setBookings(nextBookings);
  }, [setBookings]);

  const safeSetChildren = useCallback((nextChildren) => {
    const signature = JSON.stringify(nextChildren ?? []);
    if (childrenSignatureRef.current === signature) {
      console.log('[useParentDashboard] children unchanged, skipping state update');
      return;
    }
    childrenSignatureRef.current = signature;
    console.log('[useParentDashboard] children updated, length:', Array.isArray(nextChildren) ? nextChildren.length : 0);
    setChildren(nextChildren);
  }, [setChildren]);

  // Load profile function
  const loadProfile = useCallback(async () => {
    if (!user?.id) {
      console.log('[useParentDashboard] loadProfile skipped - missing user id');
      return;
    }

    try {
      setLoadingSafe(true);
      console.log('[useParentDashboard] loadProfile start for user:', user.id);
      const res = await apiService.auth.getProfile();
      console.log('👤 Profile API response:', res);

      const profileData = res?.data || res || {};
      safeSetProfile(profileData);
    } catch (error) {
      console.error('❌ Error loading profile:', error);
      safeSetProfile(null);
    } finally {
      setLoadingSafe(false);
      console.log('[useParentDashboard] loadProfile complete');
    }
  }, [user?.id, setLoadingSafe, safeSetProfile]);

  // Fetch jobs function
  const fetchJobs = useCallback(async () => {
    if (!user?.id || user?.role !== 'parent') {
      console.log('[useParentDashboard] fetchJobs skipped - invalid user context');
      return;
    }

    try {
      setLoadingSafe(true);
      console.log('[useParentDashboard] fetchJobs start');
      const res = await apiService.jobs.getMy();
      console.log('💼 Jobs API response:', res);

      const jobsList = res?.data?.jobs || res?.jobs || [];
      safeSetJobs(jobsList);
    } catch (error) {
      console.error('❌ Error fetching jobs:', error);
      safeSetJobs([]);
    } finally {
      setLoadingSafe(false);
      console.log('[useParentDashboard] fetchJobs complete');
    }
  }, [user?.id, user?.role, setLoadingSafe, safeSetJobs]);

  // Fetch caregivers function
  const fetchCaregivers = useCallback(async () => {
    if (!user?.id) {
      console.log('[useParentDashboard] fetchCaregivers skipped - missing user id');
      return;
    }

    try {
      setLoadingSafe(true);
      console.log('[useParentDashboard] fetchCaregivers start');
      const res = await apiService.caregivers.getAll({ _t: Date.now(), role: 'caregiver' });
      console.log('👥 Caregivers API response:', res);

      const caregiversList = res?.data?.caregivers || res?.caregivers || [];
      safeSetCaregivers(caregiversList);
    } catch (error) {
      console.error('❌ Error fetching caregivers:', error);
      safeSetCaregivers([]);
    } finally {
      setLoadingSafe(false);
      console.log('[useParentDashboard] fetchCaregivers complete');
    }
  }, [user?.id, setLoadingSafe, safeSetCaregivers]);

  // Fetch bookings function
    // Fetch bookings function
    const fetchBookings = useCallback(async () => {
      if (!user?.id || user?.role !== 'parent') {
        console.log('[useParentDashboard] fetchBookings skipped - invalid user context');
        return;
      }
  
      try {
        setLoadingSafe(true);
        console.log('[useParentDashboard] fetchBookings start');
        const res = await apiService.bookings.getMy();
        console.log('📅 Bookings API response:', res);
  
        const bookingsList = res?.data?.bookings || res?.bookings || [];
        safeSetBookings(bookingsList);
      } catch (error) {
        console.error('❌ Error fetching bookings:', error);
        safeSetBookings([]);
      } finally {
        setLoadingSafe(false);
        console.log('[useParentDashboard] fetchBookings complete');
      }
    }, [user?.id, user?.role, setLoadingSafe, safeSetBookings]);

  // Fetch children function
  const fetchChildren = useCallback(async () => {
    if (!user?.id || user?.role !== 'parent') {
      console.log('[useParentDashboard] fetchChildren skipped - invalid user context');
      return;
    }

    try {
      setLoadingSafe(true);
      console.log('[useParentDashboard] fetchChildren start');
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
      safeSetChildren(normalized);
    } catch (error) {
      console.error('❌ Error fetching children:', {
        message: error?.message,
        status: error?.status,
        statusCode: error?.statusCode,
        code: error?.code,
        originalError: error?.originalError,
        stack: error?.stack
      });
      safeSetChildren([]);
      throw error;
    } finally {
      setLoadingSafe(false);
      console.log('[useParentDashboard] fetchChildren complete');
    }
  }, [user?.id, user?.role, setLoadingSafe, safeSetChildren]);

  // Load data on focus
  useFocusEffect(
    useCallback(() => {
      console.log('[useParentDashboard] focus effect triggered');
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