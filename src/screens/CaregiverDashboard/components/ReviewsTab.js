import React, { useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DashboardDataState from '../../../components/common/DashboardDataState';
import { useReview, REVIEW_STATUS } from '../../../contexts/ReviewContext';

const ReviewsTab = ({
  userId,
  role = 'caregiver',
  onRefresh,
}) => {
  const { reviews, status, error, fetchReviews, clearError } = useReview();

  const handleRefresh = useCallback(() => {
    if (onRefresh) {
      onRefresh();
    }
    if (userId) {
      fetchReviews({ userId, role });
    }
  }, [fetchReviews, onRefresh, role, userId]);

  useEffect(() => {
    if (!userId) {
      return;
    }
    fetchReviews({ userId, role });
  }, [fetchReviews, role, userId]);

  const effectiveStatus = useMemo(() => {
    if (!userId) {
      return REVIEW_STATUS.IDLE;
    }

    if (status === REVIEW_STATUS.READY && reviews.length === 0) {
      return 'empty';
    }

    return status;
  }, [userId, status, reviews.length]);

  const errorMessage = useMemo(() => {
    if (!error) {
      return 'Unable to load reviews right now.';
    }
    return error;
  }, [error]);

  const renderItem = ({ item }) => (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <Ionicons name="star" size={18} color="#FACC15" />
        <Text style={styles.ratingText}>{item.rating?.toFixed?.(1) ?? item.rating ?? '—'}</Text>
        <Text style={styles.reviewerName}>{item.reviewerName}</Text>
      </View>
      {item.comment ? <Text style={styles.comment}>{item.comment}</Text> : null}
      <Text style={styles.timestamp}>{new Date(item.timestamp).toLocaleDateString()}</Text>
    </View>
  );

  return (
    <DashboardDataState
      status={effectiveStatus}
      loadingText="Loading reviews…"
      emptyTitle="No reviews yet"
      emptySubtitle="Reviews from families will appear here"
      errorSubtitle={errorMessage}
      maintenanceSubtitle="Reviews are temporarily unavailable."
      onRetry={effectiveStatus === REVIEW_STATUS.ERROR || effectiveStatus === REVIEW_STATUS.MAINTENANCE ? handleRefresh : undefined}
      retryLabel="Retry"
      iconOverrides={{ empty: 'star-outline' }}
      testID="caregiver-reviews-tab"
    >
      <FlatList
        data={reviews}
        keyExtractor={(item, index) => item.id?.toString() ?? `${item.reviewerId ?? 'review'}-${index}`}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl
            refreshing={status === REVIEW_STATUS.LOADING}
            onRefresh={handleRefresh}
            colors={['#2563EB']}
            tintColor="#2563EB"
          />
        }
        contentContainerStyle={reviews.length ? styles.listContent : styles.emptyList}
      />
    </DashboardDataState>
  );
};

const styles = StyleSheet.create({
  listContent: {
    padding: 16,
  },
  emptyList: {
    flexGrow: 1,
  },
  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingText: {
    fontWeight: '700',
    marginLeft: 6,
    marginRight: 12,
    color: '#1F2937',
  },
  reviewerName: {
    fontWeight: '600',
    color: '#374151',
    flex: 1,
  },
  comment: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 12,
  },
  timestamp: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});

export default ReviewsTab;
