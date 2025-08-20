import { StyleSheet } from 'react-native';
import { shadows } from '../../utils/shadows';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F7FC",
    paddingHorizontal: 0,
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
    width: 280,
    marginRight: 16,
    borderRadius: 12,
    ...shadows.sm,
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
  },
  postedDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  jobActionButtons: {
    flexDirection: 'row',
  },
  secondaryButton: {
    marginRight: 8,
    borderColor: '#D1D5DB',
  },
  secondaryButtonText: {
    color: '#374151',
    fontSize: 13,
    fontWeight: '500',
  },
  primaryButton: {
    backgroundColor: '#2563EB',
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
});
