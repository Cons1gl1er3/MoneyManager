import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
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

  // Create a style for web inputs with additional properties
  const webInputStyle = Platform.OS === 'web' ? {
    height: 50,
    outlineWidth: 0,
    paddingTop: 12,
    paddingBottom: 12,
  } : {};

  // Main content as a separate component for easy conditional rendering
  const InnerContent = () => (
    <View style={styles.innerContainer}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          Add Money Source
        </Text>
      </View>
      
      <ScrollView 
        style={styles.scrollView}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {/* Account Name Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Money Source Name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="E.g. Savings, Checking, etc."
            placeholderTextColor="#9CA3AF"
            style={[styles.textInput, webInputStyle]}
          />
        </View>

        {/* Initial Balance Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Initial Balance</Text>
          <TextInput
            keyboardType="numeric"
            value={balance}
            onChangeText={(text) => {
              const formatted = formatNumber(text);
              setBalance(formatted);
            }}
            placeholder="E.g. 50.000, 1.000.000"
            placeholderTextColor="#9CA3AF"
            style={[styles.textInput, webInputStyle]}
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={isLoading}
          style={[
            styles.submitButton,
            isLoading && styles.submitButtonDisabled
          ]}
        >
          {isLoading ? (
            <>
              <Ionicons name="hourglass-outline" size={20} color="white" />
              <Text style={styles.buttonText}>Creating...</Text>
            </>
          ) : (
            <>
              <Ionicons name="save" size={20} color="white" />
              <Text style={styles.buttonText}>Create Money Source</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor="#FFFFFF" style="dark" />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          {Platform.OS === 'web' ? (
            <InnerContent />
          ) : (
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <InnerContent />
            </TouchableWithoutFeedback>
          )}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  innerContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    marginBottom: 24,
  },
  backButton: {
    padding: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 9999,
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    flex: 1,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    color: '#4b5563',
    marginBottom: 8,
    fontSize: 16,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 16 : 12,
    fontSize: 16,
    color: '#1f2937',
    backgroundColor: '#ffffff',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#2563eb',
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default AddAccount;