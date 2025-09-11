import { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { applicationsAPI, bookingsAPI, caregiversAPI, jobsAPI } from '../config/api';
import { useAuth } from '../contexts/AuthContext';
import { formatAddress } from '../utils/addressUtils';

export const useCaregiverDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [profile, setProfile] = useState({
    name: '',
    rating: 0,
    reviews: 0,
    hourlyRate: 0,
    experience: '',
    completedJobs: 0,
    responseRate: '0%',
    imageUrl: null
  });
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(false);

  // Load profile data
  const loadProfile = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const caregiverResponse = await caregiversAPI.getMyProfile();
      const caregiverProfile = caregiverResponse?.caregiver || caregiverResponse?.data?.caregiver || caregiverResponse || {};
      
      if (caregiverProfile && (caregiverProfile.name || caregiverProfile.hourlyRate)) {
        setProfile(prev => ({
          ...prev,
          name: caregiverProfile.name || prev.name,
          hourlyRate: caregiverProfile.hourlyRate || prev.hourlyRate,
          experience: caregiverProfile.experience || prev.experience,
          rating: caregiverProfile.rating || prev.rating,
          reviews: caregiverProfile.reviewCount || prev.reviews,
          imageUrl: caregiverProfile.profileImage || prev.imageUrl
        }));
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  }, [user?.id]);

  // Fetch jobs
  const fetchJobs = useCallback(async () => {
    if (!user?.id || user?.role !== 'caregiver') return;
    
    setJobsLoading(true);
    try {
      const res = await jobsAPI.getAvailableJobs();
      const jobsList = res?.data?.jobs || res?.jobs || [];
      
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
      
      setJobs(transformedJobs);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setJobs([]);
    } finally {
      setJobsLoading(false);
    }
  }, [user?.id, user?.role]);

  // Fetch applications
  const fetchApplications = useCallback(async () => {
    if (!user?.id || user?.role !== 'caregiver') return;
    
    try {
      const res = await applicationsAPI.getMyApplications();
      const list = res?.data?.applications || res?.applications || [];
      
      const normalized = list.map(a => ({
        id: a._id || a.id || Date.now(),
        jobId: a.jobId?._id || a.jobId,
        jobTitle: a.jobId?.title || 'Job Application',
        family: a.jobId?.parentId?.name || 'Family',
        status: a.status || 'pending',
        appliedDate: a.createdAt || new Date().toISOString(),
        hourlyRate: a.proposedRate || a.jobId?.rate || undefined
      }));
      
      setApplications(normalized);
    } catch (error) {
      console.error('Error fetching applications:', error);
      setApplications([]);
    }
  }, [user?.id, user?.role]);

  // Fetch bookings
  const fetchBookings = useCallback(async () => {
    if (!user?.id || user?.role !== 'caregiver') return;
    
    try {
      const res = await bookingsAPI.getMy();
      const list = Array.isArray(res?.bookings) ? res.bookings : [];
      
      const normalized = list.map((b, idx) => ({
        id: b._id || b.id || idx + 1,
        family: b.family || b.customerName || 'Family',
        date: b.date || b.startDate || new Date().toISOString(),
        time: b.time || (b.startTime && b.endTime ? `${b.startTime} - ${b.endTime}` : ''),
        status: b.status || 'pending',
        children: Array.isArray(b.children) ? b.children.length : (b.children || 0),
        location: formatAddress(b.location || b.address)
      }));
      
      setBookings(normalized);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setBookings([]);
    }
  }, [user?.id, user?.role]);

  // Load data on focus
  useFocusEffect(
    useCallback(() => {
      loadProfile();
      fetchJobs();
      fetchApplications();
      fetchBookings();
    }, [loadProfile, fetchJobs, fetchApplications, fetchBookings])
  );

  return {
    activeTab,
    setActiveTab,
    profile,
    setProfile,
    jobs,
    applications,
    bookings,
    jobsLoading,
    loadProfile,
    fetchJobs,
    fetchApplications,
    fetchBookings
  };
};