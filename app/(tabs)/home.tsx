import { Ionicons } from '@expo/vector-icons';
import { Ionicons as IconType } from '@expo/vector-icons/build/Icons';
import React, { useCallback, useEffect, useState } from 'react';
import { Animated, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// import { PieChart } from 'react-native-chart-kit';
import { useIsFocused } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import { useFocusEffect, useRouter } from 'expo-router';
import BarChartComponent from '../../components/BarChart';
import CustomButton from '../../components/CustomButton';
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

interface MonthlyData {
  month: string;
  income: number;
  expense: number;
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

const Home: React.FC = () => {
  const router = useRouter();
  const isFocused = useIsFocused();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [incomeTotal, setIncomeTotal] = useState(0);
  const [expenseTotal, setExpenseTotal] = useState(0);
  const { darkMode, toggleDarkMode, logoutUser } = useGlobalContext();
  const [userID, setUserID] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [animation] = useState(new Animated.Value(0));
  const insets = useSafeAreaInsets();

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
      if (!user) {
        console.log('No user found, redirecting to sign in...');
        router.replace('/sign-in');
        return;
      }
      setUserID(user.$id);
    } catch (error) {
      console.error('Error fetching user:', error);
      router.replace('/sign-in');
    }
  };

  const fetchTransactions = async (forceRefresh = false) => {
    try {
      if (!userID) {
        console.log('No user ID available, skipping transaction fetch');
        return;
      }
      const allTransactions = await getTransactions(userID);
      setTransactions(allTransactions);
    } catch (error) {
      console.error('Home: Error fetching transactions:', error);
      setTransactions([]); // Set empty array on error
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
      if (!userID) {
        console.log('No user ID available, skipping account fetch');
        return;
      }
      console.log('Home: Fetching accounts...');
      const userAccounts = await getUserAccounts();
      setAccounts(userAccounts);
    } catch (error) {
      console.error('Home: Error fetching accounts:', error);
      setAccounts([]); // Set empty array on error
    }
  };

  // Map account names to icons
  const getAccountIcon = (name: string): keyof typeof IconType.glyphMap => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('wallet')) return 'wallet-outline';
    if (lowerName.includes('cash')) return 'cash-outline';
    if (lowerName.includes('card') || lowerName.includes('credit')) return 'card-outline';
    if (lowerName.includes('savings')) return 'card-outline'; // piggy-bank-outline doesn't exist, use card-outline
    if (lowerName.includes('checking')) return 'business-outline'; // bank-outline doesn't exist, use business-outline
    return 'wallet-outline'; // Default icon
  };

  const calculateMonthlyData = (allTransactions: Transaction[]): MonthlyData[] => {
    const currentDate = new Date();
    const monthlyStats: { [key: string]: { income: number; expense: number } } = {};

    // Lấy dữ liệu 6 tháng gần nhất
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
      const monthLabel = date.toLocaleDateString('en-US', { month: 'short' });
      
      monthlyStats[monthKey] = { income: 0, expense: 0 };
      
      // Filter transactions cho tháng này
      const monthTransactions = allTransactions.filter(transaction => {
        const txDate = new Date(transaction.transaction_date);
        return txDate.getFullYear() === date.getFullYear() && 
               txDate.getMonth() === date.getMonth();
      });

      // Tính tổng thu nhập và chi tiêu
      monthTransactions.forEach(transaction => {
        if (transaction.is_income) {
          monthlyStats[monthKey].income += transaction.amount;
        } else {
          monthlyStats[monthKey].expense += transaction.amount;
        }
      });
    }

    // Convert thành array cho chart
    return Object.entries(monthlyStats).map(([key, values]) => {
      const [year, month] = key.split('-');
      const date = new Date(parseInt(year), parseInt(month), 1);
      return {
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        income: values.income,
        expense: values.expense,
      };
    });
  };

  // Manual refresh function for testing
  const manualRefresh = async () => {
    if (!userID) return;
    
    setIsRefreshing(true);
    console.log('Manual refresh triggered with force=true');
    
    try {
      await fetchTransactions(true); // Force refresh
      await fetchAccounts();
      console.log('Manual refresh completed');
    } catch (error) {
      console.error('Manual refresh failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUserID();
  }, []);

  useEffect(() => {
    if (userID) {
      fetchTransactions();
      fetchAccounts();
    }
  }, [userID]);

  useEffect(() => {
    if (transactions.length > 0) {
      const monthly = calculateMonthlyData(transactions);
      setMonthlyData(monthly);
      
      const filtered = filterTransactionsByMonth(transactions, currentDate);
      calculateTotals(filtered);
    }
  }, [transactions, currentDate]);

  // Use useIsFocused to trigger refresh when screen becomes active
  useEffect(() => {
    if (isFocused && userID) {
      console.log('Screen is focused, triggering refresh...');
      manualRefresh();
    }
  }, [isFocused, userID]);

  // Keep the original useFocusEffect as backup
  useFocusEffect(
    useCallback(() => {
      console.log('Home: useFocusEffect triggered');
      if (userID) {
        const refreshData = async () => {
          try {
            await fetchTransactions(true);
            await fetchAccounts();
            console.log('Home: useFocusEffect refresh completed');
          } catch (error) {
            console.error('Home: useFocusEffect refresh error:', error);
          }
        };
        
        refreshData();
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

  // Get transactions for a specific account
  const getTransactionsByAccount = (accountId: string): Transaction[] => {
    const accountTransactions = transactions.filter(transaction => transaction.account_id.$id === accountId);
    return accountTransactions;
  };

  // Get recent transactions for an account (last 3)
  const getRecentTransactionsByAccount = (accountId: string): Transaction[] => {
    const accountTransactions = getTransactionsByAccount(accountId);
    const recentTransactions = accountTransactions
      .sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime())
      .slice(0, 3);
    return recentTransactions;
  };

  const toggleMenu = () => {
    const toValue = isMenuOpen ? 0 : 1;
    Animated.spring(animation, {
      toValue,
      friction: 5,
      useNativeDriver: true,
    }).start();
    setIsMenuOpen(!isMenuOpen);
  };

  const menuItems = [
    {
      title: 'Add Transaction',
      icon: 'add-circle' as const,
      route: '/add-transaction' as const,
    },
    {
      title: 'Scan Receipt',
      icon: 'scan' as const,
      route: '/scan' as const,
    },
    {
      title: 'Assistant',
      icon: 'chatbubble-ellipses' as const,
      route: '/chatbot' as const,
    },
  ];

  const renderMenuItems = () => {
    return menuItems.map((item, index) => {
      const translateY = animation.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -50 * (index + 1)], // Reduced spacing
      });

      const opacity = animation.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0, 0, 1],
      });

      return (
        <Animated.View
          key={item.title}
          style={[
            styles.menuItem,
            {
              transform: [{ translateY }],
              opacity,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => {
              setIsMenuOpen(false);
              router.push(item.route);
            }}
          >
            <Ionicons name={item.icon} size={24} color="white" />
            <Text style={styles.menuText}>{item.title}</Text>
          </TouchableOpacity>
        </Animated.View>
      );
    });
  };

  return (
    <View className="bg-gray-50 flex-1">
      {/* Header */}
      <View style={{ paddingTop: insets.top + 10, paddingHorizontal: 16, backgroundColor: '#F9FAFB' }}>
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-2xl font-bold">Home</Text>
          <TouchableOpacity onPress={toggleMenu}>
            <Ionicons name="settings-outline" size={24} color="black" />
          </TouchableOpacity>
        </View>

        {/* Month Navigator */}
        <View className="flex-row justify-between items-center mb-6">
          <TouchableOpacity onPress={() => changeMonth(-1)}>
            <Ionicons name="chevron-back" size={24} color="#4B5563" />
          </TouchableOpacity>
          <View className="flex-row items-center">
            <Ionicons name="calendar-outline" size={20} color="#4B5563" />
            <Text className="text-lg font-semibold ml-2">{currentDate.toLocaleString('default', { month: 'long' })} {currentDate.getFullYear()}</Text>
          </View>
          <TouchableOpacity onPress={() => changeMonth(1)}>
            <Ionicons name="chevron-forward" size={24} color="#4B5563" />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Main Content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        className="flex-1 px-4"
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      >
        {/* Income & Spending Cards */}
        <View className="flex-row justify-between items-center mb-6">
          <View className="flex-1 bg-green-50 p-4 rounded-lg mr-3">
            <Text className="text-lg font-medium">Income</Text>
            <Text className="text-md font-bold mt-1">{formatVND(incomeTotal)}</Text>
          </View>
          <View className="flex-1 bg-red-50 p-4 rounded-lg ml-3">
            <Text className="text-lg font-medium">Spending</Text>
            <Text className="text-md font-bold mt-1">{formatVND(expenseTotal)}</Text>
          </View>
        </View>

        {/* NEW: Monthly Trends Chart */}
        <View className="mt-6 px-4">
          <Text className="text-xl font-bold mb-4">Monthly Trends</Text>
          <BarChartComponent 
            data={monthlyData} 
            height={300}
            yAxisConfig={{
              showGrid: true,
              gridColor: '#e5e7eb',
              labelColor: '#374151',
              labelSize: 11,
              numberOfTicks: 6,
              showTitle: false,
              title: 'VND'
            }}
            xAxisConfig={{
              labelColor: '#374151',
              labelSize: 12,
              labelRotation: false,
              showTitle: false,
              title: 'Months',
              labelFormatter: (month) => month
            }}
            barWidth={16}
            barSpacing={3}
            showTooltip={true}
            currencySymbol="VNĐ"
          />
        </View>

        {/* Money Source Section */}
        <View className="mt-6 px-4">
          <View className="flex-row justify-between items-center">
            <Text className="text-xl font-bold">Money Source</Text>
            <TouchableOpacity onPress={() => router.push('/add-account')}>
              <Text className="text-green-600">CREATE</Text>
            </TouchableOpacity>
          </View>
          
          {accounts.length > 0 ? (
            <View className="mt-4 flex-row space-x-4">
              {accounts.slice(0, 2).map(account => {
                const recentTransactions = getRecentTransactionsByAccount(account.$id);
                const transactionCount = getTransactionsByAccount(account.$id).length;
                const isNegativeBalance = account.balance < 0;
                
                return (
                  <TouchableOpacity 
                    key={account.$id} 
                    className="flex-1 bg-green-50 p-4 rounded-lg"
                    onPress={() => {
                      // TODO: Navigate to account detail with transactions
                    }}
                  >
                    <View className="flex-row justify-between items-center mb-3">
                      <Text className="text-lg font-medium flex-1" numberOfLines={1}>
                        {account.name}
                      </Text>
                      <Ionicons name={getAccountIcon(account.name)} size={20} color="#000" />
                    </View>
                    
                    <Text className={`text-xl font-bold mb-2 ${isNegativeBalance ? 'text-red-500' : 'text-green-600'}`}>
                      {formatVND(account.balance)}
                    </Text>
                    
                    {/* Transaction count */}
                    <Text className="text-sm text-gray-500 mb-2">
                      {transactionCount} transaction{transactionCount !== 1 ? 's' : ''}
                    </Text>
                    
                    {/* Recent transactions */}
                    {recentTransactions.length > 0 && (
                      <View className="space-y-1">
                        <Text className="text-xs font-medium text-gray-600 mb-1">Recent:</Text>
                        {recentTransactions.slice(0, 2).map((transaction, index) => (
                          <View key={index} className="flex-row justify-between items-center">
                            <Text className="text-xs text-gray-600 flex-1" numberOfLines={1}>
                              {transaction.name}
                            </Text>
                            <Text className={`text-xs font-medium ${transaction.is_income ? 'text-green-500' : 'text-red-500'}`}>
                              {transaction.is_income ? '+' : '-'}{Math.floor(transaction.amount / 1000)}k
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}
                    
                    {recentTransactions.length === 0 && (
                      <Text className="text-xs text-gray-400 italic">No transactions yet</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View className="mt-4">
              <Text className="text-gray-500 text-center text-lg py-8">No accounts found.</Text>
            </View>
          )}
          
          {/* Show "View All" hint if there are more than 2 money sources */}
          {accounts.length > 2 && (
            <TouchableOpacity 
              onPress={() => router.push('/accounts')}
              className="mt-3 py-2"
            >
              <Text className="text-center text-blue-600 text-sm">
                View all money sources
              </Text>
            </TouchableOpacity>
          )}
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
      </ScrollView>

      {/* FAB Menu */}
      <Modal
        visible={isMenuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsMenuOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsMenuOpen(false)}
        >
          <BlurView intensity={20} style={styles.blurView}>
            {renderMenuItems()}
            <TouchableOpacity
              style={styles.fab}
              onPress={toggleMenu}
            >
              <Ionicons
                name={isMenuOpen ? 'close' : 'add'}
                size={28}
                color="white"
              />
            </TouchableOpacity>
          </BlurView>
        </TouchableOpacity>
      </Modal>

      {/* FAB Button */}
      {!isMenuOpen && (
        <TouchableOpacity
          style={styles.fab}
          onPress={toggleMenu}
        >
          <Ionicons name="add" size={28} color="white" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  blurView: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    padding: 24,
  },
  menuItem: {
    position: 'absolute',
    bottom: 64,
    right: 24,
    marginBottom: 2,
  },
  menuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4
  },
  menuText: {
    color: 'white',
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
  },
});

export default Home;