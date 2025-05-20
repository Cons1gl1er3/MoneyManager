import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { Text, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getCategories, getUserAccounts } from '../lib/appwrite';

interface Transaction {
  name: string;
  amount: number;
  type: 'income' | 'expense';
  accountName: string;
  categoryName: string;
  date: string;
  note: string;
}

const EditOcrTransaction = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [name, setName] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [originalTransaction, setOriginalTransaction] = useState<Transaction | null>(null);

  const theme = useColorScheme();
  const backgroundColor = theme === 'dark' ? '#000000' : '#FFFFFF';

  useEffect(() => {
    const loadData = async () => {
      try {
        // Parse the transaction data from params
        if (params.transaction) {
          const transaction = JSON.parse(params.transaction as string) as Transaction;
          setOriginalTransaction(transaction);
          setName(transaction.name);
          setType(transaction.type);
          setAmount(transaction.amount.toString());
          setNote(transaction.note);
          setSelectedDate(new Date(transaction.date));

          // Load accounts and categories
          const [userAccounts, systemCategories] = await Promise.all([
            getUserAccounts(),
            getCategories()
          ]);
          
          setAccounts(userAccounts);
          setCategories(systemCategories);

          // Set initial account and category based on names
          const account = userAccounts.find(acc => acc.name === transaction.accountName);
          const category = systemCategories.find(cat => cat.name === transaction.categoryName);
          
          if (account) {
            console.log('Found account:', account.name, account.$id);
            setSelectedAccount(account.$id);
          }
          if (category) {
            console.log('Found category:', category.name, category.$id);
            setSelectedCategory(category.$id);
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
        alert('Error loading transaction data. Please try again.');
      }
    };

    loadData();
  }, [params.transaction]);

  const handleSave = () => {
    if (!selectedAccount || !selectedCategory || !amount || isNaN(parseFloat(amount))) {
      alert('Please fill all fields correctly.');
      return;
    }

    // Find the account and category names for the selected IDs
    const account = accounts.find(acc => acc.$id === selectedAccount);
    const category = categories.find(cat => cat.$id === selectedCategory);

    if (!account || !category) {
      alert('Invalid account or category selection.');
      return;
    }

    // Create the updated transaction object
    const updatedTransaction = {
      name,
      amount: parseFloat(amount),
      type,
      accountName: account.name,
      categoryName: category.name,
      date: selectedDate.toISOString(),
      note,
      accountId: selectedAccount,
      categoryId: selectedCategory
    };

    // Return to the confirmation page with the updated transaction
    router.back();
    // Use setTimeout to ensure the navigation completes before setting params
    setTimeout(() => {
      router.setParams({ 
        editedTransaction: JSON.stringify(updatedTransaction),
        editedIndex: params.index
      });
    }, 100);
  };

  return (
    <SafeAreaView className="flex-1 h-full">
      <View className="flex-1 px-4 pt-12 bg-white dark:bg-black">
        <TouchableOpacity onPress={() => router.back()} className="absolute top-5 left-4 p-2 bg-gray-300 rounded-full">
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Edit Transaction</Text>

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
            borderColor: '#4b5563',
            borderRadius: 12,
            paddingHorizontal: 8,
            backgroundColor: '#1F2937',
            color: '#FFFFFF',
            fontSize: 16,
          }}
        >
          {accounts.map((account) => (
            <Picker.Item key={account.$id} label={account.name} value={account.$id} />
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
            borderColor: '#4b5563',
            borderRadius: 12,
            paddingHorizontal: 8,
            backgroundColor: '#1F2937',
            color: '#FFFFFF',
            fontSize: 16,
          }}
        >
          {categories.map((category) => (
            <Picker.Item key={category.$id} label={category.name} value={category.$id} />
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

        {/* Save Button */}
        <TouchableOpacity
          onPress={handleSave}
          className="flex-row items-center justify-center bg-blue-600 py-4 rounded-xl"
        >
          <Ionicons name="save" size={20} color="white" />
          <Text className="text-white text-base font-semibold ml-2">Save Changes</Text>
        </TouchableOpacity>
      </View>
      <StatusBar backgroundColor={backgroundColor} style={theme === 'dark' ? 'light' : 'dark'} />
    </SafeAreaView>
  );
};

export default EditOcrTransaction; 