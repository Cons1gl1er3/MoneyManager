import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { Modal, Text, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createAccount, getCurrentUser } from '../lib/appwrite';

const AddAccount = () => {
  const router = useRouter();
  const [name, setName] = useState('');
  const [balance, setBalance] = useState('');
  const [userID, setUserID] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false); // Loading state
  const [showSuccessModal, setShowSuccessModal] = useState(false); // Success modal state
  const [savedAccount, setSavedAccount] = useState(null); // Store saved account data
  const theme = useColorScheme();
  const backgroundColor = theme === 'dark' ? '#000000' : '#FFFFFF';

  // Format number with thousand separators
  const formatNumber = (text: string): string => {
    // Remove all non-numeric characters
    const cleanedText = text.replace(/[^0-9]/g, '');
    
    // Add thousand separators
    if (cleanedText) {
      return cleanedText.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }
    return cleanedText;
  };

  // Get raw number from formatted string
  const getRawNumber = (formattedText: string): string => {
    return formattedText.replace(/\./g, '');
  };

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

  // Handle account creation
  const handleSubmit = async () => {
    if (isLoading) return; // Prevent multiple submissions
    
    setIsLoading(true);
    
    try {
      if (!userID) {
        alert('User not authenticated. Please log in.');
        return;
      }
      if (!name.trim()) {
        alert('Please enter an account name.');
        return;
      }
      
      // Get raw balance value for validation
      const rawBalance = getRawNumber(balance);
      const balanceValue = parseFloat(rawBalance) || 0;
      
      if (isNaN(balanceValue) || balanceValue < 0) {
        alert('Please enter a valid initial balance.');
        return;
      }

      console.log('AddAccount: Creating account...', {
        name: name.trim(),
        balance: balanceValue
      });

      // Create account via Appwrite
      await createAccount(userID, name.trim(), balanceValue);

      console.log('AddAccount: Account created successfully');

      // Store account data and show success modal
      setSavedAccount({
        name: name.trim(),
        balance: balanceValue
      });
      setShowSuccessModal(true);

    } catch (error) {
      console.error('Error creating account:', error);
      alert('An error occurred while creating the account.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView className="flex-1 h-full">
        <StatusBar backgroundColor={backgroundColor} style={theme === 'dark' ? 'light' : 'dark'} />
        <View className="flex-1 px-4 pt-4 bg-white dark:bg-black">
          {/* Header */}
          <View className="flex-row items-center mb-6">
            <TouchableOpacity
              onPress={() => router.back()}
              className="mr-4 p-2 bg-gray-100 rounded-full"
            >
              <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
            <Text className="text-2xl font-bold flex-1 text-gray-800 dark:text-white">
              Add Money Source
            </Text>
          </View>

          {/* Account Name Input */}
          <Text className="text-gray-700 dark:text-gray-400 mb-2">Account Name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="E.g. Savings, Checking, etc."
            placeholderTextColor="#9CA3AF"
            className="border border-gray-300 dark:border-gray-600 px-4 py-3 rounded-xl mb-4 text-base text-gray-600 dark:text-gray-300"
          />

          {/* Initial Balance Input */}
          <Text className="text-gray-700 dark:text-gray-400 mb-2">Initial Balance</Text>
          <TextInput
            keyboardType="numeric"
            value={balance}
            onChangeText={(text) => {
              const formatted = formatNumber(text);
              setBalance(formatted);
            }}
            placeholder="E.g. 50.000, 1.000.000"
            placeholderTextColor="#9CA3AF"
            className="border border-gray-300 dark:border-gray-600 px-4 py-3 rounded-xl mb-6 text-base text-gray-600 dark:text-gray-300"
          />

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isLoading}
            className={`flex-row items-center justify-center py-4 rounded-xl ${
              isLoading ? 'bg-gray-400' : 'bg-blue-600'
            }`}
          >
            {isLoading ? (
              <>
                <Ionicons name="hourglass-outline" size={20} color="white" />
                <Text className="text-white text-base font-semibold ml-2">Creating...</Text>
              </>
            ) : (
              <>
                <Ionicons name="save" size={20} color="white" />
                <Text className="text-white text-base font-semibold ml-2">Create Account</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Success Modal */}
          <Modal
            animationType="fade"
            transparent={true}
            visible={showSuccessModal}
            onRequestClose={() => setShowSuccessModal(false)}
          >
            <View className="flex-1 justify-center items-center bg-black/50">
              <View className="bg-white dark:bg-gray-800 mx-4 p-6 rounded-2xl shadow-xl">
                <View className="items-center mb-4">
                  <Ionicons name="checkmark-circle" size={60} color="#22C55E" />
                  <Text className="text-2xl font-bold text-gray-800 dark:text-white mt-2">
                    Success!
                  </Text>
                </View>
                
                {savedAccount && (
                  <View className="mb-6">
                    <Text className="text-gray-600 dark:text-gray-300 text-center mb-2">
                      Money Source has been created successfully!
                    </Text>
                    <View className="bg-gray-50 dark:bg-gray-700 p-4 rounded-xl">
                      <Text className="font-semibold text-gray-800 dark:text-white">
                        {savedAccount.name}
                      </Text>
                      <Text className="text-lg font-bold text-green-600 mt-1">
                        {savedAccount.balance.toLocaleString('vi-VN')} VNĐ
                      </Text>
                      <Text className="text-sm text-gray-500 dark:text-gray-400">
                        Initial Balance
                      </Text>
                    </View>
                  </View>
                )}
                
                <TouchableOpacity
                  onPress={() => {
                    setShowSuccessModal(false);
                    router.back();
                  }}
                  className="bg-blue-600 py-3 px-6 rounded-xl"
                >
                  <Text className="text-white text-center font-semibold">
                    Go Back
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </View>
      </SafeAreaView>
    </>
  );
};

export default AddAccount;