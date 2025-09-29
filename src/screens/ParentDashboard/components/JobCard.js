import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Calendar, MapPin, Clock, DollarSign, Users, Edit2, Trash2, Clock as ClockIcon, Check } from 'lucide-react-native';
import { StatusBadge } from '../../../shared/ui';
import { jobsAPI } from '../../../services/index';
import { useNavigation } from '@react-navigation/native';

const JobCard = ({ job, onPress, onUpdate }) => {
  const navigation = useNavigation();
  
  const handleEdit = () => {
    navigation.navigate('EditJob', { jobId: job.id, jobData: job });
  };

  const handleDelete = async () => {
    Alert.alert(
      'Delete Job',
      'Are you sure you want to delete this job posting? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await jobsAPI.delete(job.id);
              if (onUpdate) onUpdate();
            } catch (error) {
              console.error('Error deleting job:', error);
              Alert.alert('Error', 'Failed to delete job. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await jobsAPI.update(job.id, { status: newStatus });
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error updating job status:', error);
      Alert.alert('Error', 'Failed to update job status. Please try again.');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Flexible';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };


  const showActions = job.status === 'open' || job.status === 'pending';

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <StatusBadge status={job.status} />
        
        <Text style={styles.postedDate}>
          {(() => {
            try {
              const d = job.createdAt?.toDate ? job.createdAt.toDate() : (job.createdAt ? new Date(job.createdAt) : null);
              return d ? `Posted ${d.toLocaleDateString()}` : 'Posted Recently';
            } catch {
              return 'Posted Recently';
            }
          })()}
        </Text>
      </View>
      
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        <Text style={styles.jobTitle} numberOfLines={2}>
          {job.title}
        </Text>
        
        <View style={styles.jobMeta}>
          <View style={styles.metaItem}>
            <MapPin size={14} color="#6B7280" />
            <Text style={styles.metaText} numberOfLines={1}>
              {job.location || 'Location not specified'}
            </Text>
          </View>
          
          <View style={styles.metaItem}>
            <DollarSign size={14} color="#6B7280" />
            <Text style={styles.metaText}>₱{job.rate || 'Negotiable'}/hr</Text>
          </View>
          
          <View style={styles.metaItem}>
            <Calendar size={14} color="#6B7280" />
            <Text style={styles.metaText}>
              {formatDate(job.startDate)}
              {job.endDate ? ` - ${formatDate(job.endDate)}` : ''}
            </Text>
          </View>
          
          <View style={styles.metaItem}>
            <Clock size={14} color="#6B7280" />
            <Text style={styles.metaText} numberOfLines={1}>
              {job.workingHours || 'Flexible hours'}
            </Text>
          </View>
          
          {job.applicants?.length > 0 && (
            <View style={[styles.metaItem, styles.applicantsBadge]}>
              <Users size={14} color="#4F46E5" />
              <Text style={[styles.metaText, styles.applicantsText]}>
                {job.applicants.length} {job.applicants.length === 1 ? 'Applicant' : 'Applicants'}
              </Text>
            </View>
          )}
        </View>
        
        {job.description && (
          <Text style={styles.jobDescription} numberOfLines={2}>
            {job.description}
          </Text>
        )}
      </TouchableOpacity>
      
      <View style={styles.cardFooter}>
        <View style={styles.actions}>
          {showActions && (
            <>
              <TouchableOpacity 
                style={[styles.actionButton, styles.editButton]}
                onPress={handleEdit}
              >
                <Edit2 size={16} color="#4F46E5" />
                <Text style={[styles.actionButtonText, { color: '#4F46E5' }]}>
                  Edit
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionButton, styles.deleteButton]}
                onPress={handleDelete}
              >
                <Trash2 size={16} color="#EF4444" />
                <Text style={[styles.actionButtonText, { color: '#EF4444' }]}>
                  Delete
                </Text>
              </TouchableOpacity>
              
              {job.status === 'open' && (
                <TouchableOpacity 
                  style={[styles.actionButton, styles.markFilledButton]}
                  onPress={() => handleStatusChange('filled')}
                >
                  <Check size={16} color="#8B5CF6" />
                  <Text style={[styles.actionButtonText, { color: '#8B5CF6' }]}>
                    Mark Filled
                  </Text>
                </TouchableOpacity>
              )}
            </>
          )}
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.viewButton]}
            onPress={onPress}
          >
            <Text style={[styles.actionButtonText, { color: '#4F46E5' }]}>
              View Details
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  postedDate: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
    lineHeight: 22,
  },
  jobMeta: {
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  metaText: {
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 8,
    flex: 1,
  },
  applicantsBadge: {
    backgroundColor: '#EEF2FF',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  applicantsText: {
    color: '#4F46E5',
    fontWeight: '500',
  },
  jobDescription: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 16,
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
    marginTop: -4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 6,
  },
  editButton: {
    borderColor: '#E0E7FF',
    backgroundColor: '#EEF2FF',
  },
  deleteButton: {
    borderColor: '#FEE2E2',
    backgroundColor: '#FEF2F2',
  },
  markFilledButton: {
    borderColor: '#EDE9FE',
    backgroundColor: '#F5F3FF',
  },
  viewButton: {
    borderColor: '#E0E7FF',
    backgroundColor: '#FFFFFF',
    marginLeft: 'auto',
  },
});

export default JobCard;
