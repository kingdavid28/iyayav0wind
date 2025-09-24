// MessageCard.jsx - React Native Paper implementation
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Chip, Avatar } from 'react-native-paper';
import { format } from 'date-fns';

const MessageCard = ({ message, isOwn, showAvatar = false, senderName, senderAvatar }) => {
  const formatTime = (timestamp) => {
    try {
      return format(new Date(timestamp), 'HH:mm');
    } catch (error) {
      return '';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered':
        return '#4CAF50'; // Green
      case 'sent':
        return '#2196F3'; // Blue
      case 'read':
        return '#9C27B0'; // Purple
      default:
        return '#757575'; // Grey
    }
  };

  return (
    <View style={[
      styles.container,
      isOwn ? styles.ownContainer : styles.otherContainer
    ]}>
      {showAvatar && !isOwn && (
        <Avatar.Image
          size={40}
          source={senderAvatar ? { uri: senderAvatar } : null}
          style={styles.avatar}
        />
      )}

      <View style={[
        styles.bubbleContainer,
        isOwn ? styles.ownBubble : styles.otherBubble
      ]}>
        {showAvatar && !isOwn && senderName && (
          <Text variant="labelSmall" style={styles.senderName}>
            {senderName}
          </Text>
        )}

        <Card style={[
          styles.messageCard,
          isOwn ? styles.ownMessage : styles.otherMessage
        ]}>
          <Card.Content style={styles.cardContent}>
            <Text
              variant="bodyMedium"
              style={[
                styles.messageText,
                isOwn ? styles.ownText : styles.otherText
              ]}
            >
              {message.text}
            </Text>

            <View style={styles.footer}>
              <Text
                variant="caption"
                style={[
                  styles.timestamp,
                  isOwn ? styles.ownTimestamp : styles.otherTimestamp
                ]}
              >
                {formatTime(message.timestamp)}
              </Text>

              {isOwn && message.status && (
                <View style={styles.statusContainer}>
                  <Text
                    variant="caption"
                    style={[
                      styles.statusText,
                      { color: getStatusColor(message.status) }
                    ]}
                  >
                    {message.status}
                  </Text>
                  {message.status === 'delivered' && (
                    <Text style={[styles.checkIcon, { color: getStatusColor(message.status) }]}>
                      ✓✓
                    </Text>
                  )}
                  {message.status === 'read' && (
                    <Text style={[styles.checkIcon, { color: getStatusColor(message.status) }]}>
                      ✓✓
                    </Text>
                  )}
                </View>
              )}
            </View>

            {message.edited && (
              <Text variant="caption" style={styles.editedText}>
                (edited)
              </Text>
            )}
          </Card.Content>
        </Card>

        {message.type !== 'text' && (
          <Text variant="caption" style={styles.messageType}>
            {message.type}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginVertical: 4,
    paddingHorizontal: 16,
  },
  ownContainer: {
    justifyContent: 'flex-end',
  },
  otherContainer: {
    justifyContent: 'flex-start',
  },
  avatar: {
    marginRight: 8,
    marginBottom: 8,
  },
  bubbleContainer: {
    maxWidth: '75%',
    flexDirection: 'column',
  },
  ownBubble: {
    alignItems: 'flex-end',
  },
  otherBubble: {
    alignItems: 'flex-start',
  },
  senderName: {
    marginBottom: 4,
    fontWeight: '600',
    color: '#666',
  },
  messageCard: {
    elevation: 1,
    borderRadius: 18,
  },
  ownMessage: {
    backgroundColor: '#007AFF',
  },
  otherMessage: {
    backgroundColor: '#E5E5E5',
  },
  cardContent: {
    padding: 12,
    paddingBottom: 8,
  },
  messageText: {
    lineHeight: 20,
  },
  ownText: {
    color: '#FFFFFF',
  },
  otherText: {
    color: '#000000',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  timestamp: {
    fontSize: 11,
  },
  ownTimestamp: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  otherTimestamp: {
    color: 'rgba(0, 0, 0, 0.5)',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  statusText: {
    fontSize: 11,
    marginRight: 2,
  },
  checkIcon: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  editedText: {
    fontSize: 10,
    color: 'rgba(0, 0, 0, 0.4)',
    marginTop: 2,
    fontStyle: 'italic',
  },
  messageType: {
    fontSize: 10,
    color: 'rgba(0, 0, 0, 0.4)',
    marginTop: 2,
    fontStyle: 'italic',
  },
});

export default MessageCard;
