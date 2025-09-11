import React from 'react';
import { ScrollView, View, Text, ActivityIndicator, RefreshControl } from 'react-native';
import { Chip } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles/CaregiverDashboard.styles';

export default function JobsTab({ 
  jobs, 
  jobsLoading, 
  applications,
  onRefresh,
  onJobApply,
  onJobView,
  gridCardWidth,
  gridCardHeight,
  columns 
}) {
  return (
    <ScrollView 
      style={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={jobsLoading}
          onRefresh={onRefresh}
          colors={['#3B82F6']}
          tintColor="#3B82F6"
        />
      }
    >
      <View style={styles.section}>
        <View style={styles.filters}>
          <Chip style={styles.filterChip} textStyle={styles.filterChipText}>
            All Jobs
          </Chip>
          <Chip
            style={[styles.filterChip, styles.filterChipActive]}
            textStyle={[styles.filterChipText, styles.filterChipTextActive]}
          >
            Nearby
          </Chip>
          <Chip style={styles.filterChip} textStyle={styles.filterChipText}>
            High Pay
          </Chip>
          <Chip style={styles.filterChip} textStyle={styles.filterChipText}>
            Urgent
          </Chip>
        </View>

        {jobsLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>Loading jobs...</Text>
          </View>
        ) : jobs && jobs.length > 0 ? (
          <View style={[styles.jobsGrid, columns === 1 && { flexDirection: 'column' }]}>
            {jobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                showActions={true}
                onApply={onJobApply}
                onLearnMore={onJobView}
                hasApplied={(id) => applications.some((a) => a.jobId === id)}
                jobCardStyle={columns === 1 ? { width: '100%', ...(gridCardHeight ? { height: gridCardHeight } : {}) } : { width: gridCardWidth, height: gridCardHeight }}
                gridMode
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="briefcase" size={48} color="#9CA3AF" />
            <Text style={styles.emptyStateText}>No jobs available</Text>
            <Text style={styles.emptyStateSubtext}>
              Please check back later or adjust your filters
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}