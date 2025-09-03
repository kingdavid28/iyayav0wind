import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { MessageCircle, User, LogOut } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { styles, colors } from '../../styles/ParentDashboard.styles';

const Header = ({ navigation, onProfilePress, onSignOut }) => {
  return (
    <View style={styles.header}>
      <LinearGradient
        colors={["#ebc5dd", "#ccc8e8"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ borderRadius: 16, paddingHorizontal: 16, paddingVertical: 4 }}
      >
        <View style={styles.headerTop}>
          <View style={[styles.logoContainer, { flexDirection: 'column', alignItems: 'center' }]}>
            <Image source={require('../../../../assets/icon.png')} style={[styles.logoImage, { marginBottom: 1 }]} />
            
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>I am a Parent</Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerButton} onPress={() => navigation.navigate('Messages')}>
              <MessageCircle size={22} color={colors.textInverse} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton} onPress={onProfilePress}>
              <User size={22} color={colors.textInverse} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton} onPress={onSignOut}>
              <LogOut size={22} color={colors.textInverse} />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

export default Header;