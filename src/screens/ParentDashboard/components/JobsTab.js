import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Plus, Calendar, MapPin, Clock, DollarSign } from 'lucide-react-native';
import { styles, colors } from '../../styles/ParentDashboard.styles';

const JobsTab = ({ 
  jobs = [], 
  refreshing, 
  onRefresh, 
  onCreateJob,
  onEditJob,
  onDeleteJob 
}) => {
  const [filter, setFilter] = useState('all'); // all, active, completed

  const filteredJobs = jobs.filter(job => {
    if (filter === 'active') return job.status === 'active' || job.status === 'pending';
    if (filter === 'completed') return job.status === 'completed' || job.status === 'cancelled';
    return true;
  });

  const JobCard = ({ job }) => (
    <View style={styles.jobCard}>
      <View style={styles.jobHeader}>
        <Text style={styles.jobTitle}>{job.title || 'Childcare Needed'}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(job.status) }]}>
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
          <Text style={styles.jobDetailText}>{job.location || 'Location not specified'}</Text>
        </View>
        
        <View style={styles.jobDetailRow}>
          <DollarSign size={16} color={colors.textSecondary} />
          <Text style={styles.jobDetailText}>₱{job.hourlyRate || 350}/hour</Text>
        </View>
      </View>

      <View style={styles.jobActions}>
        <TouchableOpacity 
          style={styles.jobActionButton}
          onPress={() => onEditJob(job)}
        >
          <Text style={styles.jobActionText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.jobActionButton, styles.deleteButton]}
          onPress={() => onDeleteJob(job.id)}
        >
          <Text style={[styles.jobActionText, styles.deleteText]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return colors.success;
      case 'pending': return colors.warning;
      case 'completed': return colors.info;
      case 'cancelled': return colors.error;
      default: return colors.success;
    }
  };

  return (
    <View style={styles.tabContent}>
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
          filteredJobs.map((job) => (
            <JobCard key={job.id || job._id} job={job} />
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
    </View>
  );
};

export default JobsTab;