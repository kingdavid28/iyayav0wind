import React from 'react';
import { ScrollView, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { EmptyState } from '../../shared/ui';
import ApplicationCard from '../../shared/ui/cards/ApplicationCard';
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