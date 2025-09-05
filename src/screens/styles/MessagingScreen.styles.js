import { StyleSheet } from 'react-native';
import { baseStyles, colors, dimensions } from '../../utils/commonStyles';

export const styles = StyleSheet.create({
  container: baseStyles.container,
  
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  
  messagesList: {
    flex: 1,
  },
  
  messagesContent: {
    paddingVertical: 10,
  },
  
  loadingHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 15,
  },
  
  messageContainer: {
    flexDirection: 'row',
    marginVertical: 4,
    paddingHorizontal: 15,
  },
  
  ownMessage: {
    justifyContent: 'flex-end',
  },
  
  otherMessage: {
    justifyContent: 'flex-start',
  },
  
  avatarContainer: {
    marginRight: 10,
    alignSelf: 'flex-end',
  },
  
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3b83f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  avatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 18,
    marginBottom: 2,
  },
  
  ownMessageBubble: {
    backgroundColor: '#3b83f5',
    borderBottomRightRadius: 4,
  },
  
  otherMessageBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  
  ownMessageText: {
    color: '#fff',
  },
  
  otherMessageText: {
    color: '#333',
  },
  
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  
  messageTime: {
    fontSize: 11,
    color: '#999',
  },
  
  messageStatus: {
    marginLeft: 8,
  },
  
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
    maxHeight: 100,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3b83f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
});
