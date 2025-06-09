import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getCurrentUser, getTransactions } from '../../lib/appwrite'; // Assuming you have a function to fetch transactions

interface Account {
  $id: string;  // The account ID
  name: string;
  balance: number;
}

interface Category {
  $id: string;  // The category ID
  name: string;
  icon: string;
  color: string;
}

interface User {
  $id: string;  // The user ID
  avatar: string;
  email: string;
  username: string;
}

interface Transaction {
  $id: string;  // The transaction ID
  name: string;
  account_id: Account;  // Account details associated with the transaction
  amount: number;  // The transaction amount
  category_id: Category;  // The category of the transaction
  is_income: boolean;  // Whether it's an income or expense
  note: string;  // Any notes associated with the transaction
  transaction_date: string;  // The date of the transaction
  user_id: User;  // The user associated with the transaction
}

interface TransactionGroup {
  date: string;
  total: number;
  transactions: Transaction[];
}

const Transaction = () => {
  const isFocused = useIsFocused();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [transactionsGroupedByDate, setTransactionsGroupedByDate] = useState<TransactionGroup[]>([]);
  const [userID, setUserID] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const formatDateHeader = (dateStr: string) => {
    const d = new Date(dateStr);
    const day = d.getDate();
    const weekday = d.toLocaleString('default', { weekday: 'long' });
    const month = d.toLocaleString('default', { month: 'long' });
    const year = d.getFullYear();
    return { day, month, year, weekday };
  };

  const changeMonth = (increment: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + increment);
  
    // Prevent future months
    if (newDate > new Date()) {
      alert("You cannot select a future month.");
      return;
    }
  
    setCurrentDate(newDate);
  };

  const fetchUserID = async () => {
    try {
      const user = await getCurrentUser();
      if (user) {
        setUserID(user.$id); // Set the user ID
      }
    } catch (error) {
      console.error('Error fetching user ID:', error);
    }
  };

  // Function to fetch transactions
  const fetchTransactions = async (forceRefresh = false) => {
    try {
      if (userID) {
        console.log('Transaction: Fetching transactions for user:', userID, 'forceRefresh:', forceRefresh);
        const allTransactions = await getTransactions(userID, forceRefresh); // Fetch all transactions for the user
        setTransactions(allTransactions); // Store all transactions
        console.log('Transaction: Transactions fetched:', allTransactions.length);
      }
    } catch (error) {
      console.error('Transaction: Error fetching transactions:', error);
    }
  };

  // Manual refresh function
  const manualRefresh = async () => {
    if (!userID) return;
    
    setIsRefreshing(true);
    console.log('Transaction: Manual refresh triggered with force=true');
    
    try {
      await fetchTransactions(true); // Force refresh
      console.log('Transaction: Manual refresh completed');
    } catch (error) {
      console.error('Transaction: Manual refresh failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Function to filter transactions by selected month
  const filterTransactionsByMonth = (allTransactions: Transaction[], date: Date): Transaction[] => {
    const month = date.getMonth();
    const year = date.getFullYear();
    
    return allTransactions.filter(transaction => {
      const txDate = new Date(transaction.transaction_date);
      return txDate.getMonth() === month && txDate.getFullYear() === year;
    });
  };

  // Function to group transactions by date
  const groupTransactionsByDate = (transactions: Transaction[]): TransactionGroup[] => {
    const grouped: { [key: string]: TransactionGroup } = {};

    transactions.forEach((transaction) => {
      const date = transaction.transaction_date.split('T')[0]; // Get date without time (ISO format)
      if (!grouped[date]) {
        grouped[date] = { date, total: 0, transactions: [] };
      }
      grouped[date].transactions.push(transaction);
      grouped[date].total += transaction.is_income ? transaction.amount : -transaction.amount;
    });

    return Object.values(grouped).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  useEffect(() => {
    fetchUserID(); // Fetch user ID when the component mounts
  }, []);

  useEffect(() => {
    if (userID) {
      fetchTransactions(); // Fetch transactions after userID is available
    }
  }, [userID]);

  useEffect(() => {
    const filtered = filterTransactionsByMonth(transactions, currentDate);
    const grouped = groupTransactionsByDate(filtered);
    setTransactionsGroupedByDate(grouped);
  }, [transactions, currentDate]);

  // Use useIsFocused to trigger refresh when screen becomes active
  useEffect(() => {
    if (isFocused && userID) {
      console.log('Transaction: Screen is focused, triggering refresh...');
      manualRefresh();
    }
  }, [isFocused, userID]);

  // Backup useFocusEffect
  useFocusEffect(
    useCallback(() => {
      console.log('Transaction: useFocusEffect triggered');
      if (userID) {
        const refreshData = async () => {
          try {
            await fetchTransactions(true);
            console.log('Transaction: useFocusEffect refresh completed');
          } catch (error) {
            console.error('Transaction: useFocusEffect refresh error:', error);
          }
        };
        
        refreshData();
      }
    }, [userID])
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="flex-row justify-between items-center px-4 pt-4 my-5">
          <Text className="text-2xl font-bold">Transaction</Text>
          <View className="flex-row items-center space-x-2">
            <TouchableOpacity onPress={manualRefresh} disabled={isRefreshing}>
              <Ionicons 
                name="refresh-outline" 
                size={24} 
                color={isRefreshing ? "#9CA3AF" : "#3B82F6"} 
              />
            </TouchableOpacity>
            <TouchableOpacity>
              <Ionicons name="settings-outline" size={24} color="#000" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Month Selector */}
        <View className="flex-row justify-between items-center px-4 my-6">
          <View className="flex-row items-center">
            <Ionicons name="calendar-outline" size={20} color="#000" />
            <Text className="text-lg ml-2">{currentDate.toLocaleString('default', { month: 'long' })} {currentDate.getFullYear()}</Text>
          </View>
          <View className="flex-row items-center">
            <TouchableOpacity className="mr-4" onPress={() => changeMonth(-1)}>
              <Ionicons name="chevron-back" size={24} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => changeMonth(1)}>
              <Ionicons name="chevron-forward" size={24} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity className="ml-4">
              <Ionicons name="menu" size={24} color="#000" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Render Transactions */}
        {transactionsGroupedByDate.length > 0 ? (
          transactionsGroupedByDate.map((group, index) => {
            const { day, month, year, weekday } = formatDateHeader(group.date);
            return (
              <View key={index} className="mb-6 px-3">
                {/* Date Header */}
                <View className="flex-row justify-between items-center border-b border-gray-200 pb-1 mb-3">
                  <View>
                    <View className='flex-row items-center'>
                      <View className='w-10 h-10 items-center justify-center mr-2'>
                        <Text className="font-bold text-2xl">{day}</Text>
                      </View>
                      <View className='flex-col items-start'>
                        <Text className="text-xs text-black font-semibold">{month} {year}</Text>
                        <Text className="text-xs text-black font-semibold">{weekday}</Text>
                      </View>
                    </View>
                  </View>
                  <View className='mr-3'>
                    <Text className={`text-base font-bold ${group.total >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {group.total >= 0 ? '+' : '-'}
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Math.abs(group.total)).replace('₫', 'VNĐ')}
                    </Text>
                  </View>
                </View>

                {/* Transactions */}
                <View className="space-y-3">
                  {group.transactions.map((item, idx) => (
                    <View key={idx} className="flex-row justify-between items-center bg-gray-50 p-3 rounded-lg">
                      <View className="flex-row items-center">
                        {/* Category icon */}
                        <View
                          style={{ backgroundColor: item.category_id.color }}
                          className="w-10 h-10 rounded-full items-center justify-center"
                        >
                          <Ionicons
                            name={item.category_id.icon as any}
                            size={20}
                            color="white"
                          />
                        </View>
                        <View className="ml-3">
                          <Text className="font-medium">{item.name}</Text>
                          <View className="flex-row items-center mt-1">
                            <Ionicons name="list-circle-outline" size={14} color="#22C55E" />
                            <Text className="text-xs text-gray-600 ml-1">{item.account_id.name}</Text>
                          </View>
                        </View>
                      </View>
                      <View className="items-end">
                      <Text className={`font-bold text-base ${item.is_income ? 'text-green-500' : 'text-red-500'}`}>
                        {item.is_income ? '+' : '-'}
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.amount).replace('₫', 'VNĐ')}
                      </Text>
                        <Text className="text-xs text-gray-400 mt-1">{item.transaction_date.split('T')[0]}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            );
          })
        ) : (
          <View className="flex-1 items-center justify-center p-4">
            <Text className="text-gray-500 text-lg">No transactions for this month.</Text>
          </View>
        )}
      </ScrollView>
      <TouchableOpacity
        onPress={() => router.push('/add-transaction')}
        className="absolute bottom-6 right-6 bg-blue-600 p-4 rounded-full shadow-xl"
      >
        <Ionicons name="add" size={28} color="white" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default Transaction;