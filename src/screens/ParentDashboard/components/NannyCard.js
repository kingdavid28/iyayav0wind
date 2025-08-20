import React from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { Card, Avatar } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

const NannyCard = ({ nanny, onViewProfile, onMessage }) => {
  // Format the rating to one decimal place
  const formattedRating = nanny.rating ? nanny.rating.toFixed(1) : '4.8';
  
  return (
    <Card style={styles.caregiverCard}>
      <Card.Content style={styles.caregiverContent}>
        <View style={styles.caregiverHeader}>
          <View style={styles.avatarContainer}>
            {nanny.image ? (
              <Image 
                source={{ uri: nanny.image }} 
                style={styles.avatarImage}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={40} color="#6B7280" />
              </View>
            )}
          </View>
          
          <View style={styles.caregiverInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.caregiverName}>{nanny.name || 'Nanny Name'}</Text>
              <Ionicons name="checkmark-circle" size={18} color="#4caf50" />
            </View>
            
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={16} color="#f59e0b" />
              <Text style={styles.rating}>{formattedRating}</Text>
              <Text style={styles.reviews}>({nanny.reviews || '0'} reviews)</Text>
            </View>
            
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={14} color="#6b7280" />
              <Text style={styles.location}>{nanny.distance || '0'} km away</Text>
            </View>
            
            <Text style={styles.experience}>{nanny.experience || 'Experienced caregiver'}</Text>
          </View>
          
          <View style={styles.rateContainer}>
            <Text style={styles.hourlyRate}>${nanny.hourlyRate || '20'}/hr</Text>
          </View>
        </View>

        {nanny.specialties && nanny.specialties.length > 0 && (
          <View style={styles.specialtiesContainer}>
            {nanny.specialties.slice(0, 3).map((specialty, index) => (
              <View key={index} style={styles.specialtyTag}>
                <Text style={styles.specialtyText}>{specialty}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.availabilityContainer}>
          <View style={styles.availabilityDot}>
            <View style={[
              styles.availabilityIndicator, 
              { backgroundColor: nanny.available ? "#10b981" : "#ef4444" }
            ]} />
            <Text style={styles.availabilityText}>
              {nanny.available ? "Available Now" : "Not Available"}
            </Text>
          </View>
          <Ionicons name="shield-checkmark" size={16} color="#10b981" />
          <Text style={[styles.availabilityText, { color: '#10b981' }]}>Verified</Text>
        </View>

        <View style={styles.actionButtons}>
          <Pressable 
            style={[styles.actionButton, styles.messageButton]}
            onPress={onMessage}
          >
            <Ionicons name="chatbox-outline" size={16} color="#2563eb" />
            <Text style={styles.messageButtonText}>Message</Text>
          </Pressable>
          <Pressable 
            style={[styles.actionButton, styles.bookButton]}
            onPress={onViewProfile}
            disabled={!nanny.available}
          >
            <Text style={styles.bookButtonText}>View Profile</Text>
          </Pressable>
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  caregiverCard: {
    borderRadius: 16,
    marginBottom: 16,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  caregiverContent: {
    padding: 16,
  },
  caregiverHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e1e4e8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  caregiverInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  caregiverName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginRight: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  rating: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginLeft: 4,
    marginRight: 4,
  },
  reviews: {
    fontSize: 14,
    color: '#6b7280',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  location: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 4,
  },
  experience: {
    fontSize: 14,
    color: '#6b7280',
  },
  rateContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  hourlyRate: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#db2777',
  },
  specialtiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  specialtyTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  specialtyText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  availabilityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  availabilityDot: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  availabilityIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  availabilityText: {
    fontSize: 14,
    color: '#6b7280',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  messageButton: {
    backgroundColor: '#f3f4f6',
  },
  messageButtonText: {
    marginLeft: 8,
    color: '#2563eb',
    fontWeight: '600',
  },
  bookButton: {
    backgroundColor: '#db2777',
  },
  bookButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});

export default NannyCard;
