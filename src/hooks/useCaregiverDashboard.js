import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { apiService } from '../services';
import { useAuth } from '../contexts/AuthContext';
import { formatAddress } from '../utils/addressUtils';

export const useCaregiverDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    rating: 0,
    reviews: 0,
    hourlyRate: 0,
    experience: '',
    bio: '',
    location: '',
    skills: [],
    ageCareRanges: [],
    certifications: [],
    completedJobs: 0,
    responseRate: '0%',
    profileImage: null,
    imageUrl: null,
    image: null,
    verification: null
  });
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const loadingRef = useRef(false);
  const isCaregiver = useMemo(() => String(user?.role || '').toLowerCase() === 'caregiver', [user?.role]);

  // Load profile data with caching
  const loadProfile = useCallback(async () => {
    if (!user?.id || loadingRef.current || !isCaregiver) return;

    try {
      loadingRef.current = true;
      console.log('🔄 Loading enhanced profile data...');

      // Retry with token refresh
      let caregiverResponse;
      try {
        caregiverResponse = await apiService.caregivers.getProfile();
      } catch (error) {
        console.log('🔍 API Error details:', error);
        if (error?.code === 'INVALID_TOKEN' || error?.response?.data?.code === 'INVALID_TOKEN' || error?.originalError?.code === 'INVALID_TOKEN' || error?.retryable) {
          console.log('🔄 Token invalid, refreshing and retrying...');
          const { firebaseAuthService } = await import('../services/firebaseAuthService');
          const currentUser = firebaseAuthService.getCurrentUser();
          if (currentUser) {
            const newToken = await currentUser.getIdToken(true);
            console.log('🔑 New token obtained:', newToken ? 'Yes' : 'No');
          }
          console.log('🔄 Retrying API call...');
          caregiverResponse = await apiService.caregivers.getProfile();
          console.log('✅ Retry successful');
        } else {
          throw error;
        }
      }
      const caregiverProfile = caregiverResponse?.caregiver || caregiverResponse?.data?.caregiver || caregiverResponse || {};

      if (caregiverProfile && Object.keys(caregiverProfile).length > 0) {
        setProfile(prev => ({
          ...prev,
          name: caregiverProfile.name || user?.name || prev.name,
          email: caregiverProfile.email || user?.email || prev.email,
          phone: caregiverProfile.phone || user?.phone || prev.phone,
          location:
            caregiverProfile.location ||
            (caregiverProfile.address
              ? `${caregiverProfile.address.city || ''}${
                  caregiverProfile.address.city && caregiverProfile.address.province
                    ? ', '
                    : ''
                }${caregiverProfile.address.province || ''}`
              : user?.location || prev.location),
          address: caregiverProfile.address || prev.address,
          profileImage: caregiverProfile.profileImage || user?.profileImage || prev.profileImage,
          hourlyRate: caregiverProfile.hourlyRate || caregiverProfile.rate || prev.hourlyRate,
          experience: caregiverProfile.experience || prev.experience,
          bio: caregiverProfile.bio || prev.bio,
          skills: caregiverProfile.skills || prev.skills || [],
          ageCareRanges: caregiverProfile.ageCareRanges || prev.ageCareRanges || [],
          certifications: caregiverProfile.certifications || prev.certifications || [],
          availability: caregiverProfile.availability || prev.availability,
          rating: caregiverProfile.rating || prev.rating,
          reviews: caregiverProfile.reviewCount || prev.reviews,
          completedJobs: caregiverProfile.completedJobs || prev.completedJobs,
          responseRate: caregiverProfile.responseRate || prev.responseRate,
        }));
        console.log('✅ Profile updated from API');
      }
    } catch (error) {
      console.error('❌ Error loading profile:', error?.message || error);
    } finally {
      loadingRef.current = false;
    }
  }, [user?.id, isCaregiver]);

  // Fetch jobs
  const fetchJobs = useCallback(async () => {
    if (!user?.id || !isCaregiver) {
      setJobs([]);
      setJobsLoading(false);
      return;
    }

    setJobsLoading(true);
    try {
      const res = await apiService.jobs.getAvailable();
      const jobsList = res?.data?.jobs || res?.jobs || [];

      console.log('🧾 Jobs API response:', {
        total: Array.isArray(jobsList) ? jobsList.length : 0,
        sample: jobsList.slice(0, 2).map(job => ({
          id: job?._id || job?.id,
          title: job?.title,
          rate: job?.hourlyRate || job?.rate,
          location: job?.location,
        })),
        rawKeys: res ? Object.keys(res) : null,
      });

      const transformedJobs = jobsList.map(job => ({
        id: job._id || job.id,
        title: job.title || 'Childcare Position',
        family: job.clientName || job.employerName || 'Family',
        location: job.location || 'Cebu City',
        distance: '2-5 km away',
        hourlyRate: job.hourlyRate || job.rate || 300,
        schedule: job.startTime && job.endTime ? `${job.startTime} - ${job.endTime}` : 'Flexible hours',
        requirements: Array.isArray(job.requirements) ? job.requirements : ['Experience with children'],
        postedDate: 'Recently posted',
        urgent: job.urgent || false,
        children: job.numberOfChildren || 1,
        ages: job.childrenAges || 'Various ages',
        description: job.description || ''
      }));

      console.log('🧮 Transformed jobs count:', transformedJobs.length);
      setJobs(transformedJobs);
    } catch (error) {
      console.error('Error fetching jobs:', {
        message: error?.message,
        status: error?.status,
        statusCode: error?.statusCode,
        code: error?.code,
        originalError: error?.originalError,
        stack: error?.stack
      });
      setJobs([]);
      throw error;
    } finally {
      setJobsLoading(false);
    }
  }, [user?.id, isCaregiver]);

  // Fetch applications
  const fetchApplications = useCallback(async () => {
    if (!user?.id || !isCaregiver) {
      setApplications([]);
      return;
    }

    try {
      console.log('📋 Fetching applications for caregiver:', user?.id);
      const res = await apiService.applications.getMy();
      console.log('📋 Applications API response:', res);

      const list = res?.data?.applications || res?.applications || [];
      console.log('📋 Applications count:', list.length);

      const normalized = list.map(a => ({
        id: a._id || a.id || Date.now(),
        jobId: a.jobId?._id || a.jobId,
        jobTitle: a.jobId?.title || a.jobId?.name || 'Childcare Position',
        employerName: a.jobId?.clientName || a.jobId?.clientId?.name || 'Family',
        parentId: a.parentId || a.jobId?.clientId?._id || a.jobId?.clientId,
        family: a.jobId?.clientName || a.jobId?.clientId?.name || 'Family',
        status: a.status || 'pending',
        appliedDate: a.createdAt || new Date().toISOString(),
        hourlyRate: a.proposedRate || a.jobId?.hourlyRate || 200,
        location: a.jobId?.location || 'Location not specified',
        jobDate: a.jobId?.date || new Date().toISOString(),
        message: a.message || a.coverLetter || ''
      }));

      console.log('📋 Normalized applications:', normalized);
      setApplications(normalized);
    } catch (error) {
      console.error('Error fetching applications:', {
        message: error?.message,
        status: error?.status,
        statusCode: error?.statusCode,
        code: error?.code,
        originalError: error?.originalError,
        stack: error?.stack
      });
      setApplications([]);
      throw error;
    }
  }, [user?.id, isCaregiver]);

  // Fetch bookings
  const fetchBookings = useCallback(async () => {
    console.log('📅 fetchBookings called with user:', { id: user?.id, role: user?.role });
    if (!user?.id || !isCaregiver) {
      console.log('🚫 Skipping bookings - not caregiver');
      setBookings([]);
      return;
    }

    try {
      console.log('📅 Fetching bookings for caregiver:', user?.id);
      const res = await apiService.bookings.getMy();
      const list =
        res?.data?.bookings ||
        res?.bookings ||
        [];
      console.log('📅 Bookings count:', list.length);

      if (list.length === 0) {
        console.log('📅 No bookings found in database for caregiver:', user?.id);
      }

      const normalized = list.map((b, idx) => ({
        id: b._id || b.id || idx + 1,
        family: b.clientId?.name || b.family || b.customerName || 'Family',
        caregiver: b.caregiver?.name || b.caregiverId?.name || 'Caregiver',
        clientId: b.clientId,
        parentId: b.clientId?._id || b.clientId || b.parentId || b.userId,
        date: b.date || b.startDate || new Date().toISOString(),
        time: b.time || (b.startTime && b.endTime ? `${b.startTime} - ${b.endTime}` : ''),
        status: b.status || 'pending',
        children: Array.isArray(b.children) ? b.children.length : (b.children || 0),
        location: formatAddress(b.location || b.address)
      }));

      console.log('📅 Normalized bookings:', normalized);
      setBookings(normalized);
    } catch (error) {
      console.error('❌ Error fetching bookings:', error);
      setBookings([]);
    }
  }, [user?.id, isCaregiver]);

  // Load data only once on mount
  useEffect(() => {
    if (!dataLoaded && user?.id && isCaregiver) {
      Promise.all([
        loadProfile(),
        fetchJobs(),
        fetchApplications(),
        fetchBookings()
      ]).finally(() => setDataLoaded(true));
    }
  }, [user?.id, dataLoaded, isCaregiver, loadProfile, fetchJobs, fetchApplications, fetchBookings]);

  // Refresh data when tabs become active
  useEffect(() => {
    if (!user?.id || !isCaregiver) {
      return;
    }

    if (activeTab === 'jobs') {
      fetchJobs();
    }
    if (activeTab === 'bookings') {
      fetchBookings();
    }
    if (activeTab === 'applications') {
      fetchApplications();
    }
  }, [activeTab, fetchJobs, fetchBookings, fetchApplications, user?.id, isCaregiver]);

  return {
    activeTab,
    setActiveTab,
    profile,
    setProfile,
    jobs,
    applications,
    setApplications,
    bookings,
    jobsLoading,
    loadProfile,
    fetchJobs,
    fetchApplications,
    fetchBookings,
    dataLoaded
  };
};