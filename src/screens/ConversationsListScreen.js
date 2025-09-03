import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import messagingService from '../services/messagingService';
import { useApi } from '../hooks/useApi';
import { formatDistanceToNow } from 'date-fns';
import { styles } from './styles/ConversationsListScreen.styles';

const ConversationsListScreen = () => {
  const navigation = useNavigation();
  const [conversations, setConversations] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const {
    data: conversationsData,
    loading,
    error,
    execute: loadConversations,
  } = useApi();

  // Load conversations when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchConversations();
    }, [])
  );

  const fetchConversations = async () => {
    try {
      const result = await loadConversations(() =>
        messagingService.getConversations()
      );

      if (result) {
        setConversations(result);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load conversations');
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchConversations();
    setRefreshing(false);
  };

  const handleConversationPress = (conversation) => {
    const otherParticipant = conversation.participants.find(
      p => p._id !== conversation.currentUserId
    );

    navigation.navigate('MessagingScreen', {
      conversationId: conversation._id,
      recipientName: otherParticipant?.name || 'Unknown User',
    });
  };

  const renderConversation = ({ item: conversation }) => {
    const otherParticipant = conversation.participants.find(
      p => p._id !== conversation.currentUserId
    );

    const lastMessageText = conversation.lastMessage?.text || 'No messages yet';
    const lastMessageTime = conversation.lastMessage?.createdAt 
      ? formatDistanceToNow(new Date(conversation.lastMessage.createdAt), { addSuffix: true })
      : '';

    return (
      <TouchableOpacity
        style={styles.conversationItem}
        onPress={() => handleConversationPress(conversation)}
      >
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {otherParticipant?.name?.charAt(0) || '?'}
            </Text>
          </View>
          {conversation.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>
                {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <Text style={styles.participantName}>
              {otherParticipant?.name || 'Unknown User'}
            </Text>
            {lastMessageTime && (
              <Text style={styles.lastMessageTime}>
                {lastMessageTime}
              </Text>
            )}
          </View>

          <View style={styles.conversationFooter}>
            <Text 
              style={[
                styles.lastMessage,
                conversation.unreadCount > 0 && styles.unreadMessage
              ]}
              numberOfLines={1}
            >
              {lastMessageText}
            </Text>
            
            {conversation.jobId && (
              <View style={styles.jobIndicator}>
                <Ionicons name="briefcase" size={12} color="#666" />
              </View>
            )}
          </View>
        </View>

        <Ionicons name="chevron-forward" size={20} color="#ccc" />
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="chatbubbles-outline" size={64} color="#ccc" />
      <Text style={styles.emptyTitle}>No conversations yet</Text>
      <Text style={styles.emptySubtitle}>
        Start messaging with caregivers or parents to see your conversations here
      </Text>
    </View>
  );

  if (loading && conversations.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b83f5" />
        <Text style={styles.loadingText}>Loading conversations...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={conversations}
        keyExtractor={(item) => item._id}
        renderItem={renderConversation}
        contentContainerStyle={conversations.length === 0 ? styles.emptyList : styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#3b83f5']}
            tintColor="#3b83f5"
          />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

export default ConversationsListScreen;
