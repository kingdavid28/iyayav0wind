import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
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
  onMessageCaregiver,
  onViewReviews,
  navigation,
  refreshing = false,
  onRefresh,
  loading = false,
  setActiveTab
}) => {

  // Get latest 3 registered caregivers (sorted by creation date)
  const featuredCaregivers = useMemo(() => 
    caregivers
      .sort((a, b) => new Date(b.createdAt || b.registeredAt || 0) - new Date(a.createdAt || a.registeredAt || 0))
      .slice(0, 3),
    [caregivers]
  );
    
  console.log('🎯 HomeTab - Caregivers received:', caregivers.length);
  console.log('🎯 HomeTab - Featured caregivers:', featuredCaregivers.length, featuredCaregivers.map(c => c.name));

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#db2777" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView 
        style={styles.dashboardContent} 
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
        bounces={true}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#db2777']}
            tintColor="#db2777"
          />
        }
      >

        
        <MobileProfileSection 
          greetingName={greetingName}
          profileImage={profileImage}
          profileContact={profileContact}
          profileLocation={profileLocation}
          activeTab="home"
          userData={userData}
          navigation={navigation}
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
              {(showAllChildren ? children : children.slice(0, 3)).map((child, index) => {
                const childId = child?._id || child?.id || index;
                const fullName = child?.name || [child?.firstName, child?.lastName].filter(Boolean).join(' ') || 'Child';
                const ageValue = child?.age ?? child?.calculatedAge ?? null;
                const birthDate = child?.birthDate || child?.dateOfBirth;
                const allergies = Array.isArray(child?.allergies)
                  ? child.allergies.filter(Boolean).join(', ')
                  : child?.allergies;
                const specialInstructions = child?.specialNeeds || child?.notes || child?.instructions;
                const preferences = child?.preferences || child?.favoriteActivities;

                return (
                  <View key={childId} style={styles.childItemCard}>
                    <View style={styles.topRightButtons}>
                      {onEditChild && (
                        <TouchableOpacity 
                          style={styles.editButtonX} 
                          onPress={() => onEditChild(child)}
                        >
                          <Text style={styles.editButtonXText}>✎</Text>
                        </TouchableOpacity>
                      )}
                      {onDeleteChild && (
                        <TouchableOpacity 
                          style={styles.deleteButtonX} 
                          onPress={() => onDeleteChild(child)}
                        >
                          <Text style={styles.deleteButtonXText}>×</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                    <View style={styles.childContentLeft}>
                      <View style={styles.childIcon}>
                        <Text style={{ fontSize: 20, color: '#db2777' }}>👶</Text>
                      </View>
                      <View style={styles.childInfo}>
                        <Text style={styles.childName}>{fullName}</Text>
                        {ageValue != null ? (
                          <>
                            <Text style={styles.childDetails}>Age: {ageValue} years</Text>
                            {birthDate ? (
                              <Text style={styles.childDetails}>Birth date: {birthDate}</Text>
                            ) : null}
                          </>
                        ) : birthDate ? (
                          <Text style={styles.childDetails}>Birth date: {birthDate}</Text>
                        ) : (
                          <Text style={styles.childDetails}>Age: Not available</Text>
                        )}
                        {preferences ? (
                          <Text style={styles.childDetailLine}>Loves: {preferences}</Text>
                        ) : null}
                        {specialInstructions ? (
                          <Text style={styles.childDetailLine}>Notes: {specialInstructions}</Text>
                        ) : null}
                        {allergies ? (
                          <Text style={styles.childAllergies}>⚠️ Allergies: {allergies}</Text>
                        ) : null}
                      </View>
                    </View>
                  </View>
                );
              })}
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
        {featuredCaregivers.length > 0 ? (
          <View style={{ paddingHorizontal: 8, marginBottom: 20, overflow: 'visible' }}>
            <Text style={[styles.sectionTitle, { marginBottom: 12, marginLeft: 8 }]}>Featured Caregivers ({featuredCaregivers.length})</Text>
            {featuredCaregivers.map((caregiver) => (
              <CaregiverCard
                key={caregiver.caregiverProfileId || caregiver.caregiverAccountId || caregiver.id || caregiver._id}
                caregiver={caregiver}
                onPress={onBookCaregiver}
                onMessagePress={onMessageCaregiver}
                onViewReviews={onViewReviews}
              />
            ))}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
};

export default HomeTab;
