import React from 'react';
import { ScrollView, View, Text, Pressable } from 'react-native';
import { Button, Card } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles/CaregiverDashboard.styles';

function QuickStat({ icon, value, label, color = '#2563EB', bgColor = '#EFF6FF' }) {
  return (
    <View style={[styles.quickTile, { backgroundColor: '#fff' }]}>
      <View style={[styles.quickIconWrap, { backgroundColor: bgColor }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text style={styles.quickValue}>{value ?? '-'}</Text>
      <Text style={styles.quickLabel}>{label}</Text>
    </View>
  );
}

function QuickAction({ icon, label, onPress, gradientColors }) {
  return (
    <Pressable onPress={onPress} style={styles.quickActionTile}>
      <LinearGradient colors={gradientColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.quickActionGradient}>
        <View style={styles.quickActionIconWrap}>
          <Ionicons name={icon} size={20} color="#ffffff" />
        </View>
        <Text style={[styles.quickActionLabel, { color: '#ffffff' }]}>{label}</Text>
      </LinearGradient>
    </Pressable>
  );
}

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
  navigation 
}) {
  return (
    <ScrollView style={styles.content}>
      {/* Quick stats */}
      <View style={styles.quickGrid}>
        <QuickStat icon="star" value={profile.rating} label="Rating" color="#F59E0B" bgColor="#FFFBEB" />
        <QuickStat icon="checkmark-done" value={profile.completedJobs} label="Jobs Done" color="#10B981" bgColor="#ECFDF5" />
        <QuickStat icon="cash" value={`$${profile.hourlyRate}`} label="Rate" color="#2563EB" bgColor="#EFF6FF" />
        <QuickStat icon="chatbubble-ellipses" value={profile.responseRate} label="Response" color="#8B5CF6" bgColor="#F5F3FF" />
      </View>

      {/* Quick actions */}
      <View style={styles.actionGrid}>
        <QuickAction
          icon="search"
          label="Find Jobs"
          gradientColors={["#3B82F6", "#2563EB"]}
          onPress={() => onTabChange('jobs')}
        />
        <QuickAction
          icon="calendar"
          label="Bookings"
          gradientColors={["#22C55E", "#16A34A"]}
          onPress={() => onTabChange('bookings')}
        />
        <QuickAction
          icon="chatbubble-ellipses"
          label="Messages"
          gradientColors={["#A78BFA", "#8B5CF6"]}
          onPress={() => onTabChange('messages')}
        />
        <QuickAction
          icon="document-text"
          label="Applications"
          gradientColors={["#fb7185", "#ef4444"]}
          onPress={() => onTabChange('applications')}
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