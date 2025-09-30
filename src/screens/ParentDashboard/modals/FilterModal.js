import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Platform,
} from 'react-native';
import { Slider } from '@miblanchard/react-native-slider';
import { X, RotateCcw } from 'lucide-react-native';
import { ModalWrapper } from '../../../shared/ui';

const DAYS_OF_WEEK = [
  { key: 'monday', label: 'Mon' },
  { key: 'tuesday', label: 'Tue' },
  { key: 'wednesday', label: 'Wed' },
  { key: 'thursday', label: 'Thu' },
  { key: 'friday', label: 'Fri' },
  { key: 'saturday', label: 'Sat' },
  { key: 'sunday', label: 'Sun' },
];

const CERTIFICATIONS = [
  'CPR Certified',
  'First Aid',
  'Early Childhood Education',
  'Newborn Care',
  'Special Needs',
  'Montessori Training',
];

const defaultFilters = {
  availability: { availableNow: false, days: [] },
  location: { distance: 25 },
  rate: { min: 15, max: 50 },
  experience: { min: 1 },
  certifications: [],
  rating: 4.0,
};

const FilterModal = ({ visible, onClose, filters = {}, onApplyFilters }) => {
  const [localFilters, setLocalFilters] = useState(defaultFilters);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setLocalFilters({ ...defaultFilters, ...filters });
  }, [filters, visible]);

  const updateFilter = (category, field, value) => {
    setLocalFilters(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value
      }
    }));
    setHasChanges(true);
  };

  const toggleDay = (day) => {
    const currentDays = localFilters.availability.days;
    const newDays = currentDays.includes(day)
      ? currentDays.filter(d => d !== day)
      : [...currentDays, day];
    
    updateFilter('availability', 'days', newDays);
  };

  const toggleCertification = (cert) => {
    const current = localFilters.certifications;
    const updated = current.includes(cert)
      ? current.filter(c => c !== cert)
      : [...current, cert];
    
    setLocalFilters(prev => ({ ...prev, certifications: updated }));
    setHasChanges(true);
  };

  const resetFilters = () => {
    setLocalFilters(defaultFilters);
    setHasChanges(true);
  };

  const handleApply = () => {
    onApplyFilters(localFilters);
    onClose();
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (localFilters.availability.availableNow) count++;
    if (localFilters.availability.days.length > 0) count++;
    if (localFilters.rate.min > 15 || localFilters.rate.max < 50) count++;
    if (localFilters.experience.min > 1) count++;
    if (localFilters.certifications.length > 0) count++;
    if (localFilters.rating > 4.0) count++;
    return count;
  };

  return (
    <ModalWrapper
      visible={visible}
      onClose={onClose}
      animationType="slide"
      overlayStyle={modalStyles.bottomOverlay}
      style={modalStyles.bottomContent}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Filter Caregivers</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={resetFilters} style={styles.resetButton}>
              <RotateCcw size={20} color="#6B7280" />
              <Text style={styles.resetText}>Reset</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Instructions */}
          <View style={styles.instructionsContainer}>
            <Text style={styles.instructionsTitle}>How to use filters:</Text>
            <Text style={styles.instructionsText}>• Toggle "Available Now" for immediate booking</Text>
            <Text style={styles.instructionsText}>• Select days when you need care</Text>
            <Text style={styles.instructionsText}>• Set your budget range with rate slider</Text>
            <Text style={styles.instructionsText}>• Choose minimum experience and rating</Text>
            <Text style={styles.instructionsText}>• Select required certifications</Text>
          </View>

          {/* Availability Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Availability</Text>
            
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Available Now</Text>
              <Switch
                value={localFilters.availability.availableNow}
                onValueChange={(value) => updateFilter('availability', 'availableNow', value)}
                trackColor={{ false: '#E5E7EB', true: '#8B5CF6' }}
                thumbColor={localFilters.availability.availableNow ? '#FFFFFF' : '#F3F4F6'}
              />
            </View>

            <Text style={styles.subLabel}>Available Days</Text>
            <View style={styles.daysContainer}>
              {DAYS_OF_WEEK.map(day => (
                <TouchableOpacity
                  key={day.key}
                  style={[
                    styles.dayButton,
                    localFilters.availability.days.includes(day.key) && styles.dayButtonActive
                  ]}
                  onPress={() => toggleDay(day.key)}
                >
                  <Text style={[
                    styles.dayButtonText,
                    localFilters.availability.days.includes(day.key) && styles.dayButtonTextActive
                  ]}>
                    {day.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Distance Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Distance</Text>
            <Text style={styles.valueLabel}>Within {localFilters.location.distance} miles</Text>
            <Slider
              value={[localFilters.location.distance]}
              onValueChange={([value]) => updateFilter('location', 'distance', Math.round(value))}
              minimumValue={5}
              maximumValue={50}
              step={5}
              trackStyle={styles.sliderTrack}
              thumbStyle={styles.sliderThumb}
              minimumTrackTintColor="#8B5CF6"
              maximumTrackTintColor="#E5E7EB"
            />
            <View style={styles.sliderLabels}>
              <Text style={styles.sliderLabel}>5 mi</Text>
              <Text style={styles.sliderLabel}>50 mi</Text>
            </View>
          </View>

          {/* Rate Range Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Hourly Rate</Text>
            <Text style={styles.valueLabel}>
              ${localFilters.rate.min} - ${localFilters.rate.max} per hour
            </Text>
            <Slider
              value={[localFilters.rate.min, localFilters.rate.max]}
              onValueChange={([min, max]) => {
                setLocalFilters(prev => ({
                  ...prev,
                  rate: { min: Math.round(min), max: Math.round(max) }
                }));
                setHasChanges(true);
              }}
              minimumValue={10}
              maximumValue={100}
              step={5}
              trackStyle={styles.sliderTrack}
              thumbStyle={styles.sliderThumb}
              minimumTrackTintColor="#8B5CF6"
              maximumTrackTintColor="#E5E7EB"
            />
            <View style={styles.sliderLabels}>
              <Text style={styles.sliderLabel}>$10</Text>
              <Text style={styles.sliderLabel}>$100</Text>
            </View>
          </View>

          {/* Experience Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Minimum Experience</Text>
            <Text style={styles.valueLabel}>
              {localFilters.experience.min} {localFilters.experience.min === 1 ? 'year' : 'years'}
            </Text>
            <Slider
              value={[localFilters.experience.min]}
              onValueChange={([value]) => updateFilter('experience', 'min', Math.round(value))}
              minimumValue={0}
              maximumValue={20}
              step={1}
              trackStyle={styles.sliderTrack}
              thumbStyle={styles.sliderThumb}
              minimumTrackTintColor="#8B5CF6"
              maximumTrackTintColor="#E5E7EB"
            />
            <View style={styles.sliderLabels}>
              <Text style={styles.sliderLabel}>0 years</Text>
              <Text style={styles.sliderLabel}>20+ years</Text>
            </View>
          </View>

          {/* Rating Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Minimum Rating</Text>
            <Text style={styles.valueLabel}>{localFilters.rating.toFixed(1)} stars & above</Text>
            <Slider
              value={[localFilters.rating]}
              onValueChange={([value]) => {
                setLocalFilters(prev => ({ ...prev, rating: Math.round(value * 2) / 2 }));
                setHasChanges(true);
              }}
              minimumValue={0}
              maximumValue={5}
              step={0.5}
              trackStyle={styles.sliderTrack}
              thumbStyle={styles.sliderThumb}
              minimumTrackTintColor="#8B5CF6"
              maximumTrackTintColor="#E5E7EB"
            />
            <View style={styles.sliderLabels}>
              <Text style={styles.sliderLabel}>0 ⭐</Text>
              <Text style={styles.sliderLabel}>5 ⭐</Text>
            </View>
          </View>

          {/* Certifications Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Certifications</Text>
            <View style={styles.certificationsContainer}>
              {CERTIFICATIONS.map(cert => (
                <TouchableOpacity
                  key={cert}
                  style={[
                    styles.certificationButton,
                    localFilters.certifications.includes(cert) && styles.certificationButtonActive
                  ]}
                  onPress={() => toggleCertification(cert)}
                >
                  <Text style={[
                    styles.certificationButtonText,
                    localFilters.certifications.includes(cert) && styles.certificationButtonTextActive
                  ]}>
                    {cert}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.applyButton, !hasChanges && styles.applyButtonDisabled]} 
            onPress={handleApply}
            disabled={!hasChanges}
          >
            <Text style={styles.applyButtonText}>
              Apply {getActiveFilterCount() > 0 ? `(${getActiveFilterCount()})` : ''}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ModalWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    width: '100%',
    alignSelf: 'stretch',
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  resetText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  switchLabel: {
    fontSize: 16,
    color: '#374151',
  },
  subLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  valueLabel: {
    fontSize: 16,
    color: '#8B5CF6',
    fontWeight: '600',
    marginBottom: 12,
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: 'white',
  },
  dayButtonActive: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  dayButtonText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  dayButtonTextActive: {
    color: 'white',
  },
  sliderTrack: {
    height: 4,
    borderRadius: 2,
  },
  sliderThumb: {
    width: 20,
    height: 20,
    backgroundColor: '#8B5CF6',
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  sliderLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  certificationsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  certificationButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: 'white',
  },
  certificationButtonActive: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  certificationButtonText: {
    fontSize: 14,
    color: '#6B7280',
  },
  certificationButtonTextActive: {
    color: 'white',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '600',
  },
  applyButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
  },
  applyButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  applyButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
  instructionsContainer: {
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 12,
    marginVertical: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#8B5CF6',
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
    lineHeight: 20,
  },
});

const modalStyles = StyleSheet.create({
  bottomOverlay: {
    justifyContent: 'flex-end',
    alignItems: 'stretch',
    paddingHorizontal: 0,
  },
  bottomContent: {
    width: '100%',
    maxWidth: undefined,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 0,
  },
});

export default FilterModal;