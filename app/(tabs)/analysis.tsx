import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Dimensions, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getCurrentUser, getTransactions } from '../../lib/appwrite';

interface Transaction {
  $id: string;
  amount: number;
  is_income: boolean;
  transaction_date: string;
  category_id: {
    name: string;
    color: string;
  };
}

const screenWidth = Dimensions.get("window").width;

const Analysis = () => {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [monthlyStats, setMonthlyStats] = useState({
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
    averages: {
      daily: { income: 0, expense: 0 },
      weekly: { income: 0, expense: 0 },
      monthly: { income: 0, expense: 0 }
    }
  });

  const changeMonth = (amount: number) => {
    const updated = new Date(selectedMonth);
    updated.setMonth(updated.getMonth() + amount);

    if (updated > new Date()) {
      alert("You cannot select a future month.");
      return;
    }

    setSelectedMonth(updated);
  };

  // Fetch transactions for the current user
  const fetchTransactions = async () => {
    try {
      const user = await getCurrentUser();
      if (user) {
        const allTransactions = await getTransactions(user.$id);
        setTransactions(allTransactions);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  // Filter transactions for selected month
  const filterTransactionsByMonth = (allTransactions: Transaction[], date: Date): Transaction[] => {
    const month = date.getMonth();
    const year = date.getFullYear();
    
    return allTransactions.filter(transaction => {
      const txDate = new Date(transaction.transaction_date);
      return txDate.getMonth() === month && txDate.getFullYear() === year;
    });
  };

  // Calculate monthly statistics
  const calculateMonthlyStats = (monthTransactions: Transaction[]) => {
    const stats = {
      totalIncome: 0,
      totalExpense: 0,
      balance: 0,
      averages: {
        daily: { income: 0, expense: 0 },
        weekly: { income: 0, expense: 0 },
        monthly: { income: 0, expense: 0 }
      }
    };

    // Calculate totals
    monthTransactions.forEach(tx => {
      if (tx.is_income) {
        stats.totalIncome += tx.amount;
      } else {
        stats.totalExpense += tx.amount;
      }
    });

    stats.balance = stats.totalIncome - stats.totalExpense;

    // Calculate averages
    const daysInMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0).getDate();
    const weeksInMonth = daysInMonth / 7;

    stats.averages.daily.income = stats.totalIncome / daysInMonth;
    stats.averages.daily.expense = stats.totalExpense / daysInMonth;
    stats.averages.weekly.income = stats.totalIncome / weeksInMonth;
    stats.averages.weekly.expense = stats.totalExpense / weeksInMonth;
    stats.averages.monthly.income = stats.totalIncome;
    stats.averages.monthly.expense = stats.totalExpense;

    setMonthlyStats(stats);
  };

  // Fetch transactions when component mounts
  useEffect(() => {
    fetchTransactions();
  }, []);

  // Recalculate stats when month changes or transactions update
  useEffect(() => {
    const monthTransactions = filterTransactionsByMonth(transactions, selectedMonth);
    calculateMonthlyStats(monthTransactions);
  }, [selectedMonth, transactions]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { 
      style: 'currency', 
      currency: 'VND' 
    }).format(amount).replace('₫', 'VNĐ');
  };

  const chartData = {
    labels: ["1", "5", "10", "15", "20", "25", "30"],
    datasets: [
      {
        data: [120, 450, 300, 800, 650, 400, 900],
        color: () => "#4F46E5",
        strokeWidth: 2,
      },
    ],
    legend: ["Spending"],
  };

  const pieData = [
    { name: "Food", amount: 500, color: "#4F46E5", legendFontColor: "#7F7F7F", legendFontSize: 12 },
    { name: "Shopping", amount: 300, color: "#EC4899", legendFontColor: "#7F7F7F", legendFontSize: 12 },
    { name: "Bills", amount: 250, color: "#6366F1", legendFontColor: "#7F7F7F", legendFontSize: 12 },
    { name: "Others", amount: 150, color: "#9333EA", legendFontColor: "#7F7F7F", legendFontSize: 12 },
  ];

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="flex-row justify-between items-center px-4 pt-4 my-5">
          <Text className="text-2xl font-bold">Analysis</Text>
          <TouchableOpacity>
            <Ionicons name="settings-outline" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        {/* Month Selector */}
        <View className="flex-row justify-between items-center px-4 my-6">
          <View className="flex-row items-center">
            <Ionicons name="calendar-outline" size={20} color="#000" />
            <Text className="text-lg ml-2">
              {selectedMonth.toLocaleString("default", { month: "long" })} {selectedMonth.getFullYear()}
            </Text>
          </View>
          <View className="flex-row items-center">
            <TouchableOpacity className="mr-4" onPress={() => changeMonth(-1)}>
              <Ionicons name="chevron-back" size={24} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => changeMonth(1)}>
              <Ionicons name="chevron-forward" size={24} color="#000" />
            </TouchableOpacity>
          </View>
        </View>

        <View className="px-4">
          <Text className="text-xl font-bold mb-2">Spending Over Time</Text>
          {/* Line Chart Section
          <LineChart
            data={chartData}
            width={screenWidth - 32}
            height={220}
            chartConfig={{
              backgroundColor: "#ffffff",
              backgroundGradientFrom: "#ffffff",
              backgroundGradientTo: "#ffffff",
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(79, 70, 229, ${opacity})`,
              labelColor: () => "#6B7280",
              propsForDots: {
                r: "4",
                strokeWidth: "2",
                stroke: "#4F46E5",
              },
            }}
            bezier
            style={{ borderRadius: 12 }}
          />
        */}
        </View>

        <View className="px-4 space-y-4">
          {/* Summary Block */}
          <View className="bg-gray-50 rounded-lg p-6 mx-2">
            <Text className="font-semibold mb-3 text-xl">Summary</Text>
            <View className="flex-row justify-between items-center mb-2">
              <View className="flex-row items-center space-x-1">
                <Ionicons name="arrow-up-circle" size={16} color="#EF4444" />
                <Text className="text-sm text-gray-700 ml-1">Spending</Text>
              </View>
              <Text className="text-sm text-red-500 font-semibold">{formatCurrency(monthlyStats.totalExpense)}</Text>
            </View>
            <View className="flex-row justify-between items-center mb-2">
              <View className="flex-row items-center space-x-1">
                <Ionicons name="arrow-down-circle" size={16} color="#22C55E" />
                <Text className="text-sm text-gray-700 ml-1">Income</Text>
              </View>
              <Text className="text-sm text-green-500 font-semibold">{formatCurrency(monthlyStats.totalIncome)}</Text>
            </View>
            <View className="border-t border-gray-300 my-2" />
            <View className="flex-row justify-between items-center">
              <Text className="text-base font-semibold">Balance</Text>
              <Text className={`text-base font-bold ${monthlyStats.balance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {formatCurrency(monthlyStats.balance)}
              </Text>
            </View>
          </View>
          
          {/* Average Block */}
          <View className="bg-gray-50 rounded-lg p-6 mx-2 my-6">
            <Text className="text-base font-semibold mb-3">Average</Text>
            {/* Daily */}
            <View className="flex-row justify-between mb-1">
              <Text className="text-sm text-gray-600">Day</Text>
              <View className="flex-row space-x-4">
                <View className='w-32 items-end'>
                  <Text className="text-sm text-green-500 font-semibold">{formatCurrency(monthlyStats.averages.daily.income)}</Text>
                </View>
                <View className='w-32 items-end'>
                  <Text className="text-sm text-red-500 font-semibold">{formatCurrency(monthlyStats.averages.daily.expense)}</Text>
                </View>
              </View>
            </View>
            {/* Weekly */}
            <View className="flex-row justify-between mb-1">
              <Text className="text-sm text-gray-600">Week</Text>
              <View className="flex-row space-x-4">
                <View className='w-32 items-end'>
                  <Text className="text-sm text-green-500 font-semibold">{formatCurrency(monthlyStats.averages.weekly.income)}</Text>
                </View>
                <View className='w-32 items-end'>
                  <Text className="text-sm text-red-500 font-semibold">{formatCurrency(monthlyStats.averages.weekly.expense)}</Text>
                </View>
              </View>
            </View>
            {/* Monthly */}
            <View className="flex-row justify-between mb-1">
              <Text className="text-sm text-gray-600">Month</Text>
              <View className="flex-row space-x-4">
                <View className='w-32 items-end'>
                  <Text className="text-sm text-green-500 font-semibold">{formatCurrency(monthlyStats.averages.monthly.income)}</Text>
                </View>
                <View className='w-32 items-end'>
                  <Text className="text-sm text-red-500 font-semibold">{formatCurrency(monthlyStats.averages.monthly.expense)}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Analysis;