import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StarRatingDisplay } from 'react-native-star-rating-widget';

const ReviewItem = ({ review }) => {
  return (
    <View style={styles.reviewContainer}>
      <StarRatingDisplay
        rating={review.rating}
        starSize={20}
        color="#FFD700"
      />
      {review.comment && (
        <Text style={styles.comment}>{review.comment}</Text>
      )}
      <Text style={styles.timestamp}>
        {new Date(review.timestamp).toLocaleDateString()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  reviewContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    elevation: 1,
  },
  comment: {
    fontSize: 14,
    marginVertical: 8,
  },
  timestamp: {
    fontSize: 12,
    color: '#888',
    alignSelf: 'flex-end',
  },
});

export default ReviewItem;