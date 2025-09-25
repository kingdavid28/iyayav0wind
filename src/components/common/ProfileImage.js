import React, { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';

const ProfileImage = ({ 
  source, 
  size = 60, 
  style, 
  fallbackIcon = 'person',
  ...props 
}) => {
  const { colors } = useTheme();
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  // Handle image loading errors
  const handleError = () => {
    setError(true);
    setLoading(false);
  };

  // Handle successful image load
  const handleLoad = () => {
    setLoading(false);
  };

  // If there's an error or no source, show fallback icon
  if (error || !source?.uri) {
    return (
      <View 
        style={[
          styles.fallbackContainer, 
          { width: size, height: size, borderRadius: size / 2, backgroundColor: colors.card },
          style
        ]}
      >
        <Ionicons 
          name={fallbackIcon} 
          size={size * 0.6} 
          color={colors.text} 
          style={{ opacity: 0.6 }}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      {loading && (
        <View style={[styles.loadingContainer, { backgroundColor: colors.card }]}>
          <Ionicons 
            name="image" 
            size={size * 0.5} 
            color={colors.text} 
            style={{ opacity: 0.3 }}
          />
        </View>
      )}
      <Image
        source={source}
        style={[
          styles.image, 
          { 
            width: size, 
            height: size, 
            borderRadius: size / 2,
            opacity: loading ? 0 : 1
          }
        ]}
        onError={handleError}
        onLoad={handleLoad}
        resizeMode="cover"
        {...props}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  image: {
    backgroundColor: 'transparent',
  },
  fallbackContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 30,
  },
});

export default ProfileImage;
