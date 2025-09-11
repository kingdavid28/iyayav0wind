import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  TouchableOpacity, 
  Alert,
  Keyboard,
  StatusBar,
  TextInput,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { GiftedChat, Bubble, Send, Time } from 'react-native-gifted-chat';
import { 
  ArrowLeft, 
  Paperclip, 
  Send as SendIcon, 
  Search, 
  X, 
  Image as ImageIcon,
  ChevronDown,
  ChevronRight,
  Clock,
  Check,
  CheckCheck
} from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import mime from 'mime';


// Platform-specific FileSystem import
const FileSystem = Platform.OS === 'web' ? null : require('expo-file-system');
// Firebase removed
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { useMessaging } from '../contexts/MessagingContext';

const MAX_FILE_SIZE_MB = 10;

export default function EnhancedChatScreen() {
  const { user: currentUser } = useAuth();
  const route = useRoute();
  const navigation = useNavigation();
  const { conversationId, recipientId, recipientName } = route.params || {};
  
  // State management
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [showAttachments, setShowAttachments] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Refs
  const giftedChatRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const { messages: ctxMessages, setActiveConversation, getOrCreateConversation, sendMessage, markMessagesAsRead, activeConversation, otherTyping, startTyping, stopTyping } = useMessaging();

  // Init conversation and map context messages
  useEffect(() => {
    const init = async () => {
      try {
        if (conversationId) {
          setActiveConversation({ id: conversationId, participants: [currentUser?.uid, recipientId].filter(Boolean) });
        } else if (recipientId) {
          await getOrCreateConversation(recipientId);
        }
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [conversationId, recipientId, currentUser?.uid, setActiveConversation, getOrCreateConversation]);

  const mappedMessages = useMemo(() => {
    return (ctxMessages || [])
      .slice()
      .sort((a, b) => new Date(b.createdAt || b.created_at) - new Date(a.createdAt || a.created_at))
      .map((m) => ({
        _id: m.id || m._id,
        text: m.content || m.text || '',
        createdAt: m.createdAt ? new Date(m.createdAt) : (m.created_at ? new Date(m.created_at) : new Date()),
        user: {
          _id: m.senderId || m.sender_id,
          name: m.senderName || m.sender_name || 'User',
          avatar: m.senderAvatar || m.sender_avatar,
        },
        sent: true,
        received: !!m.delivered || !!m.received,
        read: !!m.read,
        attachments: [],
      }));
  }, [ctxMessages]);

  useEffect(() => {
    setMessages(mappedMessages);
  }, [mappedMessages]);
  
  // Handle sending a message with attachments
  const onSend = useCallback(async (newMessages = []) => {
    if (isSending) return;
    const messageText = newMessages?.[0]?.text || '';
    if (!messageText.trim() && attachments.length === 0) return;
    try {
      setIsSending(true);
      // Prepare attachments as base64 payloads
      let prepared = [];
      if (attachments.length > 0) {
        if (Platform.OS === 'web' || !FileSystem) {
          console.warn('File attachments not supported on web platform');
          Alert.alert('Upload Error', 'File attachments are not supported on web platform');
          return;
        }
        
        const arr = [];
        for (const a of attachments) {
          try {
            const base64 = await FileSystem.readAsStringAsync(a.uri, { encoding: FileSystem.EncodingType.Base64 });
            arr.push({ base64, mimeType: a.type || 'application/octet-stream', name: a.name || 'file' });
          } catch (e) {
            console.warn('Failed to read attachment base64:', e?.message || e);
          }
        }
        prepared = arr;
      }

      await sendMessage({ text: messageText.trim(), attachments: prepared });
      setShowAttachments(false);
      setAttachments([]);
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  }, [isSending, attachments.length, sendMessage]);
  
  // Handle message search
  const handleSearch = useCallback((query) => {
    const q = (query || '').trim().toLowerCase();
    if (!q) { setSearchResults([]); return; }
    setIsSearching(true);
    try {
      const results = (ctxMessages || [])
        .filter((m) => (m.text || m.content || '').toLowerCase().includes(q))
        .map((m) => ({ id: m.id || m._id, text: m.text || m.content || '', senderId: m.senderId || m.sender_id, createdAt: m.createdAt || m.created_at }));
      setSearchResults(results);
    } finally {
      setIsSearching(false);
    }
  }, [ctxMessages]);
  
  // Handle search input changes with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        handleSearch(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [searchQuery, handleSearch]);

  // Handle typing indicator
  const handleInputTextChanged = useCallback((text) => {
    // Clear any existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set a new timeout to indicate typing stopped
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      stopTyping?.();
    }, 2000);
    
    // Only set typing to true if it wasn't already
    if (!isTyping) {
      setIsTyping(true);
      startTyping?.();
    }
  }, [isTyping]);

  // Handle image selection from gallery
  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Please grant camera roll permissions to upload images.');
        return;
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: [ImagePicker.MediaType.Images],
        allowsEditing: false,
        quality: 0.8,
        allowsMultipleSelection: true
      });
      
      if (!result.canceled) {
        const selectedImages = result.assets || [result];
        const newAttachments = selectedImages.map(asset => ({
          uri: asset.uri,
          type: mime.getType(asset.uri) || 'image/jpeg',
          name: asset.uri.split('/').pop() || `image-${Date.now()}.jpg`,
          isImage: true
        }));
        
        setAttachments(prev => [...prev, ...newAttachments]);
        setShowAttachments(true);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  };

  // Handle document selection
  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
        multiple: true
      });
      
      if (result.type === 'success') {
        const selectedDocs = result.assets || [result];
        const newAttachments = [];
        
        for (const doc of selectedDocs) {
          // Check file size (skip on web)
          let fileInfo = { size: 0 };
          if (Platform.OS !== 'web' && FileSystem) {
            fileInfo = await FileSystem.getInfoAsync(doc.uri);
            const fileSizeMB = fileInfo.size / (1024 * 1024);
            
            if (fileSizeMB > MAX_FILE_SIZE_MB) {
              Alert.alert('File too large', `File size exceeds ${MAX_FILE_SIZE_MB}MB limit.`);
              continue;
            }
          }
          
          newAttachments.push({
            uri: doc.uri,
            type: mime.getType(doc.uri) || 'application/octet-stream',
            name: doc.name || `file-${Date.now()}`,
            isImage: false,
            size: fileInfo.size
          });
        }
        
        if (newAttachments.length > 0) {
          setAttachments(prev => [...prev, ...newAttachments]);
          setShowAttachments(true);
        }
      }
    } catch (error) {
      if (!error.canceled) {
        console.error('Error picking document:', error);
        Alert.alert('Error', 'Failed to select document. Please try again.');
      }
    }
  };

  // Remove an attachment
  const removeAttachment = (index) => {
    const newAttachments = [...attachments];
    newAttachments.splice(index, 1);
    setAttachments(newAttachments);
    if (newAttachments.length === 0) {
      setShowAttachments(false);
    }
  };

  // Render attachment preview with improved UI
  const renderAttachmentPreview = () => (
    <View style={styles.attachmentsContainer}>
      <View style={styles.attachmentsScroll} horizontal showsHorizontalScrollIndicator={false}>
        <TouchableOpacity 
          style={[
            styles.addAttachmentButton,
            isSending && styles.addAttachmentButtonDisabled
          ]}
          onPress={isSending ? undefined : pickImage}
          disabled={isSending}
        >
          <ImageIcon size={24} color={isSending ? '#d1d5db' : '#6b7280'} />
        </TouchableOpacity>
        
        {attachments.map((attachment, index) => (
          <View key={index} style={styles.attachmentPreview}>
            {attachment.isImage ? (
              <Image 
                source={{ uri: attachment.uri }} 
                style={styles.attachmentImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.fileAttachmentPreview}>
                <Paperclip size={20} color="#6b7280" style={styles.fileIcon} />
                <View style={styles.fileInfoContainer}>
                  <Text style={styles.fileName} numberOfLines={1}>
                    {attachment.name}
                  </Text>
                  <Text style={styles.fileSize}>
                    {(attachment.size / 1024).toFixed(1)} KB
                  </Text>
                </View>
              </View>
            )}
            <TouchableOpacity 
              style={styles.removeAttachmentButton}
              onPress={() => !isSending && removeAttachment(index)}
              disabled={isSending}
            >
              <X size={16} color="#ffffff" />
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </View>
  );

  // Render custom input toolbar with attachment options
  const renderInputToolbar = (props) => (
    <View style={styles.inputToolbarContainer}>
      {showAttachments && renderAttachmentPreview()}
      <View style={styles.inputContainer}>
        <TouchableOpacity 
          style={styles.attachmentButton}
          onPress={pickDocument}
        >
          <Paperclip size={24} color="#6b7280" />
        </TouchableOpacity>
        
        <TextInput
          {...props.textInputProps}
          style={styles.textInput}
          placeholder="Type a message..."
          placeholderTextColor="#9ca3af"
          multiline
          onChangeText={(text) => {
            handleInputTextChanged(text);
            props.onTextChanged?.(text);
          }}
        />
        
        <TouchableOpacity 
          style={styles.searchButton}
          onPress={() => setShowSearch(true)}
        >
          <Search size={24} color="#6b7280" />
        </TouchableOpacity>
        
        {renderSend({ ...props, text: props.text, onSend: props.onSend })}
      </View>
    </View>
  );

  // Render search overlay with improved UI
  const renderSearchOverlay = () => {
    if (!showSearch) return null;
    
    return (
      <View style={styles.searchOverlay}>
        <View style={styles.searchHeader}>
          <View style={styles.searchInputContainer}>
            <Search size={20} color="#9ca3af" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search messages..."
              placeholderTextColor="#9ca3af"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              onSubmitEditing={() => handleSearch(searchQuery)}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity 
                style={styles.clearSearchButton}
                onPress={() => setSearchQuery('')}
              >
                <X size={18} color="#9ca3af" />
              </TouchableOpacity>
            )}
          </View>
          
          <TouchableOpacity 
            style={styles.closeSearchButton}
            onPress={() => {
              setShowSearch(false);
              setSearchQuery('');
              setSearchResults([]);
            }}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
        
        {isSearching ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#3b82f6" />
            <Text style={styles.loadingText}>Searching messages...</Text>
          </View>
        ) : searchResults.length > 0 ? (
          <FlatList
            data={searchResults}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.searchResultItem}
                onPress={() => {
                  // Scroll to the selected message
                  const messageIndex = messages.findIndex(msg => msg._id === item.id);
                  if (messageIndex !== -1) {
                    giftedChatRef.current?.scrollToIndex({
                      index: messageIndex,
                      animated: true,
                      viewPosition: 0.5
                    });
                    setShowSearch(false);
                  }
                }}
              >
                <View style={styles.searchResultContent}>
                  <Text style={styles.searchResultText}>
                    {item.text}
                  </Text>
                  <View style={styles.searchResultMeta}>
                    <Text style={styles.searchResultSender}>
                      {item.senderId === currentUser.uid ? 'You' : recipientName}
                    </Text>
                    <Text style={styles.searchResultDate}>
                      {new Date(item.createdAt).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Text>
                  </View>
                </View>
                <ChevronRight size={18} color="#d1d5db" />
              </TouchableOpacity>
            )}
            style={styles.searchResultsList}
            keyboardShouldPersistTaps="handled"
          />
        ) : searchQuery ? (
          <View style={styles.noResultsContainer}>
            <Search size={48} color="#d1d5db" style={styles.noResultsIcon} />
            <Text style={styles.noResultsTitle}>No results found</Text>
            <Text style={styles.noResultsText}>
              We couldn't find any messages matching "{searchQuery}"
            </Text>
          </View>
        ) : (
          <View style={styles.searchPlaceholder}>
            <Search size={48} color="#d1d5db" style={styles.searchPlaceholderIcon} />
            <Text style={styles.searchPlaceholderText}>
              Search for messages in this conversation
            </Text>
            <Text style={styles.searchPlaceholderHint}>
              Messages will appear here as you type
            </Text>
          </View>
        )}
      </View>
    );
  };

  // Render custom message bubble with improved styling
  const renderBubble = (props) => {
    const isCurrentUser = props.currentMessage.user._id === currentUser.uid;
    const hasAttachments = props.currentMessage.attachments?.length > 0;
    const isFirstInGroup = props.isFirstInGroup;
    const isLastInGroup = props.isLastInGroup;
    
    return (
      <View style={[
        styles.bubbleContainer,
        isCurrentUser ? styles.bubbleContainerRight : styles.bubbleContainerLeft,
        isFirstInGroup && styles.bubbleFirstInGroup,
        isLastInGroup && styles.bubbleLastInGroup
      ]}>
        {!isCurrentUser && isFirstInGroup && (
          <Image 
            source={{ uri: props.currentMessage.user.avatar }} 
            style={styles.avatar}
            defaultSource={require('../../assets/avatar-placeholder.png')}
          />
        )}
        
        <View style={[
          styles.bubbleContent,
          isCurrentUser ? styles.bubbleRight : styles.bubbleLeft,
          hasAttachments && styles.bubbleWithAttachments
        ]}>
          {!isCurrentUser && isFirstInGroup && (
            <Text style={styles.senderName}>
              {props.currentMessage.user.name || 'User'}
            </Text>
          )}
          
          {hasAttachments && (
            <View style={styles.messageAttachments}>
              {props.currentMessage.attachments.map((attachment, index) => (
                <View key={index} style={styles.messageAttachment}>
                  {attachment.type?.startsWith('image/') ? (
                    <Image 
                      source={{ uri: attachment.url }} 
                      style={styles.attachmentImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.fileAttachment}>
                      <Paperclip size={16} color="#6b7280" />
                      <Text style={styles.fileName} numberOfLines={1}>
                        {attachment.name || 'File'}
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
          
          {props.currentMessage.text ? (
            <View style={styles.messageTextContainer}>
              <Text style={[
                styles.messageText,
                isCurrentUser ? styles.messageTextRight : styles.messageTextLeft
              ]}>
                {props.currentMessage.text}
              </Text>
            </View>
          ) : null}
          
          <View style={styles.messageFooter}>
            <Text style={[
              styles.timeText,
              isCurrentUser ? styles.timeTextRight : styles.timeTextLeft
            ]}>
              {new Date(props.currentMessage.createdAt).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </Text>
            
            {isCurrentUser && (
              <View style={styles.statusContainer}>
                {props.currentMessage.read ? (
                  <CheckCheck size={14} color="#60a5fa" />
                ) : props.currentMessage.received ? (
                  <Check size={14} color="#9ca3af" />
                ) : (
                  <View style={styles.sendingIndicator} />
                )}
              </View>
            )}
          </View>
        </View>
        
        {isCurrentUser && isFirstInGroup && (
          <View style={styles.avatarPlaceholder} />
        )}
      </View>
    );
  };

  // Render custom send button with improved styling
  const renderSend = (props) => {
    const isDisabled = isSending || (!props.text?.trim() && attachments.length === 0);
    
    return (
      <Send
        {...props}
        containerStyle={styles.sendContainer}
        disabled={isDisabled}
        alwaysShowSend={false}
      >
        <View style={[
          styles.sendButton,
          isDisabled ? styles.sendButtonDisabled : null,
          isSending && styles.sendButtonSending
        ]}>
          {isSending ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <SendIcon size={20} color="#ffffff" />
          )}
        </View>
      </Send>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={24} color="#111827" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {recipientName}
          </Text>
          {otherTyping && (
            <Text style={styles.typingText}>typing...</Text>
          )}
        </View>
        <TouchableOpacity 
          style={styles.searchHeaderButton}
          onPress={() => setShowSearch(true)}
        >
          <Search size={24} color="#6b7280" />
        </TouchableOpacity>
      </View>

      <GiftedChat
        messages={messages}
        onSend={onSend}
        user={{
          _id: currentUser.uid,
          name: currentUser.displayName || 'User',
          avatar: currentUser.photoURL
        }}
        renderBubble={renderBubble}
        renderSend={renderSend}
        renderInputToolbar={renderInputToolbar}
        alwaysShowSend
        scrollToBottom
        placeholder="Type a message..."
        isLoadingEarlier={isLoading}
        onInputTextChanged={handleInputTextChanged}
        textInputProps={{
          maxLength: 2000,
          returnKeyType: 'send',
        }}
        listViewProps={{
          keyboardDismissMode: showSearch ? 'on-drag' : 'none',
        }}
      />
      
      {renderSearchOverlay()}
    </View>
  );
}

const styles = StyleSheet.create({
  // Main container
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  
  // Header styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    zIndex: 10,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
    borderRadius: 20,
  },
  headerContent: {
    flex: 1,
    marginLeft: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111827',
  },
  typingText: {
    fontSize: 13,
    color: '#3b82f6',
    marginTop: 2,
    fontStyle: 'italic',
  },
  searchHeaderButton: {
    padding: 8,
    borderRadius: 20,
  },
  
  // Message list container
  messageListContainer: {
    flex: 1,
    paddingHorizontal: 12,
  },
  
  // Message bubble styles
  bubbleContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 4,
    maxWidth: '80%',
  },
  bubbleContainerLeft: {
    alignSelf: 'flex-start',
  },
  bubbleContainerRight: {
    alignSelf: 'flex-end',
  },
  bubbleFirstInGroup: {
    marginTop: 12,
  },
  bubbleLastInGroup: {
    marginBottom: 8,
  },
  bubbleContent: {
    borderRadius: 18,
    padding: 12,
    maxWidth: '100%',
  },
  bubbleLeft: {
    backgroundColor: '#ffffff',
    borderBottomLeftRadius: 4,
    marginLeft: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  bubbleRight: {
    backgroundColor: '#3b82f6',
    borderBottomRightRadius: 4,
    marginRight: 8,
  },
  bubbleWithAttachments: {
    padding: 8,
  },
  
  // Avatar
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 8,
    backgroundColor: '#e5e7eb',
  },
  avatarPlaceholder: {
    width: 36,
    marginLeft: 8,
  },
  
  // Message content
  senderName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4b5563',
    marginBottom: 4,
  },
  messageTextContainer: {
    marginBottom: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  messageTextLeft: {
    color: '#111827',
  },
  messageTextRight: {
    color: '#ffffff',
  },
  
  // Message attachments
  messageAttachments: {
    marginBottom: 8,
  },
  messageAttachment: {
    marginBottom: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  fileAttachment: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 8,
  },
  
  // Message footer (time + status)
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  timeText: {
    fontSize: 11,
    marginRight: 4,
  },
  timeTextLeft: {
    color: '#9ca3af',
  },
  timeTextRight: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sendingIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  
  // Input toolbar
  inputToolbarContainer: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    backgroundColor: '#ffffff',
    paddingBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    maxHeight: 120,
    minHeight: 40,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    marginRight: 8,
    lineHeight: 20,
  },
  
  // Attachment button
  attachmentButton: {
    padding: 8,
    marginRight: 4,
    borderRadius: 20,
  },
  
  // Search button
  searchButton: {
    padding: 8,
    marginRight: 4,
    borderRadius: 20,
  },
  
  // Send button
  sendContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  sendButtonDisabled: {
    backgroundColor: '#d1d5db',
    shadowColor: 'transparent',
  },
  sendButtonSending: {
    backgroundColor: '#93c5fd',
  },
  
  // Attachments preview
  attachmentsContainer: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f9fafb',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  attachmentsScroll: {
    flexDirection: 'row',
  },
  addAttachmentButton: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  addAttachmentButtonDisabled: {
    opacity: 0.6,
  },
  attachmentPreview: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginRight: 8,
    overflow: 'hidden',
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  attachmentImage: {
    width: '100%',
    height: '100%',
  },
  fileAttachmentPreview: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  fileInfoContainer: {
    alignItems: 'center',
    marginTop: 4,
  },
  fileName: {
    fontSize: 10,
    color: '#4b5563',
    textAlign: 'center',
    fontWeight: '500',
  },
  fileSize: {
    fontSize: 9,
    color: '#9ca3af',
    marginTop: 2,
  },
  fileIcon: {
    marginBottom: 4,
  },
  removeAttachmentButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  
  // Search overlay
  searchOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#ffffff',
    zIndex: 1000,
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: '#111827',
    padding: 0,
  },
  clearSearchButton: {
    padding: 4,
    marginLeft: 8,
  },
  closeSearchButton: {
    padding: 8,
    marginLeft: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#3b82f6',
    fontWeight: '500',
  },
  
  // Search results
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    color: '#6b7280',
    fontSize: 14,
  },
  searchResultsList: {
    flex: 1,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  searchResultContent: {
    flex: 1,
    marginRight: 8,
  },
  searchResultText: {
    fontSize: 16,
    color: '#111827',
    marginBottom: 4,
    lineHeight: 22,
  },
  searchResultMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchResultSender: {
    fontSize: 13,
    color: '#3b82f6',
    marginRight: 8,
    fontWeight: '500',
  },
  searchResultDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  
  // No results/empty states
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  noResultsIcon: {
    marginBottom: 16,
    opacity: 0.5,
  },
  noResultsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  noResultsText: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  
  // Search placeholder
  searchPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  searchPlaceholderIcon: {
    marginBottom: 16,
    opacity: 0.5,
  },
  searchPlaceholderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
    textAlign: 'center',
  },
  searchPlaceholderHint: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
});
