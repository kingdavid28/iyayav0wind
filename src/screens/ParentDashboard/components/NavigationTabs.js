import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Home, Search, Calendar, User, MessageCircle, Plus } from 'lucide-react-native';
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
        <Home size={20} color={activeTab === 'home' ? colors.secondary : colors.textTertiary} />
        <Text style={[styles.navText, activeTab === 'home' && styles.activeNavText]}>
          Home
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.navItem, activeTab === 'search' && styles.activeNavItem]}
        onPress={() => setActiveTab('search')}
      >
        <Search size={20} color={activeTab === 'search' ? colors.secondary : colors.textTertiary} />
        <Text style={[styles.navText, activeTab === 'search' && styles.activeNavText]}>
          Search
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.navItem, activeTab === 'bookings' && styles.activeNavItem]}
        onPress={() => setActiveTab('bookings')}
      >
        <Calendar size={20} color={activeTab === 'bookings' ? colors.secondary : colors.textTertiary} />
        <Text style={[styles.navText, activeTab === 'bookings' && styles.activeNavText]}>
          Bookings
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.navItem, activeTab === 'jobs' && styles.activeNavItem]}
        onPress={() => setActiveTab('jobs')}
      >
        <Plus size={20} color={activeTab === 'jobs' ? colors.secondary : colors.textTertiary} />
        <Text style={[styles.navText, activeTab === 'jobs' && styles.activeNavText]}>
          Post Job
        </Text>
      </TouchableOpacity>


      </ScrollView>
    </View>
  );
};

export default NavigationTabs;
