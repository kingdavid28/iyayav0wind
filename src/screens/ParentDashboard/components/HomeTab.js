import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from 'react-native-paper'; // Import useTheme
import { styles } from '../../styles/ParentDashboard.styles';
import QuickActions from './QuickActions';

import MobileProfileSection from './MobileProfileSection';
import CaregiverCard from './CaregiverCard';

const HomeTab = ({ 
  bookings, 
  children, 
  quickActions, 
  onAddChild, 
  onEditChild, 
  onDeleteChild,
  onViewBookings,
  onViewAllChildren,
  showAllChildren,
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
        
        {/* Children Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Text style={styles.sectionTitle}>My Children ({children.length})</Text>
            </View>
          </View>
          
          {children.length === 0 ? (
            <View style={styles.emptySection}>
              <Text style={styles.emptySectionText}>No children added yet</Text>
              <Text style={styles.emptyStateSubtext}>Use the "Add Child" quick action above</Text>
            </View>
          ) : (
            <View style={styles.childrenList}>
              {(showAllChildren ? children : children.slice(0, 3)).map((child, index) => (
                <View key={child._id || child.id || index} style={styles.childItemCard}>
                  <View style={styles.childIcon}>
                    <Text style={{ fontSize: 20, color: '#db2777' }}>👶</Text>
                  </View>
                  <View style={styles.childInfo}>
                    <Text style={styles.childName}>{child.name}</Text>
                    <Text style={styles.childDetails}>Age: {child.age} years old</Text>
                    {child.allergies && (
                      <Text style={styles.childAllergies}>⚠️ {child.allergies}</Text>
                    )}
                  </View>
                  <View style={styles.childActions}>
                    <TouchableOpacity style={styles.childActionButton} onPress={() => onEditChild(child)}>
                      <Text style={styles.childActionText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.childActionButton, styles.deleteButton]} 
                      onPress={() => onDeleteChild(child)}
                    >
                      <Text style={[styles.childActionText, styles.deleteText]}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
          
          {children.length > 3 && (
            <TouchableOpacity 
              style={{ padding: 12, alignItems: 'center' }}
              onPress={onViewAllChildren}
            >
              <Text style={styles.linkText}>
                {showAllChildren ? 'Show Less' : `View All ${children.length} Children`}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        
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
      </ScrollView>
    </View>
  );
};

export default HomeTab;
