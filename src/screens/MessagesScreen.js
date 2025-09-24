import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
} from 'react-native';
import { Text, Surface, ActivityIndicator } from 'react-native-paper';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useAuth } from '../core/contexts/AuthContext';
import ConversationList from '../components/messaging/ConversationList';
import ChatScreen from '../components/messaging/ChatScreen';

const MessagesScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { user } = useAuth();

  const { conversationId, recipientId, recipientName, recipientAvatar } = route.params || {};
  const [selectedConversation, setSelectedConversation] = useState(null);

  // If we have a conversationId, show the chat screen directly
  if (conversationId) {
    return (
      <ChatScreen
        conversationId={conversationId}
        recipientId={recipientId}
        recipientName={recipientName}
        recipientAvatar={recipientAvatar}
      />
    );
  }

  // Otherwise show the conversation list
  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
    // Navigate to ChatScreen with conversation details
    navigation.navigate('ChatScreen', {
      conversationId: conversation.id,
      recipientId: conversation.otherUserId,
      recipientName: conversation.recipientName,
      recipientAvatar: conversation.recipientAvatar,
    });
  };

  return (
    <View style={styles.container}>
      <ConversationList
        onSelectConversation={handleSelectConversation}
        selectedConversation={selectedConversation}
        navigation={navigation}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});

export default MessagesScreen;
