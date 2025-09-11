import React from 'react';
import { View, Text } from 'react-native';
import { Card, Button } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../../screens/styles/CaregiverDashboard.styles';

export default function JobCard({ 
  job, 
  showActions = true, 
  onApply, 
  hasApplied, 
  onLearnMore, 
  jobCardStyle, 
  gridMode = false 
}) {
  const applied = typeof hasApplied === 'function' ? hasApplied(job.id) : false;
  const maxRequirementChips = gridMode ? 2 : 3;

  return (
    <Card style={[styles.jobCard, jobCardStyle]}>
      <Card.Content>
        <View style={styles.jobHeader}>
          <View>
            <Text style={styles.jobTitle} numberOfLines={gridMode ? 2 : undefined}>
              {job.title}
            </Text>
            <View style={styles.jobMeta}>
              <Ionicons name="people" size={16} color="#6B7280" />
              <Text style={styles.jobMetaText}>
                {job.children} {job.children === 1 ? 'child' : 'children'} • {job.ages}
              </Text>
              <Ionicons name="location" size={16} color="#6B7280" style={styles.jobMetaIcon} />
              <Text style={styles.jobMetaText}>{job.distance}</Text>
            </View>
          </View>
          {job.urgent && (
            <View style={styles.urgentBadge}>
              <Text style={styles.urgentBadgeText}>Urgent</Text>
            </View>
          )}
        </View>

        <View style={styles.jobDetails}>
          <View style={styles.jobDetailRow}>
            <Ionicons name="time" size={16} color="#6B7280" />
            <Text style={styles.jobDetailText}>{job.schedule}</Text>
          </View>
          <View style={styles.jobDetailRow}>
            <Ionicons name="cash" size={16} color="#6B7280" />
            <Text style={styles.jobDetailText}>${job.hourlyRate}/hr</Text>
          </View>
        </View>

        <View style={styles.requirementsContainer}>
          {job.requirements.slice(0, maxRequirementChips).map((req, index) => (
            <View key={index} style={styles.requirementTag}>
              <Text style={styles.requirementText}>{req}</Text>
            </View>
          ))}
          {job.requirements.length > maxRequirementChips && (
            <Text style={styles.moreRequirementsText}>
              +{job.requirements.length - maxRequirementChips} more
            </Text>
          )}
        </View>

        {showActions && (
          <View style={styles.jobFooter}>
            <Text style={styles.postedDate}>Posted {job.postedDate}</Text>
            <View style={styles.jobActionButtons}>
              <Button 
                mode="outlined" 
                style={styles.secondaryButton}
                labelStyle={styles.secondaryButtonText}
                onPress={() => onLearnMore && onLearnMore(job)}
              >
                Learn More
              </Button>
              {applied ? (
                <View style={[styles.appliedBadge]}>
                  <View style={styles.appliedBadgeContent}>
                    <Ionicons name="checkmark-circle" size={16} color="#4CAF50" style={{ marginRight: 6 }} />
                    <Text style={styles.appliedBadgeText}>Applied</Text>
                  </View>
                </View>
              ) : (
                <Button 
                  mode="contained" 
                  style={styles.primaryButton}
                  labelStyle={styles.primaryButtonText}
                  onPress={() => onApply && onApply(job)}
                >
                  Apply Now
                </Button>
              )}
            </View>
          </View>
        )}
      </Card.Content>
    </Card>
  );
}