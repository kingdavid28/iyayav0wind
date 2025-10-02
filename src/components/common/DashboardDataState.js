import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ActivityIndicator, Text, Button } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

const ICON_MAP = {
  empty: 'chatbubble-ellipses-outline',
  error: 'alert-circle-outline',
  maintenance: 'construct-outline',
};

const DashboardDataState = ({
  status = 'idle',
  children,
  loadingText = 'Loading data…',
  emptyTitle = 'Nothing here yet',
  emptySubtitle = 'Come back later to see updates.',
  errorTitle = 'Something went wrong',
  errorSubtitle = 'We were unable to load this content. Please try again.',
  maintenanceTitle = 'Temporarily unavailable',
  maintenanceSubtitle = 'This feature is undergoing scheduled maintenance.',
  maintenanceActionLabel = 'Notify me when back',
  maintenanceAction,
  emptyActionLabel = 'Refresh',
  emptyAction,
  retryLabel = 'Retry',
  onRetry,
  iconOverrides = {},
  contentStyle,
  testID,
}) => {
  const renderIcon = (type) => {
    const iconName = iconOverrides[type] || ICON_MAP[type];
    if (!iconName) {
      return null;
    }

    return (
      <Ionicons
        name={iconName}
        size={48}
        color="#9CA3AF"
        style={styles.icon}
      />
    );
  };

  if (status === 'loading') {
    return (
      <View style={[styles.container, contentStyle]} testID={testID || 'dashboard-state-loading'}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.primary}>{loadingText}</Text>
      </View>
    );
  }

  if (status === 'maintenance') {
    return (
      <View style={[styles.container, contentStyle]} testID={testID || 'dashboard-state-maintenance'}>
        {renderIcon('maintenance')}
        <Text style={styles.primary}>{maintenanceTitle}</Text>
        <Text style={styles.secondary}>{maintenanceSubtitle}</Text>
        {maintenanceAction ? (
          <Button mode="contained" onPress={maintenanceAction} style={styles.button}>
            {maintenanceActionLabel}
          </Button>
        ) : null}
        {onRetry ? (
          <Button mode="outlined" onPress={onRetry} style={styles.button}>
            {retryLabel}
          </Button>
        ) : null}
      </View>
    );
  }

  if (status === 'error') {
    return (
      <View style={[styles.container, contentStyle]} testID={testID || 'dashboard-state-error'}>
        {renderIcon('error')}
        <Text style={styles.primary}>{errorTitle}</Text>
        <Text style={styles.secondary}>{errorSubtitle}</Text>
        {onRetry ? (
          <Button mode="contained" onPress={onRetry} style={styles.button}>
            {retryLabel}
          </Button>
        ) : null}
      </View>
    );
  }

  if (status === 'empty') {
    return (
      <View style={[styles.container, contentStyle]} testID={testID || 'dashboard-state-empty'}>
        {renderIcon('empty')}
        <Text style={styles.primary}>{emptyTitle}</Text>
        <Text style={styles.secondary}>{emptySubtitle}</Text>
        {emptyAction ? (
          <Button mode="contained" onPress={emptyAction} style={styles.button}>
            {emptyActionLabel}
          </Button>
        ) : null}
      </View>
    );
  }

  return <>{children}</>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 220,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
  },
  icon: {
    marginBottom: 16,
  },
  primary: {
    marginTop: 8,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },
  secondary: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
    textAlign: 'center',
  },
  button: {
    marginTop: 16,
    borderRadius: 12,
  },
});

export default DashboardDataState;
