/**
 * Helper function to consistently extract and format caregiver display names
 * Handles various input types and provides fallbacks
 */
export const getCaregiverDisplayName = (bookingOrCaregiver) => {
  try {
    if (!bookingOrCaregiver) return 'Caregiver';
    
    // If it's a string, use it directly
    if (typeof bookingOrCaregiver === 'string') {
      const s = bookingOrCaregiver.trim();
      if (!s || s.toLowerCase() === 'null' || s.toLowerCase() === 'undefined' || s.toLowerCase() === 'nan') {
        return 'Caregiver';
      }
      return s;
    }

    // Handle both direct caregiver object and booking object with nested caregiver
    const caregiver = bookingOrCaregiver.caregiver || bookingOrCaregiver.caregiverId || bookingOrCaregiver;
    
    // Try different possible name fields
    const name = caregiver?.name ||
      caregiver?.user?.name ||
      caregiver?.profile?.name ||
      caregiver?.email ||
      caregiver?.user?.email ||
      caregiver?.user?.profile?.name ||
      caregiver?.displayName ||
      caregiver?.fullName ||
      '';
      
    const sanitized = String(name).trim();
    return sanitized || 'Caregiver';
  } catch (error) {
    console.error('Error getting caregiver name:', error);
    return 'Caregiver';
  }
};

/**
 * Extracts caregiver ID from various possible locations in the object
 */
export const getCaregiverId = (cg) => {
  if (!cg) return null;
  if (typeof cg === 'string') return cg;
  return (
    cg._id || 
    cg.id || 
    cg.userId || 
    cg.user?._id || 
    cg.user?.id ||
    null
  );
};

/**
 * Normalizes booking status for consistent display
 */
export const normalizeStatus = (status) => {
  if (!status) return 'pending';
  return status === 'pending_confirmation' ? 'pending' : status;
};

/**
 * Normalizes caregiver data from API response
 */
export const normalizeCaregiver = (data) => ({
  ...data,
  experience: data.experience || 0,
  rating: data.rating || 0,
  hourlyRate: data.hourlyRate || 0,
  certifications: Array.isArray(data.certifications) ? data.certifications : [],
  availability: data.availability || {},
});

/**
 * Applies filters to caregiver list
 */
export const applyFilters = (caregiversList, currentFilters) => {
  if (!caregiversList || !caregiversList.length) return [];
  
  return caregiversList.filter(caregiver => {
    if (currentFilters.rating > 0 && (caregiver.rating || 0) < currentFilters.rating) {
      return false;
    }
    
    if ((caregiver.experience || 0) < currentFilters.experience.min) {
      return false;
    }
    
    if (caregiver.hourlyRate > currentFilters.rate.max) {
      return false;
    }
    
    if (currentFilters.certifications.length > 0) {
      const caregiverCerts = Array.isArray(caregiver.certifications) 
        ? caregiver.certifications.map(c => c.toLowerCase())
        : [];
        
      const hasAllCerts = currentFilters.certifications.every(cert => 
        caregiverCerts.includes(cert.toLowerCase())
      );
      
      if (!hasAllCerts) {
        return false;
      }
    }
    
    if (currentFilters.availability.availableNow) {
      // Availability filtering logic
    }
    
    return true;
  });
};

/**
 * Counts active filters for display
 */
export const countActiveFilters = (filters) => {
  return (
    (filters.availability.availableNow ? 1 : 0) +
    (filters.availability.days.length > 0 ? 1 : 0) +
    (filters.location.distance < 50 ? 1 : 0) +
    (filters.location.location ? 1 : 0) +
    (filters.rate.max < 1000 ? 1 : 0) +
    (filters.experience.min > 0 ? 1 : 0) +
    (filters.certifications.length > 0 ? 1 : 0) +
    (filters.rating > 0 ? 1 : 0)
  );
};
