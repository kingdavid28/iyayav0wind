import { StyleSheet } from 'react-native';
import { shadows } from '../../utils/shadows';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F7FC",
    paddingHorizontal: 0,
  },
  // Parent-like header styles
  parentLikeHeaderContainer: {
    paddingTop: 40,
    paddingBottom: 8,
    paddingHorizontal: 2,
  },
  parentLikeHeaderGradient: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  logoImage: {
    width: 60,
    height: 80,
  },
  headerBadge: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
    alignSelf: 'flex-start',
  },
  headerBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#2196f3',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 6,
    marginLeft: 8,
    minWidth: 36,
  },
  header: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    ...shadows.md,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  profileImageContainer: {
    position: "relative",
    marginRight: 16,
  },
  profileImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: "#E5E7EB",
  },
  verifiedBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#10B981",
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  ratingText: {
    fontSize: 14,
    color: "#6B7280",
    marginLeft: 4,
  },
  profileDetail: {
    fontSize: 14,
    color: "#6B7280",
  },
  editProfileButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  tabs: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 4,
    ...shadows.sm,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: "#EFF6FF",
  },
  tabText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#6B7280",
    marginLeft: 6,
  },
  activeTabText: {
    color: "#2563EB",
    fontWeight: "600",
  },
  // Parent-style horizontal top nav
  navContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  navScroll: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  navTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
    minWidth: 100,
  },
  navTabActive: {
    backgroundColor: '#bed6fc',
    borderColor: '#bed6fc',
  },
  navTabText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  navTabTextActive: {
    color: '#3b83f5',
    fontWeight: '600',
  },
  // Legacy styles for compatibility
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  activeNavItem: {
    backgroundColor: '#bed6fc',
    borderColor: '#bed6fc',
  },
  navText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  activeNavText: {
    color: '#3b83f5',
  },
  content: {
    flex: 1,
    paddingTop: 16,
  },
  searchBar: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    elevation: 0,
    height: 48,
  },
  searchInput: {
    fontSize: 14,
    color: "#111827",
    paddingBottom: 0,
    marginBottom: 0,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  // New quick stats and actions grids
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  quickTile: {
    width: '48%',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    ...shadows.sm,
  },
  quickActionTile: {
    width: '48%',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    ...shadows.sm,
  },
  quickActionGradient: {
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    minHeight: 88,
    justifyContent: 'center',
  },
  quickIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickActionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)'
  },
  quickValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  quickLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  quickActionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  statCard: {
    width: '31%',
    borderRadius: 12,
    padding: 16,
    ...shadows.xs,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  jobsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    alignItems: 'stretch',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  seeAllText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '500',
  },
  horizontalScroll: {
    paddingVertical: 8,
  },
  jobCard: {
    width: '50%',
    marginRight: 0,
    marginBottom: 16,
    borderRadius: 12,
    ...shadows.sm,
  },
  jobCardHorizontal: {
    width: 308,
    marginRight: 16,
    marginBottom: 0,
  },
  jobCardTablet: {
    width: '31%',
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  jobMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  jobMetaText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
    marginRight: 12,
  },
  jobMetaIcon: {
    marginLeft: 12,
    marginRight: 4,
  },
  urgentBadge: {
    backgroundColor: '#FEE2E2',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  urgentBadgeText: {
    color: '#DC2626',
    fontSize: 10,
    fontWeight: '600',
  },
  jobDetails: {
    marginBottom: 12,
  },
  jobDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  jobDetailText: {
    fontSize: 13,
    color: '#4B5563',
    marginLeft: 8,
  },
  requirementsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  requirementTag: {
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
    marginBottom: 8,
  },
  requirementText: {
    fontSize: 12,
    color: '#4B5563',
  },
  moreRequirementsText: {
    fontSize: 12,
    color: '#9CA3AF',
    alignSelf: 'center',
  },
  jobFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    flexWrap: 'wrap',
  },
  postedDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  jobActionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    maxWidth: '100%',
    marginTop: 8,
  },
  secondaryButton: {
    marginRight: 8,
    borderColor: '#D1D5DB',
    paddingHorizontal: 10,
    flexShrink: 1,
  },
  secondaryButtonText: {
    color: '#374151',
    fontSize: 13,
    fontWeight: '500',
  },
  primaryButton: {
    backgroundColor: '#2563EB',
    flexShrink: 1,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
  },
  applicationCard: {
    marginBottom: 12,
    borderRadius: 12,
    ...shadows.sm,
  },
  applicationContent: {
    padding: 16,
  },
  applicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  applicationJobTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  applicationFamily: {
    fontSize: 14,
    color: '#6B7280',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  statusIcon: {
    marginRight: 4,
  },
  applicationDetails: {
    marginBottom: 12,
  },
  applicationDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  applicationDetailText: {
    fontSize: 13,
    color: '#4B5563',
    marginLeft: 8,
  },
  applicationActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  applicationButton: {
    minWidth: 100,
  },
  applicationButtonText: {
    fontSize: 13,
    fontWeight: '500',
  },
  bookingCard: {
    marginBottom: 12,
    borderRadius: 12,
    ...shadows.sm,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  bookingFamily: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  bookingStatus: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  bookingStatusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  bookingDetails: {
    marginBottom: 12,
  },
  bookingDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  bookingDetailText: {
    fontSize: 13,
    color: '#4B5563',
    marginLeft: 8,
  },
  bookingDetailIcon: {
    marginLeft: 16,
    marginRight: 4,
  },
  bookingActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  bookingButton: {
    minWidth: 100,
  },
  bookingButtonText: {
    fontSize: 13,
    fontWeight: '500',
  },
  profileSection: {
    marginBottom: 16,
    borderRadius: 12,
    ...shadows.sm,
  },
  profileSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileSectionContent: {
    marginBottom: 16,
  },
  profileSectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  profileSectionIcon: {
    marginRight: 12,
  },
  profileSectionText: {
    fontSize: 15,
    color: '#4B5563',
  },
  sectionDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 16,
  },
  sectionSubtitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  skillsSection: {
    marginBottom: 16,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  skillTag: {
    backgroundColor: '#EFF6FF',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  skillText: {
    color: '#2563EB',
    fontSize: 13,
    fontWeight: '500',
  },
  certificationsContainer: {
    marginBottom: 8,
  },
  certificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  certificationIcon: {
    marginRight: 12,
  },
  certificationText: {
    fontSize: 14,
    color: '#4B5563',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  filterChip: {
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
  },
  filterChipActive: {
    backgroundColor: '#EFF6FF',
  },
  filterChipText: {
    color: '#6B7280',
    fontSize: 13,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#2563EB',
  },
  bookingFilters: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  bookingFilterChip: {
    marginRight: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
  },
  bookingFilterChipActive: {
    backgroundColor: '#EFF6FF',
  },
  bookingFilterChipText: {
    color: '#6B7280',
    fontSize: 13,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  editProfileModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
  },
  editProfileTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
  },
  editProfileInput: {
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  editProfileSaveButton: {
    marginTop: 8,
    marginBottom: 12,
    backgroundColor: '#2563EB',
  },
  editProfileSaveButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  logoutButton: {
    margin: 16,
    backgroundColor: '#2563EB',
    borderRadius: 8,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  // Badge shown when caregiver already applied to a job
  appliedBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#E8F5E9',
    borderColor: '#C8E6C9',
    borderWidth: 1,
    flexShrink: 1,
  },
  appliedBadgeContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appliedBadgeText: {
    color: '#2E7D32',
    fontWeight: '600',
  },
});
