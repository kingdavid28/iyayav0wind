import React, { useState, useEffect, useCallback } from 'react';
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
import { ArrowLeft, MessageSquare, User, Search, Send, Check, CheckCheck } from 'lucide-react-native';
import { collection, query, where, orderBy, onSnapshot, doc as firestoreDoc, updateDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { formatDistanceToNow } from 'date-fns';

const SAMPLE_CONVERSATIONS = [
  {
    id: 'sample-1',
    name: 'Sarah Johnson',
    lastMessage: 'Hi! Are you available this Saturday?',
    time: '2h ago',
    unread: true,
    unreadCount: 2,
    recipientId: 'sample-sarah',
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
  const currentUser = auth.currentUser;

  // Fetch conversations in real-time
  useEffect(() => {
    if (!currentUser) {
      // Fallback to sample conversations when not logged in
      setConversations(SAMPLE_CONVERSATIONS);
      setLoading(false);
      return;
    }

    const conversationsRef = collection(db, 'conversations');
    const q = query(
      conversationsRef,
      where('participants', 'array-contains', currentUser.uid),
      orderBy('lastUpdated', 'desc')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      try {
        const conversationsData = await Promise.all(
          snapshot.docs.map(async (snap) => {
            const data = snap.data();
            const otherParticipantId = data.participants?.find((id) => id !== currentUser.uid);
            let userData = null;
            if (otherParticipantId) {
              const userDoc = await getDoc(firestoreDoc(db, 'users', otherParticipantId));
              userData = userDoc.data();
            }

            return {
              id: snap.id,
              name: userData?.displayName || 'Unknown User',
              lastMessage: data?.lastMessage?.text || 'No messages yet',
              time: data?.lastUpdated?.toDate ? formatDistanceToNow(data.lastUpdated.toDate(), { addSuffix: true }) : 'Just now',
              unread: (data?.unreadCount?.[currentUser.uid] || 0) > 0,
              unreadCount: data?.unreadCount?.[currentUser.uid] || 0,
              recipientId: otherParticipantId || null,
              avatar: userData?.photoURL || null,
            };
          })
        );

        if (conversationsData.length === 0) {
          setConversations(SAMPLE_CONVERSATIONS);
        } else {
          setConversations(conversationsData);
        }
      } catch (e) {
        // If anything fails (permissions, missing collections), use samples
        setConversations(SAMPLE_CONVERSATIONS);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Mark conversation as read
  const markAsRead = async (conversationId) => {
    if (!currentUser) return;
    
    const conversationRef = firestoreDoc(db, 'conversations', conversationId);
    await updateDoc(conversationRef, {
      [`unreadCount.${currentUser.uid}`]: 0
    });
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
        navigation.navigate('Chat', { 
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
