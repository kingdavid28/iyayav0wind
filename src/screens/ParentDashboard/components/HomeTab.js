import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useTheme } from 'react-native-paper'; // Import useTheme
import { styles } from '../../styles/ParentDashboard.styles';
import QuickActions from './QuickActions';
import ChildrenSection from './ChildrenSection';
import BookingsSection from './BookingsSection';
import MobileProfileSection from './MobileProfileSection';
import CaregiverCard from './CaregiverCard';

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
  userData,
  caregivers = [],
  onBookCaregiver,
  onMessageCaregiver
}) => {
  // Get latest 3 registered caregivers (sorted by creation date)
  const featuredCaregivers = caregivers
    .sort((a, b) => new Date(b.createdAt || b.registeredAt || 0) - new Date(a.createdAt || a.registeredAt || 0))
    .slice(0, 3);

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
        
        {/* Featured Caregivers Section */}
        {featuredCaregivers.length > 0 && (
          <View style={{ paddingHorizontal: 16, marginBottom: 20 }}>
            <Text style={[styles.sectionTitle, { marginBottom: 12 }]}>Featured Caregivers</Text>
            {featuredCaregivers.map((caregiver) => (
              <CaregiverCard
                key={caregiver.id || caregiver._id}
                caregiver={caregiver}
                onPress={onBookCaregiver}
                onMessagePress={onMessageCaregiver}
              />
            ))}
          </View>
        )}
        
        <ChildrenSection children={children} onAddChild={onAddChild} onEditChild={onEditChild} />
        <BookingsSection bookings={bookings} onViewBookings={onViewBookings} />
      </ScrollView>
    </View>
  );
};

export default HomeTab;
