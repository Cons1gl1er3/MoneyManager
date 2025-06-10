import { Ionicons } from '@expo/vector-icons';
import { Ionicons as IconType } from '@expo/vector-icons/build/Icons';
import React, { useCallback, useEffect, useState } from 'react';
import { Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// import { PieChart } from 'react-native-chart-kit';
import { useIsFocused } from '@react-navigation/native';
import { useFocusEffect, useRouter } from 'expo-router';
import ActionModal from '../../components/ActionModal';
import BarChartComponent from '../../components/BarChart';
import ConfirmModal from '../../components/ConfirmModal';
import DatePickerModal from '../../components/DatePickerModal';
import ErrorModal from '../../components/ErrorModal';
import FloatingActionButton from '../../components/FloatingActionButton';
import MonthSelector from '../../components/MonthSelector';
import SuccessModal from '../../components/SuccessModal';
import { useGlobalContext } from '../../context/GlobalProvider';
import { deleteAccount, getCurrentUser, getTransactions, getUserAccounts } from '../../lib/appwrite';

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
  const insets = useSafeAreaInsets();
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorModalMessage, setErrorModalMessage] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<Account | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const changeMonth = (increment: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + increment);
  
    // Prevent future months
    if (newDate > new Date()) {
      setErrorModalMessage('You cannot select a future month.');
      setErrorModalVisible(true);
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
      const allTransactions = await getTransactions(userID, forceRefresh);
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

  const calculateMonthlyData = (allTransactions: Transaction[], targetDate: Date): MonthlyData[] => {
    const monthlyStats: { [key: string]: { income: number; expense: number } } = {};

    // Lấy dữ liệu 6 tháng gần nhất tính từ targetDate
    for (let i = 5; i >= 0; i--) {
      const date = new Date(targetDate.getFullYear(), targetDate.getMonth() - i, 1);
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
      
      // Show month + year for all months
      const monthLabel = `${date.toLocaleDateString('en-US', { month: 'short' })} ${year}`;
      
      return {
        month: monthLabel,
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

  // Handle delete account
  const handleDeleteAccount = (account: Account) => {
    // Check if it's the default account
    if (account.name === 'Tiền mặt') {
      setErrorModalMessage('Cannot delete the default money source "Tiền mặt".');
      setErrorModalVisible(true);
      return;
    }
    
    setAccountToDelete(account);
    setShowDeleteConfirm(true);
  };

  // Confirm delete account
  const confirmDeleteAccount = async () => {
    if (!accountToDelete) return;
    
    setIsDeleting(true);
    try {
      await deleteAccount(accountToDelete.$id);
      
      // Close all modals first
      setShowDeleteConfirm(false);
      setShowActionModal(false);
      setSelectedAccount(null);
      setAccountToDelete(null);
      
      // Refresh data
      await fetchAccounts();
      await fetchTransactions(true);
      
      // Show success message after a brief delay to ensure modals are closed
      setTimeout(() => {
        setSuccessMessage(`Money source "${accountToDelete.name}" has been deleted and all transactions transferred to "Tiền mặt".`);
        setShowSuccessModal(true);
      }, 100);
    } catch (error) {
      console.error('Error deleting account:', error);
      setErrorModalMessage(error.message || 'Failed to delete money source. Please try again.');
      setErrorModalVisible(true);
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle edit account
  const handleEditAccount = (account: Account) => {
    // Close the modal first
    setShowActionModal(false);
    setSelectedAccount(null);
    
    // Then navigate to edit page
    router.push({
      pathname: '/edit-account',
      params: { account: JSON.stringify(account) }
    });
  };

  // Handle account click to show action modal
  const handleAccountClick = (account: Account) => {
    setSelectedAccount(account);
    setShowActionModal(true);
  };

  // Handle date selection from picker
  const handleDateSelect = (newDate: Date) => {
    setCurrentDate(newDate);
  };

  // Debug function for touch issues
  const debugTouchIssue = () => {
    console.log('=== HOME TOUCH DEBUG ===');
    console.log('Platform:', Platform.OS);
    console.log('Accounts length:', accounts.length);
    console.log('ShowActionModal:', showActionModal);
    console.log('ShowDatePicker:', showDatePicker);
    console.log('========================');
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
      const monthly = calculateMonthlyData(transactions, currentDate);
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

  useEffect(() => {
    debugTouchIssue();
  }, [accounts, showActionModal, showDatePicker]);

      return (
    <View className="bg-gray-50 flex-1">
      {/* Header */}
      <View style={{ paddingTop: insets.top }}>
        <View className="px-4 pt-4 my-5">
          <View className="flex-row justify-between items-center">
            <Text className="text-2xl font-bold text-black">Home</Text>
            <TouchableOpacity onPress={() => router.push('/settings')}>
              <Ionicons name="settings-outline" size={24} color="#000" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Month Navigator */}
        <MonthSelector 
          currentDate={currentDate} 
          onChangeMonth={changeMonth}
          onDatePress={() => setShowDatePicker(true)}
        />
        </View>

      {/* Main Content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={{ 
          flex: 1, 
          paddingHorizontal: 16,
        }}
        contentContainerStyle={{ 
          paddingBottom: insets.bottom + 100,
          flexGrow: 1,
        }}
        keyboardShouldPersistTaps="handled"
        scrollEventThrottle={16}
        bounces={Platform.OS === 'ios'}
      >
        {/* Income & Spending Cards */}
        <View style={{ 
          flexDirection: 'row', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: 24 
        }}>
          <View style={{
            flex: 1,
            backgroundColor: '#f0fdf4',
            padding: 16,
            borderRadius: 8,
            marginRight: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
            elevation: 2,
          }}>
            <Text style={{ fontSize: 18, fontWeight: '500', color: '#111827' }}>Income</Text>
            <Text style={{ fontSize: 16, fontWeight: 'bold', marginTop: 4, color: '#059669' }}>
              {formatVND(incomeTotal)}
            </Text>
          </View>
          <View style={{
            flex: 1,
            backgroundColor: '#fef2f2',
            padding: 16,
            borderRadius: 8,
            marginLeft: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
            elevation: 2,
          }}>
            <Text style={{ fontSize: 18, fontWeight: '500', color: '#111827' }}>Spending</Text>
            <Text style={{ fontSize: 16, fontWeight: 'bold', marginTop: 4, color: '#dc2626' }}>
              {formatVND(expenseTotal)}
            </Text>
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
        <View style={{ 
          marginTop: 24, 
          paddingHorizontal: 16,
          zIndex: 1,
          position: 'relative',
        }}>
          <View style={{ 
            flexDirection: 'row', 
            justifyContent: 'space-between', 
            alignItems: 'center' 
          }}>
            <Text style={{ 
              fontSize: 20, 
              fontWeight: 'bold',
              color: '#111827',
            }}>Money Source</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity 
                onPress={() => {
                  console.log('CREATE button pressed');
                  router.push('/add-account');
                }}
                style={{ 
                  paddingHorizontal: 8, 
                  paddingVertical: 4,
                  zIndex: 10,
                }}
                activeOpacity={0.7}
              >
                <Text style={{ color: '#059669', fontWeight: '600' }}>CREATE</Text>
              </TouchableOpacity>
              <Text style={{ color: '#9ca3af', marginHorizontal: 8 }}>|</Text>
              <TouchableOpacity 
                onPress={() => {
                  console.log('VIEW ALL button pressed');
                  router.push('/accounts');
                }}
                style={{ 
                  paddingHorizontal: 8, 
                  paddingVertical: 4,
                  zIndex: 10,
                }}
                activeOpacity={0.7}
              >
                <Text style={{ color: '#2563eb', fontWeight: '600' }}>VIEW ALL</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {accounts.length > 0 ? (
            <View style={{ 
              marginTop: 16, 
              flexDirection: 'row', 
              gap: 8,
              zIndex: 1,
            }}>
              {accounts.slice(0, 2).map(account => {
                const recentTransactions = getRecentTransactionsByAccount(account.$id);
                const transactionCount = getTransactionsByAccount(account.$id).length;
                const isNegativeBalance = account.balance < 0;
                
                return (
                  <TouchableOpacity 
                    key={account.$id} 
                    style={{ 
                      flex: 1,
                      backgroundColor: '#f0fdf4',
                      borderRadius: 12,
                      padding: 16,
                      minHeight: 140,
                      marginHorizontal: 4,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.1,
                      shadowRadius: 3,
                      elevation: 3,
                      // iOS specific touch improvements
                      zIndex: 1,
                      position: 'relative',
                    }}
                    onPress={() => {
                      console.log('Account card pressed:', account.name);
                      handleAccountClick(account);
                    }}
                    activeOpacity={0.8}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel={`${account.name} account`}
                  >
                    {/* Card Header */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <Text 
                        style={{ 
                          fontSize: 18, 
                          fontWeight: '600', 
                          flex: 1, 
                          color: '#111827' 
                        }} 
                        numberOfLines={1}
                      >
                        {account.name}
                      </Text>
                      <Ionicons name={getAccountIcon(account.name)} size={20} color="#059669" />
                    </View>
                    
                    {/* Balance */}
                    <Text style={{
                      fontSize: 20,
                      fontWeight: 'bold',
                      marginBottom: 8,
                      color: isNegativeBalance ? '#ef4444' : '#059669'
                    }}>
                      {formatVND(account.balance)}
                    </Text>
                    
                    {/* Transaction count */}
                    <Text style={{
                      fontSize: 14,
                      color: '#6b7280',
                      marginBottom: 8,
                    }}>
                      {transactionCount} transaction{transactionCount !== 1 ? 's' : ''}
                    </Text>
                    
                    {/* Recent transactions */}
                    {recentTransactions.length > 0 && (
                      <View style={{ gap: 4 }}>
                        <Text style={{
                          fontSize: 12,
                          fontWeight: '500',
                          color: '#4b5563',
                          marginBottom: 4,
                        }}>Recent:</Text>
                        {recentTransactions.slice(0, 2).map((transaction, index) => (
                          <View key={index} style={{ 
                            flexDirection: 'row', 
                            justifyContent: 'space-between', 
                            alignItems: 'center' 
                          }}>
                            <Text style={{
                              fontSize: 12,
                              color: '#4b5563',
                              flex: 1,
                            }} numberOfLines={1}>
                              {transaction.name}
                            </Text>
                            <Text style={{
                              fontSize: 12,
                              fontWeight: '500',
                              color: transaction.is_income ? '#10b981' : '#ef4444',
                            }}>
                              {transaction.is_income ? '+' : '-'}{Math.floor(transaction.amount / 1000)}k
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}
                    
                    {recentTransactions.length === 0 && (
                      <Text style={{
                        fontSize: 12,
                        color: '#9ca3af',
                        fontStyle: 'italic',
                      }}>No transactions yet</Text>
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
          

        </View>

    

      </ScrollView>

      {/* Floating Action Button */}
      <FloatingActionButton />

      {/* Action Modal */}
      <ActionModal
        visible={showActionModal}
        onClose={() => {
          setShowActionModal(false);
          setSelectedAccount(null);
        }}
        title={selectedAccount?.name || ''}
        balance={selectedAccount?.balance}
        actions={[
          {
            label: 'Edit',
            subtitle: 'Update money source details',
            icon: 'pencil',
            color: '#2563eb',
            onPress: () => {
              if (selectedAccount) {
                handleEditAccount(selectedAccount);
              }
            }
          },
          {
            label: 'Delete',
            subtitle: 'Remove this money source',
            icon: 'trash',
            color: '#dc2626',
            onPress: () => {
              if (selectedAccount) {
                handleDeleteAccount(selectedAccount);
              }
            }
          }
        ]}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        visible={showDeleteConfirm}
        title="Delete Money Source"
        message={`Are you sure you want to delete "${accountToDelete?.name}"? All transactions will be transferred to "Tiền mặt".`}
        confirmText={isDeleting ? "Deleting..." : "Delete"}
        cancelText="Cancel"
        onConfirm={confirmDeleteAccount}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setAccountToDelete(null);
        }}
        confirmButtonColor="#dc2626"
      />

      {/* Success Modal */}
      <SuccessModal
        visible={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Deleted Successfully!"
        message={successMessage}
      />

      <ErrorModal
        visible={errorModalVisible}
        message={errorModalMessage}
        onClose={() => setErrorModalVisible(false)}
      />

      {/* Date Picker Modal */}
      <DatePickerModal
        visible={showDatePicker}
        currentDate={currentDate}
        onClose={() => setShowDatePicker(false)}
        onDateSelect={handleDateSelect}
      />
    </View>
  );
};

export default Home;