import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, ScrollView, RefreshControl } from 'react-native';
import { Calendar, Users, Eye, CheckCircle, XCircle, Plus, MapPin, Clock } from 'lucide-react-native';
import { styles, colors } from '../../styles/ParentDashboard.styles';
import { apiService } from '../../../services';
import PesoSign from '../../../components/ui/feedback/PesoSign';

const MyJobsTab = ({ 
  jobs = [], 
  refreshing, 
  onRefresh, 
  onCreateJob,
  onEditJob,
  onDeleteJob,
  onCompleteJob 
}) => {
  const [filter, setFilter] = useState('all');
  const [selectedJob, setSelectedJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [applicationsLoading, setApplicationsLoading] = useState(false);

  const filteredJobs = jobs.filter(job => {
    if (filter === 'active') return job.status === 'active' || job.status === 'pending';
    if (filter === 'completed') return job.status === 'completed' || job.status === 'cancelled';
    return true;
  });

  const fetchJobApplications = useCallback(async (jobId) => {
    if (!jobId) {
      Alert.alert('Error', 'Invalid job ID.');
      return;
    }
    
    setApplicationsLoading(true);
    try {
      const response = await apiService.applications.getForJob(jobId);
      setApplications(response.data?.applications || []);
      setSelectedJob(jobId);
    } catch (error) {
      console.error('Error fetching applications:', error);
      Alert.alert('Error', 'Failed to load applications.');
    } finally {
      setApplicationsLoading(false);
    }
  }, []);

  const handleApplicationAction = async (applicationId, action) => {
    if (!applicationId || !action) {
      Alert.alert('Error', 'Invalid application data.');
      return;
    }
    
    try {
      await apiService.applications.updateStatus(applicationId, action);
      Alert.alert(
        'Success',
        `Application ${action} successfully`,
        [{ text: 'OK', onPress: () => {
          if (selectedJob) {
            fetchJobApplications(selectedJob);
          }
        }}]
      );
    } catch (error) {
      console.error('Error updating application:', error);
      Alert.alert('Error', 'Failed to update application.');
    }
  };

  const getJobStatusColor = useCallback((status) => {
    return {
      active: colors.success,
      pending: colors.warning,
      completed: colors.info,
      cancelled: colors.error,
      filled: colors.primary,
    }[status] || colors.success;
  }, []);

  const getApplicationStatusColor = useCallback((status) => {
    return {
      pending: colors.warning,
      accepted: colors.success,
      rejected: colors.error,
    }[status] || colors.textSecondary;
  }, []);

  const JobCard = ({ job }) => (
    <View style={styles.jobCard}>
      <View style={styles.jobHeader}>
        <Text style={styles.jobTitle}>{job.title || 'Childcare Needed'}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getJobStatusColor(job.status) }]}>
          <Text style={styles.statusText}>{job.status || 'active'}</Text>
        </View>
      </View>
      
      <View style={styles.jobDetails}>
        <View style={styles.jobDetailRow}>
          <Calendar size={16} color={colors.textSecondary} />
          <Text style={styles.jobDetailText}>
            {job.date ? new Date(job.date).toLocaleDateString() : 'Date not set'}
          </Text>
        </View>
        
        <View style={styles.jobDetailRow}>
          <Clock size={16} color={colors.textSecondary} />
          <Text style={styles.jobDetailText}>
            {job.startTime || '9:00 AM'} - {job.endTime || '5:00 PM'}
          </Text>
        </View>
        
        <View style={styles.jobDetailRow}>
          <MapPin size={16} color={colors.textSecondary} />
          <Text style={[styles.jobDetailText, { flex: 1 }]} numberOfLines={1} ellipsizeMode="tail">
            {job.location || 'Location not specified'}
          </Text>
        </View>
        
        <View style={styles.jobDetailRowInline}>
          <View style={styles.jobDetailItem}>
            <PesoSign size={16} color={colors.textSecondary} />
            <Text style={styles.jobDetailText}>₱{job.hourlyRate || 350}/hr</Text>
          </View>
          <View style={styles.jobDetailItem}>
            <Users size={16} color={colors.textSecondary} />
            <Text style={styles.jobDetailText}>{job.applicationCount || 0} apps</Text>
          </View>
        </View>
      </View>

      <View style={styles.jobActions}>
        <View style={styles.jobActionsRow1}>
          <TouchableOpacity
            style={styles.viewApplicationsButton}
            onPress={() => {
              const jobId = job.id || job._id;
              if (jobId) {
                fetchJobApplications(jobId);
              } else {
                Alert.alert('Error', 'Job ID not found');
              }
            }}
          >
            <Eye size={16} color={colors.primary} />
            <Text style={styles.viewApplicationsText}>Applications</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.jobActionsRow2}>
          {(job.status === 'active' || job.status === 'pending') && (
            <TouchableOpacity 
              style={[styles.jobActionButton, styles.completeButton]}
              onPress={() => onCompleteJob(job.id || job._id)}
            >
              <Text style={[styles.jobActionText, styles.completeText]}>Complete</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            style={styles.jobActionButton}
            onPress={() => onEditJob(job)}
          >
            <Text style={styles.jobActionText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.jobActionButton, styles.deleteButton]}
            onPress={() => onDeleteJob(job.id || job._id)}
          >
            <Text style={[styles.jobActionText, styles.deleteText]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderApplicationItem = ({ item }) => (
    <View style={styles.applicationCard}>
      <View style={styles.applicationHeader}>
        <Text style={styles.caregiverName}>{item.caregiverId?.name || 'Caregiver'}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getApplicationStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>

      {item.message && (
        <Text style={styles.applicationMessage}>"{item.message}"</Text>
      )}

      {item.status === 'pending' && (
        <View style={styles.applicationActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.acceptButton]}
            onPress={() => handleApplicationAction(item._id, 'accepted')}
          >
            <CheckCircle size={16} color="#FFFFFF" />
            <Text style={styles.acceptButtonText}>Accept</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.rejectButton]}
            onPress={() => handleApplicationAction(item._id, 'rejected')}
          >
            <XCircle size={16} color="#EF4444" />
            <Text style={styles.rejectButtonText}>Reject</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.tabContent}>
      {selectedJob ? (
        <>
          <View style={styles.applicationsHeader}>
            <TouchableOpacity 
              style={styles.backButtonContainer}
              onPress={() => setSelectedJob(null)}
            >
              <Text style={styles.backButton}>← Back to Jobs</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Applications</Text>
          </View>

          <FlatList
            data={applications}
            renderItem={renderApplicationItem}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.applicationsList}
            refreshing={applicationsLoading}
            onRefresh={() => selectedJob && fetchJobApplications(selectedJob)}
            ListEmptyComponent={
              <View style={styles.emptyApplicationsContainer}>
                <Users size={48} color={colors.textTertiary} />
                <Text style={styles.emptyApplicationsTitle}>No Applications Yet</Text>
                <Text style={styles.emptyApplicationsText}>
                  Applications will appear here when caregivers apply to your job
                </Text>
              </View>
            }
            showsVerticalScrollIndicator={false}
          />
        </>
      ) : (
        <>
          {/* Header */}
          <View style={styles.jobsHeader}>
            <Text style={styles.sectionTitle}>My Job Posts</Text>
            <TouchableOpacity 
              style={styles.createJobButton}
              onPress={onCreateJob}
            >
              <Plus size={20} color={colors.white} />
              <Text style={styles.createJobText}>Post Job</Text>
            </TouchableOpacity>
          </View>

          {/* Filter Tabs */}
          <View style={styles.filterTabs}>
            {['all', 'active', 'completed'].map((filterType) => (
              <TouchableOpacity
                key={filterType}
                style={[
                  styles.filterTab,
                  filter === filterType && styles.activeFilterTab
                ]}
                onPress={() => setFilter(filterType)}
              >
                <Text style={[
                  styles.filterTabText,
                  filter === filterType && styles.activeFilterTabText
                ]}>
                  {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Jobs List */}
          <ScrollView
            style={styles.jobsList}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            showsVerticalScrollIndicator={false}
          >
            {filteredJobs.length > 0 ? (
              filteredJobs.map((job, index) => (
                <JobCard key={job._id || job.id || `job-${index}`} job={job} />
              ))
            ) : (
              <View style={styles.emptyState}>
                <Plus size={48} color={colors.textTertiary} />
                <Text style={styles.emptyStateTitle}>No jobs posted yet</Text>
                <Text style={styles.emptyStateText}>
                  Create your first job posting to find the perfect caregiver
                </Text>
                <TouchableOpacity 
                  style={styles.emptyStateButton}
                  onPress={onCreateJob}
                >
                  <Text style={styles.emptyStateButtonText}>Post Your First Job</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </>
      )}
    </View>
  );
};

export default MyJobsTab;