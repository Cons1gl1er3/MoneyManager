import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { Alert, Image, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGlobalContext } from '../context/GlobalProvider';
import { getCurrentUser, logout } from '../lib/appwrite';

// Updated interface to match Appwrite Document structure
interface User {
  $id: string;
  user_id: string;
  avatar: string;
  email: string;
  username: string;
  $createdAt: string;
}

const Settings = () => {
  const router = useRouter();
  const { logoutUser } = useGlobalContext();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    React.useCallback(() => {
      fetchUserInfo();
    }, [])
  );

  const fetchUserInfo = async () => {
    try {
      setLoading(true);
      const userInfo = await getCurrentUser();
      setUser(userInfo as unknown as User);
    } catch (error) {
      console.error('Error fetching user info:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Are you sure you want to logout?');
      if (confirmed) {
        performLogout();
      }
    } else {
      Alert.alert(
        'Logout',
        'Are you sure you want to logout?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Logout',
            style: 'destructive',
            onPress: performLogout,
          },
        ]
      );
    }
  };

  const performLogout = async () => {
    try {
      await logout();
      logoutUser();
      router.replace('/sign-in');
    } catch (error) {
      console.error('Logout failed:', error);
      Alert.alert('Error', 'Failed to logout. Please try again.');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView className="flex-1 bg-gray-50">
          <View className="flex-1 items-center justify-center">
            <Text className="text-gray-500 text-lg">Loading...</Text>
          </View>
        </SafeAreaView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView className="flex-1 bg-gray-50">
        <StatusBar style="dark" />
        
        {/* Header */}
        <View className="flex-row items-center px-4 pt-4 mb-6 bg-gray-50">
          <TouchableOpacity
            onPress={() => router.back()}
            className="mr-4 p-2 bg-gray-100 rounded-full"
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold flex-1">Settings</Text>
        </View>

        <ScrollView className="flex-1 px-4">
          {/* User Profile Card */}
          <View className="bg-white rounded-xl p-6 mb-6 shadow-sm">
            <View className="items-center mb-6">
              {/* Avatar */}
              <View className="w-24 h-24 bg-blue-100 rounded-full items-center justify-center mb-4 overflow-hidden">
                {user?.avatar ? (
                  <Image 
                    source={{ uri: user.avatar }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                ) : (
                  <Ionicons name="person" size={40} color="#3B82F6" />
                )}
              </View>
              
              {/* User Name */}
              <Text className="text-xl font-bold text-gray-800 mb-2">
                {user?.username || 'User'}
              </Text>
              
              {/* User Email */}
              <Text className="text-gray-600 text-base">
                {user?.email || 'No email available'}
              </Text>
            </View>

            {/* User Details */}
            <View className="space-y-4">
              <View className="flex-row justify-between items-center py-3 border-b border-gray-100">
                <Text className="text-gray-600">User ID</Text>
                <Text className="text-gray-800 font-medium text-xs">
                  {user?.$id ? `${user.$id.substring(0, 8)}...` : 'N/A'}
                </Text>
              </View>
              
              <View className="flex-row justify-between items-center py-3 border-b border-gray-100">
                <Text className="text-gray-600">Member Since</Text>
                <Text className="text-gray-800 font-medium">
                  {user?.$createdAt ? formatDate(user.$createdAt) : 'N/A'}
                </Text>
              </View>
            </View>
          </View>

          {/* Settings Options */}
          <View className="bg-white rounded-xl mb-6 shadow-sm overflow-hidden">
            <Text className="text-lg font-semibold p-4 pb-2 text-gray-800">
              App Settings
            </Text>
            
            {/* Account Management */}
            <TouchableOpacity 
              className="flex-row items-center p-4 border-b border-gray-100"
              onPress={() => router.push('/account-management')}
            >
              <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center mr-4">
                <Ionicons name="person-circle-outline" size={24} color="#3B82F6" />
              </View>
              <View className="flex-1">
                <Text className="text-gray-800 font-medium">Account Management</Text>
                <Text className="text-gray-500 text-sm">Manage your account settings</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>

            {/* Money Sources */}
            <TouchableOpacity 
              className="flex-row items-center p-4 border-b border-gray-100"
              onPress={() => router.push('/accounts')}
            >
              <View className="w-10 h-10 bg-green-100 rounded-full items-center justify-center mr-4">
                <Ionicons name="wallet-outline" size={24} color="#10B981" />
              </View>
              <View className="flex-1">
                <Text className="text-gray-800 font-medium">Money Sources</Text>
                <Text className="text-gray-500 text-sm">Manage your accounts and wallets</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          {/* Help & Support */}
          <View className="bg-white rounded-xl mb-6 shadow-sm overflow-hidden">
            <Text className="text-lg font-semibold p-4 pb-2 text-gray-800">
              Help & Support
            </Text>
            

            <TouchableOpacity className="flex-row items-center p-4">
              <View className="w-10 h-10 bg-green-100 rounded-full items-center justify-center mr-4">
                <Ionicons name="mail-outline" size={24} color="#10B981" />
              </View>
              <View className="flex-1">
                <Text className="text-gray-800 font-medium">Contact Us</Text>
                <Text className="text-gray-500 text-sm">Send feedback or report issues</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          {/* Logout Button */}
          <View className="bg-white rounded-xl mb-8 shadow-sm overflow-hidden">
          <Text className="text-lg font-semibold p-4 pb-2 text-gray-800">
              Logout
            </Text>
            <TouchableOpacity
              className="flex-row items-center p-4"
              onPress={handleLogout}
            >
              <View className="w-10 h-10 bg-red-100 rounded-full items-center justify-center mr-4">
                <Ionicons name="log-out-outline" size={24} color="#EF4444" />
              </View>
              <View className="flex-1">
                <Text className="text-red-500 font-medium">Logout</Text>
                <Text className="text-gray-500 text-sm">Sign out of your account</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
};

export default Settings; 