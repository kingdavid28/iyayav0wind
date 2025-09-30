import React from 'react';
import { Text, TouchableOpacity, View, StyleSheet } from 'react-native';

const SectionTitle = ({
  title,
  subtitle,
  onPress,
  asButton = false,
  textStyle,
  containerStyle,
}) => {
  if (asButton) {
    return (
      <TouchableOpacity
        onPress={onPress}
        style={[styles.container, containerStyle]}
        accessibilityRole="button"
        accessibilityLabel={title}
      >
        <Text style={[styles.title, textStyle]}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={[styles.title, textStyle]}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    fontSize: 13,
    color: '#6B7280',
  },
});

export default SectionTitle;
