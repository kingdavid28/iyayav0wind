import { formatTimeRange, buildSchedule } from './utils/dateUtils';
import { bookingsAPI } from '../../config/api';

// Moved from caregiverUtils.js to fix import issues
export const getCaregiverDisplayName = (bookingOrCaregiver) => {
  try {
    // If no booking or caregiver data is provided
    if (!bookingOrCaregiver) return 'No caregiver assigned';
    
    // If it's a string, use it directly
    if (typeof bookingOrCaregiver === 'string') {
      const s = bookingOrCaregiver.trim();
      if (!s || s.toLowerCase() === 'null' || s.toLowerCase() === 'undefined' || s.toLowerCase() === 'nan') {
        return 'No caregiver assigned';
      }
      return s;
    }

    // Debug log to see the actual data structure
    console.log('Caregiver data structure:', JSON.stringify(bookingOrCaregiver, null, 2));

    // If we have a booking with no caregiver assigned
    if (bookingOrCaregiver.caregiverId === null || bookingOrCaregiver.caregiver === null) {
      return 'No caregiver assigned';
    }

    // Handle both direct caregiver object and booking object with nested caregiver
    const caregiver = bookingOrCaregiver.caregiver || bookingOrCaregiver.caregiverId || bookingOrCaregiver;
    
    // If we still don't have a valid caregiver object
    if (!caregiver || (typeof caregiver === 'object' && Object.keys(caregiver).length === 0)) {
      return 'No caregiver assigned';
    }
    
    // Try to get the most accurate name in order of preference
    let name = '';
    
    // First, check for direct name properties
    if (caregiver.name) {
      name = caregiver.name;
    } 
    // Check for nested user name
    else if (caregiver.user?.name) {
      name = caregiver.user.name;
    }
    // Check for profile name
    else if (caregiver.profile?.name) {
      name = caregiver.profile.name;
    }
    // Check for display name in caregiver profile
    else if (caregiver.caregiverProfile?.displayName) {
      name = caregiver.caregiverProfile.displayName;
    }
    // Fall back to other possible fields
    else {
      name = caregiver.displayName || 
             caregiver.fullName || 
             caregiver.user?.displayName ||
             caregiver.user?.fullName ||
             '';
    }
    
    const sanitized = String(name).trim();
    return sanitized || 'No caregiver assigned';
  } catch (error) {
    console.error('Error getting caregiver name:', error);
    return 'No caregiver assigned';
  }
};

export const normalizeStatus = (s) => {
  if (!s) return 'pending';
  return s === 'pending_confirmation' ? 'pending' : s;
};

export const fetchMyBookings = async () => {
  try {
    console.log('Fetching bookings...');
    const response = await bookingsAPI.getMyBookings?.() || await bookingsAPI.getMy?.();
    
    console.log('Bookings API response:', JSON.stringify(response, null, 2));
    
    // Extract bookings from response
    let list = [];
    if (response?.data?.data?.bookings) {
      // Handle the new format with pagination { data: { data: { bookings: [] } } }
      list = response.data.data.bookings;
    } else if (response?.data?.bookings) {
      // Handle format with { data: { bookings: [] } }
      list = response.data.bookings;
    } else if (Array.isArray(response?.data)) {
      // Handle direct array response in data
      list = response.data;
    } else if (Array.isArray(response)) {
      // Fallback for direct array response
      list = response;
    } else if (response?.bookings) {
      // Fallback for old format { bookings: [] }
      list = response.bookings;
    }
    
    // Fetch fresh caregiver data for each booking to ensure we have the most up-to-date information
    list = await Promise.all(list.map(async (booking) => {
      try {
        // If we don't have a caregiver ID, return the booking as is
        if (!booking.caregiverId) return booking;
        
        // Get the caregiver ID
        const caregiverId = typeof booking.caregiverId === 'object' 
          ? (booking.caregiverId._id || booking.caregiverId.id) 
          : booking.caregiverId;
        
        if (!caregiverId) return booking;
        
        // Fetch the latest caregiver data
        const response = await fetch(`${process.env.API_URL || 'http://localhost:3000'}/api/caregivers/${caregiverId}`, {
          headers: {
            'Authorization': `Bearer ${await AsyncStorage.getItem('userToken')}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          console.warn(`Failed to fetch caregiver ${caregiverId}:`, await response.text());
          return booking; // Return original booking if fetch fails
        }
        
        const caregiverData = await response.json();
        
        // Merge the fresh caregiver data with the existing booking data
        return {
          ...booking,
          caregiver: {
            ...(booking.caregiver || {}), // Keep existing caregiver data as fallback
            ...(caregiverData.data || caregiverData), // Add/override with fresh data
            _id: caregiverId // Ensure ID is set
          }
        };
      } catch (error) {
        console.error('Error fetching caregiver data:', error);
        return booking; // Return original booking if there's an error
      }
    }));
    
    console.log('Extracted bookings list:', list.length);

    // Sort bookings by date (newest first) and then by time
    const sortedList = [...list].sort((a, b) => {
      const dateA = new Date(a.date + 'T' + (a.startTime || '00:00'));
      const dateB = new Date(b.date + 'T' + (b.startTime || '00:00'));
      return dateB - dateA; // Sort in descending order (newest first)
    });

    return sortedList.map((b) => {
      // Get caregiver info - prioritize the embedded caregiver data
      let caregiverInfo = b.caregiver || b.caregiverId || b.user || {};
      let caregiverName = 'No caregiver assigned';
      let caregiverId = null;
      
      // If we have embedded caregiver data, use it directly
      if (b.caregiver && (b.caregiver.name || b.caregiver._id)) {
        caregiverInfo = b.caregiver;
        caregiverName = b.caregiver.name || 'Unknown Caregiver';
        caregiverId = b.caregiver._id || b.caregiver.id;
      } 
      // Fallback to other possible sources
      else if (b.caregiverId) {
        if (typeof b.caregiverId === 'object') {
          caregiverName = b.caregiverId.name || 'Unknown Caregiver';
          caregiverId = b.caregiverId._id || b.caregiverId.id;
        } else {
          // If it's just an ID, we can't get the name
          caregiverName = 'Unknown Caregiver';
          caregiverId = b.caregiverId;
        }
      }
      
      // If we still don't have a name, try the getCaregiverDisplayName function
      if (caregiverName === 'Unknown Caregiver' || caregiverName === 'No caregiver assigned') {
        caregiverName = getCaregiverDisplayName(caregiverInfo);
      }
      
      // Get status, default to 'pending' if not provided
      const status = normalizeStatus(b.status);
      
      // Format date and time
      const date = b.date ? new Date(b.date) : new Date();
      const formattedDate = date.toISOString().split('T')[0];
      
      // Build schedule string
      let scheduleStr = '';
      try {
        scheduleStr = buildSchedule(b.date, b.startTime, b.endTime);
      } catch (e) {
        console.warn('Error building schedule string, using raw values', e);
        scheduleStr = `${b.date} • ${b.startTime || ''} - ${b.endTime || ''}`.replace(/\s*-\s*$/, '');
      }
      
      // Process children array
      const childrenList = [];
      if (Array.isArray(b.children)) {
        b.children.forEach(child => {
          if (typeof child === 'string') {
            childrenList.push(child);
          } else if (child?.name || child?.childName || child?._id) {
            childrenList.push(child.name || child.childName || child._id);
          }
        });
      }
      
      // Get payment status and amount
      const paymentStatus = b.paymentStatus || 'pending';
      const amount = b.totalCost || 0;
      
      // Return normalized booking object
      const normalizedBooking = {
        id: b._id || b.id || `booking-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        caregiver: caregiverName,
        caregiverId,
        caregiverProfile: b.caregiverId?.caregiverProfile || null,
        status: normalizeStatus(b.status || b.bookingStatus || 'pending'),
        date: formattedDate,
        startTime: b.startTime || b.start || '09:00',
        endTime: b.endTime || b.end || '17:00',
        schedule: scheduleStr,
        children: childrenList,
        paymentStatus: paymentStatus,
        amount: amount,
        currency: b.currency || 'USD',
        _raw: process.env.NODE_ENV === 'development' ? b : undefined
      };
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Normalized booking:', JSON.stringify(normalizedBooking, null, 2));
      }
      
      return normalizedBooking;
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return [];
  }
};
