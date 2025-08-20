"use client"

import React, { useState } from "react"
import { View, Text, ScrollView, Pressable, Dimensions, Image, Modal, TextInput } from "react-native"
import { Card, Searchbar, Chip, Button } from "react-native-paper"
import { Ionicons, MaterialCommunityIcons, FontAwesome } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { styles } from "./styles/CaregiverDashboard.styles"
import { useAuth } from "../contexts/AuthContext"

const { width } = Dimensions.get("window")

export default function CaregiverDashboard({ onLogout }) {
  const { signOut } = useAuth()
  const [activeTab, setActiveTab] = useState("dashboard")
  const [searchQuery, setSearchQuery] = useState("")
  const [editProfileModalVisible, setEditProfileModalVisible] = useState(false)
  const [profileName, setProfileName] = useState("Sarah Johnson")
  const [profileHourlyRate, setProfileHourlyRate] = useState("25")
  const [profileExperience, setProfileExperience] = useState("5+ years")

  const profile = {
    name: "Sarah Johnson",
    rating: 4.9,
    reviews: 127,
    hourlyRate: 25,
    experience: "5+ years",
    specialties: ["Toddlers", "Meal Prep", "Light Housekeeping"],
    certifications: ["CPR Certified", "First Aid", "Child Development"],
    backgroundCheck: "Verified",
    completedJobs: 234,
    responseRate: "98%"
  }

  const mockJobs = [
    {
      id: 1,
      title: "Full-time Nanny for 2 Children",
      family: "The Johnson Family",
      location: "Manhattan, NY",
      distance: "2.1 miles away",
      hourlyRate: 28,
      schedule: "Monday-Friday, 8AM-6PM",
      requirements: ["CPR certified", "Experience with toddlers", "Non-smoker"],
      postedDate: "2 days ago",
      urgent: true,
      children: 2,
      ages: "2, 5"
    },
    {
      id: 2,
      title: "Weekend Babysitter Needed",
      family: "The Smith Family",
      location: "Brooklyn, NY",
      distance: "3.5 miles away",
      hourlyRate: 22,
      schedule: "Weekends, flexible hours",
      requirements: ["Infant experience", "References required"],
      postedDate: "1 week ago",
      urgent: false,
      children: 1,
      ages: "8 months"
    }
  ]

  const mockApplications = [
    {
      id: 1,
      jobTitle: "Full-time Nanny for 2 Children",
      family: "The Johnson Family",
      status: "pending",
      appliedDate: "2023-05-15",
      hourlyRate: 28
    },
    {
      id: 2,
      jobTitle: "Weekend Babysitter",
      family: "The Smith Family",
      status: "accepted",
      appliedDate: "2023-05-10",
      hourlyRate: 25
    }
  ]

  const mockBookings = [
    {
      id: 1,
      family: "The Johnson Family",
      date: "2023-06-01",
      time: "09:00 - 17:00",
      status: "confirmed",
      children: 2,
      location: "Manhattan, NY"
    },
    {
      id: 2,
      family: "The Smith Family",
      date: "2023-06-05",
      time: "18:00 - 22:00",
      status: "pending",
      children: 1,
      location: "Brooklyn, NY"
    }
  ]

  const handleSaveProfile = () => {
    // Save profile logic here
    setEditProfileModalVisible(false)
  }

  const renderEditProfileModal = () => (
    <Modal
      visible={editProfileModalVisible}
      onDismiss={() => setEditProfileModalVisible(false)}
      transparent
      animationType="slide"
    >
      <View style={styles.modalOverlay}>
        <Card style={styles.editProfileModal}>
          <Card.Content>
            <Text style={styles.editProfileTitle}>Edit Profile</Text>
            <TextInput
              label="Name"
              value={profileName}
              onChangeText={setProfileName}
              style={styles.editProfileInput}
            />
            <TextInput
              label="Hourly Rate"
              value={profileHourlyRate}
              onChangeText={setProfileHourlyRate}
              style={styles.editProfileInput}
              keyboardType="numeric"
            />
            <TextInput
              label="Experience"
              value={profileExperience}
              onChangeText={setProfileExperience}
              style={styles.editProfileInput}
            />
            <Button
              mode="contained"
              style={styles.editProfileSaveButton}
              labelStyle={styles.editProfileSaveButtonText}
              onPress={handleSaveProfile}
            >
              Save Changes
            </Button>
            <Button
              mode="text"
              onPress={() => setEditProfileModalVisible(false)}
            >
              Cancel
            </Button>
          </Card.Content>
        </Card>
      </View>
    </Modal>
  )

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.profileHeader}>
          <View style={styles.profileImageContainer}>
            <View style={[styles.profileImage, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#e1e4e8' }]}>
              <Ionicons name="person" size={60} color="#6B7280" />
            </View>
            {profile.backgroundCheck === "Verified" && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark" size={12} color="#fff" />
              </View>
            )}
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{profile.name}</Text>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={16} color="#FFD700" />
              <Text style={styles.ratingText}>
                {profile.rating} ({profile.reviews} reviews)
              </Text>
            </View>
            <Text style={styles.profileDetail}>
              ${profile.hourlyRate}/hr • {profile.experience} experience
            </Text>
          </View>
          <Pressable
            style={styles.editProfileButton}
            onPress={() => setEditProfileModalVisible(true)}
          >
            <Ionicons name="create-outline" size={20} color="#4B5563" />
          </Pressable>
        </View>
      </View>

      <View style={styles.tabs}>
        <Pressable
          style={[styles.tab, activeTab === "dashboard" && styles.activeTab]}
          onPress={() => setActiveTab("dashboard")}
        >
          <Ionicons
            name="grid"
            size={20}
            color={activeTab === "dashboard" ? "#2563eb" : "#6B7280"}
          />
          <Text style={[styles.tabText, activeTab === "dashboard" && styles.activeTabText]}>
            Dashboard
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === "jobs" && styles.activeTab]}
          onPress={() => setActiveTab("jobs")}
        >
          <Ionicons
            name="briefcase"
            size={20}
            color={activeTab === "jobs" ? "#2563eb" : "#6B7280"}
          />
          <Text style={[styles.tabText, activeTab === "jobs" && styles.activeTabText]}>Jobs</Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === "applications" && styles.activeTab]}
          onPress={() => setActiveTab("applications")}
        >
          <Ionicons
            name="document-text"
            size={20}
            color={activeTab === "applications" ? "#2563eb" : "#6B7280"}
          />
          <Text style={[styles.tabText, activeTab === "applications" && styles.activeTabText]}>
            Applications
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === "bookings" && styles.activeTab]}
          onPress={() => setActiveTab("bookings")}
        >
          <Ionicons
            name="calendar"
            size={20}
            color={activeTab === "bookings" ? "#2563eb" : "#6B7280"}
          />
          <Text style={[styles.tabText, activeTab === "bookings" && styles.activeTabText]}>
            Bookings
          </Text>
        </Pressable>
      </View>

      <ScrollView style={styles.content}>
        <Searchbar
          placeholder="Search jobs, families..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          iconColor="#9CA3AF"
          placeholderTextColor="#9CA3AF"
          inputStyle={styles.searchInput}
        />

        {activeTab === "dashboard" && (
          <View>
            <View style={styles.statsRow}>
              <StatCard
                icon="briefcase"
                value={profile.completedJobs}
                label="Jobs Completed"
                color="#3B82F6"
                bgColor="#EFF6FF"
              />
              <StatCard
                icon="star"
                value={profile.rating}
                label="Rating"
                color="#F59E0B"
                bgColor="#FFFBEB"
              />
              <StatCard
                icon="chatbubble-ellipses"
                value={profile.responseRate}
                label="Response Rate"
                color="#10B981"
                bgColor="#ECFDF5"
              />
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recommended Jobs</Text>
                <Pressable>
                  <Text style={styles.seeAllText}>See All</Text>
                </Pressable>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                {mockJobs.slice(0, 3).map((job) => (
                  <JobCard key={job.id} job={job} showActions={true} />
                ))}
              </ScrollView>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Upcoming Bookings</Text>
                <Pressable>
                  <Text style={styles.seeAllText}>See All</Text>
                </Pressable>
              </View>
              {mockBookings.slice(0, 2).map((booking) => (
                <BookingCard key={booking.id} booking={booking} />
              ))}
            </View>
          </View>
        )}

        {activeTab === "jobs" && (
          <View style={styles.section}>
            <View style={styles.filters}>
              <Chip style={styles.filterChip} textStyle={styles.filterChipText}>
                All Jobs
              </Chip>
              <Chip
                style={[styles.filterChip, styles.filterChipActive]}
                textStyle={[styles.filterChipText, styles.filterChipTextActive]}
              >
                Nearby
              </Chip>
              <Chip style={styles.filterChip} textStyle={styles.filterChipText}>
                High Pay
              </Chip>
              <Chip style={styles.filterChip} textStyle={styles.filterChipText}>
                Urgent
              </Chip>
            </View>

            {mockJobs.map((job) => (
              <JobCard key={job.id} job={job} showActions={true} />
            ))}
          </View>
        )}

        {activeTab === "applications" && (
          <View style={styles.section}>
            {mockApplications.length > 0 ? (
              mockApplications.map((application) => (
                <ApplicationCard key={application.id} application={application} />
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="document-text" size={48} color="#9CA3AF" />
                <Text style={styles.emptyStateText}>No applications yet</Text>
                <Text style={styles.emptyStateSubtext}>
                  Apply to jobs to see them here
                </Text>
              </View>
            )}
          </View>
        )}

        {activeTab === "bookings" && (
          <View style={styles.section}>
            <View style={styles.bookingFilters}>
              <Chip
                style={[styles.bookingFilterChip, styles.bookingFilterChipActive]}
                textStyle={styles.bookingFilterChipText}
              >
                Upcoming
              </Chip>
              <Chip
                style={styles.bookingFilterChip}
                textStyle={styles.bookingFilterChipText}
              >
                Past
              </Chip>
              <Chip
                style={styles.bookingFilterChip}
                textStyle={styles.bookingFilterChipText}
              >
                Cancelled
              </Chip>
            </View>

            {mockBookings.length > 0 ? (
              mockBookings.map((booking) => (
                <BookingCard key={booking.id} booking={booking} />
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="calendar" size={48} color="#9CA3AF" />
                <Text style={styles.emptyStateText}>No bookings yet</Text>
                <Text style={styles.emptyStateSubtext}>
                  Your upcoming bookings will appear here
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      <Button
        mode="contained"
        onPress={onLogout || signOut}
        style={styles.logoutButton}
        labelStyle={styles.logoutButtonText}
      >
        Logout
      </Button>

      {renderEditProfileModal()}
    </View>
  )
}

function StatCard({ icon, value, label, color, bgColor }) {
  return (
    <View style={[styles.statCard, { backgroundColor: bgColor }]}>
      <View style={[styles.statIcon, { backgroundColor: `${color}20` }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  )
}

function JobCard({ job, showActions = true }) {
  return (
    <Card style={styles.jobCard}>
      <Card.Content>
        <View style={styles.jobHeader}>
          <View>
            <Text style={styles.jobTitle}>{job.title}</Text>
            <View style={styles.jobMeta}>
              <Ionicons name="people" size={16} color="#6B7280" />
              <Text style={styles.jobMetaText}>
                {job.children} {job.children === 1 ? 'child' : 'children'} • {job.ages}
              </Text>
              <Ionicons name="location" size={16} color="#6B7280" style={styles.jobMetaIcon} />
              <Text style={styles.jobMetaText}>{job.distance}</Text>
            </View>
          </View>
          {job.urgent && (
            <View style={styles.urgentBadge}>
              <Text style={styles.urgentBadgeText}>Urgent</Text>
            </View>
          )}
        </View>

        <View style={styles.jobDetails}>
          <View style={styles.jobDetailRow}>
            <Ionicons name="time" size={16} color="#6B7280" />
            <Text style={styles.jobDetailText}>{job.schedule}</Text>
          </View>
          <View style={styles.jobDetailRow}>
            <Ionicons name="cash" size={16} color="#6B7280" />
            <Text style={styles.jobDetailText}>${job.hourlyRate}/hr</Text>
          </View>
        </View>

        <View style={styles.requirementsContainer}>
          {job.requirements.slice(0, 3).map((req, index) => (
            <View key={index} style={styles.requirementTag}>
              <Text style={styles.requirementText}>{req}</Text>
            </View>
          ))}
          {job.requirements.length > 3 && (
            <Text style={styles.moreRequirementsText}>
              +{job.requirements.length - 3} more
            </Text>
          )}
        </View>

        {showActions && (
          <View style={styles.jobFooter}>
            <Text style={styles.postedDate}>Posted {job.postedDate}</Text>
            <View style={styles.jobActionButtons}>
              <Button 
                mode="outlined" 
                style={styles.secondaryButton}
                labelStyle={styles.secondaryButtonText}
                onPress={() => {}}
              >
                Learn More
              </Button>
              <Button 
                mode="contained" 
                style={styles.primaryButton}
                labelStyle={styles.primaryButtonText}
                onPress={() => {}}
              >
                Apply Now
              </Button>
            </View>
          </View>
        )}
      </Card.Content>
    </Card>
  )
}

function ApplicationCard({ application }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'accepted':
        return '#4CAF50' // Green
      case 'rejected':
        return '#F44336' // Red
      case 'pending':
      default:
        return '#FF9800' // Orange
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'accepted':
        return 'checkmark-circle'
      case 'rejected':
        return 'close-circle'
      case 'pending':
      default:
        return 'time'
    }
  }

  return (
    <Card style={styles.applicationCard}>
      <Card.Content style={styles.applicationContent}>
        <View style={styles.applicationHeader}>
          <View>
            <Text style={styles.applicationJobTitle}>{application.jobTitle}</Text>
            <Text style={styles.applicationFamily}>{application.family}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(application.status)}15` }]}>
            <Ionicons 
              name={getStatusIcon(application.status)} 
              size={16} 
              color={getStatusColor(application.status)} 
              style={styles.statusIcon} 
            />
            <Text style={[styles.statusText, { color: getStatusColor(application.status) }]}>
              {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
            </Text>
          </View>
        </View>

        <View style={styles.applicationDetails}>
          <View style={styles.applicationDetailRow}>
            <Ionicons name="calendar" size={16} color="#6B7280" />
            <Text style={styles.applicationDetailText}>
              Applied on {new Date(application.appliedDate).toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.applicationDetailRow}>
            <Ionicons name="cash" size={16} color="#6B7280" />
            <Text style={styles.applicationDetailText}>
              ${application.hourlyRate}/hr
            </Text>
          </View>
        </View>

        <View style={styles.applicationActions}>
          <Button 
            mode="outlined" 
            style={styles.applicationButton}
            labelStyle={styles.applicationButtonText}
            onPress={() => {}}
          >
            View Details
          </Button>
          {application.status === 'accepted' && (
            <Button 
              mode="contained" 
              style={[styles.applicationButton, { marginLeft: 8 }]}
              labelStyle={styles.applicationButtonText}
              onPress={() => {}}
            >
              Message Family
            </Button>
          )}
        </View>
      </Card.Content>
    </Card>
  )
}

function BookingCard({ booking }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return '#4CAF50' // Green
      case 'cancelled':
        return '#F44336' // Red
      case 'pending':
      default:
        return '#FF9800' // Orange
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmed'
      case 'cancelled':
        return 'Cancelled'
      case 'pending':
      default:
        return 'Pending Confirmation'
    }
  }

  return (
    <Card style={styles.bookingCard}>
      <Card.Content>
        <View style={styles.bookingHeader}>
          <Text style={styles.bookingFamily}>{booking.family}</Text>
          <View style={[styles.bookingStatus, { backgroundColor: `${getStatusColor(booking.status)}15` }]}>
            <Text style={[styles.bookingStatusText, { color: getStatusColor(booking.status) }]}>
              {getStatusText(booking.status)}
            </Text>
          </View>
        </View>

        <View style={styles.bookingDetails}>
          <View style={styles.bookingDetailRow}>
            <Ionicons name="calendar" size={16} color="#6B7280" />
            <Text style={styles.bookingDetailText}>
              {new Date(booking.date).toLocaleDateString('en-US', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric' 
              })}
            </Text>
            <Ionicons name="time" size={16} color="#6B7280" style={styles.bookingDetailIcon} />
            <Text style={styles.bookingDetailText}>{booking.time}</Text>
          </View>
          <View style={styles.bookingDetailRow}>
            <Ionicons name="people" size={16} color="#6B7280" />
            <Text style={styles.bookingDetailText}>
              {booking.children} {booking.children === 1 ? 'child' : 'children'}
            </Text>
            <Ionicons name="location" size={16} color="#6B7280" style={styles.bookingDetailIcon} />
            <Text style={styles.bookingDetailText}>{booking.location}</Text>
          </View>
        </View>

        <View style={styles.bookingActions}>
          <Button 
            mode="outlined" 
            style={styles.bookingButton}
            labelStyle={styles.bookingButtonText}
            onPress={() => {}}
          >
            View Details
          </Button>
          <Button 
            mode="contained" 
            style={[styles.bookingButton, { marginLeft: 8 }]}
            labelStyle={styles.bookingButtonText}
            onPress={() => {}}
          >
            Message
          </Button>
        </View>
      </Card.Content>
    </Card>
  )
}

function ProfileSection() {
  const profile = {
    name: "Sarah Johnson",
    rating: 4.9,
    reviews: 127,
    hourlyRate: 25,
    experience: "5+ years",
    specialties: ["Toddlers", "Meal Prep", "Light Housekeeping"],
    certifications: ["CPR Certified", "First Aid", "Child Development"],
    backgroundCheck: "Verified",
    completedJobs: 234,
    responseRate: "98%"
  }

  return (
    <Card style={styles.profileSection}>
      <Card.Content>
        <View style={styles.profileSectionHeader}>
          <Text style={styles.sectionTitle}>Profile</Text>
          <Ionicons name="create-outline" size={20} color="#4B5563" />
        </View>

        <View style={styles.profileSectionContent}>
          <View style={styles.profileSectionRow}>
            <Ionicons name="person" size={20} color="#6B7280" style={styles.profileSectionIcon} />
            <Text style={styles.profileSectionText}>{profile.name}</Text>
          </View>
          <View style={styles.profileSectionRow}>
            <Ionicons name="cash" size={20} color="#6B7280" style={styles.profileSectionIcon} />
            <Text style={styles.profileSectionText}>${profile.hourlyRate}/hr</Text>
          </View>
          <View style={styles.profileSectionRow}>
            <Ionicons name="briefcase" size={20} color="#6B7280" style={styles.profileSectionIcon} />
            <Text style={styles.profileSectionText}>{profile.experience} experience</Text>
          </View>
          <View style={styles.profileSectionRow}>
            <Ionicons name="checkmark-circle" size={20} color="#6B7280" style={styles.profileSectionIcon} />
            <Text style={styles.profileSectionText}>{profile.backgroundCheck}</Text>
          </View>
        </View>

        <View style={styles.sectionDivider} />

        <View style={styles.skillsSection}>
          <Text style={styles.sectionSubtitle}>Specialties</Text>
          <View style={styles.skillsContainer}>
            {profile.specialties.map((skill, index) => (
              <View key={index} style={styles.skillTag}>
                <Text style={styles.skillText}>{skill}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.sectionDivider} />

        <View>
          <Text style={styles.sectionSubtitle}>Certifications</Text>
          <View style={styles.certificationsContainer}>
            {profile.certifications.map((cert, index) => (
              <View key={index} style={styles.certificationItem}>
                <Ionicons name="checkmark-circle" size={16} color="#10B981" style={styles.certificationIcon} />
                <Text style={styles.certificationText}>{cert}</Text>
              </View>
            ))}
          </View>
        </View>
      </Card.Content>
    </Card>
  )
}

// Styles will be added in the next part
