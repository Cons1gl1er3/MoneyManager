import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { Image, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ErrorModal from '../components/ErrorModal';
import SuccessModal from '../components/SuccessModal';
import { useGlobalContext } from '../context/GlobalProvider';
import { changeUserPassword, updateUserProfile } from '../lib/appwrite';
import { uploadToCloudinary } from '../lib/cloudinary';

interface User {
  $id: string;
  user_id: string;
  avatar: string;
  email: string;
  username: string;
  $createdAt: string;
}

const AccountManagement = () => {
  const router = useRouter();
  const { user: globalUser, setUser: setGlobalUser } = useGlobalContext();
  const [user, setUser] = useState<User | null>(globalUser as User);
  const [newUsername, setNewUsername] = useState(user?.username || '');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorModalMessage, setErrorModalMessage] = useState('');
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [successModalMessage, setSuccessModalMessage] = useState('');

  const pickImage = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        setErrorModalMessage('Please grant permission to access your photos');
        setErrorModalVisible(true);
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        setLoading(true);
        try {
          console.log('Starting image upload process...');
          
          // Get the base64 data
          const base64Data = result.assets[0].base64;
          if (!base64Data) {
            throw new Error('No base64 data available');
          }

          // Upload to Cloudinary
          console.log('Uploading to Cloudinary...');
          const { url } = await uploadToCloudinary(base64Data);
          console.log('Upload successful, image URL:', url);
          
          // Update user profile with new avatar URL
          console.log('Updating user profile...');
          const updatedUser = await updateUserProfile(user?.$id, {
            avatar: url
          });
          console.log('Profile updated successfully');

          // Update local state
          setUser(updatedUser as unknown as User);
          setGlobalUser(updatedUser as unknown as User);
          setSuccessModalMessage('Profile picture updated successfully');
          setSuccessModalVisible(true);
        } catch (error) {
          console.error('Detailed error updating avatar:', error);
          setErrorModalMessage('Failed to update profile picture. Please try again.');
          setErrorModalVisible(true);
        } finally {
          setLoading(false);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      setErrorModalMessage('Failed to pick image');
      setErrorModalVisible(true);
    }
  };

  const handleUpdateUsername = async () => {
    if (!newUsername.trim()) {
      setErrorModalMessage('Username cannot be empty');
      setErrorModalVisible(true);
      return;
    }

    setLoading(true);
    try {
      const updatedUser = await updateUserProfile(user?.$id, {
        username: newUsername.trim()
      });

      // Update local state
      setUser(updatedUser as unknown as User);
      setGlobalUser(updatedUser as unknown as User);
      setIsEditing(false);
      setSuccessModalMessage('Username updated successfully');
      setSuccessModalVisible(true);
    } catch (error) {
      console.error('Error updating username:', error);
      setErrorModalMessage('Failed to update username');
      setErrorModalVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword) {
      setErrorModalMessage('Please enter both current and new password.');
      setErrorModalVisible(true);
      return;
    }
    setChangingPassword(true);
    try {
      await changeUserPassword(newPassword, oldPassword);
      setSuccessModalMessage('Password changed successfully!');
      setSuccessModalVisible(true);
      setOldPassword('');
      setNewPassword('');
    } catch (error) {
      setErrorModalMessage(error.message || 'Failed to change password');
      setErrorModalVisible(true);
    } finally {
      setChangingPassword(false);
    }
  };

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
          <Text className="text-2xl font-bold flex-1">Account Management</Text>
        </View>

        <ScrollView className="flex-1 px-4">
          {/* Profile Picture Section */}
          <View className="bg-white rounded-xl p-6 mb-6 shadow-sm">
            <Text className="text-lg font-semibold mb-4 text-gray-800">
              Profile Picture
            </Text>
            
            <View className="items-center">
              <TouchableOpacity 
                onPress={pickImage}
                disabled={loading}
                className="relative"
              >
                <View className="w-32 h-32 bg-blue-100 rounded-full items-center justify-center overflow-hidden">
                  {user?.avatar ? (
                    <Image 
                      source={{ uri: user.avatar }}
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                  ) : (
                    <Ionicons name="person" size={50} color="#3B82F6" />
                  )}
                </View>
                <View className="absolute bottom-0 right-0 bg-blue-500 rounded-full p-2">
                  <Ionicons name="camera" size={20} color="#fff" />
                </View>
              </TouchableOpacity>
              
              <Text className="text-gray-500 mt-4 text-center">
                Tap the camera icon to change your profile picture
              </Text>
            </View>
          </View>

          {/* Username Section */}
          <View className="bg-white rounded-xl p-6 mb-6 shadow-sm">
            <Text className="text-lg font-semibold mb-4 text-gray-800">
              Username
            </Text>
            
            <View className="flex-row items-center">
              {isEditing ? (
                <>
                  <TextInput
                    className="flex-1 border border-gray-300 rounded-lg px-4 py-2 mr-2"
                    value={newUsername}
                    onChangeText={setNewUsername}
                    placeholder="Enter new username"
                    autoFocus
                  />
                  <TouchableOpacity
                    onPress={handleUpdateUsername}
                    disabled={loading}
                    className="bg-blue-500 px-4 py-2 rounded-lg"
                  >
                    <Text className="text-white font-medium">Save</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text className="flex-1 text-gray-800 text-lg">
                    {user?.username}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setIsEditing(true)}
                    className="bg-gray-100 px-4 py-2 rounded-lg"
                  >
                    <Text className="text-gray-800 font-medium">Edit</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>

          {/* Email Section (Read-only) */}
          <View className="bg-white rounded-xl p-6 mb-6 shadow-sm">
            <Text className="text-lg font-semibold mb-4 text-gray-800">
              Email
            </Text>
            <Text className="text-gray-800 text-lg">
              {user?.email}
            </Text>
            <Text className="text-gray-500 mt-2">
              Email cannot be changed
            </Text>
          </View>

          {/* Change Password Section */}
          <View className="bg-white rounded-xl p-6 mb-6 shadow-sm">
            <Text className="text-lg font-semibold mb-4 text-gray-800">
              Change Password
            </Text>
            <View className="mb-4">
              <Text className="text-gray-600 mb-1">Current Password</Text>
              <TextInput
                className="border border-gray-300 rounded-lg px-4 py-2"
                value={oldPassword}
                onChangeText={setOldPassword}
                placeholder="Enter current password"
                secureTextEntry
                autoCapitalize="none"
              />
            </View>
            <View className="mb-4">
              <Text className="text-gray-600 mb-1">New Password</Text>
              <TextInput
                className="border border-gray-300 rounded-lg px-4 py-2"
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Enter new password"
                secureTextEntry
                autoCapitalize="none"
              />
            </View>
            <TouchableOpacity
              className="bg-blue-500 px-4 py-2 rounded-lg items-center"
              onPress={handleChangePassword}
              disabled={changingPassword}
            >
              <Text className="text-white font-medium">
                {changingPassword ? 'Changing...' : 'Change Password'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
      <ErrorModal
        visible={errorModalVisible}
        onClose={() => setErrorModalVisible(false)}
        message={errorModalMessage}
      />
      <SuccessModal
        visible={successModalVisible}
        onClose={() => setSuccessModalVisible(false)}
        message={successModalMessage}
      />
    </>
  );
};

export default AccountManagement; 