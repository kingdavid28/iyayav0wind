// utils/locationUtils.js
import * as Location from 'expo-location';
import axios from 'axios';

// Get current device location using Expo
export const getCurrentDeviceLocation = async () => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Location permission denied');
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    const address = await Location.reverseGeocodeAsync({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    });

    return formatLocationResponse(location, address[0]);
  } catch (error) {
    console.error('Location error:', error);
    throw error;
  }
};

// Search location using Google Maps API
export const searchLocation = async (searchText) => {
  try {
    const response = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json`, {
      params: {
        address: searchText,
        key: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY // Use Expo environment variable
      }
    });

    if (!response.data.results.length) {
      throw new Error('Location not found');
    }

    return parseGoogleMapsResult(response.data.results[0]);
  } catch (error) {
    console.error('Location search failed:', error);
    throw error;
  }
};

// Helper functions
const formatLocationResponse = (location, address) => ({
  coordinates: {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
  },
  address: address ? {
    street: address.street || '',
    city: address.city || '',
    province: address.region || '',
    country: address.country || '',
    postalCode: address.postalCode || '',
    formatted: `${address.street || ''}, ${address.city || ''}, ${address.region || ''}`.trim().replace(/^,/, '').replace(/,$/, '')
  } : null
});

const parseGoogleMapsResult = (result) => {
  const { address_components, formatted_address, geometry } = result;
  
  return {
    coordinates: {
      latitude: geometry.location.lat,
      longitude: geometry.location.lng
    },
    address: {
      formatted: formatted_address,
      street: getAddressComponent(address_components, 'route'),
      city: getAddressComponent(address_components, 'locality'),
      province: getAddressComponent(address_components, 'administrative_area_level_1'),
      country: getAddressComponent(address_components, 'country'),
      postalCode: getAddressComponent(address_components, 'postal_code')
    }
  };
};

const getAddressComponent = (components, type) => {
  return components.find(c => c.types.includes(type))?.long_name || '';
};

export const validateLocation = (location) => {
  if (!location) return false;
  
  // Check if we have at least a city and province
  if (!location.city || !location.province) return false;
  
  // Check if coordinates are valid if provided
  if (location.coordinates) {
    const { latitude, longitude } = location.coordinates;
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return false;
    }
  }
  
  return true;
};

export const formatLocationForDisplay = (location) => {
  if (!location) return '';
  
  const parts = [];
  if (location.street) parts.push(location.street);
  if (location.city) parts.push(location.city);
  if (location.province) parts.push(location.province);
  if (location.zipCode) parts.push(location.zipCode);
  if (location.country) parts.push(location.country);
  
  return parts.join(', ');
};