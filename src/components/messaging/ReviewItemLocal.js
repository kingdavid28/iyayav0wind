import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

const ReviewItemLocal = ({ review }) => {
  if (!review) {
    return null;
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown date';
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating || 0);
    const hasHalfStar = (rating || 0) % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Ionicons key={i} name="star" size={14} color="#F59E0B" />
      );
    }

    if (hasHalfStar) {
      stars.push(
        <Ionicons key="half" name="star-half" size={14} color="#F59E0B" />
      );
    }

    const emptyStars = 5 - Math.ceil(rating || 0);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Ionicons key={`empty-${i}`} name="star-outline" size={14} color="#D1D5DB" />
      );
    }

    return stars;
  };

  return (
    <Card style={styles.reviewCard}>
      <Card.Content style={styles.reviewContent}>
        <View style={styles.reviewHeader}>
          <View style={styles.reviewerInfo}>
            <View style={styles.avatarContainer}>
              <Ionicons name="person-circle" size={40} color="#3B82F6" />
            </View>
            <View style={styles.reviewerDetails}>
              <Text style={styles.reviewerName}>
                {review.parentName || review.reviewerName || 'Anonymous Parent'}
              </Text>
              <Text style={styles.reviewDate}>
                {formatDate(review.timestamp || review.createdAt)}
              </Text>
            </View>
          </View>

          <View style={styles.ratingContainer}>
            {renderStars(review.rating)}
            <Text style={styles.ratingText}>
              {review.rating ? review.rating.toFixed(1) : '0.0'}
            </Text>
          </View>
        </View>

        {review.comment && (
          <View style={styles.reviewComment}>
            <Text style={styles.commentText}>
              "{review.comment}"
            </Text>
          </View>
        )}

        {review.jobTitle && (
          <View style={styles.jobInfo}>
            <Ionicons name="briefcase" size={12} color="#6B7280" />
            <Text style={styles.jobTitleText}>
              {review.jobTitle}
            </Text>
          </View>
        )}
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  reviewCard: {
    marginVertical: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reviewContent: {
    padding: 16,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reviewerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    marginRight: 12,
  },
  reviewerDetails: {
    flex: 1,
  },
  reviewerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  reviewDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F59E0B',
    marginLeft: 4,
  },
  reviewComment: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
  },
  commentText: {
    fontSize: 14,
    color: '#374151',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  jobInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  jobTitleText: {
    fontSize: 12,
    color: '#6B7280',
  },
});

export default ReviewItemLocal;
