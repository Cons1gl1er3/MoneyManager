import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ErrorModal from '../components/ErrorModal';
import SuccessModal from '../components/SuccessModal';
import { createAccount } from '../lib/appwrite';

const AddAccount = () => {
  const router = useRouter();
  const [name, setName] = useState('');
  const [balance, setBalance] = useState('');
  const [isLoading, setIsLoading] = useState(false); // Loading state
  const [showSuccessModal, setShowSuccessModal] = useState(false); // Success modal state
  const [savedAccount, setSavedAccount] = useState(null); // Store saved account data
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorModalMessage, setErrorModalMessage] = useState('');

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

  // Handle account creation
  const handleSubmit = async () => {
    if (isLoading) return; // Prevent multiple submissions
    
    setIsLoading(true);
    
    try {
      if (!name.trim()) {
        setErrorModalMessage('Please enter a money source name.');
        setErrorModalVisible(true);
        setIsLoading(false);
        return;
      }
      
      // Get raw balance value for validation
      const rawBalance = getRawNumber(balance);
      const balanceValue = parseFloat(rawBalance) || 0;
      
      if (isNaN(balanceValue) || balanceValue <= 0) {
        setErrorModalMessage('Please enter a valid balance (must be 0 or greater).');
        setErrorModalVisible(true);
        setIsLoading(false);
        return;
      }

      console.log('AddAccount: Creating account...', {
        name: name.trim(),
        balance: balanceValue
      });

      // Create account via Appwrite
      await createAccount(name.trim(), balanceValue);

      console.log('AddAccount: Account created successfully');

      // Store account data and show success modal
      setSavedAccount({
        name: name.trim(),
        balance: balanceValue
      });
      setShowSuccessModal(true);

    } catch (error) {
      console.error('Error creating account:', error);
      setErrorModalMessage(`Failed to create money source: ${error.message || 'Unknown error'}`);
      setErrorModalVisible(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView className="flex-1 bg-white">
        <StatusBar backgroundColor="#FFFFFF" style="dark" />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View className="flex-1">
              {/* Header */}
              <View className="flex-row items-center px-4 pt-4 mb-6">
                <TouchableOpacity
                  onPress={() => router.back()}
                  className="mr-4 p-2 bg-gray-100 rounded-full"
                >
                  <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text className="text-2xl font-bold flex-1 text-gray-800">
                  Add Money Source
                </Text>
              </View>
              
              <ScrollView 
                className="flex-1 px-4"
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingBottom: 20 }}
              >
                {/* Account Name Input */}
                <View className="mb-6">
                  <Text className="text-gray-700 mb-2">Money Source Name</Text>
                  <TextInput
                    value={name}
                    onChangeText={setName}
                    placeholder="E.g. Savings, Checking, etc."
                    placeholderTextColor="#9CA3AF"
                    className="border border-gray-300 px-4 rounded-xl text-base text-gray-600 bg-white"
                    style={{ paddingVertical: Platform.OS === 'ios' ? 16 : 12 }}
                  />
                </View>

                {/* Initial Balance Input */}
                <View className="mb-6">
                  <Text className="text-gray-700 mb-2">Initial Balance</Text>
                  <TextInput
                    keyboardType="numeric"
                    value={balance}
                    onChangeText={(text) => {
                      const formatted = formatNumber(text);
                      setBalance(formatted);
                    }}
                    placeholder="E.g. 50.000, 1.000.000"
                    placeholderTextColor="#9CA3AF"
                    className="border border-gray-300 px-4 rounded-xl text-base text-gray-600 bg-white"
                    style={{ paddingVertical: Platform.OS === 'ios' ? 16 : 12 }}
                  />
                </View>

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
                      <Text className="text-white text-base font-semibold ml-2">Create Money Source</Text>
                    </>
                  )}
                </TouchableOpacity>
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
        
        {/* Modals */}
        <SuccessModal
          visible={showSuccessModal}
          onClose={() => {
            setShowSuccessModal(false);
            router.back();
          }}
          message="Money source has been created successfully!"
          accountDetails={savedAccount}
        />

        <ErrorModal
          visible={errorModalVisible}
          message={errorModalMessage}
          onClose={() => setErrorModalVisible(false)}
        />
      </SafeAreaView>
    </>
  );
};

export default AddAccount;