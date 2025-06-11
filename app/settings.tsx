import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { Alert, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ConfirmModal from '../components/ConfirmModal';
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
  const [logoutConfirmVisible, setLogoutConfirmVisible] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [contactModalVisible, setContactModalVisible] = useState(false);

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
    setLogoutConfirmVisible(true);
  };

  const performLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      logoutUser();
      setLogoutConfirmVisible(false);
      router.replace('/sign-in');
    } catch (error) {
      console.error('Logout failed:', error);
      Alert.alert('Error', 'Failed to logout. Please try again.');
    } finally {
      setLoggingOut(false);
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
            
            <TouchableOpacity 
              className="flex-row items-center p-4"
              onPress={() => setContactModalVisible(true)}
            >
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
              disabled={loggingOut}
            >
              <View className="w-10 h-10 bg-red-100 rounded-full items-center justify-center mr-4">
                <Ionicons name="log-out-outline" size={24} color="#EF4444" />
              </View>
              <View className="flex-1">
                <Text className="text-red-500 font-medium">
                  {loggingOut ? 'Logging out...' : 'Logout'}
                </Text>
                <Text className="text-gray-500 text-sm">Sign out of your account</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Confirm Modal */}
      <ConfirmModal
        visible={logoutConfirmVisible}
        onCancel={() => setLogoutConfirmVisible(false)}
        onConfirm={performLogout}
        title="Logout Confirmation"
        message="Are you sure you want to logout? You will be redirected to the sign-in screen."
        confirmText="Logout"
        cancelText="Cancel"
        confirmButtonColor="#dc2626"
      />

      {/* Contact Modal */}
      <ConfirmModal
        visible={contactModalVisible}
        onCancel={() => setContactModalVisible(false)}
        onConfirm={() => setContactModalVisible(false)}
        title="Contact Us"
        message={`
Group 2 - SE - 20242
Welcome to Money Manager! 
This app helps you track your expenses and manage your money effectively.

For feedback or support, please contact us at:
vanhtran18.work@gmail.com`
}
        confirmText="Close"
        cancelText=""
        confirmButtonColor="#10B981"
      />
    </>
  );
};

export default Settings; 