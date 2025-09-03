import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  
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
  
  list: {
    paddingVertical: 10,
  },
  
  emptyList: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 15,
    marginHorizontal: 10,
    marginVertical: 2,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  
  avatarContainer: {
    position: 'relative',
    marginRight: 15,
  },
  
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#3b83f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  
  unreadBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#ff4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  
  unreadBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  
  conversationContent: {
    flex: 1,
  },
  
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  
  participantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  
  lastMessageTime: {
    fontSize: 12,
    color: '#666',
    marginLeft: 10,
  },
  
  conversationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  lastMessage: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  
  unreadMessage: {
    fontWeight: '600',
    color: '#333',
  },
  
  jobIndicator: {
    marginLeft: 8,
    padding: 4,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
  },
  
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
});
