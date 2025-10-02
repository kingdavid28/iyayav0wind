import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
  Linking,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { caregiversAPI } from '../services';
import ProfileImage from '../components/ui/feedback/ProfileImage';
import { Calendar, Clock, MapPin, Phone, Mail, Award, Star } from 'lucide-react-native';
import { formatDate } from '../utils/dateUtils';

const formatCurrency = (value) => {
  if (value == null) {
    return '—';
  }
  const amount = Number(value);
  if (Number.isNaN(amount)) {
    return '—';
  }
  return `₱${amount.toLocaleString('en-PH', { maximumFractionDigits: 2 })}`;
};

const CaregiverProfileScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { caregiverId, caregiver: initialCaregiver = null } = route.params || {};

  const [caregiver, setCaregiver] = useState(initialCaregiver);
  const [loading, setLoading] = useState(!initialCaregiver);
  const [refreshing, setRefreshing] = useState(false);

  const resolvedCaregiverId = useMemo(() => {
    if (caregiverId) {
      return caregiverId;
    }
    const candidate = initialCaregiver?._id || initialCaregiver?.id || initialCaregiver?.caregiverId;
    return candidate ?? null;
  }, [caregiverId, initialCaregiver]);

  const normalizeCaregiver = useCallback((rawCaregiver = {}) => {
    if (!rawCaregiver) {
      return null;
    }

    const base = rawCaregiver.caregiver || rawCaregiver.provider || rawCaregiver.data || rawCaregiver;

    const normalized = {
      ...base,
      _id: base?._id || base?.id || rawCaregiver?._id || rawCaregiver?.id || resolvedCaregiverId,
      id: base?.id || base?._id || rawCaregiver?.id || rawCaregiver?._id || resolvedCaregiverId,
      name: base?.name || base?.displayName || base?.fullName || 'Caregiver',
      rating: base?.rating ?? base?.averageRating ?? 0,
      reviewCount: base?.reviewCount ?? base?.reviewsCount ?? 0,
      hourlyRate: base?.hourlyRate != null ? Number(base.hourlyRate) : undefined,
      certifications: base?.certifications ?? [],
      skills: base?.skills ?? [],
      experience: base?.experience ?? {},
      availability: base?.availability ?? {},
      contactEmail: base?.contactEmail || base?.email,
      contactPhone: base?.contactPhone || base?.phone,
      profileImage: base?.profileImage || base?.avatar || base?.photoUrl,
      location: base?.location || base?.address,
      bio: base?.bio || base?.aboutMe,
      createdAt: base?.createdAt,
      updatedAt: base?.updatedAt,
    };

    return normalized;
  }, [resolvedCaregiverId]);

  const fetchCaregiver = useCallback(async (showErrors = true) => {
    if (!resolvedCaregiverId) {
      if (showErrors) {
        Alert.alert('Missing caregiver ID', 'Unable to load caregiver profile because no ID was provided.');
      }
      return;
    }

    try {
      setLoading(true);
      let normalized = null;
      try {
        const response = await caregiversAPI.getById(resolvedCaregiverId);
        normalized = normalizeCaregiver(response);
      } catch (error) {
        const statusCode = error?.response?.status || error?.statusCode;
        const isNotFound = error?.code === 'VALIDATION_ERROR' || statusCode === 404;

        if (!isNotFound) {
          throw error;
        }

        const fallbackResponse = await caregiversAPI.getProfile({ cache: false });
        normalized = normalizeCaregiver(fallbackResponse);

        if (!normalized) {
          throw error;
        }
      }

      if (!normalized) {
        throw new Error('Caregiver profile not found');
      }
      setCaregiver(normalized);
    } catch (error) {
      console.error('Failed to load caregiver profile:', error);
      if (showErrors) {
        Alert.alert('Error', error?.message || 'Failed to load caregiver profile.');
      }
    } finally {
      setLoading(false);
    }
  }, [resolvedCaregiverId, normalizeCaregiver]);

  useEffect(() => {
    if (!initialCaregiver && resolvedCaregiverId) {
      fetchCaregiver(false);
    }
  }, [initialCaregiver, resolvedCaregiverId, fetchCaregiver]);

  useEffect(() => {
    if (caregiver?.name) {
      navigation.setOptions({ title: caregiver.name });
    }
  }, [caregiver?.name, navigation]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchCaregiver(false);
    setRefreshing(false);
  }, [fetchCaregiver]);

  const handleContact = useCallback((type) => {
    if (!caregiver) {
      return;
    }

    if (type === 'phone' && caregiver.contactPhone) {
      Linking.openURL(`tel:${caregiver.contactPhone}`);
    } else if (type === 'email' && caregiver.contactEmail) {
      Linking.openURL(`mailto:${caregiver.contactEmail}`);
    }
  }, [caregiver]);

  if (!resolvedCaregiverId) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.errorTitle}>Caregiver not found</Text>
        <Text style={styles.errorMessage}>A caregiver ID is required to view this profile.</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#db2777" />
        <Text style={styles.loadingText}>Loading caregiver profile...</Text>
      </View>
    );
  }

  if (!caregiver) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.errorTitle}>Profile unavailable</Text>
        <Text style={styles.errorMessage}>We could not find details for this caregiver right now. Pull to refresh or try again later.</Text>
      </View>
    );
  }

  const experienceDescription = caregiver.experience?.description?.trim();
  const years = caregiver.experience?.years ?? caregiver.experience?.yearsOfExperience;
  const months = caregiver.experience?.months;
  const availabilityDays = caregiver.availability?.days || caregiver.availability?.preferredDays || [];

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.headerSection}>
        <ProfileImage imageUrl={caregiver.profileImage} size={120} borderColor="#db2777" borderWidth={4} />
        <Text style={styles.name}>{caregiver.name}</Text>
        {!!caregiver.bio && <Text style={styles.bio}>{caregiver.bio}</Text>}
        <View style={styles.headerStats}>
          <View style={styles.statItem}>
            <Star size={18} color="#facc15" />
            <Text style={styles.statText}>{Number(caregiver.rating || 0).toFixed(1)}</Text>
            <Text style={styles.statCaption}>{`${caregiver.reviewCount || 0} reviews`}</Text>
          </View>
          <View style={styles.statItem}>
            <Clock size={18} color="#3b82f6" />
            <Text style={styles.statText}>{formatCurrency(caregiver.hourlyRate)}</Text>
            <Text style={styles.statCaption}>Hourly rate</Text>
          </View>
          {years != null && (
            <View style={styles.statItem}>
              <Calendar size={18} color="#10b981" />
              <Text style={styles.statText}>{`${years} yrs${months ? ` ${months} mos` : ''}`}</Text>
              <Text style={styles.statCaption}>Experience</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contact</Text>
        <View style={styles.row}>
          <Phone size={18} color="#3b82f6" />
          <Text style={styles.rowValue}>{caregiver.contactPhone || 'Not provided'}</Text>
          {caregiver.contactPhone && (
            <Text style={styles.rowAction} onPress={() => handleContact('phone')}>
              Call
            </Text>
          )}
        </View>
        <View style={styles.row}>
          <Mail size={18} color="#6366f1" />
          <Text style={styles.rowValue}>{caregiver.contactEmail || 'Not provided'}</Text>
          {caregiver.contactEmail && (
            <Text style={styles.rowAction} onPress={() => handleContact('email')}>
              Email
            </Text>
          )}
        </View>
        <View style={styles.row}>
          <MapPin size={18} color="#22c55e" />
          <Text style={styles.rowValue}>{caregiver.location || 'Location not specified'}</Text>
        </View>
      </View>

      {Array.isArray(caregiver.skills) && caregiver.skills.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Skills</Text>
          <View style={styles.chipGroup}>
            {caregiver.skills.map((skill, index) => (
              <View key={`${skill}-${index}`} style={styles.chip}>
                <Text style={styles.chipText}>{skill}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {!!experienceDescription && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Experience</Text>
          <Text style={styles.paragraph}>{experienceDescription}</Text>
        </View>
      )}

      {Array.isArray(caregiver.certifications) && caregiver.certifications.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Certifications</Text>
          {caregiver.certifications.map((item, index) => (
            <View key={`${item?.name || item}-${index}`} style={styles.certificationRow}>
              <Award size={18} color="#f97316" />
              <View style={styles.certificationTextWrapper}>
                <Text style={styles.certificationName}>{item?.name || item}</Text>
                {item?.issuer && <Text style={styles.certificationIssuer}>{item.issuer}</Text>}
                {item?.issuedAt && (
                  <Text style={styles.certificationIssuer}>
                    Issued {formatDate?.(item.issuedAt) ?? item.issuedAt}
                  </Text>
                )}
              </View>
            </View>
          ))}
        </View>
      )}

      {Array.isArray(availabilityDays) && availabilityDays.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Availability</Text>
          <View style={styles.chipGroup}>
            {availabilityDays.map((day, index) => (
              <View key={`${day}-${index}`} style={[styles.chip, styles.availabilityChip]}>
                <Text style={styles.chipText}>{day}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {caregiver.createdAt && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile Activity</Text>
          <Text style={styles.paragraph}>
            Member since {formatDate?.(caregiver.createdAt) ?? caregiver.createdAt}
          </Text>
          {caregiver.updatedAt && (
            <Text style={styles.paragraph}>Last updated {formatDate?.(caregiver.updatedAt) ?? caregiver.updatedAt}</Text>
          )}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  centeredContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#4b5563',
    textAlign: 'center',
  },
  headerSection: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 24,
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 16,
    color: '#111827',
  },
  bio: {
    marginTop: 8,
    fontSize: 16,
    textAlign: 'center',
    color: '#4b5563',
  },
  headerStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 24,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statText: {
    marginTop: 6,
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  statCaption: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  rowValue: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#374151',
  },
  rowAction: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '600',
  },
  chipGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: '#eff6ff',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  chipText: {
    color: '#1d4ed8',
    fontSize: 14,
    fontWeight: '500',
  },
  availabilityChip: {
    backgroundColor: '#ecfdf5',
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 22,
    color: '#374151',
  },
  certificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  certificationTextWrapper: {
    marginLeft: 12,
    flex: 1,
  },
  certificationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  certificationIssuer: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
});

export default CaregiverProfileScreen;
