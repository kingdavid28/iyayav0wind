import React from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useNotifications } from '../../contexts/NotificationContext';

const NotificationBell = ({ onPress, size = 24, color = '#1f2937', style }) => {
  const { unreadCount, badgeCounts } = useNotifications();

  const total = badgeCounts?.total ?? unreadCount ?? 0;
  const display = total > 99 ? '99+' : total.toString();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Notifications"
      accessibilityHint="Opens the notifications list"
      onPress={onPress}
      style={({ pressed }) => [styles.button, style, pressed && styles.pressed]}
    >
      <Ionicons name="notifications-outline" size={size} color={color} />
      {total > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{display}</Text>
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    padding: 8,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  pressed: {
    opacity: 0.8,
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 18,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 999,
    backgroundColor: '#ef4444',
    borderWidth: 1,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },
});

export default NotificationBell;
