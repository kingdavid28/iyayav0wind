import React, { useEffect, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../contexts/AuthContext';
import { useMessaging } from '../../../contexts/MessagingContext';

const MessagesTab = ({ navigation, refreshing, onRefresh }) => {
  const { user } = useAuth();
  const {
    conversations,
    conversationsLoading,
    subscribeToConversations,
    markMessagesAsRead,
  } = useMessaging();

  useEffect(() => {
    const userIdToUse = user?.id || user?.uid;
    if (!userIdToUse) return;

    subscribeToConversations(userIdToUse, 'parent');
    return () => subscribeToConversations(null);
  }, [user?.id, user?.uid, subscribeToConversations]);

  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="chatbubble-ellipses-outline" size={64} color="#9CA3AF" />
      <Text style={styles.emptyTitle}>No conversations yet</Text>
      <Text style={styles.emptySubtitle}>
        Messages from families and caregivers will appear here
      </Text>
    </View>
  );

  const handleConversationPress = async (conversation) => {
    const userIdToUse = user?.id || user?.uid;
    if (!userIdToUse || !conversation?.caregiverId) return;

    const [id1, id2] = [userIdToUse, conversation.caregiverId].sort();
    const conversationId = `${id1}_${id2}`;
    await markMessagesAsRead(userIdToUse, conversation.caregiverId, conversationId);

    navigation.navigate('Chat', {
      userId: userIdToUse,
      userType: 'parent',
      targetUserId: conversation.caregiverId,
      targetUserName: conversation.caregiverName,
      targetUserType: 'caregiver',
    });
  };

  const ConversationItem = ({ item }) => (
    <TouchableOpacity style={styles.conversationItem} onPress={() => handleConversationPress(item)}>
      <View style={styles.avatar}>
        <Ionicons name="person-circle" size={40} color="#3B82F6" />
      </View>
      <View style={styles.conversationInfo}>
        <Text style={styles.conversationName}>{item.caregiverName || 'Caregiver'}</Text>
        <Text style={styles.lastMessage}>
          {item.lastMessage || 'No messages yet'}
        </Text>
      </View>
      <Text style={styles.timestamp}>
        {item.lastMessageTime ? new Date(item.lastMessageTime).toLocaleDateString() : ''}
      </Text>
    </TouchableOpacity>
  );

  const conversationData = useMemo(() => conversations || [], [conversations]);

  if (conversationsLoading && conversationData.length === 0) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading conversations...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={conversationData}
        renderItem={({ item }) => <ConversationItem item={item} />}
        keyExtractor={(item, index) => index.toString()}
        refreshing={refreshing || conversationsLoading}
        onRefresh={onRefresh}
        ListEmptyComponent={EmptyState}
        contentContainerStyle={conversationData.length === 0 ? styles.emptyList : undefined}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  emptyList: {
    flex: 1,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  avatar: {
    marginRight: 12,
  },
  conversationInfo: {
    flex: 1,
  },
  conversationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  timestamp: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
});

export default MessagesTab;
