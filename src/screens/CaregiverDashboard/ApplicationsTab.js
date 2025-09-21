import React from 'react';
import { ScrollView, View, Text, RefreshControl, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { EmptyState } from '../../shared/ui';
import ApplicationCard from '../../shared/ui/cards/ApplicationCard';
import { styles } from '../styles/CaregiverDashboard.styles';

export default function ApplicationsTab({ 
  applications, 
  onApplicationView, 
  onMessageFamily,
  refreshing = false,
  onRefresh,
  loading = false
}) {
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading applications...</Text>
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
      <View style={styles.section}>
        {applications.length > 0 ? (
          applications.map((application) => (
            <ApplicationCard 
              key={application.id || application._id} 
              application={application}
              onPress={onApplicationView}
              onWithdraw={() => {}}
            />
          ))
        ) : (
          <EmptyState 
            icon="document-text" 
            title="No applications yet"
            subtitle="Apply to jobs to see them here"
          />
        )}
      </View>
    </ScrollView>
  );
}