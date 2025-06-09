import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { Alert, Modal, Text, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getCategories, getUserAccounts, logTransaction } from '../lib/appwrite';

const AddTransaction = () => {
  const router = useRouter();
  const [name, setName] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [selectedAccount, setSelectedAccount] = useState(null);  // State for selected account
  const [selectedCategory, setSelectedCategory] = useState(null); // State for selected category
  const [accounts, setAccounts] = useState([]);  // List of user accounts
  const [categories, setCategories] = useState([]);  // List of categories for dropdown
  const [selectedDate, setSelectedDate] = useState(new Date()); // For date picker
  const [showDatePicker, setShowDatePicker] = useState(false); // For toggling date picker visibility
  const [isLoading, setIsLoading] = useState(false); // Loading state for saving transaction
  const [showSuccessModal, setShowSuccessModal] = useState(false); // Success modal state
  const [savedTransaction, setSavedTransaction] = useState(null); // Store saved transaction data

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

  // Fetch user accounts and categories when component mounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        const userAccounts = await getUserAccounts(); // Get accounts for the current user
        setAccounts(userAccounts);

        if (userAccounts.length > 0) {
          setSelectedAccount(userAccounts[0].$id); // Set the first account as default
        }
        
        const systemCategories = await getCategories();
        setCategories(systemCategories);

        if (systemCategories.length > 0) {
          setSelectedCategory(systemCategories[0].$id); // Set the first account as default
        }
      } catch (error) {
        console.error('Error fetching accounts and categories:', error);
      }
    };

    fetchData();
  }, []);

  // Handle account and category selection
  const handleSubmit = async () => {
    if (isLoading) return; // Prevent multiple submissions
    
    setIsLoading(true);
    
    try {
      // Get raw amount value for validation
      const rawAmount = getRawNumber(amount);
      
      // Validation
      if (!selectedAccount || !selectedCategory || !rawAmount || isNaN(parseFloat(rawAmount))) {
        Alert.alert(
          'Validation Error',
          'Please fill all required fields correctly.',
          [{ text: 'OK', style: 'default' }]
        );
        return;
      }

      if (parseFloat(rawAmount) <= 0) {
        Alert.alert(
          'Invalid Amount',
          'Please enter a valid amount greater than 0.',
          [{ text: 'OK', style: 'default' }]
        );
        return;
      }

      if (!name.trim()) {
        Alert.alert(
          'Missing Transaction Name',
          'Please enter a transaction name.',
          [{ text: 'OK', style: 'default' }]
        );
        return;
      }

      console.log('AddTransaction: Starting to save transaction...');
      
      // Call logTransaction with selected data
      const accountID = selectedAccount; // Get the selected account ID
      const categoryID = selectedCategory; // Get the selected category ID
      const isIncome = type === 'income'; // Determine if it's income or expense
      const transactionDate = selectedDate.toISOString(); // Use the selected date

      console.log('AddTransaction: Transaction data:', {
        name: name.trim(),
        accountID,
        categoryID,
        amount: parseFloat(rawAmount),
        isIncome,
        note: note.trim(),
        transactionDate
      });

      const transaction = await logTransaction(
        name.trim(), 
        accountID, 
        categoryID, 
        parseFloat(rawAmount), 
        isIncome, 
        note.trim(), 
        transactionDate
      );
      
      console.log('AddTransaction: Transaction saved successfully:', transaction.$id);
      
      // Store transaction data and show success modal
      setSavedTransaction({
        name: name.trim(),
        amount: parseFloat(rawAmount),
        type: isIncome ? 'Income' : 'Expense'
      });
      setShowSuccessModal(true);
      
    } catch (error) {
      console.error('AddTransaction: Error logging transaction:', error);
      
      // Show detailed error message
      const errorMessage = error.message || 'An unknown error occurred while saving the transaction.';
      Alert.alert(
        'Error Saving Transaction ❌',
        `Failed to save transaction: ${errorMessage}\n\nPlease try again or check your internet connection.`,
        [{ text: 'OK', style: 'default' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const theme = useColorScheme();
  const backgroundColor = theme === 'dark' ? '#000000' : '#FFFFFF';

  return (
    <SafeAreaView className="flex-1 h-full">
    <View className="flex-1 px-4 pt-6 bg-white dark:bg-black">
      {/* Header with back button and title in same row */}
      <View className="flex-row items-center mb-6">
        <TouchableOpacity onPress={() => router.back()} className="p-2 bg-gray-300 rounded-full mr-4">
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text className="text-2xl font-bold text-gray-800 dark:text-white">Add Transaction</Text>
      </View>

      {/* Transaction Name Input */}
      <Text className="text-gray-700 dark:text-gray-400 mb-2">Transaction Name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="E.g. Coffee, Grocery, Salary"
          placeholderTextColor="#9CA3AF"
          className="border border-gray-300 dark:border-gray-600 px-4 py-3 rounded-xl mb-6 text-base text-gray-600 dark:text-gray-300"
        />

      {/* Amount Input */}
      <Text className="text-gray-700 dark:text-gray-400 mb-2">Amount</Text>
      <TextInput
        keyboardType="numeric"
        value={amount}
        onChangeText={(text) => {
          const formatted = formatNumber(text);
          setAmount(formatted);
        }}
        placeholder="E.g. 50.000, 100.000"
        placeholderTextColor="#9CA3AF"
        className="border border-gray-300 dark:border-gray-600 px-4 py-3 rounded-xl mb-4 text-base text-gray-600 dark:text-gray-300"
      />

      {/* Type Toggle */}
      <View className="flex-row mb-4 space-x-4">
        <TouchableOpacity
          onPress={() => setType('expense')}
          className={`flex-1 py-3 rounded-xl items-center ${type === 'expense' ? 'bg-red-600' : 'bg-gray-200 dark:bg-gray-700'}`}
        >
          <Text className={`font-semibold ${type === 'expense' ? 'text-white' : 'text-black dark:text-white'}`}>Expense</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setType('income')}
          className={`flex-1 py-3 rounded-xl items-center ${type === 'income' ? 'bg-green-600' : 'bg-gray-200 dark:bg-gray-700'}`}
        >
          <Text className={`font-semibold ${type === 'income' ? 'text-white' : 'text-black dark:text-white'}`}>Income</Text>
        </TouchableOpacity>
      </View>

      {/* Account Selection */}
      <Text className="text-gray-700 dark:text-gray-400 mb-2">Select Account</Text>
      <View className="border border-gray-300 dark:border-gray-600 rounded-xl mb-4">
        <Picker
          selectedValue={selectedAccount}
          onValueChange={(itemValue) => setSelectedAccount(itemValue)}
          style={{
            color: '#6B7280', // Gray color for text
            backgroundColor: 'transparent',
          }}
        >
          {accounts.map((account, index) => (
            <Picker.Item key={index} label={account.name} value={account.$id} />
          ))}
        </Picker>
      </View>

      {/* Category Selection */}
      <Text className="text-gray-700 dark:text-gray-400 mb-2">Select Category</Text>
      <View className="border border-gray-300 dark:border-gray-600 rounded-xl mb-4">
        <Picker
          selectedValue={selectedCategory}
          onValueChange={(itemValue) => setSelectedCategory(itemValue)}
          style={{
            color: '#6B7280', // Gray color for text
            backgroundColor: 'transparent',
          }}
        >
          {categories.map((category, index) => (
            <Picker.Item key={index} label={category.name} value={category.$id} />
          ))}
        </Picker>
      </View>

      {/* Note Input */}
      <Text className="text-gray-700 dark:text-gray-400 mb-2">Note (optional)</Text>
      <TextInput
        value={note}
        onChangeText={setNote}
        placeholder="E.g. Dinner with friends, Freelance work"
        placeholderTextColor="#9CA3AF"
        className="border border-gray-300 dark:border-gray-600 px-4 py-3 rounded-xl mb-6 text-base text-gray-600 dark:text-gray-300"
      />

      {/* Date Selection */}
      <Text className="text-gray-700 dark:text-gray-400 mb-2">Transaction Date</Text>
      <TouchableOpacity
        onPress={() => setShowDatePicker(true)}
        className="border border-gray-300 dark:border-gray-600 px-4 py-3 rounded-xl mb-7 flex-row items-center justify-between"
      >
        <Text className="text-gray-600 dark:text-gray-300 text-base">
          {selectedDate.toLocaleDateString('vi-VN', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </Text>
        <Ionicons name="calendar-outline" size={20} color="#9CA3AF" />
      </TouchableOpacity>
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="spinner"
          onChange={(event, date) => {
            setShowDatePicker(false);
            if (date) {
              setSelectedDate(date);
            }
          }}
          maximumDate={new Date()} // Prevent future dates
          style={{ marginBottom: 20 }}
        />
      )}

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
            <Text className="text-white text-base font-semibold ml-2">Saving...</Text>
          </>
        ) : (
          <>
            <Ionicons name="save" size={20} color="white" />
            <Text className="text-white text-base font-semibold ml-2">Save Transaction</Text>
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
            
            {savedTransaction && (
              <View className="mb-6">
                <Text className="text-gray-600 dark:text-gray-300 text-center mb-2">
                  Transaction has been saved successfully!
                </Text>
                <View className="bg-gray-50 dark:bg-gray-700 p-4 rounded-xl">
                  <Text className="font-semibold text-gray-800 dark:text-white">
                    {savedTransaction.name}
                  </Text>
                  <Text className="text-lg font-bold text-green-600 mt-1">
                    {savedTransaction.amount.toLocaleString('vi-VN')} VNĐ
                  </Text>
                  <Text className="text-sm text-gray-500 dark:text-gray-400">
                    Type: {savedTransaction.type}
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
    <StatusBar backgroundColor={backgroundColor} style={theme === 'dark' ? 'light' : 'dark'} />
    </SafeAreaView>
  );
};

export default AddTransaction;