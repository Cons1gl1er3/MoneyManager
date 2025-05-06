import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker'; // Add DateTimePicker for user to select a date
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Picker, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { getUserAccounts, logTransaction } from '../lib/appwrite'; // Import your logTransaction function

const AddTransaction = () => {
  const router = useRouter();
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [selectedAccount, setSelectedAccount] = useState(null);  // State for selected account
  const [selectedCategory, setSelectedCategory] = useState(''); // State for selected category
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
        
        // Sample categories - you might fetch these from your categories collection
        setCategories([
          { name: 'Food', category_id: 'cat_food' },
          { name: 'Transport', category_id: 'cat_transport' },
          { name: 'Entertainment', category_id: 'cat_entertainment' },
        ]);
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

      const transaction = await logTransaction(accountID, categoryID, parseFloat(amount), isIncome, note, transactionDate);

      // Navigate back after submitting
      router.back();
    } catch (error) {
      console.error('Error logging transaction:', error);
      alert('An error occurred while logging the transaction.');
    }
  };

  return (
    <View className="flex-1 px-4 pt-12 bg-white dark:bg-black">
      <Text className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Add Transaction</Text>

      {/* Amount Input */}
      <Text className="text-gray-700 dark:text-gray-300 mb-2">Amount</Text>
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
      <Text className="text-gray-700 dark:text-gray-300 mb-2">Select Account</Text>
      <Picker
        selectedValue={selectedAccount}
        onValueChange={(itemValue) => setSelectedAccount(itemValue)}
        style={{ marginBottom: 20 }}
      >
        {accounts.map((account, index) => (
          <Picker.Item key={index} label={account.name} value={account.account_id} />
        ))}
      </Picker>

      {/* Category Selection */}
      <Text className="text-gray-700 dark:text-gray-300 mb-2">Select Category</Text>
      <Picker
        selectedValue={selectedCategory}
        onValueChange={(itemValue) => setSelectedCategory(itemValue)}
        style={{ marginBottom: 20 }}
      >
        {categories.map((category, index) => (
          <Picker.Item key={index} label={category.name} value={category.category_id} />
        ))}
      </Picker>

      {/* Note Input */}
      <Text className="text-gray-700 dark:text-gray-300 mb-2">Note (optional)</Text>
      <TextInput
        value={note}
        onChangeText={setNote}
        placeholder="E.g. Dinner, Freelance, etc."
        className="border border-gray-300 dark:border-gray-600 px-4 py-3 rounded-xl mb-6 text-base text-black dark:text-white"
      />

      {/* Date Selection */}
      <Text className="text-gray-700 dark:text-gray-300 mb-2">Transaction Date</Text>
      <TouchableOpacity
        onPress={() => setShowDatePicker(true)}
        className="border border-gray-300 dark:border-gray-600 px-4 py-3 rounded-xl mb-4"
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
  );
};

export default AddTransaction;