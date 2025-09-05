import React, { useState } from 'react';
import { View, Text, Modal, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { settingsService } from '../services/settingsService';

export function RequestInfoModal({ visible, onClose, targetUser, colors }) {
  const [selectedFields, setSelectedFields] = useState([]);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const availableFields = [
    { id: 'phone', label: 'Phone Number', icon: 'call-outline' },
    { id: 'email', label: 'Email Address', icon: 'mail-outline' },
    { id: 'address', label: 'Home Address', icon: 'location-outline' },
    { id: 'emergencyContact', label: 'Emergency Contact', icon: 'person-outline' },
    { id: 'references', label: 'References', icon: 'people-outline' },
    { id: 'certifications', label: 'Certifications', icon: 'ribbon-outline' },
  ];

  const toggleField = (fieldId) => {
    setSelectedFields(prev => 
      prev.includes(fieldId) 
        ? prev.filter(id => id !== fieldId)
        : [...prev, fieldId]
    );
  };

  const handleSubmit = async () => {
    if (selectedFields.length === 0 || !reason.trim()) return;
    
    setLoading(true);
    try {
      await settingsService.requestInformation({
        targetUserId: targetUser.id,
        requestedFields: selectedFields,
        reason: reason.trim(),
      });
      
      setSelectedFields([]);
      setReason('');
      onClose();
    } catch (error) {
      console.error('Failed to send request:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Request Information</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#374151" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <Text style={styles.subtitle}>
            Request information from {targetUser?.name || 'this user'}
          </Text>

          <Text style={styles.sectionTitle}>Select Information</Text>
          {availableFields.map(field => (
            <TouchableOpacity
              key={field.id}
              style={[
                styles.fieldOption,
                selectedFields.includes(field.id) && styles.fieldOptionSelected
              ]}
              onPress={() => toggleField(field.id)}
            >
              <Ionicons 
                name={field.icon} 
                size={20} 
                color={selectedFields.includes(field.id) ? colors.primary : '#6B7280'} 
              />
              <Text style={[
                styles.fieldLabel,
                selectedFields.includes(field.id) && { color: colors.primary }
              ]}>
                {field.label}
              </Text>
              {selectedFields.includes(field.id) && (
                <Ionicons name="checkmark" size={20} color={colors.primary} />
              )}
            </TouchableOpacity>
          ))}

          <Text style={styles.sectionTitle}>Reason for Request</Text>
          <TextInput
            style={styles.reasonInput}
            placeholder="Please explain why you need this information..."
            value={reason}
            onChangeText={setReason}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          <TouchableOpacity
            style={[
              styles.submitButton,
              { backgroundColor: colors.primary },
              (selectedFields.length === 0 || !reason.trim() || loading) && styles.submitButtonDisabled
            ]}
            onPress={handleSubmit}
            disabled={selectedFields.length === 0 || !reason.trim() || loading}
          >
            <Text style={styles.submitButtonText}>
              {loading ? 'Sending...' : 'Send Request'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
    marginTop: 16,
  },
  fieldOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  fieldOptionSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#EBF4FF',
  },
  fieldLabel: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
    marginLeft: 12,
  },
  reasonInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: 100,
  },
  submitButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});