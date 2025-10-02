import BaseMessagesTab, { CaregiverMessagesTab } from '../../../components/messaging/shared/BaseMessagesTab';

const MessagesTab = ({ navigation, refreshing, onRefresh }) => (
  <CaregiverMessagesTab
    navigation={navigation}
    refreshing={refreshing}
    onRefresh={onRefresh}
  />
);

export default MessagesTab;
