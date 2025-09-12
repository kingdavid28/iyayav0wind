import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  FlatList, 
  TouchableOpacity, 
  TextInput,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { ArrowLeft, MessageSquare, User, Search } from 'lucide-react-native';
import { messagesAPI } from '../config/api';
import { useMessaging } from '../contexts/MessagingContext';
import { useAuth } from '../core/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';

const SAMPLE_CONVERSATIONS = [
  {
    id: 'sample-1',
    name: 'Ana Dela Cruz',
    lastMessage: 'Hi! Are you available this Saturday?',
    time: '2h ago',
    unread: true,
    unreadCount: 2,
    recipientId: 'sample-ana',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop',
  },
  {
    id: 'sample-2',
    name: 'Maria Reyes',
    lastMessage: 'Thanks! See you tomorrow at 9am.',
    time: '1d ago',
    unread: false,
    unreadCount: 0,
    recipientId: 'sample-maria',
    avatar: 'https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?w=200&h=200&fit=crop',
  },
];

const Messages = () => {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user: currentUser } = useAuth();
  const { conversations: apiConversations, loading: apiLoading } = useMessaging();

  // Fetch conversations via MessagingContext (API-only)
  useEffect(() => {
    // Map API conversations to UI shape
    const mapApi = (list = []) =>
      list.map((c) => {
        const otherId = Array.isArray(c.participants)
          ? c.participants.find((id) => id !== currentUser?._id && id !== currentUser?.id && id !== currentUser?.uid)
          : null;
        const lm = c.lastMessage || c.last_message || {};
        const lmText = lm.text || lm.content || lm.body || 'No messages yet';
        const updatedAt = c.updatedAt || c.updated_at || lm.createdAt || lm.created_at || c.createdAt || c.created_at;
        let time = 'Just now';
        try {
          const d = updatedAt ? new Date(updatedAt) : new Date();
          time = formatDistanceToNow(d, { addSuffix: true });
        } catch (error) {
          console.warn('Time format error:', error);
        }
        const senderId = lm.senderId || lm.sender_id;
        const currentId = currentUser?._id || currentUser?.id || currentUser?.uid;
        const unread = lm && !lm.read && senderId && currentId && senderId !== currentId;
        return {
          id: c.id || c._id,
          name: c.title || c.name || 'Conversation',
          lastMessage: lmText,
          time,
          unread: !!unread,
          unreadCount: unread ? 1 : 0,
          recipientId: otherId,
          avatar: c.avatar || null,
        };
      });

    const mapped = mapApi(apiConversations || []);
    if (!apiLoading && mapped.length === 0) {
      setConversations(SAMPLE_CONVERSATIONS);
    } else {
      setConversations(mapped);
    }
    setLoading(apiLoading && mapped.length === 0);
  }, [currentUser?._id, currentUser?.id, currentUser?.uid, apiConversations, apiLoading]);

  // Mark conversation as read
  const markAsRead = async (conversationId) => {
    if (!currentUser) return;
    // REST: best-effort server call and optimistic UI update
    try { await messagesAPI.markRead(conversationId); } catch (error) {
      console.warn('Mark read error:', error);
    }
    setConversations((prev) => prev.map((c) => c.id === conversationId ? { ...c, unread: false, unreadCount: 0 } : c));
  };

  // Filter conversations based on search query
  const filteredConversations = conversations.filter((conversation) => {
    const q = searchQuery.toLowerCase();
    return (
      (conversation.name || '').toLowerCase().includes(q) ||
      (conversation.lastMessage || '').toLowerCase().includes(q)
    );
  });

  const renderConversation = ({ item }) => (
    <TouchableOpacity 
      style={styles.conversationItem}
      onPress={() => {
        markAsRead(item.id);
        navigation.navigate('Messaging', { 
          conversationId: item.id,
          recipientName: item.name,
          recipientId: item.recipientId || item.id
        });
      }}
    >
      <View style={styles.avatar}>
        {item.avatar ? (
          <Image source={{ uri: item.avatar }} style={styles.avatarImage} />
        ) : (
          <User size={24} color="#6b7280" />
        )}
      </View>
      <View style={styles.conversationContent}>
        <View style={styles.conversationHeader}>
          <Text style={styles.conversationName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={[
            styles.conversationTime,
            item.unread && styles.unreadTime
          ]}>
            {item.time}
          </Text>
        </View>
        <View style={styles.messagePreview}>
          <Text 
            style={[
              styles.conversationMessage,
              item.unread && styles.unreadMessage
            ]}
            numberOfLines={1}
          >
            {item.lastMessage}
          </Text>
          {item.unread ? (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>
                {item.unreadCount || ''}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Messages</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Search size={20} color="#9ca3af" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search conversations..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#9ca3af"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity 
            style={styles.clearSearchButton}
            onPress={() => setSearchQuery('')}
          >
            <Text style={styles.clearSearchText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Conversation List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      ) : filteredConversations.length === 0 ? (
        <View style={styles.emptyState}>
          <MessageSquare size={48} color="#d1d5db" />
          <Text style={styles.emptyStateText}>
            {searchQuery ? 'No matching conversations found' : 'No conversations yet'}
          </Text>
          {!searchQuery && (
            <Text style={styles.emptyStateSubtext}>
              Start a new conversation to see it here
            </Text>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredConversations}
          renderItem={renderConversation}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.conversationList}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  headerRight: {
    width: 40,
  },
  conversationList: {
    padding: 8,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#f9fafb',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  conversationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  conversationTime: {
    fontSize: 12,
    color: '#6b7280',
  },
  conversationMessage: {
    fontSize: 14,
    color: '#6b7280',
  },
  unreadMessage: {
    fontWeight: '600',
    color: '#111827',
  },
  // Added missing styles referenced by the component
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    margin: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
    paddingVertical: 6,
  },
  clearSearchButton: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  clearSearchText: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyStateText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  emptyStateSubtext: {
    marginTop: 4,
    fontSize: 13,
    color: '#9ca3af',
  },
  unreadTime: {
    color: '#111827',
    fontWeight: '600',
  },
  unreadBadge: {
    marginLeft: 8,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
});

export default Messages;
