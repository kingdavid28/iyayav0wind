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
