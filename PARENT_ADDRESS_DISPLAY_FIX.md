# Parent Address Display Fix

## Issue Identified
The parent's address was not showing in the home tab of the ParentDashboard because of inconsistent data mapping between different components and data sources.

## Root Causes

### 1. **Prop Priority Issue in MobileProfileSection**
- **Problem**: The component was checking `profileData?.address` before using the `profileLocation` prop
- **Impact**: Even when address data was available in props, it wasn't being displayed

### 2. **Inconsistent Field Mapping**
- **Problem**: Backend might return address data in either `address` or `location` fields
- **Impact**: Address data could be lost if stored in a different field than expected

### 3. **Profile Update Field Mismatch**
- **Problem**: Profile updates only saved to `address` field, not `location`
- **Impact**: Address might not persist correctly across different API endpoints

## Fixes Applied

### 1. **Fixed MobileProfileSection Address Display**
```javascript
// Before
<Text style={styles.mobileProfileDetailText}>
  📍 {String(typeof profileData?.address === 'string' ? profileData.address : profileData?.address?.street || profileLocation || 'Location not set')}
</Text>

// After  
<Text style={styles.mobileProfileDetailText}>
  📍 {String(profileLocation || profileData?.address || profileData?.location || 'Location not set')}
</Text>
```

**Benefits**:
- Prioritizes the `profileLocation` prop that comes from ParentDashboard state
- Falls back to profile data if prop is not available
- Checks both `address` and `location` fields for compatibility

### 2. **Enhanced Profile Update Data Mapping**
```javascript
// Before
const updateData = {
  name: profileForm.name.trim(),
  phone: profileForm.contact.trim(),
  address: profileForm.location.trim()
};

// After
const updateData = {
  name: profileForm.name.trim(),
  phone: profileForm.contact.trim(),
  address: profileForm.location.trim(),
  location: profileForm.location.trim() // Also set location field for compatibility
};
```

**Benefits**:
- Ensures address is saved in both `address` and `location` fields
- Provides compatibility with different backend field expectations
- Prevents data loss during profile updates

### 3. **Improved Profile Data Loading**
```javascript
// Before
setProfile({
  name: profileData.name || profileData.displayName || '',
  email: profileData.email || '',
  phone: profileData.phone || profileData.contact || '',
  address: formatAddress(profileData.address) || '',
  children: profileData.children || [],
  imageUrl: profileData.profileImage || profileData.avatar || null,
  ...profileData
});

// After
setProfile({
  name: profileData.name || profileData.displayName || '',
  email: profileData.email || '',
  phone: profileData.phone || profileData.contact || '',
  address: formatAddress(profileData.address || profileData.location) || '',
  location: formatAddress(profileData.address || profileData.location) || '',
  children: profileData.children || [],
  imageUrl: profileData.profileImage || profileData.avatar || null,
  ...profileData
});
```

**Benefits**:
- Checks both `address` and `location` fields when loading profile
- Populates both fields in local state for consistency
- Uses `formatAddress` utility for consistent formatting

## Data Flow After Fix

1. **Profile Loading**: `useParentDashboard` hook loads profile and maps both `address` and `location` fields
2. **State Management**: ParentDashboard updates `profileForm.location` from `profile.address`
3. **Prop Passing**: HomeTab passes `profileLocation` to MobileProfileSection
4. **Display**: MobileProfileSection prioritizes `profileLocation` prop for display
5. **Updates**: Profile updates save to both `address` and `location` fields

## Testing Recommendations

1. **New Address Entry**: Test adding an address through profile edit
2. **Address Display**: Verify address shows immediately in home tab
3. **Profile Refresh**: Test that address persists after app restart
4. **Backend Compatibility**: Verify works with both `address` and `location` field responses
5. **Empty Address**: Test graceful handling when no address is set

## Files Modified

- `src/screens/ParentDashboard/components/MobileProfileSection.js` - Fixed address display priority
- `src/screens/ParentDashboard/index.js` - Enhanced profile update data mapping  
- `src/hooks/useParentDashboard.js` - Improved profile data loading with dual field support

The parent's address should now display correctly in the home tab and persist properly across profile updates.