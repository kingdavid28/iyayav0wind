import { StyleSheet, Platform } from 'react-native';

// Design tokens - export as named exports
export const colors = {
  primary: '#8B5CF6',
  primaryLight: '#F5F3FF',
  primaryLighter: '#FAF7FF',
  primaryDark: '#7C3AED',
  secondary: '#EC4899',
  secondaryLight: '#FCE7F3',
  accent: '#F59E0B',
  accentLight: '#FEF3C7',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  text: '#1F2937',
  textSecondary: '#4B5563',
  textTertiary: '#6B7280',
  textInverse: '#FFFFFF',
  background: '#F9FAFB',
  backgroundLight: '#F3F4F6',
  surface: '#FFFFFF',
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  divider: '#E5E7EB',
};

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const typography = {
  h2: { fontSize: 24, fontWeight: '700', lineHeight: 32 },
  h3: { fontSize: 18, fontWeight: '600', lineHeight: 24 },
  subtitle1: { fontSize: 16, fontWeight: '600', lineHeight: 22 },
  subtitle2: { fontSize: 14, fontWeight: '600', lineHeight: 20 },
  body1: { fontSize: 14, fontWeight: '400', lineHeight: 20 },
  body2: { fontSize: 13, fontWeight: '400', lineHeight: 18 },
  caption: { fontSize: 12, fontWeight: '400', lineHeight: 16 },
  button: { fontSize: 14, fontWeight: '600', lineHeight: 20 },
};

export const styles = StyleSheet.create({
  // Base container styles
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    flex: 1,
    padding: spacing.md,
  },
  header: {
    paddingTop: Platform.select({
      web: 20,
      ios: 40,
      android: 50,
    }),
    paddingBottom: Platform.select({
      web: 10,
      default: 1,
    }),
    paddingHorizontal: Platform.select({
      web: 10,
      default: 5,
    }),
  },
  headerContent: {
    width: '100%',
    flexDirection: Platform.select({
      web: 'row',
      default: 'column',
    }),
    justifyContent: 'space-between',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Platform.select({
      web: 5,
      default: 2,
    }),
    marginBottom: Platform.select({
      web: 3,
      default: 2,
    }),
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Platform.select({
      web: 5,
      default: 2,
    }),
    marginBottom: Platform.select({
      web: 5,
      default: 2,
    }),
  },
  logoImage: {
    width: Platform.select({
      web: 90,
      default: 60,
    }),
    height: Platform.select({
      web: 110,
      default: 80,
    }),
    marginRight: 2,
  },
  logoText: {
    fontSize: Platform.select({
      web: 24,
      default: 20,
    }),
    fontWeight: 'bold',
    color: 'white',
  },
  headerBadge: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: Platform.select({
      web: 10,
      default: 8,
    }),
    alignSelf: 'flex-start',
  },
  headerBadgeText: {
    fontSize: Platform.select({
      web: 12,
      default: 10,
    }),
    fontWeight: '600',
    color: '#2196f3',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Platform.select({
      web: 5,
      default: 2,
    }),
  },
  headerButton: {
    padding: Platform.select({
      web: 8,
      default: 2,
    }),
    marginLeft: Platform.select({
      web: 20,
      default: 8,
    }),
    minWidth: Platform.select({
      web: 5,
      default: 36,
    }),
  },
  // Fixed tab container styles
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: '#ffffff',
  },
  activeNavItem: {
    backgroundColor: '#fce7f3',
  },
  navText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  activeNavText: {
    color: '#db2777',
    fontWeight: '600',
  },
  dashboardContent: {
    padding: 16,
    gap: 16,
  },
  welcomeCard: {
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#4b5563',
  },
  quickActionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  quickAction: {
    width: '48%',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  quickActionText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  sectionCard: {
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 10,
    marginLeft: 10,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginRight: 20,
    marginBottom: 10,
    marginLeft: 20,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 1,
    marginLeft: 10,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
  },
  addButtonText: {
    marginLeft: 2,
    fontSize: 14,
    fontWeight: '500',
  },
  childrenList: {
    gap: 12,
  },
  childCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
  },
  childIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  childInfo: {
    flex: 1,
  },
  childName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  childDetails: {
    fontSize: 14,
    color: '#6b7280',
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  bookingsList: {
    gap: 12,
  },
  bookingCard: {
    flexDirection: 'column',
    alignItems: 'stretch',
    justifyContent: 'flex-start',
    padding: 12,
    marginBottom: 8,
    borderRadius: 12,
    position: 'relative',
    overflow: 'hidden', // ensure children don't render outside rounded corners
  },
  bookingInfo: {
    flex: 1,
    minWidth: 0, // allow text to wrap/shrink inside flex row
  },
  bookingCaregiver: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    flexShrink: 1,
    flexWrap: 'wrap',
  },
  bookingTime: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
    flexShrink: 1,
    flexWrap: 'wrap',
  },
  bookingChildren: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
    flexShrink: 1,
    flexWrap: 'wrap',
  },
  bookingStatus: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 0,
    marginLeft: 8,
    flexShrink: 0,
  },
  bookingStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  caregiversContent: {
    padding: 16,
    gap: 16,
  },
  // Search and filter bar styles
  combinedSearchFilterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  searchContainerInline: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIconInline: {
    marginRight: 8,
  },
  searchInputInline: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
    paddingVertical: 0,
  },
  searchLoadingInline: {
    marginLeft: 8,
  },
  filterButtonInline: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  filterBadgeInline: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#ef4444',
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeTextInline: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  activeFiltersContainer: {
    marginBottom: 16,
  },
  activeFiltersScroll: {
    paddingVertical: 4,
  },
  activeFiltersText: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  caregiversList: {
    gap: 16,
  },
  caregiverCard: {
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  caregiverContent: {
    padding: 16,
    gap: 16,
  },
  caregiverHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    marginRight: 12,
    backgroundColor: '#f3f4f6',
  },
  caregiverInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  caregiverName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginRight: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  rating: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginLeft: 4,
    marginRight: 4,
  },
  reviews: {
    fontSize: 14,
    color: '#6b7280',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  location: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 4,
  },
  experience: {
    fontSize: 14,
    color: '#6b7280',
  },
  rateContainer: {
    alignItems: 'flex-end',
  },
  hourlyRate: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#db2777',
  },
  specialtiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  specialtyTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  specialtyText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  availabilityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  availabilityDot: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  availabilityIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  availabilityText: {
    fontSize: 14,
    color: '#6b7280',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  messageButton: {
    backgroundColor: '#f3f4f6',
  },
  messageButtonText: {
    marginLeft: 8,
    color: '#2563eb',
    fontWeight: '600',
  },
  bookButton: {
    backgroundColor: '#db2777',
  },
  bookButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  emptySection: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptySectionText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 8,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  
  // Utility and shared component styles used by dashboard components
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 16,
  },
  shadowSm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  flexRow: {
    flexDirection: 'row',
  },
  flexWrap: {
    flexWrap: 'wrap',
  },
  itemsCenter: {
    alignItems: 'center',
  },
  justifyBetween: {
    justifyContent: 'space-between',
  },
  avatarLg: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f3f4f6',
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  iconButton: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
  },
  button: {
    backgroundColor: '#db2777',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  saveButton: {
    backgroundColor: '#db2777',
  },
  // Modal styles for ChildModal/ProfileModal
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 5,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 0,
    width: '50%',
    maxWidth: 500,
    minHeight: '60%',
    maxHeight: '85%',
    height: 'auto',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    height: '20%',
    padding: 16,
  },
  input: {
    marginBottom: 10,
    backgroundColor: '#ffffff',
    minHeight: 56,
  },
  childItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 4,
  },
  modalBody: {
    flex: 1,
    padding: 16,
  },
  childrenListTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  
  // Add these styles to your existing styles object
bookingsContent: {
  flex: 1,
  padding: 16,
},
bookingsHeader: {
  marginBottom: 16,
},
bookingsTitle: {
  fontSize: 24,
  fontWeight: 'bold',
  color: '#1f2937',
  marginBottom: 12,
},
bookingsFilterTabs: {
  flexDirection: 'row',
  backgroundColor: '#f3f4f6',
  borderRadius: 8,
  padding: 4,
},
filterTab: {
  flex: 1,
  paddingVertical: 8,
  paddingHorizontal: 12,
  borderRadius: 6,
  alignItems: 'center',
},
activeFilterTab: {
  backgroundColor: 'white',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.1,
  shadowRadius: 2,
  elevation: 2,
},
filterTabText: {
  fontSize: 14,
  fontWeight: '500',
  color: '#6b7280',
},
activeFilterTabText: {
  color: '#db2777',
  fontWeight: '600',
},
bookingItemCard: {
  backgroundColor: 'white',
  borderRadius: 12,
  padding: 16,
  marginBottom: 12,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.1,
  shadowRadius: 2,
  elevation: 2,
},
bookingItemHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: 12,
},
bookingCaregiverInfo: {
  flexDirection: 'row',
  alignItems: 'flex-start',
  flex: 1,
},
bookingAvatar: {
  width: 40,
  height: 40,
  borderRadius: 20,
  marginRight: 12,
},
bookingCaregiverDetails: {
  flex: 1,
},
bookingCaregiverName: {
  fontSize: 16,
  fontWeight: '600',
  color: '#1f2937',
  marginBottom: 4,
},
bookingStatusBadge: {
  alignSelf: 'flex-start',
  paddingHorizontal: 8,
  paddingVertical: 4,
  borderRadius: 12,
},

bookingCost: {
  fontSize: 18,
  fontWeight: 'bold',
  color: '#db2777',
},
bookingDetails: {
  marginBottom: 16,
},
bookingDetailRow: {
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: 8,
},
bookingDetailText: {
  marginLeft: 8,
  fontSize: 14,
  color: '#6b7280',
  flex: 1,
},
bookingActions: {
  flexDirection: 'row',
  justifyContent: 'flex-end',
  gap: 8,
},
bookingActionButton: {
  paddingHorizontal: 16,
  paddingVertical: 8,
  borderRadius: 8,
  minWidth: 100,
  alignItems: 'center',
},
payButton: {
  backgroundColor: '#3B82F6',
},
viewButton: {
  paddingVertical: 4,
  paddingHorizontal: 16,
  borderRadius: 8,
  backgroundColor: '#fce7f3',
},
reviewButton: {
  backgroundColor: '#8B5CF6',
},
payButtonText: {
  color: 'white',
  fontWeight: '600',
  fontSize: 14,
},
viewButtonText: {
  color: 'white',
  fontWeight: '600',
  fontSize: 14,
},
cancelButtonText: {
  color: '#92400E',
  fontWeight: '600',
  fontSize: 14,
},
reviewButtonText: {
  color: 'white',
  fontWeight: '600',
  fontSize: 14,
},

// Add these styles to your existing StyleSheet
paymentModalContent: {
  backgroundColor: '#ffffff',
  borderRadius: 16,
  width: '90%',
  maxWidth: 400,
  overflow: 'hidden',
},

closeButton: {
  width: 32,
  height: 32,
  borderRadius: 16,
  backgroundColor: colors.backgroundLight,
  justifyContent: 'center',
  alignItems: 'center',
},
closeIcon: {
  fontSize: 24,
  color: colors.textSecondary,
  lineHeight: 28,
},
modalSubtitle: {
  ...typography.body1,
  color: colors.textSecondary,
  textAlign: 'center',
  marginBottom: spacing.lg,
},
uploadContainer: {
  marginBottom: spacing.xl,
},
uploadArea: {
  borderWidth: 2,
  borderStyle: 'dashed',
  borderColor: colors.primaryLight,
  borderRadius: 12,
  padding: spacing.xl,
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: colors.primaryLighter,
},
uploadIcon: {
  width: 48,
  height: 48,
  borderRadius: 24,
  backgroundColor: colors.primary,
  justifyContent: 'center',
  alignItems: 'center',
  marginBottom: spacing.md,
},
uploadIconText: {
  fontSize: 24,
  color: colors.textInverse,
  fontWeight: '300',
},
uploadPrompt: {
  ...typography.subtitle2,
  color: colors.text,
  marginBottom: spacing.xs,
},
uploadHint: {
  ...typography.caption,
  color: colors.textTertiary,
},
imagePreviewContainer: {
  alignItems: 'center',
},
paymentImage: {
  width: '100%',
  height: 200,
  borderRadius: 8,
  marginBottom: spacing.md,
  backgroundColor: colors.backgroundLight,
},
changePhotoButton: {
  paddingVertical: spacing.xs,
  paddingHorizontal: spacing.md,
},
changePhotoText: {
  ...typography.body2,
  color: colors.primary,
  fontWeight: '500',
},
modalButtons: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  //gap: spacing.md,
},
modalButton: {
  flex: 1,
  //paddingVertical: spacing.md,
  borderRadius: 10,
  width: '100%',
  height: 40,
  alignItems: 'center',
  justifyContent: 'center',
},

submitButton: {
  paddingHorizontal: spacing.md,
  backgroundColor: colors.secondary,
},
disabledButton: {
  backgroundColor: colors.borderLight,
},

submitButtonText: {
  ...typography.button,
  color: colors.textInverse,
},
// Add to your existing styles object
profileHeader: {
  flexDirection: 'row',
  alignItems: 'center',
  padding: spacing.md,
  backgroundColor: colors.surface,
  borderRadius: 12,
  marginBottom: spacing.md,
},
profileAvatar: {
  width: 60,
  height: 60,
  borderRadius: 30,
  backgroundColor: colors.primaryLight,
  justifyContent: 'center',
  alignItems: 'center',
  marginRight: spacing.md,
},
profileAvatarText: {
  fontSize: 24,
  fontWeight: 'bold',
  color: colors.primary,
},
profileInfo: {
  flex: 1,
},
profileName: {
  ...typography.h3,
  color: colors.text,
  marginBottom: spacing.xs,
},
profileContact: {
  ...typography.body2,
  color: colors.textSecondary,
  marginBottom: spacing.xs,
},
profileLocation: {
  ...typography.caption,
  color: colors.textTertiary,
  flexDirection: 'row',
  alignItems: 'center',
},
editProfileButton: {
  padding: spacing.xs,
  borderRadius: 8,
  backgroundColor: colors.primaryLight,
},
profileStats: {
  flexDirection: 'row',
  justifyContent: 'space-around',
  padding: spacing.md,
  backgroundColor: colors.surface,
  borderRadius: 12,
  marginBottom: spacing.md,
},
statItem: {
  alignItems: 'center',
},
statValue: {
  ...typography.h3,
  color: colors.primary,
  marginBottom: spacing.xs,
},
statLabel: {
  ...typography.caption,
  color: colors.textSecondary,
},

});

// Export styles as both named and default for backward compatibility
// export { styles };

// export default {
//   colors,
//   spacing,
//   typography,
// };