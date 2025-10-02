import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  RefreshControl
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { ratingsService } from '../services';
import { StarRatingInput, StarRatingDisplay } from 'react-native-star-rating-widget';

const ReviewItem = ({ review }) => (
  <View style={styles.reviewContainer}>
    <StarRatingDisplay
      rating={review.rating}
      starSize={20}
      color="#FFD700"
    />
    {review.review && (
      <Text style={styles.comment}>{review.review}</Text>
    )}
    <Text style={styles.timestamp}>
      {new Date(review.createdAt).toLocaleDateString()}
    </Text>
  </View>
);

const CaregiverReviewsScreen = ({ route }) => {
  const { caregiverId } = route.params;
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [ratingSummary, setRatingSummary] = useState(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch reviews and summary
  const fetchReviewsAndSummary = async () => {
    try {
      setLoading(true);

      // Fetch rating summary
      const summaryResponse = await ratingsService.getRatingSummary(caregiverId, 'caregiver');
      if (summaryResponse?.success) {
        setRatingSummary(summaryResponse.data);
      }

      // Fetch recent reviews
      const reviewsResponse = await ratingsService.getCaregiverRatings(caregiverId, 1, 10);
      if (reviewsResponse?.success) {
        setReviews(reviewsResponse.data || []);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      Alert.alert('Error', 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviewsAndSummary();
  }, [caregiverId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchReviewsAndSummary();
    setRefreshing(false);
  };

  const submitReview = async () => {
    if (rating === 0) {
      Alert.alert('Error', 'Please select a rating');
      return;
    }

    if (!user?.id) {
      Alert.alert('Error', 'You must be logged in to submit a review');
      return;
    }

    try {
      // Submit rating via backend API
      const response = await ratingsService.rateCaregiver(caregiverId, null, rating, comment);

      if (response?.success) {
        // Refresh reviews and summary after successful submission
        await fetchReviewsAndSummary();

        setRating(0);
        setComment('');
        setShowReviewForm(false);
        Alert.alert('Success', 'Review submitted successfully');

        // Also refresh dashboard data if needed
        // This could trigger a global refresh or update parent dashboard
      } else {
        Alert.alert('Error', response?.error || 'Failed to submit review');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to submit review');
      console.error('Error submitting review:', error);
    }
  };

  const renderReviewItem = ({ item }) => (
    <ReviewItem review={item} />
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading reviews...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Rating Summary Section */}
      {ratingSummary && (
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>Rating Summary</Text>
          <View style={styles.summaryRow}>
            <StarRatingDisplay
              rating={ratingSummary.averageRating || 0}
              starSize={20}
              color="#FFD700"
            />
            <Text style={styles.averageRating}>
              {ratingSummary.averageRating?.toFixed(1) || '0.0'}
            </Text>
            <Text style={styles.totalRatings}>
              ({ratingSummary.totalRatings || 0} reviews)
            </Text>
          </View>
        </View>
      )}

      {!showReviewForm ? (
        <TouchableOpacity
          style={styles.addReviewButton}
          onPress={() => setShowReviewForm(true)}
        >
          <Text style={styles.addReviewButtonText}>Add Review</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.reviewForm}>
          <StarRatingInput
            rating={rating}
            onChange={setRating}
            starSize={30}
          />
          <TextInput
            style={styles.commentInput}
            value={comment}
            onChangeText={setComment}
            placeholder="Write your review..."
            multiline
            numberOfLines={4}
          />
          <View style={styles.reviewButtons}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowReviewForm(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.submitButton}
              onPress={submitReview}
            >
              <Text style={styles.submitButtonText}>Submit</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <FlatList
        data={reviews}
        renderItem={renderReviewItem}
        keyExtractor={(item) => item._id || item.id}
        style={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No reviews yet</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    flex: 1,
  },
  summaryContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  averageRating: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
    color: '#333',
  },
  totalRatings: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
  },
  addReviewButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  addReviewButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  reviewForm: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    elevation: 2,
    marginBottom: 16,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    marginVertical: 16,
    textAlignVertical: 'top',
    minHeight: 100,
  },
  reviewButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#757575',
  },
  cancelButtonText: {
    color: '#757575',
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
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
    color: '#333',
  },
  timestamp: {
    fontSize: 12,
    color: '#888',
    alignSelf: 'flex-end',
    marginTop: 8,
  },
});

export default CaregiverReviewsScreen;