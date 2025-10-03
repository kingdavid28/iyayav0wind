// MessageInput.jsx - React Native Paper message input component
import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Keyboard } from 'react-native';
import { ActivityIndicator, Badge } from 'react-native-paper';
import { Send, Paperclip } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';
import { useMessaging } from '../../contexts/MessagingContext';

const MessageInput = ({
  conversation,
  disabled = false,
  onSendMessage,
  onImagePick,
  onTyping,
  placeholder = "Type a message..."
}) => {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const { queueStatus } = useMessaging();

  const pendingCount = queueStatus?.pendingCount || 0;
  const failedCount = queueStatus?.failedCount || 0;
  const isOffline = queueStatus?.isOnline === false;
  const queueCount = failedCount > 0 ? failedCount : pendingCount;
  const hasQueueActivity = queueCount > 0;

  const handleTextChange = (text) => {
    setMessage(text);
    if (onTyping) {
      onTyping(text);
    }
  };

  const handleSend = async () => {
    if (!message.trim() || !conversation || sending || disabled) return;

    setSending(true);
    Keyboard.dismiss();

    try {
      if (onSendMessage) {
        await onSendMessage(message.trim());
      }
      setMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };
  const handleImagePick = async () => {
    if (onImagePick) {
      await onImagePick();
    } else {
      try {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });

        if (!result.canceled) {
          Alert.alert('Info', 'Image sharing feature coming soon!');
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to pick image');
      }
    }
  };

  if (!conversation) return null;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={handleImagePick}
        style={styles.attachButton}
        disabled={disabled || sending}
      >
        <Paperclip size={20} color={disabled || sending ? "#ccc" : "#666"} />
      </TouchableOpacity>

      <TextInput
        value={message}
        onChangeText={handleTextChange}
        placeholder={placeholder}
        style={[
          styles.textInput,
          (disabled || sending) && styles.textInputDisabled
        ]}
        multiline
        onSubmitEditing={handleSend}
        blurOnSubmit={false}
        disabled={disabled || sending}
      />

      <View style={styles.sendWrapper}>
        {hasQueueActivity && (
          <Badge
            style={[
              styles.queueBadge,
              failedCount > 0 ? styles.queueBadgeError : null,
            ]}
          >
            {queueCount}
          </Badge>
        )}
        <TouchableOpacity
          onPress={handleSend}
          disabled={!message.trim() || disabled || sending}
          style={[
            styles.sendButton,
            (!message.trim() || disabled || sending) && styles.sendButtonDisabled,
            isOffline ? styles.sendButtonOffline : null,
          ]}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Send size={20} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  attachButton: {
    padding: 12,
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
    backgroundColor: '#f5f5f5',
    fontSize: 16,
    textAlignVertical: 'top',
  },
  textInputDisabled: {
    backgroundColor: '#f0f0f0',
    color: '#999',
  },
  sendWrapper: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButton: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    padding: 12,
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
    width: 44,
    height: 44,
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  sendButtonOffline: {
    backgroundColor: '#5C6BC0',
  },
  queueBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#FFA000',
    color: '#000',
    zIndex: 2,
  },
  queueBadgeError: {
    backgroundColor: '#D32F2F',
    color: '#fff',
  },
});

export default MessageInput;
