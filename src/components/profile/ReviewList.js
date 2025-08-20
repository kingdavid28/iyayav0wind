import React from 'react';
import { View, StyleSheet, FlatList, Image } from 'react-native';
import { Text, Avatar, Divider, useTheme } from 'react-native-paper';
import { Rating } from 'react-native-ratings';
import { format } from 'date-fns';

const ReviewList = ({ reviews, currentUserId }) => {
  const theme = useTheme();

  const renderReview = ({ item }) => {
    const isCurrentUser = item.reviewerId === currentUserId;
    
    return (
      <View style={styles.reviewContainer}>
        <View style={styles.reviewHeader}>
          <Avatar.Image 
            size={40} 
            source={item.reviewerAvatar ? { uri: item.reviewerAvatar } : require('../../../assets/default-avatar.png')}
            style={styles.avatar}
          />
          <View style={styles.reviewerInfo}>
            <Text style={styles.reviewerName}>
              {isCurrentUser ? 'You' : item.reviewerName}
            </Text>
            <Text style={styles.reviewDate}>
              {format(new Date(item.createdAt), 'MMM d, yyyy')}
            </Text>
          </View>
          <View style={styles.ratingContainer}>
            <Rating
              type="star"
              ratingCount={5}
              imageSize={16}
              readonly
              startingValue={item.rating}
              style={styles.ratingStars}
            />
          </View>
        </View>
        
        {item.comment && (
          <Text style={styles.comment}>{item.comment}</Text>
        )}
        
        {item.images && item.images.length > 0 && (
          <FlatList
            horizontal
            data={item.images}
            keyExtractor={(_, index) => `image-${index}`}
            renderItem={({ item: imageUri }) => (
              <Image 
                source={{ uri: imageUri }} 
                style={styles.reviewImage}
                resizeMode="cover"
              />
            )}
            contentContainerStyle={styles.imagesContainer}
            showsHorizontalScrollIndicator={false}
          />
        )}
        
        <Divider style={[styles.divider, { backgroundColor: theme.colors.surfaceVariant }]} />
      </View>
    );
  };

  return (
    <FlatList
      data={reviews}
      renderItem={renderReview}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.container}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No reviews yet</Text>
        </View>
      }
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
  },
  reviewContainer: {
    marginBottom: 16,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatar: {
    marginRight: 12,
    backgroundColor: '#f0f0f0',
  },
  reviewerInfo: {
    flex: 1,
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  reviewDate: {
    fontSize: 12,
    color: '#666',
  },
  ratingContainer: {
    alignItems: 'flex-end',
  },
  ratingStars: {
    alignSelf: 'flex-start',
  },
  comment: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
    color: '#333',
  },
  imagesContainer: {
    marginBottom: 12,
  },
  reviewImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginRight: 8,
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
  },
});

export default ReviewList;
