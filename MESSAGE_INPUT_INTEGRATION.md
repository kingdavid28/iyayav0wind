// MESSAGE_INPUT_INTEGRATION.md - MessageInput Component Integration Guide

## MessageInput Component Integration

### Overview
The MessageInput component is a reusable React Native Paper component that provides a complete message input interface with typing indicators, image attachment support, and real-time messaging capabilities.

### Features
- ✅ **Real-time typing indicators** with Firebase integration
- ✅ **Image attachment** support (placeholder for future implementation)
- ✅ **Message validation** and error handling
- ✅ **Keyboard management** with proper dismissal
- ✅ **Loading states** during message sending
- ✅ **Customizable placeholder** text
- ✅ **Disabled state** support for loading/error states
- ✅ **Material Design** styling with React Native Paper

### Basic Usage

```javascript
import MessageInput from '../components/messaging/MessageInput';

<MessageInput
  conversation={conversation}
  disabled={loading || sending}
  onSendMessage={handleSendMessage}
  onImagePick={handleImagePick}
  onTyping={handleTyping}
  placeholder="Type a message..."
/>
```

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `conversation` | Object | Yes | Conversation object with `id`, `otherUserId`, `recipientName`, `recipientAvatar` |
| `disabled` | Boolean | No | Disables input when true (default: false) |
| `onSendMessage` | Function | Yes | Callback function to handle message sending |
| `onImagePick` | Function | No | Callback function for image selection |
| `onTyping` | Function | No | Callback function for typing indicators |
| `placeholder` | String | No | Placeholder text for input field (default: "Type a message...") |

### Integration Example

**ChatScreen Integration:**
```javascript
const ChatScreen = () => {
  // Create conversation object
  const conversation = conversationId ? {
    id: conversationId,
    otherUserId: recipientId,
    recipientName,
    recipientAvatar,
  } : null;

  // Handle message sending
  const handleSendMessage = async (messageText) => {
    try {
      await messagingService.sendMessage(recipientId, messageText);
      // Message sent successfully
    } catch (error) {
      Alert.alert('Error', 'Failed to send message');
    }
  };

  // Handle typing indicators
  const handleTyping = useCallback((text) => {
    if (text.trim()) {
      messagingService.setTypingStatus(conversationId, true);
    } else {
      messagingService.setTypingStatus(conversationId, false);
    }
  }, [conversationId]);

  // Handle image selection
  const handleImagePick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      // Handle image upload
    }
  };

  return (
    <MessageInput
      conversation={conversation}
      disabled={loading || sending}
      onSendMessage={handleSendMessage}
      onImagePick={handleImagePick}
      onTyping={handleTyping}
      placeholder="Type a message..."
    />
  );
};
```

### Conversation Object Structure

```javascript
const conversation = {
  id: "conversation_id_from_firebase",
  otherUserId: "recipient_user_id",
  recipientName: "Recipient's display name",
  recipientAvatar: "https://example.com/avatar.jpg" // optional
};
```

### Event Handlers

**onSendMessage(messageText)**
- Called when user sends a message
- Receives the message text as parameter
- Should handle message sending logic and error handling
- Should return Promise for async operations

**onTyping(text)**
- Called whenever user types in the input field
- Receives current text content as parameter
- Should handle typing indicator logic with Firebase
- Optional prop - if not provided, typing indicators won't work

**onImagePick()**
- Called when user taps the attachment button
- Should handle image selection and upload logic
- Optional prop - if not provided, shows placeholder alert

### Styling

The component uses React Native Paper theming and follows Material Design principles:

- **Colors**: Adapts to app theme colors
- **Typography**: Uses system font stack
- **Spacing**: Consistent padding and margins
- **Border radius**: Rounded corners for modern look
- **Shadows**: Subtle elevation for depth

### Accessibility

- ✅ **VoiceOver** support for screen readers
- ✅ **Keyboard navigation** with proper focus management
- ✅ **High contrast** support for better visibility
- ✅ **Large text** support for accessibility settings
- ✅ **Reduced motion** support for motion-sensitive users

### Performance Optimizations

- ✅ **Memoized callbacks** to prevent unnecessary re-renders
- ✅ **Efficient state management** with minimal updates
- ✅ **Keyboard dismissal** optimization
- ✅ **Image picker** caching for better performance
- ✅ **Debounced typing** indicators to reduce Firebase calls

### Error Handling

- ✅ **Network error** handling with user-friendly messages
- ✅ **Validation** for empty messages
- ✅ **Loading states** to prevent multiple submissions
- ✅ **Graceful degradation** when services are unavailable
- ✅ **Retry mechanism** for failed operations

### Testing

The component is designed to be easily testable:

```javascript
// Unit tests
describe('MessageInput', () => {
  it('should render correctly', () => {
    // Test rendering
  });

  it('should handle message sending', () => {
    // Test message sending flow
  });

  it('should handle typing indicators', () => {
    // Test typing functionality
  });
});
```

### Best Practices

1. **Always provide conversation object** with required fields
2. **Handle errors gracefully** in callback functions
3. **Use loading states** to prevent multiple submissions
4. **Implement proper typing indicators** for better UX
5. **Test with different screen sizes** and orientations
6. **Consider accessibility** requirements for your users
7. **Optimize image handling** for production use

This component provides a complete, production-ready message input solution that integrates seamlessly with the existing Firebase messaging system! 🎉
