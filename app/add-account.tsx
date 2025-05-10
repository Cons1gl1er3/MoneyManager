import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { Text, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createAccount, getCurrentUser } from '../lib/appwrite';

const AddAccount = () => {
  const router = useRouter();
  const [name, setName] = useState('');
  const [balance, setBalance] = useState('');
  const [userID, setUserID] = useState<string | null>(null);
  const theme = useColorScheme();
  const backgroundColor = theme === 'dark' ? '#000000' : '#FFFFFF';

  // Fetch user ID when component mounts
  useEffect(() => {
    const fetchUserID = async () => {
      try {
        const user = await getCurrentUser();
        if (user) {
          setUserID(user.$id);
        }
      } catch (error) {
        console.error('Error fetching user ID:', error);
        alert('Failed to fetch user information.');
      }
    };
    fetchUserID();
  }, []);

  // Format balance for display (VNĐ)
  const formatVND = (value: string): string => {
    const numericValue = parseFloat(value.replace(/[^0-9]/g, '')) || 0;
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    })
      .format(numericValue)
      .replace('₫', 'VNĐ');
  };

  // Handle balance input to allow only numbers
  const handleBalanceChange = (text: string) => {
    const numericText = text.replace(/[^0-9]/g, '');
    setBalance(numericText);
  };

  // Handle account creation
  const handleSubmit = async () => {
    try {
      if (!userID) {
        alert('User not authenticated. Please log in.');
        return;
      }
      if (!name.trim()) {
        alert('Please enter an account name.');
        return;
      }
      const balanceValue = parseFloat(balance) || 0;
      if (isNaN(balanceValue)) {
        alert('Please enter a valid initial balance.');
        return;
      }

      // Create account via Appwrite
      await createAccount(userID, name.trim(), balanceValue);

      // Navigate back after successful creation
      router.back();
    } catch (error) {
      console.error('Error creating account:', error);
      alert('An error occurred while creating the account.');
    }
  };

  return (
    <SafeAreaView className="flex-1 h-full">
      <StatusBar backgroundColor={backgroundColor} style={theme === 'dark' ? 'light' : 'dark'} />
      <View className="flex-1 px-4 pt-12 bg-white dark:bg-black">
        {/* Back Button */}
        <TouchableOpacity
          onPress={() => router.back()}
          className="absolute top-5 left-4 p-2 bg-gray-300 rounded-full"
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>

        {/* Header */}
        <Text className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">
          Add Account
        </Text>

        {/* Account Name Input */}
        <Text className="text-gray-700 dark:text-gray-400 mb-2">Account Name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="E.g. Savings, Checking"
          className="border border-gray-300 dark:border-gray-600 px-4 py-3 rounded-xl mb-4 text-base text-black dark:text-white"
        />

        {/* Initial Balance Input */}
        <Text className="text-gray-700 dark:text-gray-400 mb-2">Initial Balance</Text>
        <TextInput
          keyboardType="numeric"
          value={balance}
          onChangeText={handleBalanceChange}
          placeholder="Enter initial balance"
          className="border border-gray-300 dark:border-gray-600 px-4 py-3 rounded-xl mb-4 text-base text-black dark:text-white"
        />
        <Text className="text-gray-500 dark:text-gray-400 mb-6">
          {balance ? formatVND(balance) : '0 VNĐ'}
        </Text>

        {/* Submit Button */}
        <TouchableOpacity
          onPress={handleSubmit}
          className="flex-row items-center justify-center bg-blue-600 py-4 rounded-xl"
        >
          <Ionicons name="save" size={20} color="white" />
          <Text className="text-white text-base font-semibold ml-2">Create Account</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default AddAccount;