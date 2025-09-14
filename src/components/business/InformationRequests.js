import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, Alert, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { settingsService } from '../../services';

export function InformationRequests({ user, userType, colors }) {
  const [activeTab, setActiveTab] = useState('pending');
  const [pendingRequests, setPendingRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadRequests();
  }, [activeTab]);

  const loadRequests = async () => {
    setLoading(true);
    try {
      if (activeTab === 'pending') {
        // Use privacy API for pending requests
        const data = await settingsService.getPrivacySettings();
        setPendingRequests([]);
      } else {
        // Mock sent requests for now
        setSentRequests([]);
      }
    } catch (error) {
      console.error('Failed to load requests:', error);
      // Set empty arrays on error
      if (activeTab === 'pending') {
        setPendingRequests([]);
      } else {
        setSentRequests([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResponse = async (requestId, approved, sharedFields = []) => {
    try {
      await settingsService.respondToRequest({ requestId, approved, sharedFields });
      Alert.alert('Success', approved ? 'Information shared successfully' : 'Request declined');
      loadRequests();
    } catch (error) {
      Alert.alert('Error', 'Failed to respond to request');
    }
  };

  const renderRequest = (request) => (
    <View key={request.id} style={styles.requestCard}>
      <View style={styles.requestHeader}>
        <Text style={styles.requesterName}>{request.requesterName}</Text>
        <Text style={styles.requestDate}>{new Date(request.createdAt).toLocaleDateString()}</Text>
      </View>
      
      <Text style={styles.requestReason}>{request.reason}</Text>
      
      <View style={styles.requestedFields}>
        <Text style={styles.fieldsLabel}>Requested Information:</Text>
        {request.requestedFields.map((field, index) => (
          <Text key={index} style={styles.fieldItem}>• {field}</Text>
        ))}
      </View>

      {activeTab === 'pending' && request.status === 'pending' && (
        <View style={styles.requestActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.declineButton]}
            onPress={() => handleResponse(request.id, false)}
          >
            <Text style={styles.declineButtonText}>Decline</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={() => handleResponse(request.id, true, request.requestedFields)}
          >
            <Text style={styles.approveButtonText}>Approve</Text>
          </TouchableOpacity>
        </View>
      )}

      {request.status !== 'pending' && (
        <View style={[styles.statusBadge, { 
          backgroundColor: request.status === 'approved' ? '#10B981' : '#EF4444' 
        }]}>
          <Text style={styles.statusText}>{request.status.toUpperCase()}</Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Information Requests</Text>
      
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'pending' && { borderBottomColor: colors.primary }]}
          onPress={() => setActiveTab('pending')}
        >
          <Text style={[styles.tabText, activeTab === 'pending' && { color: colors.primary }]}>
            Pending ({pendingRequests.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'sent' && { borderBottomColor: colors.primary }]}
          onPress={() => setActiveTab('sent')}
        >
          <Text style={[styles.tabText, activeTab === 'sent' && { color: colors.primary }]}>
            Sent ({sentRequests.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.requestsList}>
        {loading ? (
          <Text style={styles.loadingText}>Loading...</Text>
        ) : (
          <>
            {activeTab === 'pending' && pendingRequests.map((request) => renderRequest(request))}
            {activeTab === 'sent' && sentRequests.map((request) => renderRequest(request))}
            {((activeTab === 'pending' && pendingRequests.length === 0) || 
              (activeTab === 'sent' && sentRequests.length === 0)) && (
              <Text style={styles.emptyText}>No requests found</Text>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 24,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    alignItems: 'center',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  requestsList: {
    maxHeight: 400,
  },
  requestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  requesterName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  requestDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  requestReason: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 12,
  },
  requestedFields: {
    marginBottom: 16,
  },
  fieldsLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  fieldItem: {
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 8,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  declineButton: {
    backgroundColor: '#F3F4F6',
  },
  declineButtonText: {
    color: '#374151',
    fontWeight: '500',
  },
  approveButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  loadingText: {
    textAlign: 'center',
    color: '#6B7280',
    marginTop: 32,
  },
  emptyText: {
    textAlign: 'center',
    color: '#6B7280',
    marginTop: 32,
  },
});
