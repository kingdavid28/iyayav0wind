import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Home, Search, Calendar, User } from 'lucide-react-native';
import { styles, colors } from '../../styles/ParentDashboard.styles';

const NavigationTabs = ({ activeTab, setActiveTab, onProfilePress }) => {
  return (
    <View style={styles.tabContainer}>
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
        style={[styles.navItem, activeTab === 'profile' && styles.activeNavItem]}
        onPress={onProfilePress}
      >
        <User size={20} color={activeTab === 'profile' ? colors.secondary : colors.textTertiary} />
        <Text style={[styles.navText, activeTab === 'profile' && styles.activeNavText]}>
          Profile
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default NavigationTabs;