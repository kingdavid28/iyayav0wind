import React, { useEffect, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from 'react-native-paper';
import { useAuth } from '../../../contexts/AuthContext';
import { useMessaging } from '../../../contexts/MessagingContext';
import { styles } from '../../styles/CaregiverDashboard.styles';

const MessagesTab = ({ navigation, refreshing, onRefresh }) => {
  const { user } = useAuth();
  const { conversations, conversationsLoading, subscribeToConversations, markMessagesAsRead } = useMessaging();

  useEffect(() => {
    const userIdToUse = user?.id || user?.uid;
    if (!userIdToUse) return;

    subscribeToConversations(userIdToUse, 'caregiver');
    return () => subscribeToConversations(null);
  }, [user?.id, user?.uid, subscribeToConversations]);

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const diffInHours = (Date.now() - date.getTime()) / (1000 * 60 * 60);
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${Math.floor(diffInHours)}h ago`;
    return date.toLocaleDateString();
  };

  const handleConversationPress = async (conversation) => {
    const userIdToUse = user?.id || user?.uid;
    if (!userIdToUse) return;

    if (conversation.parentId) {
      const [id1, id2] = [userIdToUse, conversation.parentId].sort();
      const conversationId = `${id1}_${id2}`;
      await markMessagesAsRead(userIdToUse, conversation.parentId, conversationId);
    }

    navigation.navigate('Chat', {
      userId: userIdToUse,
      userType: 'caregiver',
      targetUserId: conversation.parentId,
      targetUserName: conversation.parentName,
      targetUserType: 'parent',
    });
  };

  const renderConversationItem = ({ item }) => (
    <TouchableOpacity onPress={() => handleConversationPress(item)}>
      <View style={messageStyles.conversationItem}>
        <View style={messageStyles.conversationContent}>
          <View style={messageStyles.avatarContainer}>
            {item.parentAvatar ? (
              <Image source={{ uri: item.parentAvatar }} style={messageStyles.avatar} />
            ) : (
              <View style={messageStyles.defaultAvatar}>
                <Ionicons name="person" size={24} color="#5bbafa" />
              </View>
            )}
            {!item.isRead && <View style={messageStyles.unreadDot} />}
          </View>

          <View style={messageStyles.messageInfo}>
            <View style={messageStyles.messageHeader}>
              <Text style={messageStyles.parentName}>{item.parentName || 'Parent'}</Text>
              <Text style={messageStyles.messageTime}>{formatTime(item.lastMessageTime)}</Text>
            </View>
            <Text
              style={[
                messageStyles.lastMessage,
                !item.isRead && messageStyles.unreadMessage,
              ]}
              numberOfLines={1}
            >
              {item.lastMessage}
            </Text>
          </View>

          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </View>
      </View>
    </TouchableOpacity>
  );

  const conversationData = useMemo(() => conversations || [], [conversations]);

  if (conversationsLoading && conversationData.length === 0) {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Card style={messageStyles.conversationsCard}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#5bbafa" />
            <Text style={styles.loadingText}>Loading conversations...</Text>
          </View>
        </Card>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <Card style={messageStyles.conversationsCard}>
        <FlatList
          data={conversationData}
          renderItem={renderConversationItem}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing || conversationsLoading}
              onRefresh={onRefresh}
              colors={['#5bbafa']}
              tintColor="#5bbafa"
            />
          }
          ListEmptyComponent={
            <View style={messageStyles.emptyState}>
              <Ionicons name="chatbubbles-outline" size={64} color="#D1D5DB" />
              <Text style={messageStyles.emptyTitle}>No conversations yet</Text>
              <Text style={messageStyles.emptySubtitle}>
                Start messaging parents to see conversations here
              </Text>
            </View>
          }
          contentContainerStyle={conversationData.length === 0 ? { flex: 1 } : undefined}
          showsVerticalScrollIndicator={false}
        />
      </Card>
    </KeyboardAvoidingView>
  );
};

const messageStyles = {
  conversationsCard: {
    flex: 1,
    margin: 8,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  conversationItem: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  conversationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  defaultAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#5bbafa',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  messageInfo: {
    flex: 1,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  parentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  messageTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  lastMessage: {
    fontSize: 14,
    color: '#6B7280',
  },
  unreadMessage: {
    fontWeight: '500',
    color: '#374151',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
};

export default MessagesTab;
