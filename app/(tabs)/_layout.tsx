import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

// Platform-specific safe area handler
const usePlatformSafeArea = () => {
  if (Platform.OS === 'web') {
    return { bottom: 0, top: 0 };
  }
  
  try {
    // Dynamic import for mobile platforms only
    const { useSafeAreaInsets } = require('react-native-safe-area-context');
    return useSafeAreaInsets();
  } catch (error) {
    console.warn('Safe area context not available, using defaults');
    return { bottom: 0, top: 0 };
  }
};

export default function TabLayout() {
  // Get platform-specific insets
  const insets = usePlatformSafeArea();

  // Platform-specific tab bar configuration
  const getTabBarConfig = () => {
    const baseColors = {
      backgroundColor: '#ffffff',
      borderTopColor: '#e5e7eb',
    };

    switch (Platform.OS) {
      case 'web':
        return {
          style: {
            ...baseColors,
            height: 82,
            paddingTop: 10,
            paddingBottom: 12,
            borderTopWidth: 1,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 5,
          },
          labelStyle: {
            fontSize: 12,
            marginBottom: 4,
            fontWeight: '500' as const,
          },
        };

      case 'ios':
        return {
          style: {
            backgroundColor: '#ffffff',
            borderTopColor: '#e5e7eb',
            borderTopWidth: 1,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            height: 50 + insets.bottom, 
            paddingTop: 6,
            paddingBottom: insets.bottom,
          },
          labelStyle: {
            fontSize: 11,
            fontWeight: '500' as const,
          },
        };

        case 'android':
          default:
            return {
              style: {
                ...baseColors,
                height: 65 + insets.bottom, 
                paddingTop: 8,
                paddingBottom: insets.bottom > 0 ? insets.bottom + 12 : 20, 
                borderTopWidth: 1,
                elevation: 10,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -2 },
                shadowOpacity: 0.15,
                shadowRadius: 6,
              },
              labelStyle: {
                fontSize: 11,
                marginBottom: 2,
                fontWeight: '500' as const,
              },
            };
    }
  };

  const tabBarConfig = getTabBarConfig();

    return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: tabBarConfig.style,
        tabBarLabelStyle: tabBarConfig.labelStyle,
        tabBarActiveTintColor: '#6366f1',
        tabBarInactiveTintColor: '#6b7280',
        tabBarHideOnKeyboard: Platform.OS === 'android',
        tabBarShowLabel: true,
        tabBarAllowFontScaling: false,
        ...(Platform.OS === 'ios' && {
          tabBarItemStyle: {
            marginVertical: 3,
          }
        }),
        ...(Platform.OS === 'android' && {
          tabBarItemStyle: {
            paddingVertical: 4,
            marginVertical: 0,
          },
          tabBarLabelPosition: 'below-icon' as const,
        }),
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? "home" : "home-outline"} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="analysis"
        options={{
          title: 'Analysis',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? "pie-chart" : "pie-chart-outline"} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="transaction"
        options={{
          title: 'Transaction',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? "add-circle" : "add-circle-outline"} 
              size={26} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: 'Categories',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? "grid" : "grid-outline"} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />
    </Tabs> 
  );
}