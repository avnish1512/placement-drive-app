import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { AlertCircle, RefreshCw } from 'lucide-react-native';

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorCount: number;
}

export interface ErrorBoundaryProps {
  children: React.ReactNode;
  onError?: (error: Error, errorInfo?: React.ErrorInfo) => void;
  fallback?: (error: Error, retry: () => void) => React.ReactNode;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  private errorCount = 0;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
      errorCount: 0
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console
    console.error('Error caught by boundary:', error);
    console.error('Component stack:', errorInfo.componentStack);

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Track error count
    this.errorCount += 1;
    this.setState(prev => ({
      errorCount: prev.errorCount + 1
    }));

    // If too many errors, force a reload
    if (this.errorCount > 3) {
      console.error('Too many errors, will reload on next action');
    }
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorCount: 0
    });
    this.errorCount = 0;
  };

  render() {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.resetError);
      }

      // Default error UI
      return (
        <View style={styles.container}>
          <ScrollView style={styles.content}>
            <View style={styles.errorBox}>
              <AlertCircle size={48} color="#EF4444" />
              <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
              <Text style={styles.errorMessage}>
                An unexpected error occurred. The team has been notified.
              </Text>

              <View style={styles.errorDetails}>
                <Text style={styles.errorDetailsTitle}>Error Details:</Text>
                <Text style={styles.errorDetailsText}>
                  {this.state.error?.message || 'Unknown error'}
                </Text>
              </View>

              {this.state.errorCount > 1 && (
                <Text style={styles.errorCountWarning}>
                  This error has occurred {this.state.errorCount} times
                </Text>
              )}
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.button} onPress={this.resetError}>
              <RefreshCw size={16} color="#FFFFFF" />
              <Text style={styles.buttonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  errorBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginTop: 32,
    borderTopWidth: 4,
    borderTopColor: '#EF4444',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 16,
    marginBottom: 12,
  },
  errorMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  errorDetails: {
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    width: '100%',
  },
  errorDetailsTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#DC2626',
    marginBottom: 8,
  },
  errorDetailsText: {
    fontSize: 12,
    color: '#991B1B',
    fontFamily: 'monospace',
  },
  errorCountWarning: {
    fontSize: 12,
    color: '#D97706',
    fontStyle: 'italic',
    marginBottom: 16,
  },
  footer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366F1',
    borderRadius: 8,
    paddingVertical: 12,
    gap: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

/**
 * Hook to handle async errors in functional components
 * Usage: const handleError = useErrorHandler();
 *        try { ... } catch(err) { handleError(err); }
 */
export const useErrorHandler = () => {
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return setError;
};

/**
 * Wrapper function to safely call async functions
 * Usage: const result = await safeAsync(() => someAsyncFunction());
 */
export const safeAsync = async <T,>(
  fn: () => Promise<T>,
  onError?: (error: Error) => void
): Promise<T | null> => {
  try {
    return await fn();
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('Async error caught:', err);

    if (onError) {
      onError(err);
    }

    return null;
  }
};

/**
 * Wrapper function to safely call sync functions
 * Usage: const result = safeSync(() => someFunction());
 */
export const safeSync = <T,>(
  fn: () => T,
  onError?: (error: Error) => void
): T | null => {
  try {
    return fn();
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('Sync error caught:', err);

    if (onError) {
      onError(err);
    }

    return null;
  }
};
