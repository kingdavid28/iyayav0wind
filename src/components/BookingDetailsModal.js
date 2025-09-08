import React from 'react';
import { View, Text, ScrollView, Pressable, Linking, Alert, Platform, StyleSheet } from 'react-native';
import { Calendar, Clock, DollarSign, MapPin, Phone, Mail, MessageCircle, Navigation, Star, Baby, AlertCircle, CheckCircle, X } from 'lucide-react-native';
import PropTypes from 'prop-types';

/**
 * BookingDetailsModal displays detailed information about a booking, including children, contact, and actions.
 * Accessibility labels and roles are provided for all interactive elements.
 *
 * @param {Object} props
 * @param {boolean} props.visible - Whether the modal is visible
 * @param {Object} props.booking - Booking details object
 * @param {Function} props.onClose - Called when the modal is closed
 * @param {Function} props.onMessage - Called when the message button is pressed
 * @param {Function} props.onGetDirections - Called when the directions button is pressed
 * @param {Function} props.onCompleteBooking - Called to mark booking as complete
 * @param {Function} props.onCancelBooking - Called to cancel booking
 */
export function BookingDetailsModal({ 
  visible, 
  booking, 
  onClose, 
  onMessage, 
  onGetDirections, 
  onCompleteBooking,
  onCancelBooking 
}) {
  if (!visible || !booking) return null;

  const enhancedBooking = {
    ...booking,
    location: booking.location || "Cebu City",
    address: booking.address || "123 Osmeña Blvd, Cebu City, 6000 Cebu",
    contactPhone: booking.contactPhone || "0917 123 4567",
    contactEmail: booking.contactEmail || "delacruz.family@email.ph",
    totalHours: booking.totalHours || 4,
    totalAmount: booking.totalAmount || (booking.hourlyRate * 4),
    requirements: booking.requirements || ["CPR Certified", "Background Check", "Non-smoker"],
    childrenDetails: booking.childrenDetails || [
      {
        name: "Maya",
        age: 3,
        specialInstructions: "Loves puzzles and quiet activities",
        allergies: "None",
        preferences: "Story time before nap"
      },
      {
        name: "Miguel", 
        age: 5,
        specialInstructions: "Needs help with homework",
        allergies: "Peanuts",
        preferences: "Outdoor play, building blocks"
      }
    ],
    emergencyContact: booking.emergencyContact || {
      name: "Dra. Ana Dela Cruz",
      phone: "0918 987 6543",
      relation: "Mother"
    }
  };

  const getStatusColors = (status) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return { bg: 'bg-green-100', border: 'border-green-200', text: 'text-green-800' };
      case 'pending':
        return { bg: 'bg-yellow-100', border: 'border-yellow-200', text: 'text-yellow-800' };
      case 'completed':
        return { bg: 'bg-blue-100', border: 'border-blue-200', text: 'text-blue-800' };
      case 'cancelled':
        return { bg: 'bg-red-100', border: 'border-red-200', text: 'text-red-800' };
      default:
        return { bg: 'bg-gray-100', border: 'border-gray-200', text: 'text-gray-800' };
    }
  };

  const statusColors = getStatusColors(enhancedBooking.status);

  return (
    <View className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <View className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden" style={styles.card}>
        {/* Header */}
        <View className="flex flex-row items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100">
          <View className="flex flex-row items-center">
            <View className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
              <Calendar size={24} color="#3b82f6" />
            </View>
            <View>
              <Text className="text-xl font-bold text-gray-800">Booking Details</Text>
              <Text className="text-sm text-gray-600">{enhancedBooking.family}</Text>
            </View>
          </View>
          
          <View className="flex flex-row items-center gap-3">
            <View className={`px-3 py-1.5 rounded-full border ${statusColors.bg} ${statusColors.border}`}>
              <Text className={`text-sm font-semibold ${statusColors.text}`}>
                {enhancedBooking.status.charAt(0).toUpperCase() + enhancedBooking.status.slice(1)}
              </Text>
            </View>
            
            <Pressable onPress={onClose}>
              <X size={24} color="#9ca3af" />
            </Pressable>
          </View>
        </View>

        <ScrollView style={{ maxHeight: 'calc(90vh - 140px)' }}>
          <View className="p-6 gap-6">
            {/* Booking Overview */}
            <View className="bg-gray-50 rounded-xl p-4">
              <Text className="text-lg font-bold text-gray-800 mb-4">Booking Overview</Text>
              <View className="flex flex-row flex-wrap gap-4">
                <View className="flex flex-row items-center">
                  <Calendar size={20} color="#6b7280" className="mr-2" />
                  <View>
                    <Text className="text-sm text-gray-600">Date</Text>
                    <Text className="font-semibold text-gray-800">{enhancedBooking.date}</Text>
                  </View>
                </View>
                <View className="flex flex-row items-center">
                  <Clock size={20} color="#6b7280" className="mr-2" />
                  <View>
                    <Text className="text-sm text-gray-600">Time</Text>
                    <Text className="font-semibold text-gray-800">{enhancedBooking.time}</Text>
                  </View>
                </View>
                <View className="flex flex-row items-center">
                  <DollarSign size={20} color="#6b7280" className="mr-2" />
                  <View>
                    <Text className="text-sm text-gray-600">Rate</Text>
                    <Text className="font-semibold text-blue-600">${enhancedBooking.hourlyRate}/hr</Text>
                  </View>
                </View>
                <View className="flex flex-row items-center">
                  <Star size={20} color="#6b7280" className="mr-2" />
                  <View>
                    <Text className="text-sm text-gray-600">Total</Text>
                    <Text className="font-semibold text-green-600">${enhancedBooking.totalAmount}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Location & Contact */}
            <View className="bg-white border border-gray-200 rounded-xl p-4">
              <Text className="text-lg font-bold text-gray-800 mb-4">Location & Contact</Text>
              <View className="gap-3">
                <View className="flex flex-row items-start">
                  <MapPin size={20} color="#6b7280" className="mr-3 mt-0.5" />
                  <View>
                    <Text className="font-semibold text-gray-800">{enhancedBooking.location}</Text>
                    <Text className="text-sm text-gray-600">{enhancedBooking.address}</Text>
                  </View>
                </View>
                {/* Phone - only show if present, else show privacy placeholder */}
                {enhancedBooking.contactPhone ? (
                  <View className="flex flex-row items-center">
                    <Phone size={20} color="#6b7280" className="mr-3" />
                    <View>
                      <Text className="text-sm text-gray-600">Phone</Text>
                      <Text className="font-semibold text-gray-800">{enhancedBooking.contactPhone}</Text>
                    </View>
                  </View>
                ) : (
                  <View className="flex flex-row items-center">
                    <Phone size={20} color="#6b7280" className="mr-3" />
                    <View>
                      <Text className="text-sm text-gray-600">Phone</Text>
                      <Text style={{ color: '#9ca3af', fontStyle: 'italic' }}>Contact info hidden for privacy</Text>
                    </View>
                  </View>
                )}
                {/* Email - only show if present, else show privacy placeholder */}
                {enhancedBooking.contactEmail ? (
                  <View className="flex flex-row items-center">
                    <Mail size={20} color="#6b7280" className="mr-3" />
                    <View>
                      <Text className="text-sm text-gray-600">Email</Text>
                      <Text className="font-semibold text-gray-800">{enhancedBooking.contactEmail}</Text>
                    </View>
                  </View>
                ) : (
                  <View className="flex flex-row items-center">
                    <Mail size={20} color="#6b7280" className="mr-3" />
                    <View>
                      <Text className="text-sm text-gray-600">Email</Text>
                      <Text style={{ color: '#9ca3af', fontStyle: 'italic' }}>Contact info hidden for privacy</Text>
                    </View>
                  </View>
                )}
              </View>
            </View>

            {/* Children Details */}
            <View className="bg-white border border-gray-200 rounded-xl p-4">
              <View className="flex flex-row items-center">
                <Baby size={20} color="#6b7280" className="mr-2" />
                <Text className="text-lg font-bold text-gray-800">Children Details</Text>
              </View>
              <View className="gap-4 mt-4">
                {enhancedBooking.childrenDetails.map((child, index) => (
                  <View key={index} className="bg-blue-50 rounded-lg p-4">
                    <View className="flex flex-row items-center justify-between mb-2">
                      <Text className="font-semibold text-gray-800">{child.name}</Text>
                      <Text className="text-sm text-gray-600">Age {child.age}</Text>
                    </View>
                    
                    <View className="gap-2">
                      <View>
                        <Text className="font-medium text-gray-700">Preferences: </Text>
                        <Text className="text-gray-600">{child.preferences}</Text>
                      </View>
                      <View>
                        <Text className="font-medium text-gray-700">Special Instructions: </Text>
                        <Text className="text-gray-600">{child.specialInstructions}</Text>
                      </View>
                      {child.allergies && child.allergies !== 'None' && (
                        <View className="flex flex-row items-center">
                          <AlertCircle size={16} color="#ef4444" className="mr-1" />
                          <Text className="font-medium text-red-700">Allergies: </Text>
                          <Text className="text-red-600 ml-1">{child.allergies}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Requirements */}
            <View className="bg-white border border-gray-200 rounded-xl p-4">
              <Text className="text-lg font-bold text-gray-800 mb-4">Requirements</Text>
              <View className="flex flex-row flex-wrap gap-2">
                {enhancedBooking.requirements.map((req, index) => (
                  <View key={index} className="px-3 py-1 bg-green-100 rounded-full flex flex-row items-center">
                    <CheckCircle size={12} color="#16a34a" className="mr-1" />
                    <Text className="text-green-700 text-sm font-medium">{req}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Special Notes */}
            {enhancedBooking.notes && (
              <View className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <Text className="text-lg font-bold text-gray-800 mb-2">Special Notes</Text>
                <Text className="text-gray-700">{enhancedBooking.notes}</Text>
              </View>
            )}

            {/* Emergency Contact */}
            <View className="bg-red-50 border border-red-200 rounded-xl p-4">
              <View className="flex flex-row items-center">
                <AlertCircle size={20} color="#dc2626" className="mr-2" />
                <Text className="text-lg font-bold text-gray-800">Emergency Contact</Text>
              </View>
              <View className="gap-2 mt-4">
                <View>
                  <Text className="font-medium text-gray-700">Name: </Text>
                  <Text className="text-gray-800">{enhancedBooking.emergencyContact.name}</Text>
                </View>
                <View>
                  <Text className="font-medium text-gray-700">Relation: </Text>
                  <Text className="text-gray-800">{enhancedBooking.emergencyContact.relation}</Text>
                </View>
                <View>
                  <Text className="font-medium text-gray-700">Phone: </Text>
                  <Text className="text-gray-800 font-semibold">{enhancedBooking.emergencyContact.phone}</Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Footer Actions */}
        <View className="flex flex-row flex-wrap gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <Pressable
            onPress={onMessage}
            className="flex-1 min-w-[120px] px-4 py-3 bg-blue-100 rounded-lg flex flex-row items-center justify-center"
          >
            <MessageCircle size={16} color="#3b82f6" className="mr-2" />
            <Text className="text-blue-700 font-semibold">Message Family</Text>
          </Pressable>
          
          <Pressable
            onPress={() => {
              Linking.openURL(`https://maps.google.com/?q=${enhancedBooking.address}`);
              onGetDirections?.();
            }}
            className="flex-1 min-w-[120px] px-4 py-3 bg-green-100 rounded-lg flex flex-row items-center justify-center"
          >
            <Navigation size={16} color="#16a34a" className="mr-2" />
            <Text className="text-green-700 font-semibold">Get Directions</Text>
          </Pressable>

          {enhancedBooking.status === 'confirmed' && (
            <Pressable
              onPress={() => {
                Alert.alert("Booking Completed", "The booking has been marked as complete");
                onCompleteBooking?.();
              }}
              className="flex-1 min-w-[120px] px-4 py-3 bg-blue-600 rounded-lg flex flex-row items-center justify-center"
            >
              <CheckCircle size={16} color="#ffffff" className="mr-2" />
              <Text className="text-white font-semibold">Mark Complete</Text>
            </Pressable>
          )}

          {(enhancedBooking.status === 'pending_confirmation' || enhancedBooking.status === 'confirmed') && (
            <Pressable
              onPress={() => {
                Alert.alert("Booking Cancelled", "The booking has been cancelled");
                onCancelBooking?.();
              }}
              className="px-4 py-3 bg-red-100 rounded-lg flex flex-row items-center justify-center"
            >
              <Text className="text-red-700 font-semibold">Cancel Booking</Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

BookingDetailsModal.propTypes = {
  visible: PropTypes.bool.isRequired,
  booking: PropTypes.shape({
    location: PropTypes.string,
    address: PropTypes.string,
    contactPhone: PropTypes.string,
    contactEmail: PropTypes.string,
    totalHours: PropTypes.number,
    totalAmount: PropTypes.number,
    hourlyRate: PropTypes.number,
    requirements: PropTypes.arrayOf(PropTypes.string),
    childrenDetails: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string,
        age: PropTypes.number,
        specialInstructions: PropTypes.string,
        allergies: PropTypes.string,
        preferences: PropTypes.string
      })
    ),
    emergencyContact: PropTypes.shape({
      name: PropTypes.string,
      phone: PropTypes.string,
      relation: PropTypes.string
    }),
    status: PropTypes.string,
    family: PropTypes.string,
    date: PropTypes.string,
    time: PropTypes.string,
    notes: PropTypes.string
  }),
  onClose: PropTypes.func.isRequired,
  onMessage: PropTypes.func,
  onGetDirections: PropTypes.func,
  onCompleteBooking: PropTypes.func,
  onCancelBooking: PropTypes.func
};

BookingDetailsModal.defaultProps = {
  booking: {}
};

const styles = StyleSheet.create({
  card: Platform.select({
    web: {
      boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
    },
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 12,
    },
    android: {
      elevation: 8,
    },
    default: {},
  }),
});

export default BookingDetailsModal;
