import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles, colors } from '../../styles/ParentDashboard.styles';
import { useMessaging } from '../../../contexts/MessagingContext';

const NavigationTabs = ({ activeTab, setActiveTab, onProfilePress, navigation }) => {
  const { unreadCount } = useMessaging();
  
  return (
    <View style={styles.tabContainer}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsScrollContent}
      >
      <TouchableOpacity
        style={[styles.navItem, activeTab === 'home' && styles.activeNavItem]}
        onPress={() => setActiveTab('home')}
      >
        <Ionicons name="home-outline" size={20} color={activeTab === 'home' ? colors.secondary : colors.textTertiary} />
        <Text style={[styles.navText, activeTab === 'home' && styles.activeNavText]}>
          Home
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.navItem, activeTab === 'search' && styles.activeNavItem]}
        onPress={() => setActiveTab('search')}
      >
        <Ionicons name="search-outline" size={20} color={activeTab === 'search' ? colors.secondary : colors.textTertiary} />
        <Text style={[styles.navText, activeTab === 'search' && styles.activeNavText]}>
          Search
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.navItem, activeTab === 'bookings' && styles.activeNavItem]}
        onPress={() => setActiveTab('bookings')}
      >
        <Ionicons name="calendar-outline" size={20} color={activeTab === 'bookings' ? colors.secondary : colors.textTertiary} />
        <Text style={[styles.navText, activeTab === 'bookings' && styles.activeNavText]}>
          Bookings
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.navItem, activeTab === 'messages' && styles.activeNavItem]}
        onPress={() => setActiveTab('messages')}
      >
        <Ionicons name="chatbubble-ellipses-outline" size={20} color={activeTab === 'messages' ? colors.secondary : colors.textTertiary} />
        {unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadBadgeText}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </Text>
          </View>
        )}
        <Text style={[styles.navText, activeTab === 'messages' && styles.activeNavText]}>
          Messages
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.navItem, activeTab === 'jobs' && styles.activeNavItem]}
        onPress={() => setActiveTab('jobs')}
      >
        <Ionicons name="briefcase-outline" size={20} color={activeTab === 'jobs' ? colors.secondary : colors.textTertiary} />
        <Text style={[styles.navText, activeTab === 'jobs' && styles.activeNavText]}>
          Jobs
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.navItem, activeTab === 'job-management' && styles.activeNavItem]}
        onPress={() => setActiveTab('job-management')}
      >
        <Ionicons name="add-outline" size={20} color={activeTab === 'job-management' ? colors.secondary : colors.textTertiary} />
        <Text style={[styles.navText, activeTab === 'job-management' && styles.activeNavText]}>
          Post Job
        </Text>
      </TouchableOpacity>

      </ScrollView>
    </View>
  );
};

export default NavigationTabs;
