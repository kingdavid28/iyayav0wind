import React from 'react';
import { ScrollView, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles/CaregiverDashboard.styles';

export default function ApplicationsTab({ 
  applications, 
  onApplicationView, 
  onMessageFamily 
}) {
  return (
    <ScrollView style={styles.content}>
      <View style={styles.section}>
        {applications.length > 0 ? (
          applications.map((application) => (
            <ApplicationCard 
              key={application.id} 
              application={application}
              onViewDetails={onApplicationView}
              onMessage={onMessageFamily}
            />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="document-text" size={48} color="#9CA3AF" />
            <Text style={styles.emptyStateText}>No applications yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Apply to jobs to see them here
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}