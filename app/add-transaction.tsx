import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const AddTransaction = () => {
  const router = useRouter();
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  const handleSubmit = () => {
    // 💾 Save transaction here (e.g., insert into SQLite or API call)
    console.log({
      type,
      amount: parseFloat(amount),
      note,
      category_id: 'cat_food', // Replace with selected category
      date: new Date().toISOString(),
    });

    router.back();
  };

  return (
    <View className="flex-1 px-4 pt-12 bg-white dark:bg-black">
      <Text className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">
        Add Transaction
      </Text>

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
          className={`flex-1 py-3 rounded-xl items-center ${
            type === 'expense' ? 'bg-red-600' : 'bg-gray-200 dark:bg-gray-700'
          }`}
        >
          <Text className={`font-semibold ${type === 'expense' ? 'text-white' : 'text-black dark:text-white'}`}>
            Expense
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setType('income')}
          className={`flex-1 py-3 rounded-xl items-center ${
            type === 'income' ? 'bg-green-600' : 'bg-gray-200 dark:bg-gray-700'
          }`}
        >
          <Text className={`font-semibold ${type === 'income' ? 'text-white' : 'text-black dark:text-white'}`}>
            Income
          </Text>
        </TouchableOpacity>
      </View>

      {/* Note Input */}
      <Text className="text-gray-700 dark:text-gray-300 mb-2">Note (optional)</Text>
      <TextInput
        value={note}
        onChangeText={setNote}
        placeholder="E.g. Dinner, Freelance, etc."
        className="border border-gray-300 dark:border-gray-600 px-4 py-3 rounded-xl mb-6 text-base text-black dark:text-white"
      />

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