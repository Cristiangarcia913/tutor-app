import { Stack } from 'expo-router';
import { DatabaseProvider } from '../src/hooks/useDatabase';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <DatabaseProvider>
        <StatusBar style="dark" />
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
      </DatabaseProvider>
    </SafeAreaProvider>
  );
}
