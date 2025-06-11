import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ErrorModal from '../components/ErrorModal';
import { getCategoriesByType, getUserAccounts, logTransaction } from '../lib/appwrite';

// Import mock data directly
const mockData = require('../assets/mock-receipt-transactions.json');

interface RawTransaction {
  name: string;
  amount: number;
  type: 'income' | 'expense';
  accountName: string;
  categoryName: string;
  date: string;
  note: string;
}

interface ProcessedTransaction extends RawTransaction {
  accountId: string;
  categoryId: string;
}

interface Account {
  $id: string;
  name: string;
  balance: number;
}

interface Category {
  $id: string;
  name: string;
  icon?: string;
  color?: string;
}

const ReceiptLogConfirmation = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const theme = useColorScheme();
  const backgroundColor = theme === 'dark' ? '#121212' : '#F9FAFB';
  const [rawTransactions, setRawTransactions] = useState<RawTransaction[]>([]);
  const [processedTransactions, setProcessedTransactions] = useState<ProcessedTransaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load accounts and expense categories only (OCR only supports expense)
        const [userAccounts, expenseCategories] = await Promise.all([
          getUserAccounts(),
          getCategoriesByType('expense')
        ]);
        
        setAccounts(userAccounts);
        setCategories(expenseCategories as unknown as Category[]);

        // If we have edited transactions in params, use those
        if (params.editedTransaction && params.editedIndex) {
          const editedTransaction = JSON.parse(params.editedTransaction as string);
          const editedIndex = parseInt(params.editedIndex as string);
          
          setProcessedTransactions(prev => {
            // Always preserve previous transactions
            const updated = [...prev];
            updated[editedIndex] = {
              ...editedTransaction,
              // Force type to expense since OCR only supports expense
              type: 'expense',
              accountId: editedTransaction.accountId,
              categoryId: editedTransaction.categoryId
            };
            return updated;
          });
        } else if (processedTransactions.length === 0) {
          // Only load mock data if we don't have any transactions
          setRawTransactions(mockData.transactions);

          // Process transactions by matching names to IDs and force all to expense type
          const processed = [];
          for (const transaction of mockData.transactions) {
            const account = userAccounts.find(acc => acc.name === transaction.accountName);
            const category = expenseCategories.find(cat => cat.name === transaction.categoryName);

            if (!account || !category) {
              setErrorMessage(`Could not find matching account or category for transaction: ${transaction.name}`);
              setErrorModalVisible(true);
              setIsLoading(false);
              return;
            }

            processed.push({
              ...transaction,
              type: 'expense' as const, // Force all OCR transactions to be expense
              accountId: account.$id,
              categoryId: category.$id
            });
          }

          setProcessedTransactions(processed);
        }
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        setErrorMessage('Error loading transactions. Please try again.');
        setErrorModalVisible(true);
      }
    };

    loadData();
  }, [params.editedTransaction, params.editedIndex]);

  const handleEdit = (index: number) => {
    const transaction = processedTransactions[index];
    console.log('Editing transaction:', transaction);
    
    // Navigate to edit transaction page with the transaction data
    router.push({
      pathname: '/edit-ocr-transaction',
      params: { 
        transaction: JSON.stringify(transaction),
        index: index.toString()
      }
    });
  };

  const handleConfirm = async () => {
    try {
      // Log all transactions
      for (const transaction of processedTransactions) {
        await logTransaction(
          transaction.name,
          transaction.accountId,
          transaction.categoryId,
          transaction.amount,
          transaction.type === 'income',
          transaction.note,
          transaction.date
        );
      }
      
      // Navigate back after successful logging
      router.push('/home');
    } catch (error) {
      console.error('Error logging transactions:', error);
      setErrorMessage('An error occurred while logging the transactions.');
      setErrorModalVisible(true);
    }
  };

  const handleErrorModalClose = () => {
    setErrorModalVisible(false);
    router.back();
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 h-full">
        <View className="flex-1 items-center justify-center bg-white dark:bg-black">
          <Text className="text-gray-800 dark:text-white">Loading transactions...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 h-full">
      <View className="flex-1 px-4 pt-12 bg-white dark:bg-black">
        <TouchableOpacity onPress={() => router.back()} className="absolute top-5 left-4 p-2 bg-gray-300 rounded-full">
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        
        <Text className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Confirm Transactions</Text>

        <ScrollView className="flex-1">
          {processedTransactions.map((transaction, index) => (
            <View key={index} className="mb-4 p-4 border border-gray-200 dark:border-gray-700 rounded-xl">
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-lg font-semibold text-gray-800 dark:text-white">
                  {transaction.name}
                </Text>
                <TouchableOpacity
                  onPress={() => handleEdit(index)}
                  className="bg-blue-600 px-3 py-1 rounded-lg"
                >
                  <Text className="text-white">Edit</Text>
                </TouchableOpacity>
              </View>
              
              <Text className="text-gray-600 dark:text-gray-400 mb-1">
                Amount: ${transaction.amount.toFixed(2)}
              </Text>
              <Text className="text-gray-600 dark:text-gray-400 mb-1">
                Type: {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
              </Text>
              <Text className="text-gray-600 dark:text-gray-400 mb-1">
                Account: {transaction.accountName}
              </Text>
              <Text className="text-gray-600 dark:text-gray-400 mb-1">
                Category: {transaction.categoryName}
              </Text>
              <Text className="text-gray-600 dark:text-gray-400 mb-1">
                Date: {new Date(transaction.date).toLocaleDateString()}
              </Text>
              {transaction.note && (
                <Text className="text-gray-600 dark:text-gray-400">
                  Note: {transaction.note}
                </Text>
              )}
            </View>
          ))}
        </ScrollView>

        <TouchableOpacity
          onPress={handleConfirm}
          className="flex-row items-center justify-center bg-green-600 py-4 rounded-xl mb-6"
        >
          <Ionicons name="checkmark-circle" size={20} color="white" />
          <Text className="text-white text-base font-semibold ml-2">Confirm All Transactions</Text>
        </TouchableOpacity>
      </View>

      <ErrorModal
        visible={errorModalVisible}
        onClose={handleErrorModalClose}
        message={errorMessage}
        title="Transaction Error"
      />
    </SafeAreaView>
  );
};

export default ReceiptLogConfirmation; 