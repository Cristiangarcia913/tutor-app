import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform, StyleSheet } from 'react-native';
import { Colors, FontSizes, Spacing } from '../../src/constants/theme';
import { useAuthRole } from '../../src/hooks/useAuthRole';

export default function TabLayout() {
  const { isTeacher } = useAuthRole();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarItemStyle: styles.tabBarItem,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="students"
        options={{
          title: 'Alumnos',
          href: isTeacher ? '/(tabs)/students' : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="classes"
        options={{
          title: 'Clases',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="finances"
        options={{
          title: 'Finanzas',
          href: isTeacher ? '/(tabs)/finances' : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="wallet" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.surface,
    borderTopColor: Colors.border,
    borderTopWidth: 1,
    height: Platform.OS === 'ios' ? 88 : 64,
    paddingTop: Spacing.xs,
    paddingBottom: Platform.OS === 'ios' ? 28 : Spacing.xs,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    zIndex: 9999,
  },
  tabBarLabel: {
    fontSize: FontSizes.xs,
    fontWeight: '600',
    marginTop: 2,
  },
  tabBarItem: {
    paddingVertical: 4,
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {}),
  },
});
