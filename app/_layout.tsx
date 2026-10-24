import React, { Component, ReactNode, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Stack } from 'expo-router';
import { DatabaseProvider } from '../src/hooks/useDatabase';
import { AuthRoleProvider } from '../src/hooks/useAuthRole';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class RootErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('RootErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>¡Ups! Algo ha fallado al iniciar</Text>
          <Text style={styles.errorMessage}>
            {this.state.error?.message || 'Error inesperado de carga.'}
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              if (Platform.OS === 'web' && typeof window !== 'undefined') {
                window.location.reload();
              } else {
                this.setState({ hasError: false, error: null });
              }
            }}
          >
            <Text style={styles.retryButtonText}>Recargar Aplicación</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function RootLayout() {
  const [runtimeError, setRuntimeError] = useState<string | null>(null);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const handleGlobalError = (event: ErrorEvent) => {
        console.error('Captured window error:', event.error || event.message);
      };
      const handleRejection = (event: PromiseRejectionEvent) => {
        console.error('Captured promise rejection:', event.reason);
      };
      window.addEventListener('error', handleGlobalError);
      window.addEventListener('unhandledrejection', handleRejection);
      return () => {
        window.removeEventListener('error', handleGlobalError);
        window.removeEventListener('unhandledrejection', handleRejection);
      };
    }
  }, []);

  return (
    <View style={styles.root}>
      <SafeAreaProvider style={styles.root}>
        <RootErrorBoundary>
          <DatabaseProvider>
            <AuthRoleProvider>
              <StatusBar style="dark" />
              {runtimeError && (
                <View style={styles.runtimeErrorBanner}>
                  <Text style={styles.runtimeErrorText}>{runtimeError}</Text>
                </View>
              )}
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(tabs)" />
                {/* Static and creation modal screens must be declared before dynamic [id] screens */}
                <Stack.Screen name="student/new" options={{ headerShown: false, presentation: 'modal' }} />
                <Stack.Screen name="student/edit/[id]" options={{ headerShown: false, presentation: 'modal' }} />
                <Stack.Screen name="student/[id]" options={{ headerShown: false, presentation: 'card' }} />
                <Stack.Screen name="class/new" options={{ headerShown: false, presentation: 'modal' }} />
                <Stack.Screen name="class/[id]" options={{ headerShown: false, presentation: 'card' }} />
                <Stack.Screen name="payment/new" options={{ headerShown: false, presentation: 'modal' }} />
                <Stack.Screen name="payment/[id]" options={{ headerShown: false, presentation: 'card' }} />
                <Stack.Screen name="subject/manage" options={{ headerShown: false, presentation: 'modal' }} />
                <Stack.Screen name="reports" options={{ headerShown: false, presentation: 'card' }} />
                <Stack.Screen name="settings" options={{ headerShown: false, presentation: 'card' }} />
              </Stack>
            </AuthRoleProvider>
          </DatabaseProvider>
        </RootErrorBoundary>
      </SafeAreaProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#F8FAFC',
  },
  errorContainer: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#EF4444',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    color: '#4B5563',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: '#4F46E5',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 15,
  },
  runtimeErrorBanner: {
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F87171',
  },
  runtimeErrorText: {
    color: '#991B1B',
    fontSize: 12,
  },
});
