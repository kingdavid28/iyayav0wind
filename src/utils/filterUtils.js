/**
 * Filter utilities for caregiver search functionality
 * Implements best practices for filtering and search
 */

/**
 * Apply filters to caregiver list
 * @param {Array} caregivers - List of caregivers to filter
 * @param {Object} filters - Filter criteria
 * @param {string} searchQuery - Text search query
 * @returns {Array} Filtered caregiver list
 */
export const applyFilters = (caregivers, filters, searchQuery = '') => {
  if (!Array.isArray(caregivers)) return [];

  let filtered = [...caregivers];

  // Text search filter (name, location, specialties)
  if (searchQuery?.trim()) {
    const query = searchQuery.toLowerCase().trim();
    filtered = filtered.filter(caregiver => 
      caregiver.name?.toLowerCase().includes(query) ||
      caregiver.location?.toLowerCase().includes(query) ||
      caregiver.bio?.toLowerCase().includes(query) ||
      caregiver.specialties?.some(specialty => 
        specialty.toLowerCase().includes(query)
      )
    );
  }

  // Availability filter
  if (filters.availability?.availableNow) {
    filtered = filtered.filter(caregiver => caregiver.availableNow === true);
  }

  // Days availability filter
  if (filters.availability?.days?.length > 0) {
    filtered = filtered.filter(caregiver => 
      filters.availability.days.some(day => 
        caregiver.availableDays?.includes(day)
      )
    );
  }

  // Distance filter
  if (filters.location?.distance && filters.location?.userLocation) {
    filtered = filtered.filter(caregiver => {
      const distance = calculateDistance(
        filters.location.userLocation,
        caregiver.location
      );
      return distance <= filters.location.distance;
    });
  }

  // Rate range filter
  if (filters.rate?.min !== undefined || filters.rate?.max !== undefined) {
    filtered = filtered.filter(caregiver => {
      const rate = parseFloat(caregiver.hourlyRate) || 0;
      const minRate = filters.rate.min || 0;
      const maxRate = filters.rate.max || Infinity;
      return rate >= minRate && rate <= maxRate;
    });
  }

  // Experience filter
  if (filters.experience?.min !== undefined) {
    filtered = filtered.filter(caregiver => {
      const experience = parseInt(caregiver.experience) || 0;
      return experience >= filters.experience.min;
    });
  }

  // Rating filter
  if (filters.rating !== undefined && filters.rating > 0) {
    filtered = filtered.filter(caregiver => {
      const rating = parseFloat(caregiver.rating) || 0;
      return rating >= filters.rating;
    });
  }

  // Certifications filter
  if (filters.certifications?.length > 0) {
    filtered = filtered.filter(caregiver => 
      filters.certifications.some(cert => 
        caregiver.certifications?.includes(cert)
      )
    );
  }

  return filtered;
};

/**
 * Count active filters
 * @param {Object} filters - Filter object
 * @returns {number} Number of active filters
 */
export const countActiveFilters = (filters) => {
  let count = 0;

  if (filters.availability?.availableNow) count++;
  if (filters.availability?.days?.length > 0) count++;
  if (filters.rate?.min > 0 || filters.rate?.max < 1000) count++;
  if (filters.experience?.min > 0) count++;
  if (filters.certifications?.length > 0) count++;
  if (filters.rating > 0) count++;

  return count;
};

/**
 * Reset filters to default state
 * @returns {Object} Default filter object
 */
export const getDefaultFilters = () => ({
  availability: { availableNow: false, days: [] },
  location: { distance: 25 },
  rate: { min: 15, max: 50 },
  experience: { min: 1 },
  certifications: [],
  rating: 4.0,
});

/**
 * Calculate distance between two coordinates (Haversine formula)
 * @param {Object} coord1 - {lat, lng}
 * @param {Object} coord2 - {lat, lng}
 * @returns {number} Distance in miles
 */
const calculateDistance = (coord1, coord2) => {
  if (!coord1 || !coord2) return Infinity;

  const R = 3959; // Earth's radius in miles
  const dLat = toRad(coord2.lat - coord1.lat);
  const dLon = toRad(coord2.lng - coord1.lng);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(coord1.lat)) * Math.cos(toRad(coord2.lat)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const toRad = (value) => (value * Math.PI) / 180;

/**
 * Debounce function for search input
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Sort caregivers by various criteria
 * @param {Array} caregivers - List of caregivers
 * @param {string} sortBy - Sort criteria
 * @returns {Array} Sorted caregiver list
 */
export const sortCaregivers = (caregivers, sortBy = 'rating') => {
  if (!Array.isArray(caregivers)) return [];

  const sorted = [...caregivers];

  switch (sortBy) {
    case 'rating':
      return sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    case 'price_low':
      return sorted.sort((a, b) => (a.hourlyRate || 0) - (b.hourlyRate || 0));
    case 'price_high':
      return sorted.sort((a, b) => (b.hourlyRate || 0) - (a.hourlyRate || 0));
    case 'experience':
      return sorted.sort((a, b) => (b.experience || 0) - (a.experience || 0));
    case 'distance':
      return sorted.sort((a, b) => (a.distance || 0) - (b.distance || 0));
    default:
      return sorted;
  }
};