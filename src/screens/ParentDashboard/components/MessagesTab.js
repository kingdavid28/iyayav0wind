import BaseMessagesTab, { ParentMessagesTab } from '../../../components/messaging/shared/BaseMessagesTab';

const MessagesTab = ({ navigation, refreshing, onRefresh }) => (
  <ParentMessagesTab
    navigation={navigation}
    refreshing={refreshing}
    onRefresh={onRefresh}
  />
);

export default MessagesTab;
