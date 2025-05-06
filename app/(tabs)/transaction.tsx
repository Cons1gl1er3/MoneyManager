import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface Transaction {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  title: string;
  amount: number;
  isExpense: boolean;
  method: string;
  date: string; // ISO string
}

interface TransactionGroup {
  date: string;
  total: number;
  transactions: Transaction[];
}

const transactionsGroupedByDate: TransactionGroup[] = [
  {
    date: "2025-04-08",
    total: -250,
    transactions: [
      {
        icon: 'medical-outline',
        color: '#8B5CF6',
        title: 'Health',
        amount: 250,
        isExpense: true,
        method: 'Cash',
        date: '2023-11-16',
      },
    ],
  },
  {
    date: "2025-04-07",
    total: 4770,
    transactions: [
      {
        icon: 'call-outline',
        color: '#EC4899',
        title: 'Entertainment',
        amount: 500,
        isExpense: true,
        method: 'Cash',
        date: '2023-11-15',
      },
      {
        icon: 'game-controller-outline',
        color: '#3B82F6',
        title: 'Leisure',
        amount: 580,
        isExpense: true,
        method: 'Cash',
        date: '2023-11-15',
      },
      {
        icon: 'wallet-outline',
        color: '#22C55E',
        title: 'Savings',
        amount: 6500,
        isExpense: false,
        method: 'Cash',
        date: '2023-11-15',
      },
      {
        icon: 'shirt-outline',
        color: '#F87171',
        title: 'Clothing',
        amount: 650,
        isExpense: true,
        method: 'Cash',
        date: '2023-11-15',
      },
    ],
  },
];

const Transaction = () => {
  const [currentDate, setCurrentDate] = useState(new Date());

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
    // Fetch data for the new month from your database here
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="flex-row justify-between items-center px-4 pt-4 my-5">
          <Text className="text-2xl font-bold">Transaction</Text>
          <TouchableOpacity>
            <Ionicons name="settings-outline" size={24} color="#000" />
          </TouchableOpacity>
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

        {transactionsGroupedByDate.map((group, index) => {
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
                    {group.total >= 0 ? '+' : '-'}€{Math.abs(group.total).toFixed(1)}
                  </Text>
                </View>
              </View>

              {/* Transactions */}
              <View className="space-y-3">
                {group.transactions.map((item, idx) => (
                  <View key={idx} className="flex-row justify-between items-center bg-gray-50 p-3 rounded-lg">
                    <View className="flex-row items-center">
                      <View style={{ backgroundColor: item.color }} className="w-10 h-10 rounded-full items-center justify-center">
                        <Ionicons name={item.icon} size={20} color="white" />
                      </View>
                      <View className="ml-3">
                        <Text className="font-medium">{item.title}</Text>
                        <View className="flex-row items-center mt-1">
                          <Ionicons name="cash-outline" size={14} color="#22C55E" />
                          <Text className="text-xs text-green-500 ml-1">{item.method}</Text>
                        </View>
                      </View>
                    </View>
                    <View className="items-end">
                      <Text className={`font-bold text-base ${item.isExpense ? 'text-red-500' : 'text-green-500'}`}>
                        {item.isExpense ? '-' : '+'}€{item.amount.toFixed(1)}
                      </Text>
                      <Text className="text-xs text-gray-400 mt-1">{item.date}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
};

export default Transaction;