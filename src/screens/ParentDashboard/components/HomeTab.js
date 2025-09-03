import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useTheme } from 'react-native-paper'; // Import useTheme
import { styles } from '../../styles/ParentDashboard.styles';
import ProfileHeader from './ProfileHeader';
import QuickActions from './QuickActions';
import ChildrenSection from './ChildrenSection';
import BookingsSection from './BookingsSection';

const HomeTab = ({ 
  greetingName, 
  profileName, 
  profileContact, 
  profileLocation, 
  bookings, 
  children, 
  quickActions, 
  onAddChild, 
  onEditChild, 
  onViewBookings 
}) => {
  const theme = useTheme();
  const colors = theme.colors || {}; // Safely access colors with fallback

  const renderWelcome = () => (
    <View style={[styles.welcomeCard, { backgroundColor: colors.secondaryLight || '#e3f2fd' }]}> 
      <Text style={styles.welcomeTitle}>{greetingName ? `Welcome back, ${greetingName}! 👋` : 'Welcome back! 👋'}</Text>
      <Text style={styles.welcomeSubtitle}>Let's find the perfect caregiver for your little ones.</Text>
    </View>
  );

  return (
    <ScrollView style={styles.dashboardContent} showsVerticalScrollIndicator={false}>
      {renderWelcome()}
      <ProfileHeader 
        profileName={profileName}
        profileContact={profileContact}
        profileLocation={profileLocation}
        bookingsCount={bookings.length}
        childrenCount={children.length}
      />
      <QuickActions actions={quickActions} />
      <ChildrenSection children={children} onAddChild={onAddChild} onEditChild={onEditChild} />
      <BookingsSection bookings={bookings} onViewBookings={onViewBookings} />
    </ScrollView>
  );
};

export default HomeTab;