import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert
} from 'react-native';
import { getFirebaseDatabase, ref, onValue, push, set, query, orderByChild } from '../config/firebase';
import { StarRatingInput, StarRatingDisplay } from 'react-native-star-rating-widget';

const ReviewItem = ({ review }) => (
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

const CaregiverReviewsScreen = ({ route }) => {
  const { userId, caregiverId } = route.params;
  const [reviews, setReviews] = useState([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  // Fetch reviews
  useEffect(() => {
    const fetchReviews = async () => {
      const database = await getFirebaseDatabase();
      const reviewsRef = ref(database, `reviews/${caregiverId}`);
      const reviewsQuery = query(reviewsRef, orderByChild('timestamp'));

      const unsubscribe = onValue(reviewsQuery, (snapshot) => {
        const reviewsData = [];
        snapshot.forEach((childSnapshot) => {
          reviewsData.push({
            id: childSnapshot.key,
            parentId: childSnapshot.val().parentId,
            rating: childSnapshot.val().rating,
            comment: childSnapshot.val().comment,
            timestamp: childSnapshot.val().timestamp
          });
        });
        setReviews(reviewsData);
      });

      return unsubscribe;
    };

    let unsubscribe;
    fetchReviews().then((unsub) => {
      unsubscribe = unsub;
    });

    return () => unsubscribe && unsubscribe();
  }, [caregiverId]);

  const submitReview = async () => {
    if (rating === 0) {
      Alert.alert('Error', 'Please select a rating');
      return;
    }

    try {
      const database = await getFirebaseDatabase();
      const reviewRef = push(ref(database, `reviews/${caregiverId}`));
      await set(reviewRef, {
        parentId: userId,
        rating: rating,
        comment: comment,
        timestamp: Date.now()
      });
      setRating(0);
      setComment('');
      setShowReviewForm(false);
      Alert.alert('Success', 'Review submitted successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to submit review');
      console.error('Error submitting review:', error);
    }
  };

  const renderReviewItem = ({ item }) => (
    <ReviewItem review={item} />
  );

  return (
    <View style={styles.container}>
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
        keyExtractor={(item) => item.id}
        style={styles.list}
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
  list: {
    flex: 1,
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