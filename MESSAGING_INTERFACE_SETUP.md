// Add this to AppNavigator.js after line 21 (Messaging components section):

// Add this route to Stack.Navigator (around line 116, after ChatScreen):
<Stack.Screen
  name="MessagingInterface"
  component={MessagingInterface}
  options={{
    title: "Messages",
    headerBackTitle: "Back",
    headerShown: false
  }}
/>

// Usage in MessagesTab.js:
// Replace the existing MessagesTab content with:
import MessagingInterface from '../../../components/messaging/MessagingInterface';

const MessagesTab = ({ navigation, refreshing, onRefresh }) => {
  return <MessagingInterface />;
};
