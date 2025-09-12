import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  ActivityIndicator,
  Alert,
  RefreshControl,
  Image,
  Linking,
} from 'react-native';
import { 
  User, 
  Clock, 
  MessageCircle, 
  Phone, 
  Mail, 
  Check, 
  X,
  Star,
  AlertCircle,
  ChevronRight
} from 'lucide-react-native';
import { jobsAPI, applicationsAPI } from '../../../config/api';
import { useAuth } from '../../../core/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';

const JobApplications = ({ jobId, onViewApplicant }) => {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState('all'); // 'all', 'new', 'reviewed'

  // Fetch job applications via REST
  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      if (!jobId || !user?.uid) return;
      try {
        setLoading(true);
        const res = await jobsAPI.getApplicationsForJob(jobId);
        const raw = res?.applications || [];
        // Normalize shape to align with previous UI expectations
        const mapped = raw.map((a) => ({
          id: a._id || a.id,
          jobId: a.jobId?._id || a.jobId,
          caregiverId: a.caregiverId?._id || a.caregiverId,
          caregiver: a.caregiver || a.caregiverId || {},
          message: a.message,
          status: a.status,
          appliedAt: a.createdAt ? new Date(a.createdAt) : null,
          createdAt: a.createdAt,
        }));

        // Client-side filter based on selectedTab
        const filtered = mapped.filter((a) => {
          if (selectedTab === 'new') return a.status === 'pending';
          if (selectedTab === 'reviewed') return ['accepted', 'rejected', 'shortlisted'].includes(a.status);
          return true;
        });

        if (isMounted) setApplications(filtered);
      } catch (error) {
        console.error('Error fetching applications:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    };
    load();
    return () => { isMounted = false; };
  }, [jobId, user?.uid, selectedTab]);

  const handleRefresh = () => {
    setRefreshing(true);
    // The real-time listener will handle the refresh
  };

  const updateApplicationStatus = async (applicationId, status) => {
    try {
      await applicationsAPI.updateStatus(applicationId, status);
      // Refresh list after update
      setRefreshing(true);
      // Trigger effect by toggling selectedTab to same value
      // or simply refetch by setting selectedTab which is already a dep
      // We'll just call the loader indirectly via state flip
      setSelectedTab((t) => t); 
    } catch (error) {
      console.error('Error updating application status:', error);
      Alert.alert('Error', 'Failed to update application status. Please try again.');
    }
  };

  const renderApplicationItem = ({ item }) => {
    const getStatusInfo = (status) => {
      switch (status?.toLowerCase()) {
        case 'accepted':
          return { color: '#10B981', label: 'Accepted', icon: <Check size={16} color="#10B981" /> };
        case 'rejected':
          return { color: '#EF4444', label: 'Rejected', icon: <X size={16} color="#EF4444" /> };
        case 'shortlisted':
          return { color: '#F59E0B', label: 'Shortlisted', icon: <Star size={16} color="#F59E0B" /> };
        default:
          return { color: '#3B82F6', label: 'New', icon: <AlertCircle size={16} color="#3B82F6" /> };
      }
    };

    const statusInfo = getStatusInfo(item.status);
    const appliedAgo = item.appliedAt 
      ? formatDistanceToNow(item.appliedAt.toDate(), { addSuffix: true })
      : 'Recently';

    return (
      <View style={styles.applicationCard}>
        <View style={styles.applicationHeader}>
          <View style={styles.applicantInfo}>
            <View style={styles.avatar}>
              {item.caregiver?.photoURL ? (
                <Image 
                  source={{ uri: item.caregiver.photoURL }} 
                  style={styles.avatarImage}
                />
              ) : (
                <User size={24} color="#6B7280" />
              )}
            </View>
            <View style={styles.applicantDetails}>
              <Text style={styles.applicantName}>
                {item.caregiver?.displayName || 'Anonymous Caregiver'}
              </Text>
              <Text style={styles.appliedDate}>
                Applied {appliedAgo}
              </Text>
            </View>
          </View>
          
          <View style={[styles.statusBadge, { backgroundColor: `${statusInfo.color}20` }]}>
            {statusInfo.icon}
            <Text style={[styles.statusText, { color: statusInfo.color }]}>
              {statusInfo.label}
            </Text>
          </View>
        </View>
        
        {item.message && (
          <Text style={styles.applicationMessage} numberOfLines={2}>
            "{item.message}"
          </Text>
        )}
        
        <View style={styles.applicationActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => onViewApplicant(item.caregiverId)}
          >
            <Text style={styles.viewProfileText}>View Profile</Text>
            <ChevronRight size={16} color="#4F46E5" />
          </TouchableOpacity>
          
          {item.status === 'pending' && (
            <View style={styles.decisionButtons}>
              <TouchableOpacity 
                style={[styles.decisionButton, styles.acceptButton]}
                onPress={() => updateApplicationStatus(item.id, 'accepted')}
              >
                <Check size={16} color="#10B981" />
                <Text style={[styles.decisionButtonText, { color: '#10B981' }]}>
                  Accept
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.decisionButton, styles.shortlistButton]}
                onPress={() => updateApplicationStatus(item.id, 'shortlisted')}
              >
                <Star size={16} color="#F59E0B" />
                <Text style={[styles.decisionButtonText, { color: '#F59E0B' }]}>
                  Shortlist
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.decisionButton, styles.rejectButton]}
                onPress={() => updateApplicationStatus(item.id, 'rejected')}
              >
                <X size={16} color="#EF4444" />
                <Text style={[styles.decisionButtonText, { color: '#EF4444' }]}>
                  Reject
                </Text>
              </TouchableOpacity>
            </View>
          )}
          
          {item.status === 'shortlisted' && (
            <View style={styles.decisionButtons}>
              <TouchableOpacity 
                style={[styles.decisionButton, styles.acceptButton]}
                onPress={() => updateApplicationStatus(item.id, 'accepted')}
              >
                <Check size={16} color="#10B981" />
                <Text style={[styles.decisionButtonText, { color: '#10B981' }]}>
                  Accept
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.decisionButton, styles.rejectButton]}
                onPress={() => updateApplicationStatus(item.id, 'rejected')}
              >
                <X size={16} color="#EF4444" />
                <Text style={[styles.decisionButtonText, { color: '#EF4444' }]}>
                  Reject
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.decisionButton, styles.messageButton]}
                onPress={() => onViewApplicant(item.caregiverId, true)}
              >
                <MessageCircle size={16} color="#3B82F6" />
                <Text style={[styles.decisionButtonText, { color: '#3B82F6' }]}>
                  Message
                </Text>
              </TouchableOpacity>
            </View>
          )}
          
          {(item.status === 'accepted' || item.status === 'rejected') && (
            <View style={styles.decisionButtons}>
              <TouchableOpacity 
                style={[styles.decisionButton, styles.messageButton]}
                onPress={() => onViewApplicant(item.caregiverId, true)}
              >
                <MessageCircle size={16} color="#3B82F6" />
                <Text style={[styles.decisionButtonText, { color: '#3B82F6' }]}>
                  Message
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.decisionButton, styles.callButton]}
                onPress={() => {
                  if (item.caregiver?.phoneNumber) {
                    // Implement call functionality
                    Linking.openURL(`tel:${item.caregiver.phoneNumber}`);
                  } else {
                    Alert.alert('No Phone Number', 'This caregiver has not provided a phone number.');
                  }
                }}
              >
                <Phone size={16} color="#10B981" />
                <Text style={[styles.decisionButtonText, { color: '#10B981' }]}>
                  Call
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.decisionButton, styles.emailButton]}
                onPress={() => {
                  if (item.caregiver?.email) {
                    // Implement email functionality
                    Linking.openURL(`mailto:${item.caregiver.email}`);
                  }
                }}
              >
                <Mail size={16} color="#6B7280" />
                <Text style={[styles.decisionButtonText, { color: '#6B7280' }]}>
                  Email
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <User size={48} color="#E5E7EB" />
      <Text style={styles.emptyStateTitle}>
        {selectedTab === 'all' 
          ? 'No applications yet'
          : selectedTab === 'new' 
            ? 'No new applications'
            : 'No reviewed applications'}
      </Text>
      <Text style={styles.emptyStateText}>
        {selectedTab === 'all' 
          ? 'When caregivers apply to your job, their applications will appear here.'
          : selectedTab === 'new' 
            ? 'Check back later for new applications.'
            : 'Applications you\'ve reviewed will appear here.'}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tab, selectedTab === 'all' && styles.tabActive]}
          onPress={() => setSelectedTab('all')}
        >
          <Text style={[styles.tabText, selectedTab === 'all' && styles.tabTextActive]}>
            All Applications
          </Text>
          {selectedTab === 'all' && <View style={styles.tabIndicator} />}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, selectedTab === 'new' && styles.tabActive]}
          onPress={() => setSelectedTab('new')}
        >
          <Text style={[styles.tabText, selectedTab === 'new' && styles.tabTextActive]}>
            New
          </Text>
          {selectedTab === 'new' && <View style={styles.tabIndicator} />}
          
          {/* New applications badge */}
          {applications.some(app => app.status === 'pending') && selectedTab !== 'new' && (
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>
                {applications.filter(app => app.status === 'pending').length}
              </Text>
            </View>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, selectedTab === 'reviewed' && styles.tabActive]}
          onPress={() => setSelectedTab('reviewed')}
        >
          <Text style={[styles.tabText, selectedTab === 'reviewed' && styles.tabTextActive]}>
            Reviewed
          </Text>
          {selectedTab === 'reviewed' && <View style={styles.tabIndicator} />}
        </TouchableOpacity>
      </View>
      
      {/* Applications list */}
      {loading && applications.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Loading applications...</Text>
        </View>
      ) : (
        <FlatList
          data={applications}
          renderItem={renderApplicationItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#4F46E5']}
              tintColor="#4F46E5"
            />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    position: 'relative',
  },
  tabActive: {
    // Active tab styles
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#4F46E5',
    fontWeight: '600',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: '20%',
    right: '20%',
    height: 3,
    backgroundColor: '#4F46E5',
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  newBadge: {
    position: 'absolute',
    top: 8,
    right: 16,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  newBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    color: '#6B7280',
    fontSize: 14,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  applicationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  applicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  applicantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  applicantDetails: {
    flex: 1,
  },
  applicantName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  appliedDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  applicationMessage: {
    fontSize: 14,
    color: '#4B5563',
    fontStyle: 'italic',
    marginBottom: 12,
    lineHeight: 20,
  },
  applicationActions: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    marginBottom: 8,
  },
  viewProfileText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4F46E5',
    marginRight: 4,
  },
  decisionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  decisionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
  },
  acceptButton: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  shortlistButton: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  rejectButton: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  messageButton: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  callButton: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  emailButton: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  decisionButtonText: {
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 4,
  },
});

export default JobApplications;
