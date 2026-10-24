import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform, StyleSheet } from 'react-native';
import { Colors, FontSizes, Spacing } from '../../src/constants/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarLabelPosition: 'below-icon',
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
          tabBarLabel: 'Inicio',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={21} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="students"
        options={{
          title: 'Alumnos',
          tabBarLabel: 'Alumnos',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'people' : 'people-outline'} size={21} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="classes"
        options={{
          title: 'Clases',
          tabBarLabel: 'Clases',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'calendar' : 'calendar-outline'} size={21} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="finances"
        options={{
          title: 'Finanzas',
          tabBarLabel: 'Finanzas',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'wallet' : 'wallet-outline'} size={21} color={color} />
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
    height: Platform.OS === 'ios' ? 88 : (Platform.OS === 'web' ? 70 : 64),
    paddingTop: 4,
    paddingBottom: Platform.OS === 'ios' ? 28 : (Platform.OS === 'web' ? 12 : 4),
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    zIndex: 9999,
  },
  tabBarLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    marginTop: 1,
    marginBottom: 0,
    letterSpacing: -0.2,
  },
  tabBarItem: {
    paddingTop: 3,
    paddingBottom: 2,
    justifyContent: 'center',
    alignItems: 'center',
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {}),
  },
});
