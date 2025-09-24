import React from 'react';
import { ScrollView, View, Text, Pressable, RefreshControl, ActivityIndicator } from 'react-native';
import { Button, Card } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles/CaregiverDashboard.styles';

import { QuickStat, QuickAction } from '../../shared/ui';

export default function DashboardTab({ 
  profile, 
  jobs, 
  applications, 
  bookings, 
  jobsLoading,
  onTabChange,
  onJobApply,
  onJobView,
  onApplicationView,
  onBookingView,
  navigation,
  refreshing = false,
  onRefresh,
  loading = false
}) {
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#3B82F6']}
          tintColor="#3B82F6"
        />
      }
    >
      {/* Quick stats */}
      <View style={styles.quickGrid}>
        <QuickStat icon="star" value={profile.rating} label="Rating" color="#F59E0B" bgColor="#FFFBEB" styles={styles} />
        <QuickStat icon="checkmark-done" value={profile.completedJobs} label="Jobs Done" color="#10B981" bgColor="#ECFDF5" styles={styles} />
        <QuickStat icon="cash" value={`$${profile.hourlyRate}`} label="Rate" color="#2563EB" bgColor="#EFF6FF" styles={styles} />
        <QuickStat icon="chatbubble-ellipses" value={profile.responseRate} label="Response" color="#8B5CF6" bgColor="#F5F3FF" styles={styles} />
      </View>

      {/* Quick actions */}
      <View style={styles.actionGrid}>
        <QuickAction
          icon="search"
          label="Find Jobs"
          gradientColors={["#3B82F6", "#2563EB"]}
          onPress={() => onTabChange('jobs')}
          styles={styles}
        />
        <QuickAction
          icon="calendar"
          label="Bookings"
          gradientColors={["#22C55E", "#16A34A"]}
          onPress={() => onTabChange('bookings')}
          styles={styles}
        />
        <QuickAction
          icon="chatbubble-ellipses"
          label="Messages"
          gradientColors={["#A78BFA", "#8B5CF6"]}
          onPress={() => onTabChange('messages')}
          styles={styles}
        />
        <QuickAction
          icon="document-text"
          label="Applications"
          gradientColors={["#fb7185", "#ef4444"]}
          onPress={() => onTabChange('applications')}
          styles={styles}
        />
      </View>

      {/* Enhanced Profile Wizard Promotion */}
      <View style={styles.section}>
        <Card style={[styles.promotionCard, { backgroundColor: '#f0f9ff', borderColor: '#3b82f6' }]}>
          <Card.Content>
            <View style={styles.promotionHeader}>
              <View style={styles.promotionIcon}>
                <Ionicons name="star" size={20} color="#3b82f6" />
              </View>
              <View style={styles.promotionContent}>
                <Text style={styles.promotionTitle}>Complete Your Enhanced Profile</Text>
                <Text style={styles.promotionDescription}>
                  Add documents, certifications, and portfolio to get more bookings
                </Text>
              </View>
            </View>
            <Button
              mode="contained"
              onPress={() => navigation.navigate('EnhancedCaregiverProfileWizard', { isEdit: true, existingProfile: profile })}
              style={[styles.promotionButton, { backgroundColor: '#3b82f6' }]}
              labelStyle={{ color: '#ffffff' }}
              icon="arrow-right"
            >
              Complete Profile
            </Button>
          </Card.Content>
        </Card>
      </View>
    </ScrollView>
  );
}