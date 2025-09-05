import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import CustomDateTimePicker from '../components/DateTimePicker';
import TimePicker from '../components/TimePicker';
import jobService from '../services/jobService';
import { useApi } from '../hooks/useApi';
import { styles } from './styles/JobPostingScreen.styles';

const JobPostingScreen = () => {
  const navigation = useNavigation();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    startDate: new Date(),
    endDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    startTime: '09:00',
    endTime: '17:00',
    hourlyRate: '',
    totalHours: '',
    childrenAges: '',
    specialRequirements: '',
    isUrgent: false,
    isRecurring: false,
    recurringDays: [],
  });

  const [errors, setErrors] = useState({});

  const { loading, execute: createJob } = useApi();

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Job title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Job description is required';
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }

    if (!formData.hourlyRate || isNaN(formData.hourlyRate) || Number(formData.hourlyRate) <= 0) {
      newErrors.hourlyRate = 'Valid hourly rate is required';
    }

    if (!formData.childrenAges.trim()) {
      newErrors.childrenAges = 'Children ages are required';
    }

    if (formData.startDate >= formData.endDate) {
      newErrors.endDate = 'End date must be after start date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the errors and try again');
      return;
    }

    try {
      const jobData = {
        ...formData,
        hourlyRate: Number(formData.hourlyRate),
        totalHours: formData.totalHours ? Number(formData.totalHours) : null,
        startDate: formData.startDate.toISOString(),
        endDate: formData.endDate.toISOString(),
      };

      const result = await createJob(() => jobService.createJobPost(jobData));

      if (result) {
        Alert.alert(
          'Success',
          'Job posted successfully!',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to post job');
    }
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const toggleRecurringDay = (day) => {
    const days = formData.recurringDays.includes(day)
      ? formData.recurringDays.filter(d => d !== day)
      : [...formData.recurringDays, day];
    updateFormData('recurringDays', days);
  };

  const weekDays = [
    { key: 'monday', label: 'Mon' },
    { key: 'tuesday', label: 'Tue' },
    { key: 'wednesday', label: 'Wed' },
    { key: 'thursday', label: 'Thu' },
    { key: 'friday', label: 'Fri' },
    { key: 'saturday', label: 'Sat' },
    { key: 'sunday', label: 'Sun' },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Post a New Job</Text>
        <Text style={styles.subtitle}>Find the perfect caregiver for your children</Text>
      </View>

      <View style={styles.form}>
        {/* Job Title */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Job Title *</Text>
          <TextInput
            style={[styles.input, errors.title && styles.inputError]}
            value={formData.title}
            onChangeText={(value) => updateFormData('title', value)}
            placeholder="e.g., After-school babysitter needed"
            maxLength={100}
          />
          {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
        </View>

        {/* Description */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description *</Text>
          <TextInput
            style={[styles.textArea, errors.description && styles.inputError]}
            value={formData.description}
            onChangeText={(value) => updateFormData('description', value)}
            placeholder="Describe your childcare needs, expectations, and any special requirements..."
            multiline
            numberOfLines={4}
            maxLength={1000}
          />
          {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
        </View>

        {/* Location */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Location *</Text>
          <TextInput
            style={[styles.input, errors.location && styles.inputError]}
            value={formData.location}
            onChangeText={(value) => updateFormData('location', value)}
            placeholder="e.g., Downtown Toronto, ON"
            maxLength={100}
          />
          {errors.location && <Text style={styles.errorText}>{errors.location}</Text>}
        </View>

        {/* Date Range */}
        <View style={styles.row}>
          <View style={styles.halfWidth}>
            <CustomDateTimePicker
              label="Start Date *"
              value={formData.startDate}
              onDateChange={(date) => updateFormData('startDate', date)}
              minimumDate={new Date()}
              format="short"
            />
          </View>

          <View style={styles.halfWidth}>
            <CustomDateTimePicker
              label="End Date *"
              value={formData.endDate}
              onDateChange={(date) => updateFormData('endDate', date)}
              minimumDate={formData.startDate}
              format="short"
              error={errors.endDate}
            />
          </View>
        </View>

        {/* Time Range */}
        <View style={styles.row}>
          <View style={styles.halfWidth}>
            <TimePicker
              label="Start Time"
              value={formData.startTime}
              onTimeChange={(time) => updateFormData('startTime', time)}
              format24Hour={true}
              minuteInterval={30}
            />
          </View>

          <View style={styles.halfWidth}>
            <TimePicker
              label="End Time"
              value={formData.endTime}
              onTimeChange={(time) => updateFormData('endTime', time)}
              format24Hour={true}
              minuteInterval={30}
            />
          </View>
        </View>

        {/* Rate and Hours */}
        <View style={styles.row}>
          <View style={[styles.inputGroup, styles.halfWidth]}>
            <Text style={styles.label}>Hourly Rate (₱) *</Text>
            <TextInput
              style={[styles.input, errors.hourlyRate && styles.inputError]}
              value={formData.hourlyRate}
              onChangeText={(value) => updateFormData('hourlyRate', value)}
              placeholder="400.00"
              keyboardType="decimal-pad"
            />
            {errors.hourlyRate && <Text style={styles.errorText}>{errors.hourlyRate}</Text>}
          </View>

          <View style={[styles.inputGroup, styles.halfWidth]}>
            <Text style={styles.label}>Total Hours (optional)</Text>
            <TextInput
              style={styles.input}
              value={formData.totalHours}
              onChangeText={(value) => updateFormData('totalHours', value)}
              placeholder="8"
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Children Ages */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Children Ages *</Text>
          <TextInput
            style={[styles.input, errors.childrenAges && styles.inputError]}
            value={formData.childrenAges}
            onChangeText={(value) => updateFormData('childrenAges', value)}
            placeholder="e.g., 3, 5, 8 years old"
            maxLength={100}
          />
          {errors.childrenAges && <Text style={styles.errorText}>{errors.childrenAges}</Text>}
        </View>

        {/* Special Requirements */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Special Requirements</Text>
          <TextInput
            style={styles.textArea}
            value={formData.specialRequirements}
            onChangeText={(value) => updateFormData('specialRequirements', value)}
            placeholder="Any special needs, allergies, or requirements..."
            multiline
            numberOfLines={3}
            maxLength={500}
          />
        </View>

        {/* Urgent Job Toggle */}
        <View style={styles.switchRow}>
          <View style={styles.switchInfo}>
            <Text style={styles.switchLabel}>Urgent Job</Text>
            <Text style={styles.switchDescription}>Mark as urgent to get faster responses</Text>
          </View>
          <Switch
            value={formData.isUrgent}
            onValueChange={(value) => updateFormData('isUrgent', value)}
            trackColor={{ false: '#ccc', true: '#3b83f5' }}
            thumbColor="#fff"
          />
        </View>

        {/* Recurring Job Toggle */}
        <View style={styles.switchRow}>
          <View style={styles.switchInfo}>
            <Text style={styles.switchLabel}>Recurring Job</Text>
            <Text style={styles.switchDescription}>This job repeats weekly</Text>
          </View>
          <Switch
            value={formData.isRecurring}
            onValueChange={(value) => updateFormData('isRecurring', value)}
            trackColor={{ false: '#ccc', true: '#3b83f5' }}
            thumbColor="#fff"
          />
        </View>

        {/* Recurring Days */}
        {formData.isRecurring && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Recurring Days</Text>
            <View style={styles.daysContainer}>
              {weekDays.map((day) => (
                <TouchableOpacity
                  key={day.key}
                  style={[
                    styles.dayButton,
                    formData.recurringDays.includes(day.key) && styles.dayButtonActive
                  ]}
                  onPress={() => toggleRecurringDay(day.key)}
                >
                  <Text style={[
                    styles.dayButtonText,
                    formData.recurringDays.includes(day.key) && styles.dayButtonTextActive
                  ]}>
                    {day.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="add-circle" size={20} color="#fff" />
              <Text style={styles.submitButtonText}>Post Job</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

    </ScrollView>
  );
};

export default JobPostingScreen;
