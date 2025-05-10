import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { Text, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native';
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
    try {
      if (!selectedAccount || !selectedCategory || !amount || isNaN(parseFloat(amount))) {
        alert('Please fill all fields correctly.');
        return;
      }

      // Call logTransaction with selected data
      const accountID = selectedAccount; // Get the selected account ID
      const categoryID = selectedCategory; // Get the selected category ID
      const isIncome = type === 'income'; // Determine if it's income or expense
      const transactionDate = selectedDate.toISOString(); // Use the selected date

      const transaction = await logTransaction(name, accountID, categoryID, parseFloat(amount), isIncome, note, transactionDate);

      // Navigate back after submitting
      router.back();
    } catch (error) {
      console.error('Error logging transaction:', error);
      alert('An error occurred while logging the transaction.');
    }
  };

  const theme = useColorScheme();
  const backgroundColor = theme === 'dark' ? '#000000' : '#FFFFFF';

  return (
    <SafeAreaView className="flex-1 h-full">
    <View className="flex-1 px-4 pt-12 bg-white dark:bg-black">
      <TouchableOpacity onPress={() => router.back()} className="absolute top-5 left-4 p-2 bg-gray-300 rounded-full">
        <Ionicons name="arrow-back" size={24} color="#000" />
      </TouchableOpacity>
      <Text className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Add Transaction</Text>

      {/* Transaction Name Input */}
      <Text className="text-gray-700 dark:text-gray-400 mb-2">Transaction Name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Enter transaction name"
          className="border border-gray-300 dark:border-gray-600 px-4 py-3 rounded-xl mb-6 text-base text-black dark:text-white"
        />

      {/* Amount Input */}
      <Text className="text-gray-700 dark:text-gray-400 mb-2">Amount</Text>
      <TextInput
        keyboardType="numeric"
        value={amount}
        onChangeText={setAmount}
        placeholder="Enter amount"
        className="border border-gray-300 dark:border-gray-600 px-4 py-3 rounded-xl mb-4 text-base text-black dark:text-white"
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
      <Picker
        selectedValue={selectedAccount}
        onValueChange={(itemValue) => setSelectedAccount(itemValue)}
        style={{
          marginBottom: 20,
          borderWidth: 1,
          borderColor: '#4b5563', // Light mode border color
          borderRadius: 12,
          paddingHorizontal: 8,
          backgroundColor: '#1F2937', // Background color
          color: '#FFFFFF', // Text color (light mode)
          fontSize: 16,
        }}
      >
        {accounts.map((account, index) => (
          <Picker.Item key={index} label={account.name} value={account.$id} />
        ))}
      </Picker>

      {/* Category Selection */}
      <Text className="text-gray-700 dark:text-gray-400 mb-2">Select Category</Text>
      <Picker
        selectedValue={selectedCategory}
        onValueChange={(itemValue) => setSelectedCategory(itemValue)}
        style={{
          marginBottom: 20,
          borderWidth: 1,
          borderColor: '#4b5563', // Light mode border color
          borderRadius: 12,
          paddingHorizontal: 8,
          backgroundColor: '#1F2937', // Background color
          color: '#FFFFFF', // Text color (light mode)
          fontSize: 16,
        }}
      >
        {categories.map((category, index) => (
          <Picker.Item key={index} label={category.name} value={category.$id} />
        ))}
      </Picker>

      {/* Note Input */}
      <Text className="text-gray-700 dark:text-gray-400 mb-2">Note (optional)</Text>
      <TextInput
        value={note}
        onChangeText={setNote}
        placeholder="E.g. Dinner, Freelance, etc."
        className="border border-gray-300 dark:border-gray-600 px-4 py-3 rounded-xl mb-6 text-base text-black dark:text-white"
      />

      {/* Date Selection */}
      <Text className="text-gray-700 dark:text-gray-400 mb-2">Transaction Date</Text>
      <TouchableOpacity
        onPress={() => setShowDatePicker(true)}
        className="border border-gray-300 dark:border-gray-600 px-4 py-3 rounded-xl mb-7"
      >
        <Text className="text-gray-500">{selectedDate.toLocaleDateString()}</Text>
      </TouchableOpacity>
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={(event, date) => {
            setShowDatePicker(false);
            if (date) setSelectedDate(date);
          }}
        />
      )}

      {/* Submit Button */}
      <TouchableOpacity
        onPress={handleSubmit}
        className="flex-row items-center justify-center bg-blue-600 py-4 rounded-xl"
      >
        <Ionicons name="save" size={20} color="white" />
        <Text className="text-white text-base font-semibold ml-2">Save Transaction</Text>
      </TouchableOpacity>
    </View>
    <StatusBar backgroundColor={backgroundColor} style={theme === 'dark' ? 'light' : 'dark'} />
    </SafeAreaView>
  );
};

export default AddTransaction;