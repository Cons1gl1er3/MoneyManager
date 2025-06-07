import { Ionicons } from '@expo/vector-icons';
import { Ionicons as IconType } from '@expo/vector-icons/build/Icons';
import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// import { PieChart } from 'react-native-chart-kit';
import { Link, useFocusEffect, useRouter } from 'expo-router';
import CustomButton from '../../components/CustomButton';
// import PieChartComponent from '../../components/PieChart';
import { useGlobalContext } from '../../context/GlobalProvider';
import { getCurrentUser, getTransactions, getUserAccounts, logout } from '../../lib/appwrite';

interface NavButtonProps {
  icon: keyof typeof IconType.glyphMap;
  label: string;
  isActive: boolean;
}

const NavButton = ({ icon, label, isActive }: NavButtonProps) => (
  <TouchableOpacity className="items-center">
    <Ionicons 
      name={icon} 
      size={24} 
      color={isActive ? "#6366F1" : "#6B7280"} 
    />
    <Text className={`text-xs mt-1 ${isActive ? 'text-indigo-600' : 'text-gray-500'}`}>
      {label}
    </Text>
  </TouchableOpacity>
);

interface CategoryItemProps {
  icon: keyof typeof IconType.glyphMap;
  color: string;
  title: string;
  amount: string;
}

interface TransactionItemProps {
  icon: keyof typeof IconType.glyphMap;
  color: string;
  title: string;
  amount: string;
  isExpense: boolean;
}

interface Account {
  $id: string;
  name: string;
  balance: number;
}

interface Category {
  $id: string;
  name: string;
  icon: string;
  color: string;
}

interface User {
  $id: string;
  avatar: string;
  email: string;
  username: string;
}

interface Transaction {
  $id: string;
  name: string;
  account_id: Account;
  amount: number;
  category_id: Category;
  is_income: boolean;
  note: string;
  transaction_date: string;
  user_id: User;
}

const CategoryItem = ({ icon, color, title, amount }: CategoryItemProps) => (
  <View className="flex-row justify-between items-center">
    <View className="flex-row items-center">
      <View style={{ backgroundColor: color }} className="w-8 h-8 rounded-full items-center justify-center">
        <Ionicons name={icon} size={16} color="white" />
      </View>
      <Text className="ml-2 font-medium">{title}</Text>
    </View>
    <Text className="font-bold">€{amount}</Text>
  </View>
);

const TransactionItem = ({ icon, color, title, amount, isExpense }: TransactionItemProps) => (
  <View className="flex-row justify-between items-center bg-gray-50 p-4 rounded-lg">
    <View className="flex-row items-center">
      <View style={{ backgroundColor: color }} className="w-10 h-10 rounded-full items-center justify-center">
        <Ionicons name={icon} size={20} color="white" />
      </View>
      <Text className="ml-3 font-medium">{title}</Text>
    </View>
    <Text className={`font-bold ${isExpense ? 'text-red-500' : 'text-green-500'}`}>
      {isExpense ? '-' : '+'}€{amount}
    </Text>
  </View>
);

const Home = () => {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [incomeTotal, setIncomeTotal] = useState(0);
  const [expenseTotal, setExpenseTotal] = useState(0);
  const { darkMode, toggleDarkMode, logoutUser } = useGlobalContext();
  const [userID, setUserID] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);

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

  const categoryData = [
    { name: 'Clothing', amount: 650.0, color: '#9333EA', icon: 'shirt-outline', legendFontColor: '#7F7F7F' },
    { name: 'Leisure', amount: 580.0, color: '#4F46E5', icon: 'game-controller-outline', legendFontColor: '#7F7F7F' },
    { name: 'Entertainment', amount: 500.0, color: '#EC4899', icon: 'film-outline', legendFontColor: '#7F7F7F' },
    { name: 'Health', amount: 250.0, color: '#6366F1', icon: 'medical-outline', legendFontColor: '#7F7F7F' },
  ];

  const fetchUserID = async () => {
    try {
      const user = await getCurrentUser();
      if (user) {
        setUserID(user.$id);
      }
    } catch (error) {
      console.error('Error fetching user ID:', error);
    }
  };

  const fetchTransactions = async () => {
    try {
      if (userID) {
        const allTransactions = await getTransactions(userID);
        setTransactions(allTransactions);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const filterTransactionsByMonth = (allTransactions: Transaction[], date: Date): Transaction[] => {
    const month = date.getMonth();
    const year = date.getFullYear();

    return allTransactions.filter(transaction => {
      const txDate = new Date(transaction.transaction_date);
      return txDate.getMonth() === month && txDate.getFullYear() === year;
    });
  };

  const calculateTotals = (filteredTransactions: Transaction[]) => {
    const income = filteredTransactions
      .filter(tx => tx.is_income)
      .reduce((sum, tx) => sum + tx.amount, 0);
    const expense = filteredTransactions
      .filter(tx => !tx.is_income)
      .reduce((sum, tx) => sum + tx.amount, 0);
    setIncomeTotal(income);
    setExpenseTotal(expense);
  };

  const formatVND = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    })
      .format(amount)
      .replace('₫', 'VNĐ');
  };

  const fetchAccounts = async () => {
    try {
      if (userID) {
        const userAccounts = await getUserAccounts();
        setAccounts(userAccounts);
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
    }
  };

  // Map account names to icons
  const getAccountIcon = (name: string): string => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('wallet')) return 'wallet-outline';
    if (lowerName.includes('cash')) return 'cash-outline';
    if (lowerName.includes('card') || lowerName.includes('credit')) return 'card-outline';
    if (lowerName.includes('savings')) return 'piggy-bank-outline';
    if (lowerName.includes('checking')) return 'bank-outline';
    return 'wallet-outline'; // Default icon
  };

  useEffect(() => {
    fetchUserID();
  }, []);

  useEffect(() => {
    if (userID) {
      fetchTransactions();
    }
  }, [userID]);

  useEffect(() => {
    const filtered = filterTransactionsByMonth(transactions, currentDate);
    calculateTotals(filtered);
  }, [transactions, currentDate]);

  useFocusEffect(
    useCallback(() => {
      if (userID) {
        fetchTransactions();
        fetchAccounts();
      }
    }, [userID])
  );

  // Format the data for the pie chart
  const chartData = categoryData.map(item => ({
    name: item.name,
    population: item.amount, // 'population' is the value field in react-native-chart-kit
    color: item.color,
    legendFontColor: item.legendFontColor,
    legendFontSize: 12,
  }));

  const handleLogout = async () => {
    try {
      await logout(); 
      logoutUser();   
  
      router.replace('/sign-in');
    } catch (err) {
      console.warn('Logout failed:', err);
    }
  };

  return (
    <SafeAreaView className={`flex-1 ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="flex-row justify-between items-center px-4 pt-4 my-5">
          <Text className="text-2xl font-bold ">Home</Text>
          <TouchableOpacity onPress={toggleDarkMode}>
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

        {/* Income & Spending Cards */}
        <View className="flex-row px-4 mt-4 space-x-4">
          <View className="flex-1 bg-green-50 p-4 rounded-lg mr-3">
            <Text className="text-lg font-medium">Income</Text>
            <Text className="text-md font-bold mt-1">{formatVND(incomeTotal)}</Text>
          </View>
          <View className="flex-1 bg-red-50 p-4 rounded-lg ml-3">
            <Text className="text-lg font-medium">Spending</Text>
            <Text className="text-md font-bold mt-1">{formatVND(expenseTotal)}</Text>
          </View>
        </View>

        {/* Account Section */}
        <View className="mt-6 px-4">
          <View className="flex-row justify-between items-center">
            <Text className="text-xl font-bold">Account</Text>
            <TouchableOpacity onPress={() => router.push('/add-account')}>
              <Text className="text-blue-600">VIEW ALL</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-4">
            <View className="flex-row space-x-4">
              {accounts.length > 0 ? (
                accounts.map(account => (
                  <View key={account.$id} className="w-40 bg-green-50 p-4 rounded-lg mr-5">
                    <View className="flex-row justify-between items-center">
                      <Text className="text-lg font-medium">{account.name}</Text>
                      <Ionicons name={getAccountIcon(account.name)} size={24} color="#000" />
                    </View>
                    <Text className="text-xl font-bold mt-2 text-green-600">
                      {formatVND(account.balance)}
                    </Text>
                  </View>
                ))
              ) : (
                <Text className="text-gray-500 text-lg">No accounts found.</Text>
              )}
            </View>
          </ScrollView>
        </View>

        {/* Categories Section */}
        <View className="mt-6 px-4 h-60">
          <Text className="text-xl font-bold">Categories</Text>
          <View className="flex-row mt-4 h-48">
            <View className="w-1/2 items-center justify-center">
              {/* <PieChartComponent
                data={chartData}
                width={150}
                height={150}
                accessor="population"
                absolute
                center={[30, 0]}
                showLegend={false}
              /> */}
              <Text className="mt-1 font-bold pr-5">€1980.0</Text>
            </View>
            <View className="w-1/2 justify-between py-4">
              {categoryData.map((item, index) => (
                <CategoryItem 
                  key={index} 
                  icon={item.icon as keyof typeof IconType.glyphMap} 
                  color={item.color} 
                  title={item.name} 
                  amount={item.amount.toString()} 
                />
              ))}
            </View>
          </View>
        </View>

        {/* Budget Section */}
        <View className="mt-6 px-4">
          <View className="flex-row justify-between items-center">
            <Text className="text-xl font-bold">Budgets</Text>
            <TouchableOpacity>
              <Text className="text-blue-600">VIEW ALL</Text>
            </TouchableOpacity>
          </View>
          
          <View className="mt-4 bg-green-50 p-4 rounded-lg">
            <View className="flex-row justify-between items-center">
              <Text className="text-lg font-medium">November Budget</Text>
              <Text className="text-xl font-bold">€1980.0</Text>
            </View>
            <View className="mt-2">
              <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <View className="h-full w-4/5 bg-orange-400" />
              </View>
              <Text className="text-sm text-gray-600 mt-1">€1980.0 of €2500.0</Text>
              <Text className="text-sm text-gray-600">79.20 %</Text>
            </View>
          </View>
        </View>

        {/* Transaction Section */}
        <View className="mt-6 px-4 pb-20">
          <Text className="text-xl font-bold">Transaction</Text>
          <View className="mt-4 space-y-4">
            <TransactionItem
              icon="medical-outline"
              color="#6366F1"
              title="Health"
              amount="250.0"
              isExpense
            />
            {/* Add more transactions as needed */}
          </View>
        </View>

        <View>
          {/* Other components */}
          <CustomButton 
            title="Logout" 
            handlePress={handleLogout} 
            containerStyles="mt-4"
            textStyles=""
            isLoading={false}
          />
        </View>
        <Link href="/scan" asChild>
          <TouchableOpacity className="bg-green-600 px-4 py-2 rounded-xl shadow mt-4">
            <Text className="text-white text-base font-semibold text-center">📸 Scan Receipt</Text>
          </TouchableOpacity>
        </Link>
        <Link href="/chatbot" asChild>
          <TouchableOpacity className="bg-blue-600 px-4 py-2 rounded-xl shadow mt-4">
            <Text className="text-white text-base font-semibold text-center">💬 Ask Assistant</Text>
          </TouchableOpacity>
        </Link>
      </ScrollView>
      <TouchableOpacity
          onPress={() => router.push('/add-transaction')} // Make sure this screen exists
          className="absolute bottom-6 right-6 bg-blue-600 p-4 rounded-full shadow-xl"
        >
          <Ionicons name="add" size={28} color="white" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default Home;