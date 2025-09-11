import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useTheme } from 'react-native-paper'; // Import useTheme
import { styles } from '../../styles/ParentDashboard.styles';
import QuickActions from './QuickActions';
import ChildrenSection from './ChildrenSection';
import BookingsSection from './BookingsSection';
import MobileProfileSection from './MobileProfileSection';

const HomeTab = ({ 
  bookings, 
  children, 
  quickActions, 
  onAddChild, 
  onEditChild, 
  onViewBookings,
  greetingName,
  profileImage,
  profileContact,
  profileLocation,
  userData
}) => {
  return (
    <View style={{ flex: 1 }}>
      <ScrollView 
        style={styles.dashboardContent} 
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
        bounces={true}
        scrollEventThrottle={16}
      >
        <MobileProfileSection 
          greetingName={greetingName}
          profileImage={profileImage}
          profileContact={profileContact}
          profileLocation={profileLocation}
          activeTab="home"
          userData={userData}
        />
        <QuickActions actions={quickActions} />
        <ChildrenSection children={children} onAddChild={onAddChild} onEditChild={onEditChild} />
        <BookingsSection bookings={bookings} onViewBookings={onViewBookings} />
      </ScrollView>
    </View>
  );
};

export default HomeTab;
