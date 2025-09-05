import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { errorHandler } from '../../utils/errorHandler';
import { logger } from '../../utils/logger';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Safely handle error logging
    try {
      logger.error('ErrorBoundary caught an error:', error);
      logger.error('Error info:', errorInfo);
    } catch (logError) {
      console.error('Logger failed:', logError);
      console.error('Original error:', error);
    }
    
    // Safely process error
    let processedError;
    try {
      processedError = errorHandler.process(error);
    } catch (handlerError) {
      console.error('Error handler failed:', handlerError);
      // Fallback error processing
      processedError = {
        userMessage: typeof error === 'string' ? error : 
                    error?.message || 
                    error?.toString() || 
                    'An unexpected error occurred',
        retryable: true,
        code: 'UNKNOWN_ERROR'
      };
    }
    
    // Safely report error
    try {
      errorHandler.reportError(error, {
        component: this.props.componentName || 'Unknown',
        errorInfo,
        props: this.props,
      });
    } catch (reportError) {
      console.error('Error reporting failed:', reportError);
    }

    this.setState({
      error: processedError,
      errorInfo,
    });
  }

  handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null 
    });
  };

  render() {
    if (this.state.hasError) {
      const { fallback: FallbackComponent } = this.props;
      
      // Use custom fallback if provided
      if (FallbackComponent) {
        return (
          <FallbackComponent 
            error={this.state.error}
            retry={this.handleRetry}
          />
        );
      }

      // Default fallback UI
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>
            {this.state.error?.userMessage || 'An unexpected error occurred'}
          </Text>
          {this.state.error?.retryable && (
            <TouchableOpacity 
              style={styles.retryButton} 
              onPress={this.handleRetry}
            >
              <Text style={styles.retryText}>Try Again</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#dc3545',
    marginBottom: 10,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  retryButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
